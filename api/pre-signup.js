export default async function handler(req, res) {
  // -------------------------------
  // 1️⃣ CORS headers
  // -------------------------------
  res.setHeader("Access-Control-Allow-Origin", "https://expo-front-eight.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // -------------------------------
  // 2️⃣ Handle preflight OPTIONS request
  // -------------------------------
  if (req.method === "OPTIONS") {
    return res.status(200).end(); // Respond to preflight
  }

  // -------------------------------
  // 3️⃣ Handle POST request
  // -------------------------------
  if (req.method === "POST") {
    try {
      const data = req.body;

      // Example: Log the incoming data
      console.log("Signup data received:", data);

      // TODO: Your signup logic here
      // e.g., save to database, send email, etc.

      return res.status(200).json({ message: "Pre-signup successful!" });
    } catch (error) {
      console.error("Error in pre-signup:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // -------------------------------
  // 4️⃣ Reject other methods
  // -------------------------------
  return res.status(405).json({ error: "Method not allowed" });
}
