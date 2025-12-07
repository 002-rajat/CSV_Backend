const fs = require('fs');
const csv = require('fast-csv');
const pool = require('../DataBase/db');

const BATCH_SIZE = Number(process.env.BATCH_SIZE || 1000);

// --------------------------------------------------
// VALIDATION HELPERS
// --------------------------------------------------
function isValidName(name) {
  if (!name) return { ok: false, reason: 'Name is required' };
  const trimmed = name.trim();
  if (trimmed.length < 2) return { ok: false, reason: 'Minimum 2 characters' };
  if (!/^[a-zA-Z\s'-]+$/.test(trimmed))
    return { ok: false, reason: 'Name must contain only alphabetic characters' };
  return { ok: true, value: trimmed };
}

function isValidEmail(email) {
  if (!email) return { ok: false, reason: 'Email is required' };
  const trimmed = email.trim();
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(trimmed)) return { ok: false, reason: 'Invalid email format' };
  return { ok: true, value: trimmed.toLowerCase() };
}

function isValidPhone(phone) {
  if (!phone) return { ok: false, reason: 'Phone is required' };
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length !== 10)
    return { ok: false, reason: 'Phone must be exactly 10 digits' };
  return { ok: true, value: digits };
}

// --------------------------------------------------
// MAIN CONTROLLER
// --------------------------------------------------
async function handleCsvUpload(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = req.file.path;

  const results = {
    totalRows: 0,
    successCount: 0,
    failedCount: 0,
    failedRecords: []
  };

  const validBatch = [];
  let rowNumber = 0;



  // --------------------------------------------------
  // BATCH INSERT FUNCTION
  // --------------------------------------------------
  async function flushBatch() {
    if (validBatch.length === 0) return;

    const values = validBatch.map(r => [r.name, r.email, r.phone]);
    const sql = 'INSERT INTO users_csv (name, email, phone) VALUES ?';

    try {
      await pool.query(sql, [values]);
    } catch (batchErr) {
      console.error('Batch insert failed — inserting individually...', batchErr.message);

      // fallback row-by-row
      for (const row of validBatch) {
        try {
          await pool.query(
            'INSERT INTO users_csv (name, email, phone) VALUES (?, ?, ?)',
            [row.name, row.email, row.phone]
          );
        } catch (rowErr) {
          results.failedCount++;
          results.failedRecords.push({
            rowNumber: row._rowNumber,
            values: {
              name: row.name,
              email: row.email,
              phone: row.phone
            },
            errors: [`DB Insert Error: ${rowErr.message}`]
          });
        }
      }
    } finally {
      validBatch.length = 0;
    }
  }

  // --------------------------------------------------
  // PARSE CSV
  // --------------------------------------------------
  const stream = fs.createReadStream(filePath);

  const parser = csv
    .parse({ headers: true, ignoreEmpty: true })
    .on('data', async (row) => {
      parser.pause();
      rowNumber++;
      results.totalRows++;

      // Normalize keys
      const normalized = {};
      Object.keys(row).forEach(k => {
        normalized[k.trim().toLowerCase()] = row[k];
      });

      const nameRaw = normalized.name || '';
      const emailRaw = normalized.email || '';
      const phoneRaw = normalized.phone || normalized.mobile || '';

      // Validate
      const nameCheck = isValidName(nameRaw);
      const emailCheck = isValidEmail(emailRaw);
      const phoneCheck = isValidPhone(phoneRaw);

      const errors = [];
      if (!nameCheck.ok) errors.push(nameCheck.reason);
      if (!emailCheck.ok) errors.push(emailCheck.reason);
      if (!phoneCheck.ok) errors.push(phoneCheck.reason);

      // If failed row
      if (errors.length > 0) {
        results.failedCount++;
        results.failedRecords.push({
          rowNumber,
          values: {
            name: nameRaw,
            email: emailRaw,
            phone: phoneRaw
          },
          errors
        });
        parser.resume();
        return;
      }

      // Valid row — prepare for insert
      validBatch.push({
        name: nameCheck.value,
        email: emailCheck.value,
        phone: phoneCheck.value,
        _rowNumber: rowNumber
      });

      // Auto flush batch
      if (validBatch.length >= BATCH_SIZE) {
        try { await flushBatch(); } catch (e) {}
      }

      results.successCount++;
      parser.resume();
    })

    .on('end', async () => {
      await flushBatch();

      try { fs.unlinkSync(filePath); } catch {}

      return res.json(results);
    })

    .on('error', (err) => {
      try { fs.unlinkSync(filePath); } catch {}
      console.error('CSV Parse Error:', err);
      res.status(500).json({ error: 'CSV parse failed', details: err.message });
    });

  stream.pipe(parser);
}

module.exports = { handleCsvUpload };
