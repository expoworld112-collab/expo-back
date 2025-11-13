// pages/api/account/activate.js
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import User from "../../models/user";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token } = req.body;

  if (!token) return res.status(400).json({ error: "No activation token provided" });

  try {
    // --- Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION);

    const { name, username, email, password } = decoded;

    // --- Connect to MongoDB if not already connected
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }

    // --- Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return res.status(400).json({ error: "Email already registered" });

    // --- Create new user
    const newUser = new User({ name, username, email: email.toLowerCase(), password });
    await newUser.save();

    return res.status(201).json({ message: "Account activated successfully!" });
  } catch (err) {
    console.error("Account activation error:", err);
    if (err.name === "TokenExpiredError") {
      return res.status(400).json({ error: "Activation link has expired" });
    }
    return res.status(500).json({ error: "Server error" });
  }
}
