// import express from "express";
// import { check } from "express-validator";
// import {
//   signup,
//   signin,
//   signout,
//   requireSignin,
//   forgotPassword,
//   resetPassword,
//   // preSignup
// } from "../controllers/auth.js";
// import { runvalidation } from "../validators/index.js";

// const router = express.Router();

// // ======================= Validators =======================
// const usersignupvalidator = [
//   check('name').isLength({ min: 5 }).withMessage('Name must be at least 5 characters long'),
//   check('username').isLength({ min: 3, max: 10 }).withMessage('Username must be between 3 and 10 characters'),
//   check('email').isEmail().withMessage('Must be a valid email address'),
//   check('password')
//     .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/)
//     .withMessage('Password must contain 1 lowercase, 1 uppercase, 1 number, 1 special character, and be at least 8 characters long')
// ];

// const usersigninvalidator = [
//   check('email').isEmail().withMessage('Must be a valid email address')
// ];

// const forgotPasswordValidator = [
//   check('email').notEmpty().isEmail().withMessage('Must be a valid email address')
// ];

// const resetPasswordValidator = [
//   check('newPassword')
//     .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/)
//     .withMessage('Password must contain 1 lowercase, 1 uppercase, 1 number, 1 special character, and be at least 8 characters long')
// ];

// // ======================= Routes =======================
// router.post('/pre-signup', usersignupvalidator, runvalidation, preSignup);
// router.post('/signup', signup);
// router.post('/signin', usersigninvalidator, runvalidation, signin);
// router.get('/signout', signout);
// router.put('/forgot-password', forgotPasswordValidator, runvalidation, forgotPassword);
// router.put('/reset-password', resetPasswordValidator, runvalidation, resetPassword);

// export default router;
// routes/auth.js (or wherever you define auth routes)
import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "../models/user.js";

const router = express.Router();

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Allowed frontend origins
const allowedOrigins = ["https://expo-front-q575.vercel.app"];

router.options("/pre-signup", (req, res) => {
  // Handle preflight
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  return res.sendStatus(200);
});

router.post("/pre-signup", async (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");

  try {
    // Connect to MongoDB if not already
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }

    const { name, username, email, password } = req.body;
    if (!name || !username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check for existing user
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already taken" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate activation token
    const token = jwt.sign(
      { name, username, email, password: hashedPassword },
      process.env.JWT_ACCOUNT_ACTIVATION,
      { expiresIn: "10m" }
    );

    // Send activation email
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: "Activate your account",
      html: `<p>Hi ${name},</p>
             <p>Click the link below to activate your account:</p>
             <a href="${process.env.FRONTEND}/auth/account/activate/${token}">Activate Account</a>`,
    });

    return res.status(200).json({ message: `Email sent to ${email}` });
  } catch (err) {
    console.error("PreSignup error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
