import User from "../models/user.js";
import Blog from "../models/blog.js";
import jwt from "jsonwebtoken";
import _ from "lodash";
import { expressjwt } from "express-jwt";
import "dotenv/config.js";
import { errorHandler } from "../helpers/dbErrorHandler.js";
import nodemailer from "nodemailer";

// Configure mail transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  tls: { rejectUnauthorized: false },
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// ======================= Pre-signup =======================
export const preSignup = async (userData) => {
  try {
    const response = await fetch(`${API}/api/auth/pre-signup`, { // note "/auth/pre-signup"
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.error("Pre-signup error:", err.message);
    return { error: err.message };
  }
};

// ======================= Signup =======================
export const signup = async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION);
    const { name, username, email, password } = decoded;

    const usernameUrl = username.toLowerCase();
    const profile = `${process.env.MAIN_URL}/profile/${usernameUrl}`;
    const user = new User({ name, username, email, password, profile });
    await user.save();

    res.json({ message: "Signup success! Please sign in" });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(401).json({ error: "Expired or invalid link. Signup again" });
  }
};

// ======================= Signin =======================
export const signin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).exec();
    if (!user) {
      return res.status(400).json({ error: "User with that email does not exist. Please sign up." });
    }

    if (!user.authenticate(password)) {
      return res.status(400).json({ error: "Email and password do not match." });
    }

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
    const user = await User.findById(req.auth._id).exec();
    if (!user) return res.status(400).json({ error: "User not found" });

    req.profile = user;
    next();
  } catch (err) {
    res.status(400).json({ error: errorHandler(err) });
  }
};

export const adminMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.auth._id).exec();
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
    const blog = await Blog.findOne({ slug }).exec();

    if (!blog) return res.status(404).json({ error: "Blog not found" });

    const authorized = blog.postedBy._id.toString() === req.profile._id.toString();
    if (!authorized) return res.status(403).json({ error: "You are not authorized" });

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

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: "Password reset link",
      html: `<p>Please reset your password using the link below:</p>
             <p>${process.env.MAIN_URL}/auth/password/reset/${token}</p>
             <hr /><p>If you did not request this, please ignore this email.</p>`
    };

    await user.updateOne({ resetPasswordLink: token });
    await transporter.sendMail(mailOptions);

    res.json({ message: `Email sent to ${email}. Link expires in 10 minutes.` });
  } catch (err) {
    console.error("ForgotPassword Error:", err);
    res.status(400).json({ error: errorHandler(err) });
  }
};

// ======================= Reset Password =======================
export const resetPassword = async (req, res) => {
  const { resetPasswordLink, newPassword } = req.body;

  if (!resetPasswordLink) return res.status(400).json({ error: "No reset link provided" });

  try {
    const decoded = jwt.verify(resetPasswordLink, process.env.JWT_RESET_PASSWORD);
    const user = await User.findOne({ resetPasswordLink });
    if (!user) return res.status(404).json({ error: "Invalid or expired link" });

    user.password = newPassword;
    user.resetPasswordLink = "";
    await user.save();

    res.json({ message: "Password reset successful! You can now log in with your new password." });
  } catch (err) {
    res.status(400).json({ error: errorHandler(err) });
  }
};
