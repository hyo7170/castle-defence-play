// Mercenary post: random candidates, player-chosen hiring, hero skills (GDD 7).
(() => {
  const fail = reason => ({ok: false, reason});
  const preparing = state => ['ready', 'settlement'].includes(state.phase);
  const affordable = (state, cost) => state.resources &&
    Object.entries(cost).every(([key, value]) => Number.isFinite(state.resources[key]) && state.resources[key] >= value);
  const pay = (state, cost) => { for (const [key, value] of Object.entries(cost)) state.resources[key] -= value; };
  // Small seeded generator (mulberry32) so candidate rolls are reproducible.
  const random = state => {
    let t = state.seed = ((state.seed ?? 1) + 0x6D2B79F5) | 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const heroTypes = config => Object.keys(config.units).filter(type => config.units[type].hero);
  const posts = state => (state.buildings || []).filter(b => b.type === 'mercenary' && b.hp > 0);
  const hired = (state, config) => state.units.filter(u => config.units[u.type].hero);

  window.heroLimit = (state, config) => Math.max(0, ...posts(state).map(b => config.mercenary.levels[b.level - 1].heroLimit));
  window.hiredHeroes = hired;

  // Replace the candidate list of one post (or every living post).
  window.refreshMercenaries = function (state, config, only) {
    for (const post of only ? [only] : posts(state)) {
      const level = config.mercenary.levels[post.level - 1];
      const taken = new Set(hired(state, config).map(u => u.type));
      post.candidates = [];
      post.rerolled = false;
      for (let i = 0; i < level.candidates; i++) {
        const free = heroTypes(config).filter(type => !taken.has(type));
        const grades = Object.entries(level.odds).filter(([grade]) => free.some(type => config.units[type].grade === grade));
        if (!grades.length) break;
        let roll = random(state) * grades.reduce((sum, [, weight]) => sum + weight, 0);
        const grade = (grades.find(([, weight]) => (roll -= weight) < 0) || grades[grades.length - 1])[0];
        const pool = free.filter(type => config.units[type].grade === grade);
        const pick = pool[Math.floor(random(state) * pool.length)];
        post.candidates.push(pick);
        taken.add(pick);
      }
    }
  };

  const findPost = (state, plotId) => posts(state).find(b => b.plotId === plotId);

  window.mercenaryStatus = function (state, config, plotId, action, heroType, lane) {
    const post = findPost(state, plotId);
    if (!post) return fail('사용 가능한 용병소가 없습니다.');
    if (!preparing(state)) return fail('용병소는 준비 단계에서만 이용할 수 있습니다.');
    const rules = config.mercenary;
    if (action === 'reroll') {
      if (post.rerolled) return fail('이번 웨이브에는 이미 재모집했습니다.');
      if (!affordable(state, {gold: rules.rerollCost})) return fail('골드가 부족합니다.');
      return {ok: true, reason: '', cost: {gold: rules.rerollCost}};
    }
    if (action === 'upgrade') {
      const next = rules.levels[post.level];
      if (!next) return fail('최고 단계입니다.');
      if (state.wave + (state.phase === 'settlement' ? 2 : 1) < next.fromWave) return fail(`${next.fromWave}웨이브 준비부터 강화할 수 있습니다.`);
      if (!affordable(state, next.cost)) return fail('자원이 부족합니다.');
      return {ok: true, reason: '', cost: next.cost};
    }
    if (action === 'hire') {
      const stats = config.units[heroType];
      if (!stats?.hero || !post.candidates.includes(heroType)) return fail('현재 후보가 아닙니다.');
      if (!config.recruitment.lanes.includes(lane)) return fail('배치할 전선을 선택해 주세요.');
      if (hired(state, config).length >= window.heroLimit(state, config)) return fail('영웅 고용 한도에 도달했습니다.');
      if (!affordable(state, {gold: stats.cost})) return fail('골드가 부족합니다.');
      return {ok: true, reason: '', cost: {gold: stats.cost}};
    }
    if (action === 'revive') {
      const unit = hired(state, config).find(u => u.type === heroType);
      if (!unit || unit.hp > 0) return fail('전투불능 상태의 영웅이 아닙니다.');
      const gold = Math.ceil(config.units[heroType].cost * rules.reviveFraction / 10) * 10;
      if (!affordable(state, {gold})) return fail(`골드가 부족합니다 (${gold}G).`);
      return {ok: true, reason: '', cost: {gold}};
    }
    return fail('지원하지 않는 명령입니다.');
  };

  const place = (state, config, unit, lane) => {
    const postId = lane === 'central' ? 'RESERVE' : window.frontPost(state, lane);
    const slot = window.freeFormationSlot(state, config, postId, unit.type, [unit]);
    if (slot < 0) return false;
    const post = window.unitPosts(state, config).find(p => p.id === postId);
    Object.assign(unit, {lane, wallId: post.kind === 'keep' ? 'KEEP' : postId, formationSlot: slot,
      ...window.unitDestination(config, post, unit.type, slot)});
    return true;
  };

  window.mercenaryAction = function (state, config, plotId, action, heroType, lane) {
    const status = window.mercenaryStatus(state, config, plotId, action, heroType, lane);
    if (!status.ok) return status;
    const post = findPost(state, plotId);
    if (action === 'reroll') {
      pay(state, status.cost); window.refreshMercenaries(state, config, post); post.rerolled = true;
      return {ok: true, reason: `재모집 완료 (${status.cost.gold}G)`};
    }
    if (action === 'upgrade') {
      pay(state, status.cost); post.level++; window.refreshMercenaries(state, config, post);
      post.invested ||= {...config.construction.buildings.mercenary.cost};
      for (const [key, value] of Object.entries(status.cost)) post.invested[key] = (post.invested[key] || 0) + value;
      return {ok: true, reason: `용병소 Lv.${post.level} 강화 완료`};
    }
    const stats = config.units[heroType];
    if (action === 'hire') {
      const unit = {type: heroType, hp: stats.hp, cool: 0, skillReadyAt: 0};
      if (!place(state, config, unit, lane)) return fail('배치 가능한 자리가 없습니다.');
      pay(state, status.cost);
      state.units.push(unit);
      for (const each of posts(state)) each.candidates = each.candidates.filter(type => type !== heroType);
      return {ok: true, reason: `${stats.name} 고용 · ${config.orders.laneNames[lane]} 배치`};
    }
    const unit = hired(state, config).find(u => u.type === heroType);
    const previous = {hp: unit.hp, lane: unit.lane, wallId: unit.wallId, formationSlot: unit.formationSlot, x: unit.x, y: unit.y};
    unit.hp = stats.hp;
    if (!place(state, config, unit, 'central')) { Object.assign(unit, previous); return fail('중앙 예비대에 자리가 없습니다.'); }
    unit.retreat = unit.movement = null; unit.holding = false;
    unit.visualSkill = null;
    pay(state, status.cost);
    return {ok: true, reason: `${stats.name} 부활 · 중앙 예비대 배치 (${status.cost.gold}G)`};
  };

  window.heroSkillStatus = function (state, config, heroType) {
    const unit = hired(state, config).find(u => u.type === heroType);
    if (!unit) return fail('고용하지 않은 영웅입니다.');
    if (state.phase !== 'combat') return fail('전투 중에만 사용합니다.');
    if (unit.hp <= 0) return fail('전투불능');
    if (unit.retreat || unit.movement) return fail('이동 중');
    const wait = (unit.skillReadyAt || 0) - state.timer;
    if (wait > 0) return fail(`${Math.ceil(wait)}초`);
    const skill = config.units[heroType].skill;
    if (skill.kind === 'storm' && !state.enemies.some(e => e.hp > 0 && Math.hypot(e.x - unit.x, e.y - unit.y) <= skill.range))
      return fail('사거리 안에 적이 없습니다.');
    return {ok: true, reason: '', unit, skill};
  };

  window.useHeroSkill = function (state, config, heroType) {
    const status = window.heroSkillStatus(state, config, heroType);
    if (!status.ok) return status;
    const {unit, skill} = status;
    let affected = 0, visualTarget = null;
    if (skill.kind === 'slow') {
      for (const enemy of state.enemies.filter(e => e.hp > 0 && e.lane === unit.lane)) {
        enemy.slowUntil = state.timer + skill.duration; enemy.slowFactor = skill.factor; affected++;
        if (!visualTarget || Math.hypot(enemy.x-unit.x,enemy.y-unit.y) < Math.hypot(visualTarget.x-unit.x,visualTarget.y-unit.y)) visualTarget = enemy;
      }
    } else if (skill.kind === 'guard') {
      for (const ally of state.units.filter(u => u.hp > 0 && window.unitPost(u) === window.unitPost(unit))) {
        ally.guardUntil = state.timer + skill.duration; ally.guardFactor = skill.factor; affected++;
      }
    } else if (skill.kind === 'storm') {
      const distance = e => Math.hypot(e.x - unit.x, e.y - unit.y);
      const target = state.enemies.filter(e => e.hp > 0 && distance(e) <= skill.range).sort((a, b) => distance(a) - distance(b))[0];
      visualTarget = target;
      for (const enemy of state.enemies.filter(e => e.hp > 0 && Math.hypot(e.x - target.x, e.y - target.y) <= skill.radius)) {
        enemy.hp = Math.max(0, enemy.hp - skill.damage); enemy.stunUntil = state.timer + skill.stun; affected++;
      }
      window.addEffect?.(state, config, unit, target, 'storm', skill.radius);
    }
    unit.skillReadyAt = state.timer + config.mercenary.skillCooldown - (window.itemBonus?.(config, unit, 'cooldown') ?? 0);
    // Presentation only. Effects above already happened; no delayed skill queue.
    unit.visualSkill = {at: state.timer, ...(visualTarget ? {x: visualTarget.x, y: visualTarget.y} : {})};
    return {ok: true, reason: `${config.units[heroType].name}: ${skill.name} (${affected})`};
  };
})();
