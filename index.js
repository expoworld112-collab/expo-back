import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import authRoutes from "./routes/auth.js";

dotenv.config({ path: "./.env" });

const app = express();
const PORT = process.env.PORT || 8000;

// --- Middleware
app.use(express.json()); // parse JSON bodies

// --- CORS setup
app.use(
  cors({
    origin: process.env.FRONTEND,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// --- Routes
app.use("/api/auth", authRoutes);

// --- Health check route
app.get("/", (req, res) => {
  res.status(200).json({ message: "Backend running ✅" });
});

// --- 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// --- Global error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// --- Start server with MongoDB connection
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");

    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
};

startServer();
