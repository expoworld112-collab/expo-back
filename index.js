import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";

dotenv.config({ path: "./.env" });

const app = express();
app.use(express.json());

// MongoDB connection
mongoose.set("strictQuery", true);
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("DB Error:", err));

// Routes
app.use("/api/auth", authRoutes);

// Test route
app.get("/", (req, res) => res.json({ message: "Backend running ✅" }));

// Server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
