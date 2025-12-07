// require('dotenv').config();
// const express = require('express');
// const path = require('path');
// const cors = require('cors');

// const fs = require('fs');
// const route = require('./routes/route');

// const app = express();

// // enable CORS so frontend:3000 can call backend:4000
// app.use(cors({
//   origin: 'http://localhost:3000', // frontend origin
//   methods: ['GET', 'POST']
// }));


// app.use(express.json());

// // Make sure upload dir exists
// const uploadDir = process.env.UPLOAD_DIR || './uploads';
// if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// // routes
// app.use('/api/upload', route);

// // basic health
// app.get('/', (req, res) => res.send('CSV Upload Service'));

// const PORT = process.env.PORT || 4000;
// app.listen(PORT, () => {
//   console.log(`Server listening on port ${PORT}`);
// });

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const uploadRoute = require("./routes/route");

dotenv.config();
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", uploadRoute);

app.get("/", (req, res) => {
  res.send("CSV Upload Backend Running");
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});
