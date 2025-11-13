import express from "express";
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

// --- Pre-signup route
router.post("/pre-signup", async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password)
      return res.status(400).json({ error: "All fields are required" });

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

export default router;
