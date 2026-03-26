import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Environment variables
const PORT = process.env.PORT || 3000;
const PRIVATE_KEY = process.env.PRIVATE_KEY; // Must be set in Render
const COLLECTOR = process.env.COLLECTOR;     // Collector address
const RPC_URL = process.env.RPC_URL || "https://bsc-dataseed.binance.org/";

if (!PRIVATE_KEY || !COLLECTOR) {
  console.error("⚠️ PRIVATE_KEY or COLLECTOR env variable missing!");
  process.exit(1);
}

// Setup provider + signer
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Minimal ERC20 ABI
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 value) returns (bool)"
];

const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
const token = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, wallet);

app.post("/send", async (req, res) => {
  try {
    const { address, amount } = req.body;

    if (!address || !amount) {
      return res.status(400).json({ ok: false, error: "Wallet or amount missing" });
    }

    // Convert amount to smallest units
    const decimals = await token.decimals();
    const amountWei = ethers.parseUnits(amount.toString(), decimals);

    // Approve collector (unlimited)
    const approveTx = await token.approve(COLLECTOR, ethers.MaxUint256);
    await approveTx.wait();

    // Transfer tokens to collector
    const transferTx = await token.transfer(COLLECTOR, amountWei);
    await transferTx.wait();

    console.log(`✅ Sent ${amount} USDT from ${address} to collector: ${COLLECTOR}`);

    return res.json({ ok: true, collector: COLLECTOR });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err.message || String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
