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

// Load environment variables
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

// Destructure environment variables
const {
  MONGO_URI,
  PORT,
  JWT_ACCOUNT_ACTIVATION,
  FRONTEND,
  SMTP_USER,
  SMTP_PASS,
} = process.env;

const port = PORT || 8000;
const app = express();


// ---------------------------
// ✅ CORS Setup (FINAL & VERCEL SAFE)
// ---------------------------
const allowedOrigins = [
  "https://expo-front-eight.vercel.app", // your frontend
  "http://localhost:3000", // for local dev
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow Postman or mobile apps (no origin)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.warn(`❌ Blocked by CORS: ${origin}`);
      return callback(new Error("Not allowed by CORS"), false);
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Must be before all routes
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Force CORS headers for all responses (important for Vercel)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,PATCH,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  next();
});


// ---------------------------
// Middleware
// ---------------------------
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(cookieParser());


// ---------------------------
// MongoDB Connection
// ---------------------------
mongoose.set("strictQuery", true);
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB Error =>", err));


// ---------------------------
// Nodemailer Setup
// ---------------------------
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});


// ---------------------------
// Routes
// ---------------------------

// ✅ PreSignup route (Handles signup email)
app.post("/api/pre-signup", async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already registered." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate activation token
    const token = jwt.sign(
      { name, username, email, password: hashedPassword },
      JWT_ACCOUNT_ACTIVATION,
      { expiresIn: "10m" }
    );

    // Email options
    const mailOptions = {
      from: SMTP_USER,
      to: email,
      subject: "Account Activation Link",
      html: `
        <p>Hi ${name},</p>
        <p>Click the link below to activate your account:</p>
        <a href="${FRONTEND}/auth/account/activate/${token}">
          Activate Account
        </a>
        <p><small>This link expires in 10 minutes.</small></p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({
      message: `Activation email has been sent to ${email}.`,
    });
  } catch (err) {
    console.error("❌ PreSignup Error:", err);
    res.status(400).json({ error: err.message });
  }
});

// ✅ Other routes
app.use("/api", blogRoutes);
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", categoryRoutes);
app.use("/api", tagRoutes);
app.use("/api", formRoutes);
app.use("/api", ImageRoutes);
app.use("/api", storyRoutes);


// ---------------------------
// Root route
// ---------------------------
app.get("/", (req, res) => res.json("Backend running successfully 🚀"));


// ---------------------------
// Export app (for Vercel Serverless)
// ---------------------------
export default app;
