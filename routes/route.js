const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { handleCsvUpload } = require('../controllers/uploadFile');

const uploadDir = process.env.UPLOAD_DIR || './uploads';

// multer disk storage 
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ts = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${ts}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200 MB max (adjust as needed)
  },
  fileFilter: function (req, file, cb) {
    const allowed = ['.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new Error('Only .csv files are allowed'));
    }
    cb(null, true);
  },
});

router.post('/upload', upload.single('file'), handleCsvUpload);


module.exports = router;
