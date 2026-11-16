// The army panel: always-visible troop count, recruiting, every post at a glance,
// and "tap a group, then tap where it should go" (in the list or on a gate on the field).
window.createArmyUI = function (config, getState, onOpen, canvas, getView, toast) {
  const el = (tag, props = {}) => Object.assign(document.createElement(tag), props);
  const names = {infantry: '보병', archer: '궁수', mage: '마법사'};
  let selected = 'RESERVE', lastKey = '';

  const chip = el('button', {id: 'army-chip'}); chip.setAttribute('aria-label', '병력 보기');
  document.querySelector('#controls').prepend(chip);
  const panel = el('section', {id: 'army-panel', hidden: true}); panel.setAttribute('aria-label', '병력');
  const head = el('div', {className: 'army-head'}), title = el('strong'), close = el('button', {textContent: '닫기'});
  close.setAttribute('aria-label', '병력 패널 닫기'); head.append(title, close);
  const recruitRow = el('div', {className: 'army-recruit'}), list = el('div', {className: 'army-list'});
  const detail = el('div', {className: 'army-detail'}), notice = el('p', {className: 'army-notice'});
  notice.setAttribute('role', 'status');
  panel.append(head, recruitRow, notice, list); document.body.append(panel);

  const show = postId => { if (postId) selected = postId; onOpen(); panel.hidden = false; chip.setAttribute('aria-expanded', 'true'); lastKey = ''; update(); };
  const hide = () => { panel.hidden = true; chip.setAttribute('aria-expanded', 'false'); notice.textContent = ''; lastKey = ''; };
  close.onclick = hide;
  chip.onclick = () => (panel.hidden ? show() : hide());
  document.addEventListener('construction-opened', hide);
  const say = result => { notice.textContent = result.reason; lastKey = ''; update(); };

  function button(parent, text, aria, status, run, small) {
    const b = el('button', {textContent: text}); b.setAttribute('aria-label', aria);
    b.disabled = !status.ok; b.title = status.reason || '';
    if (small || !status.ok) b.append(el('br'), el('small', {textContent: status.ok ? small : status.reason}));
    b.onclick = () => say(run()); parent.append(b); return b;
  }

  function update() {
    const state = getState(), army = window.armySummary(state, config);
    const lanes = window.laneList(config).map(l => `${config.lanes[l].name[0]}${army.byLane[l]}`).join(' ');
    const chipText = `병력 ${army.total}/${army.capacity} · ${lanes} 예${army.reserve}`;
    if (chip.textContent !== chipText) chip.textContent = chipText;
    if (panel.hidden) return;
    if (!army.posts.some(p => p.id === selected)) selected = 'RESERVE';
    const preparing = ['ready', 'settlement'].includes(state.phase);
    const key = JSON.stringify([state.phase, selected, Math.floor(state.resources.gold), army.posts.map(p => [p.id, p.available, Object.values(p.counts),
      p.heroes.length, Math.round(p.health * 20), p.moving, p.holding, p.wall && [Math.round(p.wall.hp), p.wall.level, Math.ceil(Math.max(0, (p.wall.repairReadyAt || 0) - state.timer))]]),
      state.resources.stone, army.capacity]);
    if (key === lastKey) return; lastKey = key;
    const post = army.posts.find(p => p.id === selected);
    title.textContent = `병력 ${army.total}/${army.capacity}${army.heroes ? ` · 영웅 ${army.heroes}` : ''}`;

    // Recruit into the selected post (or the reserve).
    recruitRow.replaceChildren();
    recruitRow.hidden = !preparing;
    if (preparing) for (const type of config.recruitment.types)
      button(recruitRow, `${names[type]} ${config.units[type].cost}G`, `${names[type]} 뽑기`, window.recruitStatus(state, config, type, selected),
        () => window.recruit(getState(), config, type, selected), `→ ${post.name}`);

    // Every post: who is there and how they are doing. Tap to select.
    list.replaceChildren();
    for (const p of army.posts) {
      const empty = !p.units.length;
      if (empty && p.kind === 'keep' && state.walls.some(w => w.lane === p.lane && w.hp > 0)) continue;   // keep posts appear once a lane has fallen
      const row = el('button', {className: 'army-row'}); row.setAttribute('aria-label', p.name); row.setAttribute('aria-pressed', String(p.id === selected));
      const counts = Object.entries(p.counts).map(([t, n]) => `${names[t][0]}${n}`).join(' ') + (p.heroes.length ? ` ★${p.heroes.length}` : '');
      const tags = [p.wall && (p.wall.hp > 0 ? `성벽 ${Math.round(100 * p.wall.hp / window.wallMaxHp(config, p.wall))}%` : '붕괴'),
        p.moving && `이동 ${p.moving}`, p.holding && '사수'].filter(Boolean).join(' · ');
      row.append(el('span', {className: 'army-name', textContent: p.name}));
      if (tags) row.append(el('small', {textContent: tags}));
      row.append(el('span', {className: 'army-counts', textContent: counts || '비어 있음'}));
      const bar = el('i', {className: 'army-hp'}); bar.style.setProperty('--hp', `${Math.round(p.health * 100)}%`); if (!empty) row.append(bar);
      row.disabled = !p.available && empty;
      row.onclick = () => { selected = p.id; notice.textContent = ''; lastKey = ''; update(); detail.scrollIntoView?.({block: 'nearest'}); };
      list.append(row);
      if (p.id === selected) list.append(detail);   // the selected group's commands open right under it
    }

    // The selected post: where its troops can go, hold, and the gate's own commands.
    detail.replaceChildren();
    if (post.units.some(u => !u.retreat && !u.movement)) {
      const targets = window.moveTargets(state, config, post.id);
      if (targets.length) {
        detail.append(el('span', {className: 'army-label', textContent: state.phase === 'combat' ? (post.id === 'RESERVE' ? '증원 보내기' : '후퇴') : '보내기'}));
        for (const t of targets) button(detail, t.name, `${t.name}(으)로 보내기`, {ok: true}, () => window.moveGroup(getState(), config, post.id, t.id));
      }
      button(detail, post.holding ? '사수 해제' : '사수', post.holding ? '사수 해제' : '사수', {ok: true}, () => window.holdGroup(getState(), config, post.id));
    }
    if (post.wall) {
      const rules = config.wallRepair, wall = post.wall, outer = state.walls.filter(w => w.lane === wall.lane)[0] === wall;
      const options = preparing
        ? (wall.hp > 0 ? [['repair', `수리 +${rules.step}`, '성벽 수리', rules.stepCost], ...(rules.fortify.cost[(wall.level || 1) - 1] ? [['fortify', `강화 Lv.${(wall.level || 1) + 1}`, '성벽 강화', rules.fortify.cost[(wall.level || 1) - 1]]] : [])]
          : [['rebuild', '재건', '성벽 재건', rules.rebuild[outer ? 'outer' : 'inner']]])
        : [['emergency', `긴급 수리 +${rules.emergency.hp}`, '긴급 수리', rules.emergency.cost]];
      const line = el('span', {className: 'army-label', id: 'wall-info',
        textContent: `성벽 Lv.${wall.level || 1} · HP ${Math.ceil(wall.hp)}/${window.wallMaxHp(config, wall)}`});
      detail.append(line);
      for (const [action, label, aria, cost] of options)
        button(detail, label, aria, window.wallActionStatus(state, config, wall.id, action), () => window.wallAction(getState(), config, wall.id, action), window.wallCostText(cost));
    }
  }

  // On the field: tap a soldier to select his group; with a group selected, tap a gate to send it there.
  const active = new Set(); let tap = null;
  canvas.addEventListener('pointerdown', e => { active.add(e.pointerId); tap = active.size === 1 ? {id: e.pointerId, x: e.clientX, y: e.clientY} : null; });
  canvas.addEventListener('pointermove', e => { if (tap && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > config.construction.tapSlop) tap = null; });
  const cancel = e => { active.delete(e.pointerId); tap = null; };
  canvas.addEventListener('pointercancel', cancel); canvas.addEventListener('lostpointercapture', cancel);
  canvas.addEventListener('pointerup', e => {
    active.delete(e.pointerId); const candidate = tap; tap = null;
    if (!candidate || candidate.id !== e.pointerId || active.size) return;
    const state = getState(), rect = canvas.getBoundingClientRect(), v = getView(), scale = rect.height / v.h;
    const x = v.x + (e.clientX - rect.left) / scale, y = v.y + (e.clientY - rect.top) / scale;
    if (config.construction.plots.some(p => Math.hypot(p.x - x, p.y - y) <= Math.max(config.construction.minTapSize / 2 / scale, config.construction.plotRadius))) return;
    const reach = Math.max(config.construction.minTapSize / 2 / scale, 28);
    const soldier = state.units.filter(u => u.hp > 0 && Math.hypot(u.x - x, u.y - y) <= reach).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
    const s = config.field.wallStyle, pad = Math.max(0, config.construction.minTapSize / 2 / scale - s.depth);
    const wall = state.walls.find(w => { const vertical = config.lanes[w.lane].axis === 'y';
      const along = vertical ? x - w.x : y - w.y, across = vertical ? y - w.y : x - w.x; return Math.abs(along) <= s.length / 2 && Math.abs(across) <= s.depth + pad; });
    if (wall && !panel.hidden && selected !== wall.id && window.moveTargets(state, config, selected).some(t => t.id === wall.id)) {
      const result = window.moveGroup(state, config, selected, wall.id); toast?.(result.reason); say(result); return;
    }
    if (soldier) { show(window.unitPost(soldier)); return; }
    if (wall) show(wall.id);
  });
  // The central reserve's mustering ground, outlined on the field.
  function draw(ctx) {
    const p = config.orders.reserve; ctx.save(); ctx.strokeStyle = '#9da991'; ctx.setLineDash([6, 6]);
    ctx.strokeRect(p.x - 90, p.y - 20, 180, 90); ctx.setLineDash([]); ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#e1e6cb';
    ctx.fillText('중앙 예비대', p.x, p.y - 28); ctx.restore();
  }
  return {update, close: hide, open: show, draw, reset: () => { selected = 'RESERVE'; hide(); }};
};
