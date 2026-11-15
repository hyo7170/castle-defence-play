// Presentation only. Observe movement, HP and per-attacker contact snapshots; never
// change targets, damage, cooldowns, movement, rewards or hero revival rules.
(() => {
  window.unitFacing = function (dx, dy, fallback = 's') {
    if (!Number.isFinite(dx) || !Number.isFinite(dy) || Math.hypot(dx, dy) < .001) return fallback;
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'e' : 'w') : (dy > 0 ? 's' : 'n');
  };
  window.createUnitAnimator = function (config, assets) {
    let records = new Map(), corpses = [];
    const supported = unit => !!assets.units[unit.type]?.directions;
    const moving = u => u.retreat || u.movement;
    const record = u => {
      if (!records.has(u)) {
        const spawn = config.lanes[u.lane]?.spawn;
        records.set(u, {hp: u.hp, direction: spawn ? window.unitFacing(spawn.x-u.x, spawn.y-u.y) : 's',
          idle: 0, walk: 0, attack: null, hurt: null, skill: null, lastAttack: null, lastSkill: null});
      }
      return records.get(u);
    };
    const turnToMovement = (u, r) => {
      const move = moving(u);
      if (move) r.direction = window.unitFacing(move.to.x-u.x, move.to.y-u.y,
        window.unitFacing(move.to.x-move.from.x, move.to.y-move.from.y, r.direction));
    };
    const sample = (u, r) => {
      const action = moving(u) ? 'walk' : r.skill ? 'skill' : r.hurt ? 'hurt' : r.attack ? 'attack' : 'idle';
      const direction = action === 'skill' ? r.skill.direction : r.direction;
      const entry = assets.units[u.type].directions[direction];
      const elapsed = action === 'walk' ? r.walk : action === 'idle' ? r.idle : r[action].age;
      return {action, direction, frame: window.sampleSpriteAnimation(entry?.[action], elapsed,
        action === 'walk' || action === 'idle')?.frame || 0, legacyFlip: u.lane === 'west'};
    };
    return {
      get corpses() { return corpses; },
      clear() { records = new Map(); corpses = []; },
      // Called before combat so first-tick damage/death and movement arrival are observed.
      observe(state) {
        for (const u of state.units) if (supported(u)) turnToMovement(u, record(u));
      },
      update(state, dt, suspended = false) {
        if (suspended || state.phase === 'paused' || !Number.isFinite(dt) || dt < 0) return;
        for (const corpse of corpses) corpse.age += dt;
        const units = new Set(state.units);
        for (const [unit] of records) if (!units.has(unit)) records.delete(unit);
        corpses = corpses.filter(c => units.has(c.unit) && c.unit.hp <= 0 &&
          !window.sampleSpriteAnimation(c.sheet, c.age).done);
        for (const u of state.units) {
          if (!supported(u)) continue;
          const r = record(u), entry = assets.units[u.type].directions;
          r.idle += dt;
          for (const action of ['attack', 'hurt', 'skill']) if (r[action]) {
            r[action].age += dt;
            const sampled = window.sampleSpriteAnimation(entry[action === 'skill' ? r.skill.direction : r.direction]?.[action], r[action].age);
            if (!sampled || sampled.done) r[action] = null;
          }
          if (u.hp <= 0) {
            const direction = r.skill?.direction || r.direction;
            if (r.hp > 0 && entry[direction]?.death) corpses.push({unit:u, type:u.type, x:u.x, y:u.y,
              direction, sheet:entry[direction].death, age:0});
            r.hp = u.hp; r.attack = r.hurt = r.skill = null; r.lastSkill = u.visualSkill; continue;
          }
          if (r.hp <= 0) { r.attack = r.hurt = r.skill = null; r.walk = r.idle = 0; r.lastAttack = u.visualAttack; r.lastSkill = u.visualSkill; }
          if (u.hp < r.hp) r.hurt = {age:0};
          r.hp = u.hp;
          // Untargeted casts keep the displayed facing from before an ordinary
          // attack can turn the hero during this same simulation step.
          const cast = u.visualSkill;
          const castDirection = window.unitFacing(cast?.x-u.x, cast?.y-u.y, r.direction);
          const contact = u.visualAttack;
          if (contact && contact !== r.lastAttack) {
            r.lastAttack = contact;
            const age = state.timer-contact.at;
            if (!moving(u) && age >= 0 && age < (entry[r.direction]?.attack?.frames || 0) * (entry[r.direction]?.attack?.ms || 0)/1000) {
              r.direction = window.unitFacing(contact.x-u.x, contact.y-u.y, r.direction);
              r.attack = {age};
            }
          }
          if (cast && cast !== r.lastSkill) {
            r.lastSkill = cast;
            const direction = castDirection;
            const sheet = entry[direction]?.skill, sampled = window.sampleSpriteAnimation(sheet, state.timer-cast.at);
            if (!moving(u) && state.timer >= cast.at && sampled && !sampled.done) {
              r.direction = direction; r.skill = {age:state.timer-cast.at, direction};
            }
          }
          if (moving(u)) { turnToMovement(u,r); r.walk += dt; r.attack = r.hurt = r.skill = null; }
          else r.walk = 0;
        }
        corpses = corpses.slice(-Math.max(1, assets.animation?.maxCorpses || 48));
      },
      sample(u) { if (!supported(u)) return null; return sample(u, record(u)); },
      corpsePose(c) { return {action:'death', direction:c.direction,
        frame:window.sampleSpriteAnimation(c.sheet,c.age)?.frame || 0}; }
    };
  };
  window.resolveUnitPose = function(type, pose, library, variants) {
    const ready = sheet => sheet?.image.complete && sheet.image.naturalWidth;
    const directional = variants[type]?.directions?.[pose.direction];
    if (ready(directional?.[pose.action])) return {sheet:directional[pose.action],frame:pose.frame,flip:false};
    // Never show a standing fallback as a dead hero.
    if (pose.action === 'death') return null;
    if (ready(directional?.idle)) return {sheet:directional.idle,frame:0,flip:false};
    const legacy = pose.action === 'attack' && ready(variants[type]?.attack) ? variants[type].attack : library[type];
    return {sheet:legacy,frame:0,flip:!!pose.legacyFlip};
  };
})();
