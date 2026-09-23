const calculateCombat = (player, monster) => {
  const results = {
    playerAction: { type: "HIT", damage: 0, isCrit: false, isDodge: false },
    monsterAction: { type: "HIT", damage: 0, isCrit: false, isDodge: false },
    log: []
  };
  const isMagicUser = player.characterClass === "Sorcerer";
  const baseAtk = isMagicUser ? player.mag : player.str;
  const attackPower = baseAtk + Math.floor(Math.random() * 5);
  const monsterDodgeChance = 10 * 0.01; 
  if (Math.random() < monsterDodgeChance) {
    results.playerAction = { type: "DODGE", damage: 0 };
    results.log.push("Le monstre a esquivé votre attaque !");
  } else {
    const critChance = player.dex * 0.01;
    const isCrit = Math.random() < critChance;
    const finalDamage = isCrit ? attackPower * 2 : attackPower;
    results.playerAction = { type: isCrit ? "CRIT" : "HIT", damage: finalDamage, isCrit };
    results.log.push(isCrit ? `Coup CRITIQUE ! ${finalDamage} dégâts !` : `Vous infligez ${finalDamage} dégâts.`);
  }
  const playerDodgeChance = player.dex * 0.01;
  if (Math.random() < playerDodgeChance) {
    results.monsterAction = { type: "DODGE", damage: 0 };
    results.log.push("Vous avez esquivé l'attaque du monstre !");
  } else {
    const monsterDamage = monster.atk + Math.floor(Math.random() * 3);
    results.monsterAction = { type: "HIT", damage: monsterDamage };
    results.log.push(`Le monstre vous frappe : -${monsterDamage} HP`);
  }
  return results;
};
module.exports = { calculateCombat };
