require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const crypto = require('crypto');

const app = express();
app.use(express.json());

let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log('✅ MongoDB Connecté');
  } catch (err) {
    console.error('❌ Erreur MongoDB:', err);
    throw err;
  }
}

function validateInitData(initData) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  params.delete('hash');
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(process.env.BOT_TOKEN).digest();
  const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  return calculatedHash === hash;
}

const authMiddleware = async (req, res, next) => {
  await connectDB();
  const initData = req.headers['x-tg-data'] || req.body.initData;
  if (!initData || !validateInitData(initData)) {
    return res.status(403).json({ error: 'Authentification invalide' });
  }
  const params = new URLSearchParams(initData);
  const tgUser = JSON.parse(params.get('user'));
  req.user = await User.findOneAndUpdate(
    { telegramId: tgUser.id },
    { $set: { username: tgUser.username, firstName: tgUser.first_name, lastActive: new Date() } },
    { upsert: true, new: true }
  );
  next();
};

app.get('/api/me', authMiddleware, (req, res) => {
  res.json({ balance: req.user.balance, referralCount: req.user.referralCount });
});

app.post('/api/add-coins', authMiddleware, async (req, res) => {
  req.user.balance += req.body.amount || 0;
  await req.user.save();
  res.json({ success: true, newBalance: req.user.balance });
});

module.exports = app;
