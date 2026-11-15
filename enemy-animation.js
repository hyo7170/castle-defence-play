// Presentation only: no damage, targeting, rewards or wave progression here.
(() => {
  const valid = sheet => sheet && Number.isInteger(sheet.frames) && sheet.frames > 0 &&
    Number.isFinite(sheet.ms) && sheet.ms > 0;
  window.sampleSpriteAnimation = function(sheet, seconds, loop = false) {
    if (!valid(sheet) || !Number.isFinite(seconds)) return null;
    const elapsed = Math.max(0, seconds) * 1000;
    const index = Math.floor((elapsed + 1e-7) / sheet.ms);
    return {frame: loop ? index % sheet.frames : Math.min(index, sheet.frames - 1),
      done: !loop && elapsed + 1e-7 >= sheet.frames * sheet.ms};
  };
  window.createEnemyAnimator = function(config, assets) {
    let corpses = [], records = new Map();
    const direction = enemy => config.lanes[enemy.lane]?.axis === 'y' ? 'n' : 'e';
    const key = (kind, dir) => kind + (dir === 'n' ? 'North' : 'East');
    const definition = (enemy, kind) => assets.enemies[enemy.type]?.[kind + '_' + direction(enemy)];
    const walk = (enemy, timer) => {
      const entry = assets.enemies[enemy.type];
      const useNorth = direction(enemy) === 'n' && valid(entry?.walk_n);
      const sheet = useNorth ? entry.walk_n : entry?.walk_e;
      const elapsed = enemy.moving === false || enemy.stunUntil > timer ? 0 : (enemy.walkElapsed ?? timer);
      return {kind: 'walk', key: useNorth ? 'north' : 'walk', flip: enemy.lane === 'east',
        frame: window.sampleSpriteAnimation(sheet, elapsed, true)?.frame || 0};
    };
    return {
      get corpses() { return corpses; },
      get observedEnemies() { return records.size; },
      clear() { corpses = []; records.clear(); },
      // Capture first-tick HP before combat; existing records retain their last HP.
      observe(state) {
        for (const enemy of state.enemies) if (!records.has(enemy))
          records.set(enemy, {hp: enemy.hp, hurtAge: null});
      },
      walk,
      sample(enemy, timer) {
        const action = enemy.visualAttack;
        if (action && !enemy.moving && !(enemy.stunUntil > timer)) {
          const sampled = window.sampleSpriteAnimation(definition(enemy, 'attack'), timer - action.at);
          if (sampled && !sampled.done) return {...sampled, kind: 'attack',
            key: key('attack', direction(enemy)), flip: enemy.lane === 'east'};
        }
        // A real attack takes priority. Hurt time still expires in the background,
        // so it is never queued up and replayed after the attack has finished.
        const hurt = records.get(enemy), sheet = definition(enemy, 'hurt');
        if (enemy.hp > 0 && hurt?.hurtAge !== null && hurt?.hurtAge !== undefined) {
          const sampled = window.sampleSpriteAnimation(sheet, hurt.hurtAge);
          if (sampled && !sampled.done) return {...sampled, kind: 'hurt',
            key: key('hurt', direction(enemy)), flip: enemy.lane === 'east'};
        }
        return walk(enemy, timer);
      },
      death(enemy) {
        const sheet = definition(enemy, 'death');
        if (!valid(sheet)) return null;
        return {sheet, key: key('death', direction(enemy)), flip: enemy.lane === 'east'};
      },
      update(state, dt, suspended = false) {
        if (suspended || state.phase === 'paused' || !Number.isFinite(dt) || dt < 0) return;
        const alive = new Set(state.enemies);
        for (const [enemy] of records) if (!alive.has(enemy) || enemy.hp <= 0) records.delete(enemy);
        for (const enemy of state.enemies) {
          if (enemy.hp <= 0) continue;
          // Newly spawned enemies can be hit in the same combat step before
          // observe sees them. Spawns start at their configured maximum HP.
          const record = records.get(enemy) || {hp: config.enemies[enemy.type]?.hp ?? enemy.hp, hurtAge: null};
          if (record.hurtAge !== null) {
            record.hurtAge += dt;
            const sampled = window.sampleSpriteAnimation(definition(enemy, 'hurt'), record.hurtAge);
            if (!sampled || sampled.done) record.hurtAge = null;
          }
          if (enemy.hp < record.hp && valid(definition(enemy, 'hurt'))) record.hurtAge = 0;
          record.hp = enemy.hp;
          records.set(enemy, record);
        }
        for (const corpse of corpses) corpse.age += dt;
        for (const event of state.enemyDeaths?.splice(0) || []) {
          const death = this.death(event);
          if (death) corpses.push({...event, ...death, age: Math.max(0, state.timer - event.at)});
        }
        corpses = corpses.filter(c => !window.sampleSpriteAnimation(c.sheet, c.age).done);
        const limit = Math.max(0, Math.floor(assets.animation?.maxCorpses ?? 48));
        if (corpses.length > limit) corpses = corpses.slice(corpses.length - limit);
      },
      corpseFrame(corpse) { return window.sampleSpriteAnimation(corpse.sheet, corpse.age)?.frame || 0; }
    };
  };
})();
