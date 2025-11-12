import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../../models/user.js";

dotenv.config({ path: './.env' });

const { MONGO_URI, JWT_ACCOUNT_ACTIVATION, FRONTEND, SMTP_USER, SMTP_PASS } = process.env;

// Connect to MongoDB (if not already connected)
if (!mongoose.connection.readyState) {
  mongoose.set("strictQuery", true);
  mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
}

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

export default async function handler(req, res) {
  // ---------------------------
  // CORS headers
  // ---------------------------
  const allowedOrigin = "https://expo-front-eight.vercel.app";
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Handle preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
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
        <p>Click the link below to activate your account:</p>
        <a href="${FRONTEND}/auth/account/activate/${token}">Activate Account</a>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: `Email sent to ${email}. Check inbox to activate account.` });
  } catch (err) {
    console.error("PreSignup Error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
