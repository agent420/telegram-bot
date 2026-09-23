// Table des monstres (peut être déplacée dans un fichier séparer)
const MONSTERS = [
  { id: 1, name: "Slime", hp: 50, atk: 2, xpReward: 20, goldReward: 10 },
  { id: 2, name: "Gobelin", hp: 120, atk: 5, xpReward: 50, goldReward: 30 },
  { id: 3, name: "Squelette", hp: 300, atk: 12, xpReward: 120, goldReward: 80 },
  // ... ajoutez des monstres plus forts ici
];

// ROUTE : Attaquer le monstre
app.post('/api/attack', authMiddleware, async (req, res) => {
  const user = req.user;
  const monster = MONSTERS[user.currentMonsterId - 1] || MONSTERS[0];

  // 1. Le joueur attaque le monstre
  // Note: Dans un vrai jeu, on stockerait les HP du monstre en DB ou session
  // Ici on simplifie : on simule un combat rapide
  const damageDealt = user.atk + Math.floor(Math.random() * 5);
  
  // Simulation : Le monstre meurt si on a assez d'attaque (ou système de tours)
  // Pour un Hack'nSlash TWA, on peut faire : 1 clic = X dégâts.
  // Si HP monstre <= 0 :
  const monsterKilled = true; // Simplification pour l'exemple

  if (monsterKilled) {
    user.xp += monster.xpReward;
    user.gold += monster.goldReward;
    user.monstersKilled += 1;
    
    // Gestion du Level Up
    if (user.xp >= user.xpToNextLevel) {
      user.level += 1;
      user.xp -= user.xpToNextLevel;
      user.xpToNextLevel = Math.floor(user.xpToNextLevel * 1.5);
      user.maxHp += 20;
      user.atk += 5;
      user.hp = user.maxHp; // Soin complet au niveau sup
    }

    // Passer au monstre suivant
    user.currentMonsterId += 1;
    if (user.currentMonsterId > MONSTERS.length) user.currentMonsterId = 1;

    await user.save();
    res.json({ 
      event: 'MONSTER_KILLED', 
      rewardXp: monster.xpReward, 
      rewardGold: monster.goldReward, 
      newLevel: user.level,
      nextMonster: MONSTERS[user.currentMonsterId - 1].name 
    });
  }
});

// ROUTE : Améliorer les capacités
app.post('/api/upgrade', authMiddleware, async (req, res) => {
  const { stat } = req.body; // 'atk' ou 'hp'
  const cost = 50 * user.level; // Coût augmente avec le niveau

  if (user.gold < cost) return res.status(400).json({ error: 'Pas assez d'or !' });

  user.gold -= cost;
  if (stat === 'atk') user.atk += 2;
  if (stat === 'hp') user.maxHp += 20;

  await user.save();
  res.json({ success: true, newStats: { atk: user.atk, maxHp: user.maxHp, gold: user.gold } });
});
