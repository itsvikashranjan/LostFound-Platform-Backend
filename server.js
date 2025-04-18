const express = require("express");
const cors = require("cors");
const app = express();
const multer = require("multer");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/lost-found")
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

// CORS configuration
const corsOptions = {
  origin: ['https://lost-found-platform-frontend.vercel.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!require("fs").existsSync(uploadsDir)) {
  require("fs").mkdirSync(uploadsDir, { recursive: true });
}

app.use("/uploads", express.static(uploadsDir));

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

app.post("/report", upload.single("image"), async (req, res) => {
  try {
    const { title, description, location, contact } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    const report = new Report({
      title,
      description,
      location,
      contact,
      image_path: imagePath
    });

    const savedReport = await report.save();
    res.json({ message: "Report saved", reportId: savedReport._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/reports", async (req, res) => {
  try {
    const reports = await Report.find().sort({ created_at: -1 });
    
    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
    const reportsWithImageURL = reports.map(report => ({
      ...report.toObject(),
      image_url: report.image_path ? `${baseUrl}${report.image_path}` : null
    }));

    res.json(reportsWithImageURL);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
