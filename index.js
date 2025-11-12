import express from "express";
import serverless from "serverless-http";
import morgan from "morgan";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";

import User from "./models/user.js";
import blogRoutes from "./routes/blog.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import categoryRoutes from "./routes/category.js";
import tagRoutes from "./routes/tag.js";
import formRoutes from "./routes/form.js";
import ImageRoutes from "./routes/images.js";
import storyRoutes from "./routes/slides.js";

dotenv.config({ path: "./.env" });

const app = express();
const { MONGO_URI, JWT_ACCOUNT_ACTIVATION, FRONTEND, SMTP_USER, SMTP_PASS } = process.env;

// ---------------------------
// ✅ CORS
// ---------------------------
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "https://expo-front-q575.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") return res.status(200).end();
  next();
});

// ---------------------------
// Middleware
// ---------------------------
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(cookieParser());

// ---------------------------
// MongoDB
// ---------------------------
mongoose.set("strictQuery", true);
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("DB Error:", err));

// ---------------------------
// Nodemailer setup
// ---------------------------
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

// ---------------------------
// Routes
// ---------------------------
app.get("/", (req, res) => res.json({ message: "Backend is live ✅" }));

app.get("/blogs-categories-tags", (req, res) => {
  const blogs = [
    { id: 1, title: "Travel to Japan", slug: "travel-to-japan" },
    { id: 2, title: "Backpacking in Europe", slug: "backpacking-in-europe" },
  ];
  const categories = [{ id: 1, name: "Travel" }, { id: 2, name: "Adventure" }];
  const tags = [{ id: 1, name: "Japan" }, { id: 2, name: "Europe" }, { id: 3, name: "Tips" }];

  res.json({ blogs, categories, tags });
});

app.use("/api", blogRoutes);
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", categoryRoutes);
app.use("/api", tagRoutes);
app.use("/api", formRoutes);
app.use("/api", ImageRoutes);
app.use("/api", storyRoutes);

// ---------------------------
// ✅ Export serverless handler for Vercel
// ---------------------------
export const handler = serverless(app);
export default app;
