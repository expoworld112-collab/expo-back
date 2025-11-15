import User from "../models/user.js";
import Blog from "../models/blog.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { expressjwt } from "express-jwt";
import "dotenv/config.js";
import nodemailer from "nodemailer";
import { errorHandler } from "../helpers/dbErrorHandler.js";

// --- Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  tls: { rejectUnauthorized: false },
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

// ======================= Pre-signup =======================
export const preSignup = async (req, res) => {
  const { name, username, email, password } = req.body;
  if (!name || !username || !email || !password)
    return res.status(400).json({ error: "All fields are required" });

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return res.status(400).json({ error: "Email already taken" });

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
      html: `<p>Hi ${name},</p>
             <p>Click below to activate your account:</p>
             <a href="${process.env.MAIN_URL}/auth/account/activate/${token}">Activate Account</a>`
    });

    res.json({ message: `Activation email sent to ${email}` });
  } catch (err) {
    console.error("Pre-signup Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ======================= Signup =======================
export const signup = async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION);
    const { name, username, email, password } = decoded;

    const profile = `${process.env.MAIN_URL}/profile/${username.toLowerCase()}`;
    const user = new User({ name, username, email, password, profile });
    await user.save();

    res.json({ message: "Signup success! Please sign in." });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(401).json({ error: "Expired or invalid link. Signup again." });
  }
};

// ======================= Signin =======================
export const signin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ error: "User with that email does not exist." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Email and password do not match." });

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "100d" });

    res.cookie("token", token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }); // 1 day

    const { _id, username, name, email: userEmail, role } = user;
    res.json({ token, user: { _id, username, name, email: userEmail, role } });
  } catch (err) {
    res.status(400).json({ error: errorHandler(err) });
  }
};

// ======================= Signout =======================
export const signout = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Signout success" });
};

// ======================= Middleware =======================
export const requireSignin = expressjwt({
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
  userProperty: "auth"
});

export const authMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.auth._id);
    if (!user) return res.status(400).json({ error: "User not found" });
    req.profile = user;
    next();
  } catch (err) {
    res.status(400).json({ error: errorHandler(err) });
  }
};

export const adminMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.auth._id);
    if (!user) return res.status(400).json({ error: "User not found" });
    if (user.role !== 1) return res.status(403).json({ error: "Admin resource. Access denied" });
    req.profile = user;
    next();
  } catch (err) {
    res.status(400).json({ error: errorHandler(err) });
  }
};

// ======================= Blog Authorization =======================
export const canUpdateDeleteBlog = async (req, res, next) => {
  try {
    const slug = req.params.slug.toLowerCase();
    const blog = await Blog.findOne({ slug }).populate("postedBy").exec();
    if (!blog) return res.status(404).json({ error: "Blog not found" });

    if (blog.postedBy._id.toString() !== req.profile._id.toString())
      return res.status(403).json({ error: "You are not authorized" });

    next();
  } catch (err) {
    res.status(400).json({ error: errorHandler(err) });
  }
};

// ======================= Forgot Password =======================
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User with that email does not exist" });

    const token = jwt.sign({ _id: user._id }, process.env.JWT_RESET_PASSWORD, { expiresIn: "10m" });

    await user.updateOne({ resetPasswordLink: token });

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: "Password Reset Link",
      html: `<p>Reset your password using the link below:</p>
             <p>${process.env.MAIN_URL}/auth/password/reset/${token}</p>
             <hr /><p>If you did not request this, ignore this email.</p>`
    });

    res.json({ message: `Email sent to ${email}. Link expires in 10 minutes.` });
  } catch (err) {
    res.status(400).json({ error: errorHandler(err) });
  }
};

// ======================= Reset Password =================
