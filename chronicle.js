// Calendar, weather, hope and the keep's beacon. Rules only; drawing lives in atmosphere.js.
(() => {
  // The campaign runs month by month: wave 1 is the first month of the configured year.
  window.calendarDate = function (config, waveIndex, year = 0) {
    const c = config.calendar, index = Math.max(0, Math.min(c.months.length - 1, waveIndex));
    const total = c.month - 1 + index + 12 * year, month = c.months[index];
    return {year: c.year + Math.floor(total / 12), month: total % 12 + 1, weather: month.weather,
      weatherName: c.weatherNames[month.weather], darkness: month.darkness,
      text: `${c.era} ${c.year + Math.floor(total / 12)}년 ${total % 12 + 1}월`};
  };
  window.hopeTier = function (config, hope) {
    const tiers = config.hope.tiers;
    let index = 0;
    for (let i = 0; i < tiers.length; i++) if (hope >= tiers[i].min) index = i;
    return {index, ...tiers[index]};
  };
  // Every change goes through here so the value stays inside its bounds.
  window.changeHope = function (state, config, amount) {
    if (state.hope === undefined || !amount) return 0;
    const before = state.hope;
    state.hope = Math.max(0, Math.min(config.hope.max, state.hope + amount));
    return state.hope - before;
  };
  // Defenders strike faster while hope burns high.
  window.hopeAttackSpeed = (state, config) => state.hope === undefined ? 1 : window.hopeTier(config, state.hope).attackSpeed || 1;
  // Recovery between waves: halved when hope is nearly out, a little better when it cannot be put out.
  window.hopeRecovery = function (state, config, base) {
    if (state.hope === undefined) return base;
    const tier = window.hopeTier(config, state.hope);
    return base * (tier.recovery ?? 1) + (tier.recoveryBonus || 0);
  };
  // Called once per combat step: fallen soldiers and damage to the keep wear hope down.
  window.trackHope = function (state, config) {
    if (state.hope === undefined) return;
    const rules = config.hope, down = state.units.filter(u => u.hp <= 0).length;
    if (down > (state.hopeUnitsDown ?? down)) window.changeHope(state, config, rules.unitLost * (down - state.hopeUnitsDown));
    state.hopeUnitsDown = down;
    const lost = (state.hopeKeepSeen ?? state.keep) - state.keep;
    state.hopeKeepSeen = state.keep;
    if (lost > 0) {
      state.hopeKeepCarry = (state.hopeKeepCarry || 0) + lost;
      while (state.hopeKeepCarry >= rules.keepStep) { state.hopeKeepCarry -= rules.keepStep; window.changeHope(state, config, rules.keepLoss); }
    }
  };
  // The beacon: spend hope to heal every defender and push the dark back for a while. Once per wave.
  window.beaconCost = (state, config) => Math.max(0, config.hope.beacon.cost - (window.researchSum?.(state, config, 'beaconDiscount') ?? 0));
  window.beaconStatus = function (state, config) {
    const fail = reason => ({ok: false, reason});
    if (state.hope === undefined) return fail('희망이 없습니다.');
    if (state.phase !== 'combat') return fail('전투 중에만 올릴 수 있습니다.');
    if (state.beaconUsed) return fail('이번 달에는 이미 성화를 올렸습니다.');
    const cost = window.beaconCost(state, config);
    if (state.hope < cost) return fail(`희망이 부족합니다 (${cost} 필요).`);
    return {ok: true, reason: '', cost};
  };
  window.raiseBeacon = function (state, config) {
    const status = window.beaconStatus(state, config);
    if (!status.ok) return status;
    const rules = config.hope.beacon;
    window.changeHope(state, config, -status.cost);
    state.beaconUsed = true;
    state.beaconUntil = state.timer + rules.seconds;
    let healed = 0;
    for (const unit of state.units) {
      if (unit.hp <= 0) continue;
      const max = config.units[unit.type].hp;
      unit.hp = Math.min(max, unit.hp + max * rules.heal); healed++;
    }
    return {ok: true, reason: `성화를 올렸습니다 — 병사 ${healed}명이 힘을 되찾습니다`};
  };
})();
