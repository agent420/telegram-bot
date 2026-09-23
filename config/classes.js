const CLASS_DATA = {
  Warrior: { 
    initial: { str: 30, mag: 10, dex: 20, vit: 25, hp: 70, mana: 10 }, 
    max: { str: 250, mag: 50, dex: 60, vit: 100 }, 
    growth: { hpPerLvl: 2, hpPerVit: 2, manaPerLvl: 1, manaPerMag: 1 } 
  },
  Rogue: { 
    initial: { str: 20, mag: 15, dex: 30, vit: 20, hp: 45, mana: 22 }, 
    max: { str: 55, mag: 70, dex: 250, vit: 80 }, 
    growth: { hpPerLvl: 2, hpPerVit: 1.5, manaPerLvl: 2, manaPerMag: 1.5 } 
  },
  Sorcerer: { 
    initial: { str: 15, mag: 35, dex: 15, vit: 20, hp: 30, mana: 70 }, 
    max: { str: 45, mag: 250, dex: 85, vit: 80 }, 
    growth: { hpPerLvl: 1, hpPerVit: 1, manaPerLvl: 2, manaPerMag: 2 } 
  }
};
module.exports = CLASS_DATA;
