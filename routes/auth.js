import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "../models/user.js";

const router = express.Router();

// --- Nodemailer setup
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// --- Middleware to connect to MongoDB
const connectDB = async () => {
  if (!mongoose.connection.readyState) {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
};

// ==================== Pre-signup ====================
router.post("/pre-signup", async (req, res) => {
  try {
    await connectDB();

    const { name, username, email, password } = req.body;
    if (!name || !username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser)
      return res.status(400).json({ error: "Email already taken" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const token = jwt.sign(
      { name, username, email, password: hashedPassword },
      process.env.JWT_ACCOUNT_ACTIVATION,
      { expiresIn: "10m" }
    );

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

    res.status(200).json({ message: `Activation email sent to ${email}` });
  } catch (err) {
    console.error("PreSignup error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ==================== Signup ====================
router.post("/signup", async (req, res) => {
  try {
    await connectDB();
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION);
    const { name, username, email, password } = decoded;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ error: "User already exists. Please signin." });

    const user = new User({ name, username, email, password });
    await user.save();

    res.json({ message: "Signup successful! Please sign in." });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(401).json({ error: "Expired or invalid link. Signup again." });
  }
});

// ==================== Signin ====================
router.post("/signin", async (req, res) => {
  try {
    await connectDB();
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Email and password do not match" });

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.cookie("token", token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    const { _id, name, username, role } = user;
    res.json({ token, user: { _id, name, username, email, role } });
  } catch (err) {
    console.error("Signin error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ==================== Signout ====================
router.get("/signout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Signout successful" });
});

// ==================== Forgot Password ====================
router.put("/forgot-password", async (req, res) => {
  try {
    await connectDB();
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const token = jwt.sign({ _id: user._id }, process.env.JWT_RESET_PASSWORD, { expiresIn: "10m" });

    await user.updateOne({ resetPasswordLink: token });

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: "Password Reset",
      html: `<p>Reset your password using this link:</p>
             <a href="${process.env.FRONTEND}/auth/password/reset/${token}">Reset Password</a>`
    });

    res.json({ message: `Password reset email sent to ${email}` });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ==================== Reset Password ====================
router.put("/reset-password", async (req, res) => {
  try {
    await connectDB();
    const { resetPasswordLink, newPassword } = req.body;

    if (!resetPasswordLink) return res.status(400).json({ error: "No reset link provided" });

    const decoded = jwt.verify(resetPasswordLink, process.env.JWT_RESET_PASSWORD);
    const user = await User.findOne({ resetPasswordLink });
    if (!user) return res.status(400).json({ error: "Invalid or expired link" });

    user.password = newPassword;
    user.resetPasswordLink = "";
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
