const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  // --- Stats du Personnage ---
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  xpToNextLevel: { type: Number, default: 100 },
  hp: { type: Number, default: 100 },
  maxHp: { type: Number, default: 100 },
  atk: { type: Number, default: 10 },
  gold: { type: Number, default: 0 },
  // --- Progression ---
  monstersKilled: { type: Number, default: 0 },
  currentMonsterId: { type: Number, default: 1 }
});
