// The continuing campaign: years, saving and loading. Rules only.
(() => {
  const SAVE_VERSION = 1;
  // Enemies grow with each year held: multipliers for their HP, damage and numbers.
  window.yearScale = function (config, state) {
    const year = state.year || 0, s = config.campaign.yearScaling;
    return {hp: 1 + s.hp * year, damage: 1 + s.damage * year, count: 1 + s.count * year};
  };

  // Everything worth keeping between sessions. Battle-only data is left out:
  // a game is saved while preparing, never in the middle of a fight.
  const KEEP = ['phase', 'wave', 'year', 'keep', 'walls', 'units', 'buildings', 'customPlots', 'resources', 'hope', 'research',
    'decision', 'decisionLog', 'decisionSeed', 'capacityBonus', 'seed', 'kills', 'report', 'lastReward'];
  window.serializeGame = function (state) {
    if (!['ready', 'settlement', 'victory'].includes(state.phase)) return null;
    const data = {version: SAVE_VERSION};
    for (const key of KEEP) if (state[key] !== undefined) data[key] = state[key];
    // Movement orders and animation stamps do not survive a save.
    return JSON.parse(JSON.stringify(data, (key, value) =>
      ['retreat', 'movement', 'visualAttack', 'visualSkill', 'visualCollapse', 'visualHurt'].includes(key) ? undefined : value));
  };

  // Rebuild a playable state from saved data, or return null if it cannot be trusted.
  window.restoreGame = function (config, data) {
    try {
      if (!data || data.version !== SAVE_VERSION) return null;
      if (!['ready', 'settlement', 'victory'].includes(data.phase)) return null;
      if (!Number.isInteger(data.wave) || data.wave < 0 || data.wave >= config.waves.length) return null;
      if (!Number.isInteger(data.year ?? 0) || (data.year ?? 0) < 0) return null;
      if (!Array.isArray(data.walls) || data.walls.length !== config.walls.length) return null;
      if (!data.walls.every((w, i) => w.id === config.walls[i].id && Number.isFinite(w.hp))) return null;
      if (!Array.isArray(data.units) || !data.units.every(u => config.units[u.type] && Number.isFinite(u.hp) && Number.isFinite(u.x) && Number.isFinite(u.y))) return null;
      if (data.customPlots !== undefined && !(Array.isArray(data.customPlots) && data.customPlots.every(p => typeof p.id === 'string' &&
        Number.isFinite(p.x) && Number.isFinite(p.y) && Array.isArray(p.allowed) && typeof p.lane === 'string'))) return null;
      if (!Array.isArray(data.buildings) || !data.buildings.every(b => config.construction.buildings[b.type] &&
        window.plotList(data, config).some(p => p.id === b.plotId) && Number.isFinite(b.hp))) return null;
      if (!data.resources || !['gold', 'wood', 'stone'].every(k => Number.isFinite(data.resources[k]) && data.resources[k] >= 0)) return null;
      if (!Number.isFinite(data.keep) || data.keep <= 0) return null;
      const state = JSON.parse(JSON.stringify(data));
      delete state.version;
      Object.assign(state, {year: state.year || 0, enemies: [], enemyDeaths: [], queue: [], timer: 0, combatRemainder: 0,
        events: [], effects: [], kills: state.kills || 0, research: state.research || [], customPlots: state.customPlots || [], decisionLog: state.decisionLog || [],
        hope: Number.isFinite(state.hope) ? state.hope : config.hope.start});
      for (const wall of state.walls) wall.max = window.wallMaxHp(config, wall);
      for (const unit of state.units) { unit.cool = 0; unit.retreat = null; unit.movement = null; }
      return state;
    } catch { return null; }
  };

  // After the last month is held, winter passes and the next year begins with what was built.
  window.advanceYear = function (state, config) {
    if (state.phase !== 'victory') return {ok: false, reason: '한 해를 모두 막아낸 뒤에 넘어갈 수 있습니다.'};
    const rest = config.campaign.winter;
    state.year = (state.year || 0) + 1;
    state.wave = 0; state.phase = 'ready'; state.timer = 0; state.queue = []; state.enemies = []; state.effects = [];
    state.keep = config.keep.hp;
    // Winter repairs: standing gates are made whole, fallen ones are raised part-way.
    for (const wall of state.walls) {
      const max = window.wallMaxHp(config, wall);
      wall.hp = wall.hp > 0 ? max : Math.round(max * rest.fallenWallFraction);
      wall.collapsed = false; wall.max = max;
    }
    // The living recover; fallen soldiers are struck from the roll, fallen heroes still need reviving.
    state.units = state.units.filter(u => u.hp > 0 || config.units[u.type].hero);
    for (const unit of state.units) if (unit.hp > 0) unit.hp = config.units[unit.type].hp;
    for (const building of state.buildings) if (building.hp > 0) building.hp = config.construction.buildings[building.type].hp;
    for (const [key, amount] of Object.entries(rest.stipend)) state.resources[key] += amount;
    state.decisionLog = []; state.decision = null; state.report = null; state.beaconUsed = false; state.beaconUntil = 0;
    window.refreshMercenaries?.(state, config);
    return {ok: true, reason: `${window.calendarDate(config, 0, state.year).text} — 새해가 밝았습니다. 왕국의 보급이 도착했습니다`};
  };
})();
