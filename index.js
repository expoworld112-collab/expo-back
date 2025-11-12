import express from "express";
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

dotenv.config({ path: './.env' });

const app = express();
const { MONGO_URI, PORT, JWT_ACCOUNT_ACTIVATION, FRONTEND, SMTP_USER, SMTP_PASS } = process.env;

// ---------------------------
// ✅ FIXED: Manual CORS headers (always works on Vercel)
// ---------------------------
app.use((req, res, next) => {
  const allowedOrigin = "https://expo-front-q575.vercel.app";
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.status(200).end(); // handle preflight 
  }

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
app.post("/api/pre-signup", async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: "Email is taken" });
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
      subject: "Account activation link",
      html: `
        <p>Hi ${name},</p>
        <p>Click the link below to activate your account:</p>
        <a href="${FRONTEND}/auth/account/activate/${token}">Activate Account</a>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: `Email sent to ${email}. Check inbox to activate account.` });
  } catch (err) {
    console.error("PreSignup Error:", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

app.get("/blogs-categories-tags", (req, res) => {
  const blogs = [
    { id: 1, title: "Travel to Japan", slug: "travel-to-japan", date: "2025-11-12T10:00:00Z" },
    { id: 2, title: "Backpacking in Europe", slug: "backpacking-in-europe", date: "2025-11-10T08:30:00Z" },
  ];
  const categories = [{ id: 1, name: "Travel" }, { id: 2, name: "Adventure" }];
  const tags = [{ id: 1, name: "Japan" }, { id: 2, name: "Europe" }, { id: 3, name: "Tips" }];

  res.json({ blogs, categories, tags });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// Other routes
app.use("/api", blogRoutes);
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", categoryRoutes);
app.use("/api", tagRoutes);
app.use("/api", formRoutes);
app.use("/api", ImageRoutes);
app.use("/api", storyRoutes);

app.get("/", (req, res) => res.json({ message: "Backend index — CORS fixed ✅" }));

export default app;
