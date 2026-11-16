// The army in one place: recruiting without a barracks, a summary of every post,
// and one "move this group there" command that picks the right order for the phase.
(() => {
  const fail = reason => ({ok: false, reason});
  const regular = (config, unit) => !config.units[unit.type].hero;

  // Posts the player can see and use, in a fixed reading order: the reserve, then each lane front to back, then the keep.
  window.armyPosts = function (state, config) {
    const posts = window.unitPosts(state, config);
    const order = ['RESERVE', ...state.walls.map(w => w.id), ...window.laneList(config).map(l => `KEEP:${l}`)];
    return order.map(id => posts.find(p => p.id === id)).filter(Boolean);
  };

  window.armySummary = function (state, config) {
    const alive = state.units.filter(u => u.hp > 0);
    const posts = window.armyPosts(state, config).map(post => {
      const units = alive.filter(u => window.unitPost(u) === post.id);
      const counts = {};
      for (const unit of units) if (regular(config, unit)) counts[unit.type] = (counts[unit.type] || 0) + 1;
      const hp = units.reduce((s, u) => s + u.hp, 0), max = units.reduce((s, u) => s + config.units[u.type].hp, 0);
      const wall = state.walls.find(w => w.id === post.id) || null;
      return {...post, units, counts, heroes: units.filter(u => !regular(config, u)), health: max ? hp / max : 0,
        moving: units.filter(u => u.retreat || u.movement).length, holding: units.length > 0 && units.every(u => u.holding), wall};
    });
    // Short label per lane for the always-visible chip: troops at that lane's posts (walls and keep side).
    const byLane = {};
    for (const lane of window.laneList(config)) byLane[lane] = alive.filter(u => u.lane === lane && u.wallId !== 'RESERVE').length;
    return {posts, total: alive.filter(u => regular(config, u)).length, capacity: window.troopCapacity(state, config),
      reserve: alive.filter(u => u.wallId === 'RESERVE').length, byLane, heroes: alive.filter(u => !regular(config, u)).length};
  };

  const capacityOf = (config, post) => post.kind === 'reserve' ? config.orders.reserveCapacity : config.recruitment.laneCapacity;
  const occupants = (state, config, post) => state.units.filter(u => u.hp > 0 && regular(config, u) &&
    (post.kind === 'reserve' ? u.wallId === 'RESERVE' : u.lane === post.lane && u.wallId !== 'RESERVE'));

  // Recruit straight into a post. A barracks is no longer needed to train troops; barracks raise the limit.
  window.recruitStatus = function (state, config, type, postId = 'RESERVE') {
    if (!['ready', 'settlement'].includes(state.phase)) return fail('병사는 준비 단계에서만 뽑을 수 있습니다.');
    if (!config.recruitment.types.includes(type)) return fail('뽑을 수 없는 병종입니다.');
    const post = window.unitPosts(state, config).find(p => p.id === postId);
    if (!post || !post.available) return fail('그 위치에는 배치할 수 없습니다.');
    if (state.units.filter(u => u.hp > 0 && regular(config, u)).length >= window.troopCapacity(state, config))
      return fail('한도 가득 · 병영으로 늘림');
    if (occupants(state, config, post).length >= capacityOf(config, post)) return fail('자리 가득');
    if (!(state.resources?.gold >= config.units[type].cost)) return fail('골드 부족');
    return {ok: true, reason: '', post};
  };
  window.recruit = function (state, config, type, postId = 'RESERVE') {
    const status = window.recruitStatus(state, config, type, postId);
    if (!status.ok) return status;
    const post = status.post, slot = window.freeFormationSlot(state, config, post.id, type);
    if (slot < 0) return fail('그 위치에 자리가 없습니다.');
    state.resources.gold -= config.units[type].cost;
    state.units.push({type, lane: post.lane, wallId: post.kind === 'keep' ? 'KEEP' : post.id, formationSlot: slot,
      hp: config.units[type].hp, cool: 0, ...window.unitDestination(config, post, type, slot)});
    return {ok: true, reason: `${config.recruitment.names[type]} 1명 · ${post.name}`};
  };

  // Where a group may be sent right now. In preparation: anywhere standing. In battle: the reserve
  // reinforces a lane, and a front falls back one step (outer gate → inner gate or keep → reserve).
  window.moveTargets = function (state, config, sourceId) {
    const posts = window.armyPosts(state, config), from = posts.find(p => p.id === sourceId);
    if (!from) return [];
    if (state.phase !== 'combat') return posts.filter(p => p.id !== sourceId && p.available &&
      (p.kind !== 'keep' || !state.walls.some(w => w.lane === p.lane && w.hp > 0)));
    if (sourceId === 'RESERVE') return window.laneList(config).map(lane => posts.find(p => p.id === window.frontPost(state, lane))).filter(Boolean);
    const plan = window.groupOrderPlan(state, config, sourceId, null, 'retreat');
    return plan.ok ? [plan.post] : [];
  };
  window.moveGroup = function (state, config, sourceId, targetId) {
    if (!['ready', 'settlement', 'combat'].includes(state.phase)) return fail('지금은 병력을 움직일 수 없습니다.');
    const target = window.moveTargets(state, config, sourceId).find(p => p.id === targetId);
    if (!target) return fail(state.phase === 'combat' ? '전투 중에는 예비대 증원과 한 단계 후퇴만 할 수 있습니다.' : '그곳으로는 보낼 수 없습니다.');
    if (state.phase !== 'combat') return window.issueGroupOrder(state, config, sourceId, targetId, 'deploy');
    if (sourceId === 'RESERVE') return window.issueGroupOrder(state, config, sourceId, target.lane, 'reinforce');
    return window.issueGroupOrder(state, config, sourceId, null, 'retreat');
  };
})();
