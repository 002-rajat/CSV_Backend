

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
