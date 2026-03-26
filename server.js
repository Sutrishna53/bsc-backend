import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { ethers } from "ethers";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const COLLECTOR = process.env.COLLECTOR;
const USDT_BSC = "0x55d398326f99059fF775485246999027B3197955";
const BSC_RPC = "https://bsc-dataseed.binance.org/";

if(!COLLECTOR){
  console.error("ERROR: COLLECTOR env variable missing!");
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(BSC_RPC);

app.post("/send", async (req, res) => {
  try {
    const { address, amount } = req.body;

    if(!address || !amount){
      return res.status(400).json({ ok:false, error:"Wallet or amount missing" });
    }

    const amountWei = ethers.parseUnits(String(amount), 18);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider); // Ensure PRIVATE_KEY env exists

    const usdtContract = new ethers.Contract(USDT_BSC, [
      "function transfer(address to, uint amount) returns (bool)"
    ], wallet);

    const tx = await usdtContract.transfer(address, amountWei);
    await tx.wait();

    res.json({ ok:true, txHash: tx.hash });

  } catch(err) {
    console.error(err);
    res.status(500).json({ ok:false, error: err.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running...");
});
