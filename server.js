import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Collector address from environment variable
const COLLECTOR = process.env.COLLECTOR || "0x5681d680b047bf5b12939625c56301556991005e";

app.post("/send", async (req, res) => {
  try {
    const { wallet, amount } = req.body;

    // Validation
    if (!wallet || !amount) {
      return res.status(400).json({ ok: false, error: "Wallet or amount missing" });
    }

    // Optional: Add further checks here (like valid address format)
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return res.status(400).json({ ok: false, error: "Invalid wallet address" });
    }

    console.log("Send request received:", { wallet, amount, collector: COLLECTOR });

    // Dummy response (replace with real blockchain transfer logic later)
    res.json({
      ok: true,
      found: true,
      amountHuman: Number(amount),
      collector: COLLECTOR
    });

  } catch (err) {
    console.error("Send API error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

// Health check
app.get("/", (req, res) => res.send("Server is running"));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
