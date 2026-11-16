window.startWave = function (state, config) {
  if (state.phase === 'settlement') state.wave++;
  else if (state.phase !== 'ready') return false;
  state.queue = [];
  for (const lane of window.laneList(config)) {
    let count = 0;
    for (const [type, base] of config.waves[state.wave][lane] || []) {
      // Later years bring more of everything except bosses.
      const amount = config.enemies[type].cleave ? base : Math.max(1, Math.round(base * (window.yearScale?.(config, state).count ?? 1)));
      for (let i = 0; i < amount; i++) state.queue.push({lane, type, at: count++ * config.spawnInterval});
    }
  }
  state.timer = 0;
  state.combatRemainder = 0;
  state.effects = [];
  state.enemyDeaths = [];
  // Hope bookkeeping for this month.
  state.beaconUsed = false; state.beaconUntil = 0;
  state.hopeAtStart = state.hope; state.hopeWallsLost = 0;
  state.hopeUnitsDown = state.units.filter(u => u.hp <= 0).length; state.hopeKeepSeen = state.keep;
  state.report = null;
  for (const wall of state.walls) { wall.repairReadyAt = 0; wall.visualCollapse = null; }
  for (const unit of state.units) { unit.skillReadyAt = 0; unit.guardUntil = 0; unit.visualAttack = null; unit.visualSkill = null; }
  state.waveStats = {kills: 0, gold: 0,
    units: state.units.filter(u => u.hp > 0).length,
    buildings: (state.buildings || []).filter(b => b.hp > 0 && !config.construction.buildings[b.type].trap).length,
    walls: state.walls.filter(w => w.hp > 0).length};
  state.phase = 'combat';
  return true;
};
window.advanceCombat = function (state, config, dt) {
  if (state.phase !== 'combat' || !Number.isFinite(dt) || dt <= 0) return;
  const step = config.combat.maxStep;
  if (!(step > 0) || !Number.isFinite(step)) throw new Error('Invalid combat step');
  // Accumulate short frames instead of using the display refresh rate as the
  // simulation step. Every combat update uses the same configured interval.
  state.combatRemainder = (state.combatRemainder || 0) + dt;
  while (state.combatRemainder + 1e-9 >= step && state.phase === 'combat') {
    state.combatRemainder = Math.max(0, state.combatRemainder - step);
    updateCombat(state, config, step);
  }
};
function updateCombat(state, config, dt) {
  if (state.phase !== 'combat') return;
  state.timer += dt;
  for (let i = state.queue.length - 1; i >= 0; i--) {
    if (state.queue[i].at > state.timer) continue;
    const spawn = state.queue.splice(i, 1)[0];
    const base = config.lanes[spawn.lane].spawn;
    // Spread arrivals so enemies do not stack on one pixel.
    const slot = (Math.round(spawn.at / config.spawnInterval) % config.combat.spawnSlots -
      (config.combat.spawnSlots - 1) / 2) * config.combat.spawnSlotSpacing;
    state.enemies.push({ ...spawn, ...config.enemies[spawn.type], ...base,
      gateSlot: Math.round(spawn.at / config.spawnInterval),
      x: base.x + (window.laneLateral(config, spawn.lane) === 'x' ? slot : 0),
      y: base.y + (window.laneLateral(config, spawn.lane) === 'y' ? slot : 0), cool: 0 });
    const grown = window.yearScale?.(config, state), fresh = state.enemies[state.enemies.length - 1];
    if (grown) { fresh.hp *= grown.hp; fresh.damage *= grown.damage; }
    fresh.maxHp = fresh.hp;
  }
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  for (const unit of state.units) {
    if (unit.hp <= 0) continue;
    if (unit.retreat || unit.movement) {
      const key=unit.retreat?'retreat':'movement';
      const move = unit[key];
      move.elapsed = Math.min(move.duration, move.elapsed + dt);
      const fraction = move.elapsed / move.duration;
      unit.x = move.from.x + (move.to.x - move.from.x) * fraction;
      unit.y = move.from.y + (move.to.y - move.from.y) * fraction;
      if (fraction >= 1) unit[key] = null;
      continue;
    }
    unit.cool -= dt;
    const stats = config.units[unit.type];
    const target = state.enemies.filter(e => e.hp > 0 && distance(e, unit) <= stats.range)
      .sort((a, b) => distance(a, unit) - distance(b, unit))[0];
    if (target && unit.cool <= 0) {
      for (const enemy of state.enemies) {
        if (enemy.hp > 0 && (enemy === target || (stats.splash > 0 && distance(enemy, target) <= stats.splash * (window.researchBonus?.(state, config, 'splashRadius') ?? 1))))
          enemy.hp = Math.max(0, enemy.hp - (window.unitDamage?.(state, config, unit) ?? stats.damage));
      }
      window.addEffect(state, config, unit, target, unit.type, stats.splash);
      // Presentation snapshot on this exact attacker, independent of shared FX.
      unit.visualAttack = {at: state.timer, x: target.x, y: target.y};
      unit.cool = stats.interval / (window.hopeAttackSpeed?.(state, config) ?? 1);
    }
  }
  if (state.buildings?.length) window.advanceBuildings(state,config,dt);
  // The keep's own guard: archers on its walls answer anything that comes close, so the last stand is a fight, not a countdown.
  const guard = config.keepGuard;
  if (guard && state.keep > 0) {
    state.keepCool = (state.keepCool || 0) - dt;
    if (state.keepCool <= 0) {
      const near = state.enemies.filter(e => e.hp > 0 && distance(e, config.keep) <= guard.range)
        .sort((a, b) => distance(a, config.keep) - distance(b, config.keep)).slice(0, guard.volley);
      if (near.length) {
        for (const enemy of near) { enemy.hp = Math.max(0, enemy.hp - guard.damage); window.addEffect(state, config, {x: config.keep.x, y: config.keep.y - 60}, enemy, 'archerTower', 0); }
        state.keepCool = guard.interval;
      }
    }
  }
  const crowd = new Map();
  for (const enemy of state.enemies) {
    if (enemy.hp <= 0) continue;
    enemy.moving = false;
    if (enemy.stunUntil > state.timer) { enemy.visualAttack = null; continue; }
    const wall = state.walls.find(w => w.lane === enemy.lane && w.hp > 0);
    const spawn = config.lanes[enemy.lane].spawn;
    // Test the side of the wall along the invasion axis, not radial distance:
    // a soldier standing near a gate's edge can be farther from the spawn
    // than the wall's center while still standing in front of the wall.
    const behindWall = u => wall &&
      (u.x - wall.x) * (wall.x - spawn.x) +
      (u.y - wall.y) * (wall.y - spawn.y) > 0;
    // Only a few enemies can crowd one defender; the rest press on to the gate.
    // Without this cap a single soldier absorbed a whole wave until he fell,
    // and outcomes swung between "walls untouched" and "everything lost".
    // Fieldworks are not fought like defenders: traps are walked over, barricades and forward bases block the lane.
    const obstacle = window.laneObstacle?.(state, config, enemy) || null;
    const defender = !enemy.ignoresDefenders && state.timer < config.combat.forcedAdvanceAfter && [...state.units,...(state.buildings || []).filter(b => !config.construction.buildings[b.type].fieldwork)].filter(u => u.hp > 0 && !u.retreat && !behindWall(u)
      && distance(u, enemy) <= config.combat.engageRange && (crowd.get(u) || 0) < config.combat.maxAttackersPerDefender)
      .sort((a,b) => distance(a,enemy) - distance(b,enemy))[0];
    if (defender) crowd.set(defender, (crowd.get(defender) || 0) + 1);
    const index = enemy.gateSlot || 0;
    const offset = (index % 2 ? 1 : -1) * Math.ceil(index / 2) * config.combat.gateSlotSpacing;
    const structure = obstacle || wall || config.keep;
    // Stop just outside the structure on the side the lane arrives from.
    const info = config.lanes[enemy.lane], stand = -info.sign * (obstacle ? config.fieldworks.standDistance : config.combat.gateDistance);
    const spread = obstacle ? Math.max(-config.fieldworks.maxLateralOffset, Math.min(config.fieldworks.maxLateralOffset, offset)) : offset;
    const gateTarget = info.axis === 'y'
      ? {x:structure.x + spread, y:structure.y + stand}
      : {x:structure.x + stand, y:structure.y + spread};
    let target = defender || gateTarget;
    let gap = defender ? config.combat.meleeDistance : 0;
    // A fallen wall leaves only its gateway open: head for the opening first
    // instead of walking through the rubble beside it.
    const lateral = info.axis === 'y' ? 'x' : 'y', half = config.combat.gateOpening / 2;
    const rubble = state.walls.find(w => w.lane === enemy.lane && w.hp <= 0 &&
      (w[info.axis] - enemy[info.axis]) * info.sign > 0.5 && Math.abs(enemy[lateral] - w[lateral]) > half);
    const strike = target;
    if (rubble) {
      target = {[info.axis]: rubble[info.axis], [lateral]: rubble[lateral] + Math.sign(enemy[lateral] - rubble[lateral]) * half};
      gap = 0;
    }
    let dist = distance(enemy, target);
    // Close enough to the real target already (a defender beside the breach): fight instead of detouring.
    if (rubble && distance(enemy, strike) <= (defender ? config.combat.meleeDistance : 0)) { target = strike; gap = defender ? config.combat.meleeDistance : 0; dist = distance(enemy, target); }
    // Presentation only: remember what is being struck so the attack pose can follow it.
    const attackedObject = defender || obstacle || wall || config.keep;
    if (enemy.visualAttack?.target !== attackedObject) enemy.visualAttack = null;
    if (dist > gap) {
      enemy.moving = true;
      enemy.visualAttack = null;
      enemy.walkElapsed = (enemy.walkElapsed || 0) + dt;
      const slowed = enemy.slowUntil > state.timer ? enemy.slowFactor : 1;
      const step = Math.min(enemy.speed * slowed * dt, dist - gap);
      enemy.x += (target.x - enemy.x) / dist * step;
      enemy.y += (target.y - enemy.y) / dist * step;
    } else {
      enemy.cool -= dt;
      if (enemy.cool > 0) continue;
      // Frame zero is contact. This timestamp never schedules or repeats damage.
      enemy.visualAttack = {at: state.timer, target: attackedObject};
      if (defender) {
        const struck = enemy.cleave ? [...state.units, ...(state.buildings || [])].filter(u => u.hp > 0 && !u.retreat &&
          (u === defender || distance(u, defender) <= enemy.cleave)) : [defender];
        for (const victim of struck) victim.hp = Math.max(0, victim.hp - enemy.damage/(victim.holding?config.orders.holdDefenseFactor:1)*(victim.guardUntil>state.timer?victim.guardFactor:1)*(window.unitArmor?.(state, config, victim) ?? 1));
      }
      else if (obstacle) {
        obstacle.hp = Math.max(0, obstacle.hp - enemy.damage * (enemy.wallDamage || 1));
        if (!obstacle.hp && obstacle.type === 'outpost') {
          state.events.push(`${config.lanes[obstacle.lane].name} 전진기지 함락`);
          window.changeHope?.(state, config, config.hope.outpostLost);
        }
      }
      else if (wall) {
        wall.hp = Math.max(0, wall.hp - enemy.damage * (enemy.wallDamage || 1));
        if (!wall.hp) {
          wall.collapsed = true;
          window.changeHope?.(state, config, config.hope.wallLost); state.hopeWallsLost = (state.hopeWallsLost || 0) + 1;
          wall.visualCollapse = {at: state.timer}; // Presentation timestamp only.
          state.events.push(`${wall.id} 붕괴`);
          for (const unit of state.units.filter(u => u.wallId === wall.id && u.hp > 0)) {
            const travelling=unit.retreat||unit.movement;
            if(!travelling)unit.hp *= 1 - config.combat.collapseDamageFraction;
            const next = state.walls.find(w => w.lane === wall.lane && w.hp > 0) || config.keep;
            const offsets = next.id ? config.combat.retreatOffsets : config.combat.keepRetreatOffsets;
            const offset = offsets[unit.lane][window.formationOf(config, unit.type)];
            const postId=next.id||`KEEP:${unit.lane}`;
            const slot=window.freeFormationSlot(state,config,postId,unit.type,[unit]);
            const spread = config.recruitment.formationOffsets[slot];
            unit.formationSlot=slot;unit.holding=false;
            unit.wallId = next.id || 'KEEP';
            const key=unit.movement?'movement':'retreat';
            unit[key] = { from: {x: unit.x, y: unit.y},
              to: {x: next.x + offset.x + (window.laneLateral(config, unit.lane)==='x'?spread:0),
                y: next.y + offset.y + (window.laneLateral(config, unit.lane)==='y'?spread:0)},
              elapsed: 0, duration: travelling?Math.max(config.combat.maxStep,travelling.duration-travelling.elapsed):config.combat.retreatDuration };
          }
        }
      } else state.keep = Math.max(0, state.keep - enemy.damage);
      enemy.cool = enemy.interval;
    }
  }
  window.trackHope?.(state, config);
  const dead=state.enemies.filter(e=>e.hp<=0);
  if (state.enemyDeaths) for (const enemy of dead) {
    if (state.enemyDeaths.length >= config.combat.maxEffects) state.enemyDeaths.shift();
    state.enemyDeaths.push({type: enemy.type, lane: enemy.lane, x: enemy.x, y: enemy.y,
      size: enemy.size, color: enemy.color, at: state.timer});
  }
  // Render-only kill markers with the gold earned.
  if (state.effects && state.resources) for (const enemy of dead) {
    if (state.effects.length >= config.combat.maxEffects) state.effects.shift();
    state.effects.push({kind: 'gold', x1: enemy.x, y1: enemy.y, x2: enemy.x, y2: enemy.y, splash: 0,
      text: `+${config.economy.killGold[enemy.type] || 0}G`, start: state.timer, until: state.timer + config.combat.killMarkerSeconds});
    state.effects.push({kind: 'death', type: enemy.type, lane: enemy.lane, x1: enemy.x, y1: enemy.y, x2: enemy.x, y2: enemy.y, splash: 0,
      start: state.timer, until: state.timer + config.combat.effectSeconds});
  }
  if (state.resources) window.rewardBattle(state,config,dead,false);
  if (state.waveStats) state.waveStats.bosses = (state.waveStats.bosses || 0) + dead.filter(e => e.type === 'boss').length;
  const alive = state.enemies.filter(e => e.hp > 0);
  state.kills += state.enemies.length - alive.length;
  if (state.waveStats) state.waveStats.kills += state.enemies.length - alive.length;
  if (state.effects?.length) state.effects = state.effects.filter(effect => effect.until > state.timer);
  state.enemies = alive;
  if (!state.keep) state.phase = 'defeat';
  else if (!state.queue.length && !state.enemies.length) {
    // Finish in-flight retreats at settlement so the next wave starts at valid positions.
    for (const unit of state.units) {
      if (unit.retreat && unit.hp > 0) Object.assign(unit, unit.retreat.to);
      if (unit.movement && unit.hp > 0) Object.assign(unit, unit.movement.to);
      unit.retreat = null;
      unit.movement = null;
    }
    state.phase = state.wave === config.waves.length - 1 ? 'victory' : 'settlement';
    if (state.resources) window.rewardBattle(state,config,[],true);
    state.effects = [];
    // Holding the line kindles hope; holding it without losing a gate kindles more.
    window.changeHope?.(state, config, config.hope.waveCleared + (state.hopeWallsLost ? 0 : config.hope.flawless));
    // Gear that pays out each month, and spoils from a fallen boss or a marked month.
    const gear = window.gearAfterWave ? window.gearAfterWave(state, config, (state.waveStats?.bosses || 0) > 0) : null;
    if (state.waveStats) {
      const stats = state.waveStats;
      state.report = {wave: state.wave + 1, kills: stats.kills, gold: stats.gold,
        reward: state.resources ? {...(state.lastReward || config.economy.waveReward)} : null,
        unitsLost: stats.units - state.units.filter(u => u.hp > 0).length,
        buildingsLost: stats.buildings - (state.buildings || []).filter(b => b.hp > 0 && !config.construction.buildings[b.type].trap).length,
        wallsLost: stats.walls - state.walls.filter(w => w.hp > 0).length,
        hope: state.hope === undefined ? null : {from: state.hopeAtStart, to: state.hope}, loot: gear?.loot || []};
    }
    if (state.phase === 'settlement') {
      window.refreshMercenaries?.(state, config);
      window.drawDecision?.(state, config);
      const fraction = window.hopeRecovery?.(state, config, config.combat.betweenWaveRecoveryFraction) ?? config.combat.betweenWaveRecoveryFraction;
      for (const wall of state.walls) {
        if (wall.hp <= 0) continue;
        const max = window.wallMaxHp(config, wall);
        wall.hp = Math.min(max, wall.hp + max * fraction);
      }
      for (const unit of state.units) {
        if (unit.hp <= 0) continue;
        const max = config.units[unit.type].hp;
        // Hospitals add to the base recovery of regular troops on their lane (central: every lane).
        const heal = config.units[unit.type].hero ? 0 : (state.buildings || []).filter(b => b.hp > 0 && b.type === 'hospital' &&
          (b.lane === unit.lane || b.lane === 'central')).reduce((sum, b) => sum + window.buildingStats(config, b).heal, 0);
        unit.hp = Math.min(max, unit.hp + max * (fraction + heal));
      }
    }
  }
}

// Short-lived, render-only attack markers. They never affect combat results.
window.addEffect = function (state, config, from, to, kind, splash) {
  if (!state.effects) return;
  if (state.effects.length >= config.combat.maxEffects) state.effects.shift();
  state.effects.push({kind, x1: from.x, y1: from.y, x2: to.x, y2: to.y, splash: splash || 0,
    start: state.timer, until: state.timer + config.combat.effectSeconds});
};
// Coarse scouting report for a wave, as shown during preparation.
window.scoutWave = function (config, waveIndex) {
  const wave = config.waves[waveIndex];
  if (!wave) return null;
  const level = (table, value) => table.find(([limit]) => value <= limit)[1];
  const report = {wave: waveIndex + 1, lanes: {}, dangers: []};
  let wolves = 0, golems = 0;
  for (const lane of window.laneList(config)) {
    const groups = wave[lane] || [];
    if (!groups.length && config.lanes[lane].raid) continue;   // raid lanes are listed only when they attack
    const total = groups.reduce((sum, [, count]) => sum + count, 0);
    const siege = groups.filter(([type]) => config.enemies[type].wallDamage > 1).reduce((sum, [, count]) => sum + count, 0);
    wolves += groups.filter(([type]) => type === 'wolf').reduce((sum, [, count]) => sum + count, 0);
    golems += siege;
    report.lanes[lane] = {total, volume: total ? level(config.scouting.volume, total) : '없음',
      siege: level(config.scouting.siege, siege)};
  }
  if (golems) report.dangers.push('공성 골렘: 병사를 무시하고 성벽을 부숩니다');
  if (wolves) report.dangers.push('늑대 무리: 빠르게 접근합니다');
  if (report.lanes.west) report.dangers.push('서쪽 기습: 빠른 적이 서쪽 암문으로 몰려옵니다');
  const omen = config.scouting.omens?.[waveIndex + 1];
  if (omen) report.dangers.push(omen);
  if (window.laneList(config).some(lane => (wave[lane] || []).some(([type]) => config.enemies[type].cleave)))
    report.dangers.push('보스 출현: 주변 수비병을 한꺼번에 공격합니다');
  return report;
};
