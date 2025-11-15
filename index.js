import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import authRoutes from "./routes/auth.js";

dotenv.config({ path: "./.env" });

const app = express();
const PORT = process.env.PORT || 8000;

// --- Middleware to parse JSON
app.use(express.json());

// --- CORS configuration
const allowedOrigins = [
  process.env.FRONTEND?.replace(/\/$/, ""), // Frontend URL from .env
  "http://localhost:3000",                  // Local development
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman, server-to-server)
      if (!origin) return callback(null, true);

      // Allow only whitelisted origins
      if (allowedOrigins.includes(origin)) return callback(null, true);

      // Block other origins
      callback(new Error(`CORS Error: ${origin} not allowed`));
    },
    credentials: true, // Allow cookies
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// --- Handle preflight requests globally
app.options("*", cors());

// --- Routes
app.use("/auth", authRoutes);

// --- Health check
app.get("/", (req, res) => {
  res.status(200).json({ message: "Backend running ✅" });
});

// --- 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// --- Global error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);
  res.status(500).json({ error: err.message || "Internal server error" });
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
