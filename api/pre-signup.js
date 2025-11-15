import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../../models/user.js";

dotenv.config({ path: "./.env" });

const { MONGO_URI, JWT_ACCOUNT_ACTIVATION, FRONTEND, SMTP_USER, SMTP_PASS } = process.env;

// Create a single Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

// Connect to MongoDB (reuse connection if already connected)
const connectDB = async () => {
  if (!mongoose.connection.readyState) {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");
  }
};

export default async function handler(req, res) {
  // --- CORS headers
  const allowedOrigins = ["https://expo-front-one.vercel.app"];   
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Handle preflight request
  if (req.method === "OPTIONS") return res.status(200).end();

  // Only allow POST
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Validate environment variables
  if (!MONGO_URI || !JWT_ACCOUNT_ACTIVATION || !SMTP_USER || !SMTP_PASS || !FRONTEND) {
    return res.status(500).json({ error: "Missing environment variables" });
  }

  try {
    await connectDB();

    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return res.status(400).json({ error: "Email already taken" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate JWT activation token
    const token = jwt.sign(
      { name, username, email, password: hashedPassword },
      JWT_ACCOUNT_ACTIVATION,
      { expiresIn: "10m" }
    );

    // Send activation email
    await transporter.sendMail({
      from: SMTP_USER,
      to: email,
      subject: "Activate your account",
      html: `<p>Click the link below to activate your account:</p>
             <a href="${FRONTEND}/auth/account/activate/${token}">Activate Account</a>`,
    });

    return res.status(200).json({ message: `Activation email sent to ${email}` });
  } catch (err) {
    console.error("PreSignup error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
