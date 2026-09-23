require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const CLASS_DATA = require('../config/classes');
const { calculateMaxStats } = require('../utils/statsEngine');
const { calculateCombat } = require('../utils/combat');
const { generateFloor } = require('../utils/generator');
const crypto = require('crypto');

const app = express();
app.use(express.json());

let isConnected = false;

// --- GESTION DE LA CONNEXION MONGODB (AVEC TIMEOUT) ---
async function connectDB() {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Stop après 5s si MongoDB ne répond pas
    });
    isConnected = true;
    console.log('✅ MongoDB Connecté');
  } catch (err) {
    console.error('❌ Erreur MongoDB:', err);
    throw new Error("Impossible de se connecter à la base de données MongoDB");
  }
}

// --- VALIDATION DE L'IDENTITÉ TELEGRAM ---
function validateInitData(initData) {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\\n');
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(process.env.BOT_TOKEN).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    return calculatedHash === hash;
  } catch (e) {
    return false;
  }
}

// --- MIDDLEWARE D'AUTHENTIFICATION ---
const authMiddleware = async (req, res, next) => {
  try {
    await connectDB();
    
    const initData = req.headers['x-tg-data'] || req.body.initData;
    if (!initData || !validateInitData(initData)) {
      return res.status(403).json({ error: 'Authentification invalide ou expirée' });
    }
    
    const params = new URLSearchParams(initData);
    const tgUser = JSON.parse(params.get('user'));
    
    // On récupère ou crée l'utilisateur
    req.user = await User.findOneAndUpdate(
      { telegramId: tgUser.id },
      { $set: { lastActive: new Date() } },
      { upsert: true, new: true }
    ).maxTimeMs(5000);

    next();
  } catch (err) {
    console.error("Auth Error:", err.message);
    res.status(500).json({ error: err.message || "Erreur serveur interne" });
  }
};

// --- ROUTES DU JEU ---

// 1. Profil utilisateur
app.get('/api/me', authMiddleware, async (req, res) => {
  const { maxHp, maxMana } = calculateMaxStats(req.user);
  res.json({ ...req.user, maxHp, maxMana });
});

// 2. Choix de la classe
app.post('/api/choose-class', authMiddleware, async (req, res) => {
  const { className } = req.body;
  if (!CLASS_DATA[className]) return res.status(400).json({ error: 'Classe invalide' });

  const stats = CLASS_DATA[className].initial;
  req.user.characterClass = className;
  req.user.str = stats.str;
  req.user.mag = stats.mag;
  req.user.dex = stats.dex;
  req.user.vit = stats.vit;
  
  const { maxHp, maxMana } = calculateMaxStats(req.user);
  req.user.currentHp = maxHp;
  req.user.currentMana = maxMana;
  
  await req.user.save();
  res.json({ success: true, user: req.user });
});

// 3. Exploration du donjon
app.post('/api/explore', authMiddleware, async (req, res) => {
  if (!req.user.currentFloor) {
    req.user.currentFloor = generateFloor(req.user.level || 1);
    req.user.currentRoomIndex = 0;
    req.user.currentMonsterHp = req.user.currentFloor.rooms[0].monster?.hp || 0;
    await req.user.save();
  }
  const room = req.user.currentFloor.rooms[req.user.currentRoomIndex];
  res.json({ room, floor: req.user.currentFloor.floor });
});

// 4. Combat
app.post('/api/attack', authMiddleware, async (req, res) => {
  const user = req.user;
  const room = user.currentFloor?.rooms[user.currentRoomIndex];
  if (!room || room.type !== 'MONSTER') return res.status(400).json({ error: 'Pas de monstre ici' });

  const { calculateCombat } = require('../utils/combat');
  const combat = calculateCombat(user, room.monster);
  
  let mHp = user.currentMonsterHp - combat.playerAction.damage;
  user.currentHp -= combat.monsterAction.damage;

  if (user.currentHp <= 0) {
    user.currentHp = 0;
    await user.save();
    return res.json({ event: 'PLAYER_DIED', log: combat.log });
  }

  if (mHp <= 0) {
    user.gold += room.monster.reward || 0;
    user.xp += room.monster.reward || 0;
    user.currentRoomIndex++;
    
    // On vérifie si on est arrivé au boss
    if (user.currentRoomIndex >= user.currentFloor.rooms.length) {
       // Logique de transition vers le boss ici
    }
    
    user.currentMonsterHp = user.currentFloor.rooms[user.currentRoomIndex]?.monster?.hp || 0;
    await user.save();
    res.json({ event: 'KILLED', log: combat.log, gold: user.gold });
  } else {
    user.currentMonsterHp = mHp;
    await user.save();
    res.json({ event: 'TICK', log: combat.log, monsterHp: mHp, playerHp: user.currentHp });
  }
});

module.exports = app;
