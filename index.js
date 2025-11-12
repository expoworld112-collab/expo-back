// server.js
import express from "express";
import morgan from "morgan";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";

dotenv.config({ path: "./.env" });

// Import models
import User from "./models/user.js";

// Import routes
import blogRoutes from "./routes/blog.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import categoryRoutes from "./routes/category.js";
import tagRoutes from "./routes/tag.js";
import formRoutes from "./routes/form.js";
import ImageRoutes from "./routes/images.js";
import storyRoutes from "./routes/slides.js";

const { MONGO_URI, PORT, JWT_ACCOUNT_ACTIVATION, FRONTEND, SMTP_USER, SMTP_PASS } = process.env;
const app = express();
const port = PORT || 8000;

// --------------------------------------------------
// ✅ CORS CONFIGURATION (Vercel Safe)
// --------------------------------------------------
const allowedOrigins = [
  "https://expo-front-eight.vercel.app",
  "http://localhost:3000",
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    // Return immediately for preflight
    return res.status(200).end();
  }

  next();
});

// --------------------------------------------------
// Middleware
// --------------------------------------------------
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(cookieParser());

// --------------------------------------------------
// Database
// --------------------------------------------------
mongoose.set("strictQuery", true);
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB Error =>", err));

// --------------------------------------------------
// Nodemailer
// --------------------------------------------------
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

// --------------------------------------------------
// Routes
// --------------------------------------------------

// PreSignup route
app.post("/api/pre-signup", async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const token = jwt.sign(
      { name, username, email, password: hashedPassword },
      JWT_ACCOUNT_ACTIVATION,
      { expiresIn: "10m" }
    );

    const mailOptions = {
      from: SMTP_USER,
      to: email,
      subject: "Activate your account",
      html: `
        <p>Hi ${name},</p>
        <p>Click below to activate your account:</p>
        <a href="${FRONTEND}/auth/account/activate/${token}">Activate Now</a>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: `Activation email sent to ${email}` });
  } catch (err) {
    console.error("PreSignup Error:", err);
    res.status(400).json({ error: err.message });
  }
});

// Other routes
app.use("/api", blogRoutes);
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", categoryRoutes);
app.use("/api", tagRoutes);
app.use("/api", formRoutes);
app.use("/api", ImageRoutes);
app.use("/api", storyRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Backend running ✅" });
});

export default app;
