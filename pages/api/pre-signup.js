// pages/api/pre-signup.js
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "../../models/user"; // adjust path if needed

// --- Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Allowed frontend origins
const allowedOrigins = ["https://expo-front-q575.vercel.app"];

export default async function handler(req, res) {
  const origin = req.headers.origin;

  // --- Set CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));

  // --- Handle preflight request
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    // --- Connect to MongoDB if not connected
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }

    const { name, username, email, password } = req.body;

    // --- Validate input
    if (!name || !username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // --- Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return res.status(400).json({ error: "Email already taken" });

    // --- Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // --- Generate activation token
    const token = jwt.sign(
      { name, username, email, password: hashedPassword },
      process.env.JWT_ACCOUNT_ACTIVATION,
      { expiresIn: "10m" }
    );

    // --- Send activation email
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: "Activate your account",
      html: `
        <p>Hi ${name},</p>
        <p>Click the link below to activate your account:</p>
        <a href="${process.env.FRONTEND}/auth/account/activate/${token}">Activate Account</a>
      `,
    });

    return res.status(200).json({ message: `Activation email sent to ${email}` });
  } catch (err) {
    console.error("PreSignup error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
