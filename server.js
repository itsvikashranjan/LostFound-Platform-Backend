const express = require("express");
const cors = require("cors");
const app = express();
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

const db = new sqlite3.Database("report.db");

db.run(`
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    location TEXT,
    contact TEXT,
    image_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  console.log(req.body);
  res.json({ user: true });
});

app.post("/register", (req, res) => {
  const { email, password, username } = req.body;
  console.log(req.body);
  res.json({ message: "register successfull " });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

app.post("/report", upload.single("image"), (req, res) => {
  const { title, description, location, contact } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

  const stmt = db.prepare(`
    INSERT INTO reports (title, description, location, contact, image_path)
    VALUES (?, ?, ?,?, ?)
  `);

  stmt.run(title, description, location, contact, imagePath, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: "Report saved", reportId: this.lastID });
  });
});

app.get("/reports", (req, res) => {
  db.all("SELECT * FROM reports ORDER BY created_at DESC", (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Append full image URL
    const reportsWithImageURL = rows.map((report) => ({
      ...report,
      image_url: report.image_path
        ? `http://localhost:${PORT}${report.image_path}`
        : null,
    }));

    res.json(reportsWithImageURL);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
