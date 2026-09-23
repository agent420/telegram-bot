const CLASS_DATA = require('../config/classes');

function calculateMaxStats(user) {
  const data = CLASS_DATA[user.characterClass];
  if (!data) return { maxHp: 0, maxMana: 0 };
  const maxHp = data.initial.hp + (user.level * data.growth.hpPerLvl) + (user.vit * data.growth.hpPerVit);
  const maxMana = data.initial.mana + (user.level * data.growth.manaPerLvl) + (user.mag * data.growth.manaPerMag);
  return { maxHp: Math.floor(maxHp), maxMana: Math.floor(maxMana) };
}
module.exports = { calculateMaxStats };
