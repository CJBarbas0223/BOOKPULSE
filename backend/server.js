require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const bookRoutes = require("./routes/bookRoutes");

const app = express();

// Enable request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use(express.json());
app.use(cors({
  origin: ['http://localhost:8081', 'http://localhost:8082', 'http://localhost:19006', 'http://localhost:3000'],
  credentials: true
}));

// Optional MongoDB connection
if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected successfully"))
    .catch((err) => {
      console.error("MongoDB connection error:", err);
      // Don't exit process, just log the error
      console.log("Continuing without MongoDB...");
    });
} else {
  console.log("No MongoDB URI provided, skipping database connection");
}

// Routes
app.use("/api/books", bookRoutes);
app.use("/api/auth", authRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Backend is working!");
});

// Error handling middleware - should be after routes
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ 
    error: 'Server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler - should be last
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const PORT = 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test the API at http://localhost:${PORT}`);
});
