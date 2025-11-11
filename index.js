import express from "express";
import morgan from "morgan";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth2";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";

// Load environment variables
dotenv.config({ path: './.env' });

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
const port = PORT || 8000;

const app = express();

// ---------------------------
// CORS Setup
// ---------------------------
const allowedOrigins = ["https://expo-front-eight.vercel.app"];
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // allow Postman, mobile apps
    if (!allowedOrigins.includes(origin)) {
      return callback(new Error("CORS not allowed"), false);
    }
    return callback(null, true);
  },
  methods: ["GET","POST","PUT","DELETE","PATCH","OPTIONS"],
  credentials: true
}));
app.options("*", cors());

// ---------------------------
// Middleware
// ---------------------------
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(cookieParser());

// ---------------------------
// Routes
// ---------------------------
app.use('/api', blogRoutes);
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', categoryRoutes);
app.use('/api', tagRoutes);
app.use('/api', formRoutes);
app.use('/api', ImageRoutes);
app.use('/api', storyRoutes);

app.get('/', (req, res) => res.json("Backend index"));

// ---------------------------
// MongoDB Connection
// ---------------------------
mongoose.set("strictQuery", true);
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("DB connected"))
  .catch(err => console.log("DB Error =>", err));

// ---------------------------
// Nodemailer setup
// ---------------------------
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  }
});

// ---------------------------
// PreSignup Route
// ---------------------------
app.post("/api/pre-signup", async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: "Email is taken" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate activation token
    const token = jwt.sign(
      { name, username, email, password: hashedPassword },
      JWT_ACCOUNT_ACTIVATION,
      { expiresIn: '10m' }
    );

    // Send email
    const mailOptions = {
      from: SMTP_USER,
      to: email,
      subject: "Account activation link",
      html: `<p>Click to activate your account: <a href="${FRONTEND}/auth/account/activate/${token}">Activate</a></p>`
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: `Email has been sent to ${email}. Follow the instructions to activate your account.` });

  } catch (err) {
    console.error("PreSignup Error:", err);
    res.status(400).json({ error: err.message });
  }
});

// ---------------------------
// Export for serverless
// ---------------------------
export default app;
