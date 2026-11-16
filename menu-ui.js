// The bottom menu: 건설 (pick a building, then its plots light up), 영웅, 연구, and the minimap.
window.createMenuUI = function (config, getState, cam, getView, ui, toast) {
  const el = (tag, props = {}) => Object.assign(document.createElement(tag), props);
  const $ = s => document.querySelector(s);
  const groups = [
    ['방어', ['archerTower', 'magicTower']],
    ['병력·지원', ['barracks', 'repair', 'hospital', 'mercenary']],
    ['마을', ['market', 'warehouse']],
    ['공방', ['smithy', 'arcaneLab', 'engineerLab']],
    ['야전 (성문 밖 길)', ['spikes', 'mine', 'barricade', 'outpost']]
  ];
  const short = {archerTower: '빠른 단일 공격', magicTower: '느린 범위 공격', barracks: '병력 한도 +4', repair: '성벽 자동 수리', hospital: '정산 때 병사 치료',
    mercenary: '영웅 고용', market: '달마다 골드', warehouse: '달마다 목재·석재', smithy: '무기·갑옷 연구, 영웅 장비', arcaneLab: '마법 연구',
    engineerLab: '성문·탑·함정 연구', spikes: '지나가는 적 피해·둔화', mine: '밟으면 폭발', barricade: '길을 막는 목책', outpost: '길을 막고 쏘는 기지'};
  const costText = cost => Object.entries(cost).filter(([, v]) => v).map(([k, v]) => `${{gold: 'G', wood: '목', stone: '석'}[k]}${v}`).join(' ');

  // One panel at a time, shared with the army and construction panels.
  const panel = el('section', {id: 'menu-panel', hidden: true});
  const head = el('div', {className: 'army-head'}), title = el('strong'), close = el('button', {textContent: '닫기'});
  close.setAttribute('aria-label', '메뉴 닫기'); head.append(title, close);
  const body = el('div', {className: 'menu-body'});
  panel.append(head, body); document.body.append(panel);
  let open = null, lastKey = '';
  const hide = () => { panel.hidden = true; open = null; lastKey = ''; for (const b of buttons) b.setAttribute('aria-expanded', 'false'); };
  close.onclick = hide;
  document.addEventListener('construction-opened', hide);

  const buttons = [];
  const bar = $('#controls'), after = $('#army-chip');
  for (const [id, label] of [['build', '건설'], ['heroes', '영웅'], ['research', '연구']]) {
    const b = el('button', {id: `menu-${id}`, textContent: label}); b.setAttribute('aria-expanded', 'false');
    b.onclick = () => { if (open === id) { hide(); return; } ui.construction.close(); ui.army.close(); open = id; panel.hidden = false;
      for (const x of buttons) x.setAttribute('aria-expanded', String(x === b)); lastKey = ''; update(); };
    buttons.push(b);
  }
  after.after(...buttons);

  function row(parent, text, aria, small, status, run) {
    const b = el('button', {className: 'menu-item', textContent: text}); b.setAttribute('aria-label', aria);
    b.disabled = !status.ok; if (small || status.reason) b.append(el('small', {textContent: status.ok ? small : status.reason}));
    b.onclick = run; parent.append(b); return b;
  }

  function buildMenu(state) {
    title.textContent = '건설 — 지을 것을 고르세요';
    const preparing = ['ready', 'settlement'].includes(state.phase);
    for (const [name, types] of groups) {
      body.append(el('span', {className: 'army-label', textContent: name}));
      const grid = el('div', {className: 'menu-grid'}); body.append(grid);
      for (const type of types) {
        const stats = config.construction.buildings[type], free = ui.construction.eligible(type).length, zones = window.zonesFor(config, type);
        const affordable = Object.entries(stats.cost).every(([k, v]) => state.resources[k] >= v);
        const unique = stats.unique && state.buildings.some(b => b.type === type);
        const status = !preparing ? {ok: false, reason: '준비 단계에만'} : unique ? {ok: false, reason: '이미 지음'} : !free && !zones.length ? {ok: false, reason: '빈 부지 없음'}
          : !affordable ? {ok: false, reason: `${costText(stats.cost)} · 자원 부족`} : {ok: true};
        row(grid, `${stats.name}`, `${stats.name} 짓기`, `${costText(stats.cost)} · ${short[type]} · ${zones.length ? '마당 어디든' : `${free}곳`}`, status, () => {
          const plots = [...ui.construction.pickType(type), ...zones.map(z => ({x: z.x + z.w / 2, y: z.y + z.h / 2}))]; hide();
          // Bring the nearest lit plot into view if none is on screen.
          const v = getView(), seen = plots.some(p => p.x > v.x && p.x < v.x + v.w && p.y > v.y && p.y < v.y + v.h);
          if (!seen && plots.length) { const near = [...plots].sort((a, b) => Math.hypot(a.x - cam.x, a.y - cam.y) - Math.hypot(b.x - cam.x, b.y - cam.y))[0]; cam.x = near.x; cam.y = near.y; getView(); }
          toast(zones.length ? `${stats.name}: 빛나는 부지나 마당 안 원하는 곳을 누르세요` : `${stats.name}: 빛나는 부지를 누르세요 (${plots.length}곳)`);
        });
      }
    }
  }

  function heroesMenu(state) {
    const heroes = window.hiredHeroes(state, config), limit = window.heroLimit(state, config);
    title.textContent = `영웅 ${heroes.length}/${limit}`;
    if (!state.buildings.some(b => b.type === 'mercenary' && b.hp > 0)) {
      body.append(el('p', {className: 'menu-hint', textContent: '용병소를 지으면 영웅 후보가 나타나고 고용할 수 있습니다. 용병소는 본부 부지에 짓습니다.'}));
      row(body, '용병소 짓기', '용병소 짓기', '본부 부지가 빛납니다', {ok: ['ready', 'settlement'].includes(state.phase)}, () => { ui.construction.pickType('mercenary'); hide(); toast('용병소: 빛나는 부지를 누르세요'); });
      return;
    }
    if (!heroes.length) body.append(el('p', {className: 'menu-hint', textContent: '아직 고용한 영웅이 없습니다. 전장의 용병소를 눌러 후보를 고용하세요.'}));
    for (const unit of heroes) {
      const hero = config.units[unit.type], item = config.items.find(i => i.id === unit.item);
      const card = el('div', {className: 'hero-card'});
      const face = el('i', {className: 'portrait'}), art = window.ASSETS.units[unit.type];
      if (art?.portrait) { face.style.backgroundImage = `url("${art.portrait}")`; face.style.backgroundSize = 'cover'; }
      else if (art?.idle) { face.style.backgroundImage = `url("${art.idle.src}")`; face.style.backgroundSize = `${art.idle.frames * 100}% 100%`; }
      const text = el('div');
      text.append(el('strong', {textContent: `${hero.name} · ${config.mercenary.gradeNames[hero.grade] || ''}`}),
        el('span', {textContent: unit.hp > 0 ? `HP ${Math.ceil(unit.hp)}/${hero.hp} · ${config.orders.laneNames[unit.lane] || ''}` : '전투불능 — 용병소에서 부활'}),
        el('small', {textContent: `${hero.skill.name}: ${hero.skill.text}`}),
        el('small', {textContent: item ? `장비: ${item.name} (${item.text})` : '장비 없음 — 대장간에서 제작'}));
      card.append(face, text); body.append(card);
    }
  }

  function researchMenu(state) {
    title.textContent = `연구 ${state.research.length}/${Object.values(config.research).flat().length}`;
    for (const [lab, list] of Object.entries(config.research)) {
      const stats = config.construction.buildings[lab], building = state.buildings.find(b => b.type === lab && b.hp > 0);
      body.append(el('span', {className: 'army-label', textContent: stats.name + (building ? '' : ' — 아직 없음')}));
      const grid = el('div', {className: 'menu-grid'}); body.append(grid);
      if (!building) {
        row(grid, `${stats.name} 짓기`, `${stats.name} 짓기`, `${costText(stats.cost)} · 공방 부지가 빛납니다`, {ok: ['ready', 'settlement'].includes(state.phase) && ui.construction.eligible(lab).length > 0, reason: '준비 단계에만'},
          () => { ui.construction.pickType(lab); hide(); toast(`${stats.name}: 빛나는 부지를 누르세요`); });
        continue;
      }
      for (const r of list) {
        const status = window.researchStatus(state, config, building.plotId, r.id);
        row(grid, r.name, `${r.name} 연구`, `${costText(r.cost)} · ${r.text}`, status.ok ? status : {ok: false, reason: status.reason === '연구 완료' ? `✓ ${r.text}` : status.reason},
          () => { const result = window.doResearch(getState(), config, building.plotId, r.id); toast(result.reason); lastKey = ''; update(); });
      }
    }
  }

  function update() {
    drawMinimap();
    if (panel.hidden) return;
    const state = getState();
    const key = JSON.stringify([open, state.phase, state.resources, state.buildings.map(b => [b.plotId, b.type, b.hp > 0]), state.research,
      window.hiredHeroes(state, config).map(u => [u.type, Math.ceil(u.hp), u.item, u.lane])]);
    if (key === lastKey) return; lastKey = key;
    body.replaceChildren();
    ({build: buildMenu, heroes: heroesMenu, research: researchMenu})[open](state);
  }

  // Minimap: the whole world, walls by health, troops and enemies, and the current view. Tap to look there.
  const map = $('#minimap-canvas'), mctx = map.getContext('2d');
  let drawnAt = 0;
  function drawMinimap() {
    const now = performance.now(); if (now - drawnAt < 120) return; drawnAt = now;
    const W = config.world.width, H = config.world.height, dpr = window.devicePixelRatio || 1;
    const rect = map.getBoundingClientRect(); if (!rect.width) return;
    if (map.width !== Math.round(rect.width * dpr)) { map.width = Math.round(rect.width * dpr); map.height = Math.round(rect.height * dpr); }
    const sx = map.width / W, sy = map.height / H, state = getState();
    mctx.setTransform(1, 0, 0, 1, 0, 0);
    mctx.fillStyle = '#26301f'; mctx.fillRect(0, 0, map.width, map.height);
    mctx.fillStyle = '#2f5f74'; mctx.fillRect(0, config.field.river.y * sy, map.width, config.field.river.height * sy);
    mctx.fillStyle = '#6b5a40'; for (const r of config.field.roads) mctx.fillRect(r.x * sx, r.y * sy, Math.min(r.w, W - r.x) * sx, Math.min(r.h, H - r.y) * sy);
    mctx.fillStyle = '#d9b85a'; mctx.fillRect((config.keep.x - 28) * sx, (config.keep.y - 28) * sy, 56 * sx, 56 * sy);
    for (const w of state.walls) {
      const f = w.hp / window.wallMaxHp(config, w), vertical = config.lanes[w.lane].axis === 'y';
      mctx.fillStyle = w.hp <= 0 ? '#5a3a35' : f < 0.5 ? '#e0a050' : '#c8c8b8';
      vertical ? mctx.fillRect((w.x - 110) * sx, w.y * sy - 2, 220 * sx, 4) : mctx.fillRect(w.x * sx - 2, (w.y - 110) * sy, 4, 220 * sy);
    }
    const dot = (x, y, color, r) => { mctx.fillStyle = color; mctx.fillRect(x * sx - r, y * sy - r, r * 2, r * 2); };
    for (const u of state.units) if (u.hp > 0) dot(u.x, u.y, '#7fc4ff', 1.6 * dpr);
    for (const e of state.enemies) if (e.hp > 0) dot(e.x, e.y, '#ff6a55', 1.6 * dpr);
    const v = getView();
    mctx.strokeStyle = '#ffffff'; mctx.lineWidth = dpr; mctx.strokeRect(v.x * sx, v.y * sy, v.w * sx, v.h * sy);
  }
  map.addEventListener('pointerdown', e => {
    const rect = map.getBoundingClientRect();
    cam.x = (e.clientX - rect.left) / rect.width * config.world.width; cam.y = (e.clientY - rect.top) / rect.height * config.world.height; getView();
  });
  return {update, close: hide};
};
