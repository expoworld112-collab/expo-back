// api/pre-signup.js
export default async function handler(req, res) {
  // ✅ Allowed frontend origins
  const allowedOrigins = [
    "https://expo-front-eight.vercel.app", // production
    "http://localhost:3000"  // local dev
  ];

  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  // Allowed methods and headers
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow POST for actual requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const data = req.body;
    console.log("Pre-signup data:", data);

    // Your signup logic here
    return res.status(200).json({ message: "Pre-signup successful" });
  } catch (error) {
    console.error("Pre-signup error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
