import { connectDB } from "../utils/db.js";
import User from "../models/user.js";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  // --- CORS headers
  res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "POST") {
    try {
      await connectDB();
      const { name, username, email, password } = req.body;

      // --- Validation
      if (!name || !username || !email || !password)
        return res.status(400).json({ error: "All fields are required" });

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email))
        return res.status(400).json({ error: "Invalid email address" });

      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser)
        return res.status(400).json({ error: "Email already registered" });

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({
        name,
        username,
        email: email.toLowerCase(),
        password: hashedPassword,
      });

      await user.save();
      return res.status(201).json({ message: "Signup successful ✅" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
