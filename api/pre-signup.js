// api/pre-signup.js
export default async function handler(req, res) {
  // 1️⃣ Set CORS headers for all responses
  res.setHeader("Access-Control-Allow-Origin", "https://expo-front-eight.vercel.app"); // your frontend URL
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 2️⃣ Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end(); // Important for CORS preflight
  }

  // 3️⃣ Handle POST request
  if (req.method === "POST") {
    try {
      const data = req.body; // JSON body from frontend
      console.log("Pre-signup data received:", data);

      // TODO: Add your signup logic here (DB save, validation, etc.)

      return res.status(200).json({ message: "Pre-signup successful!" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
  }

  // 4️⃣ Block any other methods
  return res.status(405).json({ error: "Method not allowed" });
}
