require('dotenv').config();
const express = require('express');
const { ethers } = require('ethers');

const app = express();
app.use(express.json());

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

app.post('/fund-gas', async (req, res) => {
  try {
    const { address } = req.body;
    if (!address) return res.status(400).json({ error: "Address required" });

    const tx = await wallet.sendTransaction({
      to: address,
      value: ethers.parseEther("0.0005")
    });

    await tx.wait();
    res.json({ success: true, hash: tx.hash });

  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
