// Workshops: research that lasts for the run, and gear forged for hired heroes.
(() => {
  const fail = reason => ({ok: false, reason});
  const names = {gold: '골드', wood: '목재', stone: '석재'};
  const preparing = state => ['ready', 'settlement'].includes(state.phase);
  const can = (state, cost) => Object.entries(cost).every(([key, value]) => state.resources[key] >= value);
  const pay = (state, cost) => { for (const [key, value] of Object.entries(cost)) state.resources[key] -= value; };
  window.costText = cost => Object.entries(cost).filter(([, value]) => value).map(([key, value]) => `${names[key]} ${value}`).join(' · ');
  const all = config => Object.values(config.research).flat();
  const done = (state, config) => all(config).filter(r => (state.research || []).includes(r.id));

  // Multiplicative bonuses (damage, armour...) and additive ones (discounts).
  window.researchBonus = (state, config, key) => done(state, config).reduce((value, r) => value * (r.effect[key] ?? 1), 1);
  window.researchSum = (state, config, key) => done(state, config).reduce((value, r) => value + (r.effect[key] || 0), 0);
  // What a hero's forged item contributes: "damage" and "armor" multiply, "cooldown" is seconds off.
  window.itemBonus = (config, unit, key) => {
    const value = config.items.find(i => i.id === unit.item)?.effect[key];
    return value ?? (key === 'cooldown' ? 0 : 1);
  };
  // Damage a defender deals with all bonuses, and the factor applied to damage it takes.
  window.unitDamage = (state, config, unit) => {
    const stats = config.units[unit.type];
    return stats.damage * window.researchBonus(state, config, 'unitDamage') *
      (stats.splash ? window.researchBonus(state, config, 'arcaneDamage') : 1) * window.itemBonus(config, unit, 'damage');
  };
  window.unitArmor = (state, config, unit) => unit.type && config.units[unit.type]
    ? window.researchBonus(state, config, 'unitArmor') * window.itemBonus(config, unit, 'armor') : 1;

  const lab = (state, config, plotId) => {
    const building = (state.buildings || []).find(b => b.plotId === plotId && b.hp > 0);
    return building && config.construction.buildings[building.type].lab ? building : null;
  };

  window.researchStatus = function (state, config, plotId, id) {
    const building = lab(state, config, plotId);
    if (!building) return fail('사용 가능한 연구 시설이 없습니다.');
    const item = (config.research[config.construction.buildings[building.type].lab] || []).find(r => r.id === id);
    if (!item) return fail('이 시설에서 할 수 없는 연구입니다.');
    if ((state.research || []).includes(id)) return fail('연구 완료');
    if (!preparing(state)) return fail('연구는 준비 단계에서만 가능합니다.');
    if (!can(state, item.cost)) return fail(`자원이 부족합니다 (${window.costText(item.cost)}).`);
    return {ok: true, reason: '', item};
  };
  window.doResearch = function (state, config, plotId, id) {
    const status = window.researchStatus(state, config, plotId, id);
    if (!status.ok) return status;
    pay(state, status.item.cost);
    (state.research ||= []).push(id);
    // Stronger masonry raises every gate at once; standing gates gain the added HP.
    if (status.item.effect.wallHp) for (const wall of state.walls) {
      const before = window.wallMaxHp(config, wall);
      wall.hpFactor = (wall.hpFactor || 1) * status.item.effect.wallHp;
      wall.max = window.wallMaxHp(config, wall);
      if (wall.hp > 0) wall.hp += wall.max - before;
    }
    return {ok: true, reason: `${status.item.name} 연구 완료 — ${status.item.text}`};
  };

  window.craftStatus = function (state, config, plotId, itemId, heroType) {
    const building = lab(state, config, plotId);
    if (!building || !config.construction.buildings[building.type].forge) return fail('사용 가능한 대장간이 없습니다.');
    const item = config.items.find(i => i.id === itemId);
    const hero = state.units.find(u => u.type === heroType && config.units[u.type]?.hero);
    if (!item || !hero) return fail('장비나 영웅을 찾을 수 없습니다.');
    if (hero.item === itemId) return fail('장착 중');
    if (!preparing(state)) return fail('제작은 준비 단계에서만 가능합니다.');
    if (!can(state, item.cost)) return fail(`자원이 부족합니다 (${window.costText(item.cost)}).`);
    return {ok: true, reason: '', item, hero};
  };
  // A hero carries one item; forging another replaces it.
  window.craftItem = function (state, config, plotId, itemId, heroType) {
    const status = window.craftStatus(state, config, plotId, itemId, heroType);
    if (!status.ok) return status;
    pay(state, status.item.cost);
    status.hero.item = itemId;
    return {ok: true, reason: `${config.units[heroType].name}에게 ${status.item.name} 장착 — ${status.item.text}`};
  };
})();
