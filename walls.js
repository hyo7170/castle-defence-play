// Wall repair, emergency repair and reconstruction rules (GDD 4.3).
(() => {
  const fail = reason => ({ok: false, reason});
  const affordable = (state, cost) => state.resources &&
    Object.entries(cost).every(([key, value]) => Number.isFinite(state.resources[key]) && state.resources[key] >= value);
  const pay = (state, cost) => { for (const [key, value] of Object.entries(cost)) state.resources[key] -= value; };
  const costText = cost => Object.entries(cost).filter(([, value]) => value)
    .map(([key, value]) => `${{gold: '골드', wood: '목재', stone: '석재'}[key]} ${value}`).join(' · ');
  const maxHp = (config, wall) => window.wallMaxHp(config, wall);
  const tier = (config, wall) => config.walls.filter(w => w.lane === wall.lane)[0].id === wall.id ? 'outer' : 'inner';

  // Returns what can be done to a wall right now, without changing anything.
  window.wallActionStatus = function (state, config, wallId, action) {
    const rules = config.wallRepair;
    const wall = state.walls.find(w => w.id === wallId);
    if (!wall) return fail('성벽을 찾을 수 없습니다.');
    const preparing = ['ready', 'settlement'].includes(state.phase);
    const max = maxHp(config, wall);
    if (action === 'repair') {
      if (!preparing) return fail('일반 수리는 준비 단계에서만 가능합니다.');
      if (wall.hp <= 0) return fail('무너진 성벽은 재건해야 합니다.');
      if (wall.hp >= max) return fail('성벽이 손상되지 않았습니다.');
      if (!affordable(state, rules.stepCost)) return fail(`자원이 부족합니다 (${costText(rules.stepCost)}).`);
      return {ok: true, reason: '', cost: rules.stepCost, hp: Math.min(max, wall.hp + rules.step)};
    }
    if (action === 'rebuild') {
      if (!preparing) return fail('재건은 준비 단계에서만 가능합니다.');
      if (wall.hp > 0) return fail('무너진 성벽만 재건할 수 있습니다.');
      const cost = rules.rebuild[tier(config, wall)];
      if (!affordable(state, cost)) return fail(`자원이 부족합니다 (${costText(cost)}).`);
      return {ok: true, reason: '', cost, hp: Math.round(max * rules.rebuildFraction)};  // keeps its fortification level
    }
    if (action === 'emergency') {
      if (state.phase !== 'combat') return fail('긴급 수리는 전투 중에만 가능합니다.');
      if (wall.hp <= 0) return fail('무너진 성벽에는 긴급 수리를 쓸 수 없습니다.');
      if (wall.hp >= max) return fail('성벽이 손상되지 않았습니다.');
      const wait = (wall.repairReadyAt || 0) - state.timer;
      if (wait > 0) return fail(`재사용 대기 ${Math.ceil(wait)}초`);
      if (!affordable(state, rules.emergency.cost)) return fail(`자원이 부족합니다 (${costText(rules.emergency.cost)}).`);
      return {ok: true, reason: '', cost: rules.emergency.cost, hp: Math.min(max, wall.hp + rules.emergency.hp)};
    }
    if (action === 'fortify') {
      if (!preparing) return fail('성벽 강화는 준비 단계에서만 가능합니다.');
      if (wall.hp <= 0) return fail('무너진 성벽은 먼저 재건해야 합니다.');
      const cost = rules.fortify.cost[(wall.level || 1) - 1];
      if (!cost) return fail('최고 단계입니다.');
      if (!affordable(state, cost)) return fail(`자원이 부족합니다 (${costText(cost)}).`);
      const base = config.walls.find(w => w.id === wall.id).hp;
      const next = Math.round(base * rules.fortify.hpFactor[wall.level || 1] * (wall.hpFactor || 1));
      // The added maximum is granted as HP, existing damage stays.
      return {ok: true, reason: '', cost, hp: wall.hp + next - max, max: next};
    }
    return fail('지원하지 않는 명령입니다.');
  };

  window.wallAction = function (state, config, wallId, action) {
    const status = window.wallActionStatus(state, config, wallId, action);
    if (!status.ok) return status;
    const wall = state.walls.find(w => w.id === wallId);
    // Every check passed above; only now change resources and the wall.
    pay(state, status.cost);
    const before = wall.hp;
    wall.hp = status.hp;
    if (action === 'rebuild') wall.collapsed = false;
    if (action === 'fortify') { wall.level = (wall.level || 1) + 1; wall.max = status.max; }
    if (action === 'emergency') wall.repairReadyAt = state.timer + config.wallRepair.emergency.cooldown;
    const name = {repair: '수리', rebuild: '재건', emergency: '긴급 수리', fortify: `Lv.${wall.level} 강화`}[action];
    return {ok: true, reason: `${wall.id} ${name} +${Math.round(wall.hp - before)}HP (${costText(status.cost)})`};
  };
  window.wallCostText = costText;
})();
