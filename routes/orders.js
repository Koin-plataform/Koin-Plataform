const express = require("express");
const crypto = require("crypto");
const db = require("../database");

const router = express.Router();

const CONFIG = {
  minimumUSDT: 10,
  maximumUSDT: 100000,

  currencies: {
    MZN: 65.00,
    AOA: 950.00,
    ZAR: 18.50,
    USD: 1.02
  },

  networkFees: {
    TRC20: 5.00,
    BEP20: 3.00,
    ERC20: 5.00,
    POLYGON: 3.00,
    SOLANA: 3.00
  }
};

function clean(value) {
  return String(value ?? "").trim();
}

function validWallet(wallet, network) {
  if (network === "TRC20") return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(wallet);
  if (["ERC20","BEP20","POLYGON"].includes(network)) return /^0x[a-fA-F0-9]{40}$/.test(wallet);
  if (network === "SOLANA") return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet);
  return false;
}

function makeReference(name) {
  const prefix = clean(name).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "ORDER";
  return `${prefix}-${crypto.randomInt(1000, 10000)}`;
}

function getOrder(reference) {
  return db.prepare(`
    SELECT
      id, reference,
      customer_name AS customerName,
      customer_email AS customerEmail,
      amount_usdt AS amountUSDT,
      network,
      network_fee AS networkFeeUSDT,
      currency,
      unit_price AS unitPrice,
      total_fiat AS totalFiat,
      wallet,
      payment_method AS paymentMethod,
      payment_reference AS paymentReference,
      status,
      txid,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM orders
    WHERE reference = ?
  `).get(reference);
}

router.post("/", (req, res) => {
  try {
    const name = clean(req.body.name);
    const email = clean(req.body.email).toLowerCase();
    const amount = Number(req.body.amountUSDT);
    const network = clean(req.body.network).toUpperCase();
    const currency = clean(req.body.currency).toUpperCase();
    const wallet = clean(req.body.wallet);

    if (name.length < 2) return res.status(400).json({success:false,message:"Invalid name."});
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({success:false,message:"Invalid email."});
    if (!Number.isFinite(amount) || amount < CONFIG.minimumUSDT || amount > CONFIG.maximumUSDT)
      return res.status(400).json({success:false,message:`Amount must be between ${CONFIG.minimumUSDT} and ${CONFIG.maximumUSDT} USDT.`});
    if (!CONFIG.currencies[currency]) return res.status(400).json({success:false,message:"Unsupported currency."});
    if (!CONFIG.networkFees[network]) return res.status(400).json({success:false,message:"Unsupported network."});
    if (!validWallet(wallet, network)) return res.status(400).json({success:false,message:"Wallet address is not compatible with the selected network."});

    const networkFee = CONFIG.networkFees[network];
    const totalUSDT = amount + networkFee;
    const unitPrice = CONFIG.currencies[currency];
    const totalFiat = totalUSDT * unitPrice;
    const id = crypto.randomUUID();
    const reference = makeReference(name);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO orders (
        id, reference, customer_name, customer_email,
        amount_usdt, network, network_fee,
        currency, unit_price, total_fiat, wallet,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_PAYMENT', ?, ?)
    `).run(
      id, reference, name, email, amount, network, networkFee,
      currency, unitPrice, totalFiat, wallet, now, now
    );

    return res.status(201).json({
      success: true,
      order: getOrder(reference)
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({success:false,message:"Could not create order."});
  }
});

router.get("/:reference", (req, res) => {
  const order = getOrder(req.params.reference);
  if (!order) return res.status(404).json({success:false,message:"Order not found."});
  res.json({success:true,order});
});

router.post("/:reference/payment-reported", (req, res) => {
  const order = getOrder(req.params.reference);
  if (!order) return res.status(404).json({success:false,message:"Order not found."});

  if (!["PENDING_PAYMENT","PAYMENT_REPORTED"].includes(order.status)) {
    return res.status(400).json({success:false,message:"This order cannot report payment in its current status."});
  }

  const paymentMethod = clean(req.body.paymentMethod);
  const paymentReference = clean(req.body.paymentReference);

  const now = new Date().toISOString();

  db.prepare(`
    UPDATE orders
    SET payment_method = ?, payment_reference = ?, status = 'PAYMENT_REPORTED', updated_at = ?
    WHERE reference = ?
  `).run(paymentMethod || null, paymentReference || null, now, req.params.reference);

  res.json({success:true,order:getOrder(req.params.reference)});
});

module.exports = router;
