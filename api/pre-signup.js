import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../../models/user.js";

dotenv.config({ path: "./.env" });

const { MONGO_URI, JWT_ACCOUNT_ACTIVATION, FRONTEND, SMTP_USER, SMTP_PASS } = process.env;

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});


export default async function handler(req, res) {
  // --- ALWAYS set CORS headers first
  const allowedOrigins = ["https://expo-front-one.vercel.app//"];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") return res.status(200).end();

  // --- Make sure env variables exist
  if (!process.env.MONGO_URI || !process.env.JWT_ACCOUNT_ACTIVATION) {
    return res.status(500).json({ error: "Missing env variables" });
  }

  try {
    // --- Connect to DB (await!)
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGO_URI, { 
        useNewUrlParser: true, 
        useUnifiedTopology: true 
      });
    }

    // --- Only POST
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { name, username, email, password } = req.body;
    if (!name || !username || !email || !password) return res.status(400).json({ error: "All fields required" });

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return res.status(400).json({ error: "Email already taken" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const token = jwt.sign({ name, username, email, password: hashedPassword }, process.env.JWT_ACCOUNT_ACTIVATION, { expiresIn: "10m" });

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: "Activate your account",
      html: `<a href="${process.env.FRONTEND}/auth/account/activate/${token}">Activate</a>`,
    });

    res.status(200).json({ message: `Email sent to ${email}` });

  } catch (err) {
    console.error("PreSignup error:", err);
    res.status(500).json({ error: "Server error" });
  }
}
