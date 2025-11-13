import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors"; // <-- import cors
import authRoutes from "./routes/auth.js";

dotenv.config({ path: "./.env" });

const app = express();

// --- Middleware
app.use(express.json()); // parse JSON bodies

// --- CORS configuration
app.use(cors({
  origin: "https://expo-front-q575.vercel.app", // your front-end URL
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true, // if you use cookies/auth headers
}));

// --- MongoDB connection
mongoose.set("strictQuery", true);

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// --- Routes
app.use("/api/auth", authRoutes);

// --- Health check / test route
app.get("/", (req, res) => {
  res.status(200).json({ message: "Backend running ✅" });
});

// --- 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// --- Global error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// --- Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
