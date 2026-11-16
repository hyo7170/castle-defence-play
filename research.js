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
  // A hero's three slots. Saves from before the slots kept one "item"; it lands in its slot.
  window.heroGear = (config, unit) => {
    if (unit.gear) return unit.gear;
    const old = config.items.find(i => i.id === unit.item);
    return old ? {[old.slot]: old.id} : {};
  };
  const gearItems = (config, unit) => Object.values(window.heroGear(config, unit)).map(id => config.items.find(i => i.id === id)).filter(Boolean);
  // What a hero's gear contributes: "damage" and "armor" multiply, everything else adds up.
  window.itemBonus = (config, unit, key) => {
    const multiply = key === 'damage' || key === 'armor';
    return gearItems(config, unit).reduce((value, item) => item.effect[key] === undefined ? value
      : multiply ? value * item.effect[key] : value + item.effect[key], multiply ? 1 : 0);
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

  const itemById = (config, id) => config.items.find(i => i.id === id);
  const heroOf = (state, config, heroType) => state.units.find(u => u.type === heroType && config.units[u.type]?.hero);
  const setSlot = (state, config, hero, item) => {
    const gear = {...window.heroGear(config, hero)};
    if (gear[item.slot]) (state.inventory ||= []).push(gear[item.slot]);   // the old piece goes back to the store
    gear[item.slot] = item.id; hero.gear = gear; delete hero.item;
  };

  // The smithy forges gear into the store; naming a hero equips it straight away.
  window.craftStatus = function (state, config, plotId, itemId, heroType) {
    const building = lab(state, config, plotId);
    if (!building || !config.construction.buildings[building.type].forge) return fail('사용 가능한 대장간이 없습니다.');
    const item = itemById(config, itemId);
    if (!item) return fail('장비를 찾을 수 없습니다.');
    if (!item.cost) return fail('대장간에서는 만들 수 없는 장비입니다.');
    const hero = heroType ? heroOf(state, config, heroType) : null;
    if (heroType && !hero) return fail('장비나 영웅을 찾을 수 없습니다.');
    if (hero && window.heroGear(config, hero)[item.slot] === itemId) return fail('장착 중');
    if (!preparing(state)) return fail('제작은 준비 단계에서만 가능합니다.');
    if (!can(state, item.cost)) return fail(`자원이 부족합니다 (${window.costText(item.cost)}).`);
    return {ok: true, reason: '', item, hero};
  };
  window.craftItem = function (state, config, plotId, itemId, heroType) {
    const status = window.craftStatus(state, config, plotId, itemId, heroType);
    if (!status.ok) return status;
    pay(state, status.item.cost);
    if (!status.hero) { (state.inventory ||= []).push(itemId); return {ok: true, reason: `${status.item.name} 제작 — 보관함에 넣었습니다`}; }
    setSlot(state, config, status.hero, status.item);
    return {ok: true, reason: `${config.units[heroType].name}에게 ${status.item.name} 장착 — ${status.item.text}`};
  };

  // Equip from the store, or take a piece off back into it. Not in the middle of a fight.
  window.equipStatus = function (state, config, heroType, itemId) {
    const item = itemById(config, itemId), hero = heroOf(state, config, heroType);
    if (!item || !hero) return fail('장비나 영웅을 찾을 수 없습니다.');
    if (!(state.inventory || []).includes(itemId)) return fail('보관함에 없는 장비입니다.');
    if (state.phase === 'combat') return fail('전투 중에는 장비를 바꿀 수 없습니다.');
    return {ok: true, reason: '', item, hero};
  };
  window.equipItem = function (state, config, heroType, itemId) {
    const status = window.equipStatus(state, config, heroType, itemId);
    if (!status.ok) return status;
    state.inventory.splice(state.inventory.indexOf(itemId), 1);
    setSlot(state, config, status.hero, status.item);
    return {ok: true, reason: `${config.units[heroType].name}: ${status.item.name} 장착 — ${status.item.text}`};
  };
  window.unequipStatus = function (state, config, heroType, slot) {
    const hero = heroOf(state, config, heroType);
    if (!hero || !window.heroGear(config, hero)[slot]) return fail('뺄 장비가 없습니다.');
    if (state.phase === 'combat') return fail('전투 중에는 장비를 바꿀 수 없습니다.');
    return {ok: true, reason: '', hero};
  };
  window.unequipItem = function (state, config, heroType, slot) {
    const status = window.unequipStatus(state, config, heroType, slot);
    if (!status.ok) return status;
    const hero = status.hero;
    const gear = {...window.heroGear(config, hero)}, id = gear[slot];
    delete gear[slot]; hero.gear = gear; delete hero.item; (state.inventory ||= []).push(id);
    return {ok: true, reason: `${itemById(config, id).name}을(를) 보관함에 넣었습니다`};
  };

  // Found gear: the first piece of the pool nobody owns yet, picked by the campaign's seed.
  window.grantLoot = function (state, config, from) {
    const owned = new Set([...(state.inventory || []), ...state.units.flatMap(u => Object.values(u.gear || {}))]);
    const pool = config.loot.pool.filter(id => !owned.has(id));
    const list = pool.length ? pool : config.loot.pool;
    const pick = list[Math.abs(((state.seed || 1) * 31 + (state.year || 0) * 17 + state.wave * 7 + (state.lootCount || 0) * 13)) % list.length];
    (state.inventory ||= []).push(pick); state.lootCount = (state.lootCount || 0) + 1;
    return {id: pick, from};
  };

  // When a month is held: gear that pays out each month, and the spoils of a boss or a marked month.
  window.gearAfterWave = function (state, config, bossFell) {
    const heroes = state.units.filter(u => u.hp > 0 && config.units[u.type]?.hero), loot = [];
    let hope = 0, gold = 0;
    for (const hero of heroes) {
      hope += window.itemBonus(config, hero, 'hopePerWave'); gold += window.itemBonus(config, hero, 'goldPerWave');
      const heal = window.itemBonus(config, hero, 'healPerWave');
      if (heal) hero.hp = Math.min(config.units[hero.type].hp, hero.hp + config.units[hero.type].hp * heal);
    }
    if (hope) window.changeHope?.(state, config, hope);
    if (gold && state.resources) { state.resources.gold += gold; if (state.lastReward) state.lastReward.gold = (state.lastReward.gold || 0) + gold; }
    if (bossFell) loot.push(window.grantLoot(state, config, 'boss'));
    if (config.loot.waves.includes(state.wave + 1)) loot.push(window.grantLoot(state, config, 'month'));
    return {hope, gold, loot};
  };
})();
