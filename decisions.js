// The lord's decisions: one event between months, two answers, no right one.
(() => {
  const fail = reason => ({ok: false, reason});
  const names = {gold: '골드', wood: '목재', stone: '석재'};
  const random = state => {   // seeded, separate from mercenary rolls
    let t = state.decisionSeed = ((state.decisionSeed ?? ((state.seed ?? 1) ^ 0x5bd1e995)) + 0x6D2B79F5) | 0;
    t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const fallen = (state, config) => state.units.filter(u => u.hp <= 0 && !config.units[u.type].hero);
  const available = (state, config, event) => !event.needs || (event.needs === 'fallen' && fallen(state, config).length > 0) ||
    (event.needs === 'damagedWall' && state.walls.some(w => w.hp > 0 && w.hp < window.wallMaxHp(config, w)));

  // Called when a month ends: offer an event not seen in this run.
  window.drawDecision = function (state, config) {
    if (!state.decisionLog) return null;
    const pool = config.decisions.filter(e => !state.decisionLog.includes(e.id) && available(state, config, e));
    state.decision = pool.length ? pool[Math.floor(random(state) * pool.length)].id : null;
    if (state.decision) state.decisionLog.push(state.decision);
    return state.decision;
  };

  // Plain-language summary of what an answer does, for the buttons.
  window.decisionEffectText = function (config, option) {
    const parts = [];
    for (const [key, value] of Object.entries(option.resources || {})) parts.push(`${names[key]} ${value > 0 ? '+' : ''}${value}`);
    if (option.hope) parts.push(`희망 ${option.hope > 0 ? '+' : ''}${option.hope}`);
    if (option.capacity) parts.push(`병력 한도 +${option.capacity}`);
    if (option.revive) parts.push(`쓰러진 병사 ${option.revive}명 복귀`);
    if (option.wallHeal) parts.push(`가장 약한 성문 +${option.wallHeal}HP`);
    if (option.allWallsHeal) parts.push(`모든 성문 +${option.allWallsHeal}HP`);
    for (const type of option.recruits || []) parts.push(`${config.recruitment.names[type]} 합류`);
    if (option.item) parts.push('장비 1개');
    return parts.join(' · ') || '변화 없음';
  };

  window.decisionStatus = function (state, config, index) {
    const event = config.decisions.find(e => e.id === state.decision);
    if (!event) return fail('결정할 일이 없습니다.');
    if (!['ready', 'settlement'].includes(state.phase)) return fail('준비 단계에서만 결정합니다.');
    const option = event.options[index];
    if (!option) return fail('선택지가 없습니다.');
    for (const [key, value] of Object.entries(option.resources || {}))
      if (value < 0 && state.resources[key] < -value) return fail(`${names[key]}이(가) 부족합니다.`);
    return {ok: true, reason: '', event, option};
  };

  window.decide = function (state, config, index) {
    const status = window.decisionStatus(state, config, index);
    if (!status.ok) return status;
    const {event, option} = status;
    for (const [key, value] of Object.entries(option.resources || {})) state.resources[key] += value;
    if (option.hope) window.changeHope?.(state, config, option.hope);
    if (option.capacity) state.capacityBonus = (state.capacityBonus || 0) + option.capacity;
    const found = option.item ? window.grantLoot(state, config, 'decision') : null;
    for (const unit of fallen(state, config).slice(0, option.revive || 0)) unit.hp = Math.round(config.units[unit.type].hp * 0.5);
    const standing = state.walls.filter(w => w.hp > 0);
    const heal = (wall, amount) => { wall.hp = Math.min(window.wallMaxHp(config, wall), wall.hp + amount); };
    if (option.wallHeal && standing.length)
      heal(standing.sort((a, b) => a.hp / window.wallMaxHp(config, a) - b.hp / window.wallMaxHp(config, b))[0], option.wallHeal);
    if (option.allWallsHeal) standing.forEach(wall => heal(wall, option.allWallsHeal));
    // Volunteers join the central reserve if there is room; otherwise they are turned away at the gate.
    let joined = 0;
    for (const type of option.recruits || []) {
      const reserve = state.units.filter(u => u.hp > 0 && u.wallId === 'RESERVE').length;
      const slot = window.freeFormationSlot(state, config, 'RESERVE', type);
      if (reserve >= config.orders.reserveCapacity || slot < 0) continue;
      const post = window.unitPosts(state, config).find(p => p.id === 'RESERVE');
      state.units.push({type, lane: 'central', wallId: 'RESERVE', formationSlot: slot, hp: config.units[type].hp, cool: 0,
        ...window.unitDestination(config, post, type, slot)});
      joined++;
    }
    state.decision = null;
    state.lastDecision = {id: event.id, option: index};
    const note = (option.recruits || []).length > joined ? ' (예비대가 가득 차 일부는 받지 못했습니다)' : '';
    const gained = found ? ` · ${config.items.find(i => i.id === found.id).name}을(를) 보관함에 넣었습니다` : '';
    return {ok: true, reason: `${event.title} — ${option.label}: ${window.decisionEffectText(config, option)}${note}${gained}`, loot: found};
  };
})();
