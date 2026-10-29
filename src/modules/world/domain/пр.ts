const baseCost = 300;
// повышение уровня стоимости зданий
function upgrade_cost(level: number) {
  const targetMultiplier = 10;
  const levels = 5;
  const k = Math.pow(targetMultiplier, 1 / (levels - 1)); // 10^(1/4)
  return Math.round(baseCost * Math.pow(k, level - 1));
}
