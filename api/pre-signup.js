// api/pre-signup.js
export default async function handler(req, res) {
  // 1️⃣ Set CORS headers for all requests
  res.setHeader("Access-Control-Allow-Origin", "https://expo-front-eight.vercel.app"); // frontend URL
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 2️⃣ Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end(); // required for preflight
  }

  // 3️⃣ Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const data = req.body;
    console.log("Pre-signup data:", data);

    // TODO: Add your signup logic (DB, email, etc.)

    return res.status(200).json({ message: "Pre-signup successful" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
}
