import express from "express";

const app = express();

// ✅ Universal CORS middleware (works on Vercel)
app.use((req, res, next) => {
  // Allow all origins for now — debug mode
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    // Important for preflight success
    return res.status(200).end();
  }

  next();
});

// Test route
app.get("/", (req, res) => {
  res.json({ message: "✅ CORS test successful" });
});

// Test POST route
app.post("/api/pre-signup", (req, res) => {
  res.json({ message: "✅ POST request accepted" });
});

export default app;
