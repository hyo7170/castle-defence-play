(() => {
  "use strict";
  const C = window.CONFIG,
    canvas = document.querySelector("#game"),
    ctx = canvas.getContext("2d"),
    $ = (s) => document.querySelector(s);
  const enemyAnimator = window.createEnemyAnimator(C, window.ASSETS);
  const atmosphere = window.createAtmosphere(C, canvas);
  const debugMode = new URLSearchParams(location.search).has("debug");
  let ambient = 0;
  const unitAnimator = window.createUnitAnimator(C, window.ASSETS);
  const wallAnimator = window.createWallAnimator(C, window.ASSETS);
  let state,
    cam,
    drag = null,
    last = 0,
    updateWarnings,
    constructionUI,
    ordersUI,
    heroUI,
    menuInstance,
    automaticallyPaused = false,
    scoutOpen = false,
    reportClosed = false,
    speed = 1,
    seenEvents = 0,
    lastKeep = 0,
    toastUntil = 0,
    hitUntil = 0;
  const portrait = window.matchMedia("(orientation: portrait)");
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // Saved games live in this browser only. ?debug and ?nosave keep tests and experiments out of it.
  const params = new URLSearchParams(location.search);
  const persistent = !params.has("debug") && !params.has("nosave");
  const SAVE_KEY = `citadel-save-${C.waves.length}`;
  let savedSignature = "";
  const readSave = () => { try { return window.restoreGame(C, JSON.parse(localStorage.getItem(SAVE_KEY))); } catch { return null; } };
  function autosave() {
    if (!persistent || !["ready", "settlement", "victory"].includes(state.phase)) return;
    // Cheap fingerprint of everything a preparation phase can change.
    const signature = [state.year, state.wave, state.phase, state.hope, state.keep, state.decision, state.research.length,
      Object.values(state.resources).join(), state.buildings.map((b) => b.plotId + b.type + (b.level || 1) + Math.round(b.hp) + (b.charges ?? "")).join(),
      state.walls.map((w) => Math.round(w.hp) + ":" + (w.level || 1)).join(), state.units.map((u) => u.type + u.wallId + Math.round(u.hp) + JSON.stringify(u.gear || u.item || "") + Math.round(u.x)).join()].join("|");
    if (signature === savedSignature) return;
    savedSignature = signature;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(window.serializeGame(state))); } catch { /* storage full or unavailable */ }
  }
  function adopt(next) {   // switch to a loaded or advanced state and reset per-battle presentation
    enemyAnimator.clear(); unitAnimator.clear(); wallAnimator.clear();
    state = next; seenEvents = state.events.length; lastKeep = state.keep; reportClosed = false; scoutOpen = false;
    constructionUI?.close(); ordersUI?.close();
    updateUI();
  }
  function reset() {
    if (persistent) { try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ } savedSignature = ""; }
    enemyAnimator.clear();
    unitAnimator.clear();
    wallAnimator.clear();
    automaticallyPaused = false;
    scoutOpen = false;
    reportClosed = false;
    seenEvents = 0;
    toastUntil = 0;
    lastKeep = C.keep.hp;
    constructionUI?.close();
    ordersUI?.reset?.();
    state = {
      phase: "ready",
      wave: 0,
      year: 0,
      keep: C.keep.hp,
      walls: C.walls.map((w) => ({ ...w, max: w.hp })),
      enemies: [],
      enemyDeaths: [],
      units: C.defenders.map((u) => ({
        ...u,
        hp: C.units[u.type].hp,
        cool: 0,
      })),
      queue: [],
      timer: 0,
      combatRemainder: 0,
      kills: 0,
      events: [],
      resources: {...C.economy.initial},
      hope: C.hope.start,
      decisionLog: [],
      research: [],
      seed: (Number(new URLSearchParams(location.search).get("seed")) || Date.now()) | 0,
      buildings: [], customPlots: [], inventory: [],
    };
    const compact = canvas.getBoundingClientRect().height <= C.camera.compactStart.maxHeight;
    const initialCamera = compact ? C.camera.compactStart : C.camera.start;
    cam = Object.assign(cam || {}, {x:initialCamera.x, y:initialCamera.y, zoom:initialCamera.zoom});
    updateUI();
  }
  function dimensions() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    ctx.imageSmoothingEnabled = false;
  }
  function view() {
    const rect = canvas.getBoundingClientRect();
    const h = C.world.baseHeight / cam.zoom,
      w = (h * rect.width) / rect.height;
    // The drawn terrain extends past the world by a margin, so the camera may use it.
    const m = C.field.margin;
    cam.x = w >= C.world.width + 2 * m.x ? C.world.width / 2 : clamp(cam.x, w / 2 - m.x, C.world.width + m.x - w / 2);
    cam.y = h >= C.world.height + 2 * m.y ? C.world.height / 2 : clamp(cam.y, h / 2 - m.y, C.world.height + m.y - h / 2);
    return { w, h, x: cam.x - w / 2, y: cam.y - h / 2 };
  }
  // First-run guide: one short hint for the current step, dismissible, remembered on this device.
  let guideDone = false;
  try { guideDone = localStorage.getItem("citadel-guide-done") === "1"; } catch { /* storage unavailable */ }
  if (new URLSearchParams(location.search).has("guide")) guideDone = false;
  function finishGuide() {
    guideDone = true;
    try { localStorage.setItem("citadel-guide-done", "1"); } catch { /* ignore */ }
  }
  function updateGuide() {
    const el = $("#guide");
    let hint = "";
    if (!guideDone) {
      if (state.wave === 0 && state.phase === "ready")
        hint = state.buildings.length
          ? "② ‘정찰’로 적 정보를 확인하고 ‘전투 시작’을 누르세요"
          : "① 점선 부지(+탑)를 탭해 궁수탑이나 마법탑을 지어 보세요";
      else if (state.wave === 0 && state.phase === "combat")
        hint = "③ 성벽이나 병사를 탭하면 사수·후퇴·긴급 수리를 지휘할 수 있습니다";
      else if (state.wave === 0 && state.phase === "settlement")
        hint = "④ 마을(+마을)에 시장을 지으면 웨이브마다 골드가 늘고, 본부(+본부)에는 병영·용병소를 짓습니다";
      else if (state.wave >= 1 || ["victory", "defeat"].includes(state.phase)) finishGuide();
    }
    if ($("#guide-text").textContent !== hint) $("#guide-text").textContent = hint;
    if (el.hidden !== !hint) el.hidden = !hint;
  }
  function toast(message) {
    const el = $("#toast");
    el.textContent = message;
    el.hidden = false;
    toastUntil = performance.now() + 2400;
  }
  function feedback() {
    // Wall collapses and damage to the keep must be noticed even off screen.
    if (state.events.length > seenEvents) toast(`⚠ ${state.events.slice(seenEvents).join(" · ")}! 적이 안쪽으로 진격합니다`);
    seenEvents = state.events.length;
    const now = performance.now();
    if (state.keep < lastKeep) hitUntil = now + 300;
    lastKeep = state.keep;
    const hit = now < hitUntil;
    if (document.body.classList.contains("keep-hit") !== hit) document.body.classList.toggle("keep-hit", hit);
    // Toasts belong to combat; reports and result cards replace them afterwards.
    // A paused game holds everything on screen still, including a notice that was showing.
    if (state.phase === "paused" && !$("#toast").hidden) toastUntil = Math.max(toastUntil, now + 600);
    if (!$("#toast").hidden && (now > toastUntil || ["victory", "defeat"].includes(state.phase))) $("#toast").hidden = true;
  }
  // Result rating and the best run, kept on this device only.
  function stars() {
    const keep = state.keep / C.keep.hp, walls = state.walls.filter((w) => w.hp > 0).length;
    return 1 + (keep >= 0.5 ? 1 : 0) + (keep >= 0.9 && walls >= 1 ? 1 : 0);
  }
  function bestRun() {
    const score = state.phase === "victory" ? C.waves.length + stars() : state.phase === "defeat" ? state.wave : -1;
    let best = -1;
    try { best = Number(localStorage.getItem(`citadel-best-${C.waves.length}`) ?? -1); } catch { /* storage unavailable */ }
    if (score > best) { best = score; try { localStorage.setItem(`citadel-best-${C.waves.length}`, String(score)); } catch { /* ignore */ } }
    return best > C.waves.length ? `승리 ${"★".repeat(best - C.waves.length)}` : best >= 0 ? `${best}웨이브 방어` : "없음";
  }
  function updateUI() {
    const text = (selector, value) => { const el = $(selector); if (el.textContent !== value) el.textContent = value; };
    text("#wave",
      `웨이브 ${Math.min(state.wave + 1, C.waves.length)} / ${C.waves.length} · ${{ ready: "준비", combat: "전투", settlement: "정산", victory: "승리", defeat: "패배", paused: "일시정지" }[state.phase]} · 적 ${state.enemies.length + state.queue.length}${state.phase === "combat" && state.timer >= C.combat.forcedAdvanceAfter ? " · 적 강제 진격" : ""}`);
    text("#keep", `본관 ${Math.ceil(state.keep)} / ${C.keep.hp}`);
    const disabled = !["ready", "settlement"].includes(state.phase);
    if ($("#start").disabled !== disabled) $("#start").disabled = disabled;
    text("#start", state.phase === "settlement" ? "다음 전투" : "전투 시작");
    const scout = (index) => {
      const r = window.scoutWave(C, index);
      if (!r) return "";
      const lane = (name, l) => `${name} 물량 ${l.volume} · 공성 ${l.siege}`;
      const when = window.calendarDate(C, index, state.year);
      return `정찰 ${r.wave}웨이브 (${when.text} · ${when.weatherName}) — ${Object.entries(r.lanes).map(([id, l]) => lane(C.lanes[id].name, l)).join(" / ")}` +
        (r.dangers.length ? `\n주의: ${r.dangers.join(" · ")}` : "");
    };
    const report = state.report;
    const wallLine = state.walls.map((w) => `${w.id} ${w.hp > 0 ? `${Math.round((100 * w.hp) / (w.max || w.hp))}%` : "붕괴"}`).join(" · ");
    const summary = report
      ? `${window.calendarDate(C, report.wave - 1, state.year).text} · ${report.wave}웨이브 방어 성공!\n처치 ${report.kills} · 처치 보상 +${report.gold}G` +
        (report.reward ? `\n보급 +${report.reward.gold}G · 목재 +${report.reward.wood} · 석재 +${report.reward.stone}` : "") +
        (report.loot?.length ? `\n전리품 — ${report.loot.map(l => C.items.find(i => i.id === l.id).name).join(", ")} (영웅 메뉴의 보관함)` : "") +
        `\n손실 — 병사 ${report.unitsLost} · 건물 ${report.buildingsLost} · 성벽 ${report.wallsLost}\n${wallLine}\n${report.hope ? `희망 ${Math.round(report.hope.from)} → ${Math.round(report.hope.to)} (${window.hopeTier(C, report.hope.to).name}) · ` : ""}생존 병력과 성벽이 일부 회복됐습니다.`
      : "웨이브 방어 성공!\n생존 병력과 성벽이 일부 회복됐습니다.";
    text("#message", {
      ready: scout(0),
      combat:
        "수비대가 자동으로 전투합니다. 성벽이 무너지면 적이 안쪽으로 진격합니다.",
      settlement: `${summary}\n\n${scout(state.wave + 1)}\n\n탭하면 닫힙니다 · 건설과 지휘를 마친 뒤 ‘다음 전투’ · ‘정찰’로 다시 보기`,
      victory: `승리! ${state.phase === "victory" ? "★".repeat(stars()) + "☆".repeat(3 - stars()) : ""}\n긴 밤이 끝나고 해가 떴습니다. ${C.waves.length}개 웨이브를 모두 방어했습니다!\n본관 ${Math.ceil(state.keep)}/${C.keep.hp} · 남은 성벽 ${state.walls.filter((w) => w.hp > 0).length}/${state.walls.length} · 총 처치 ${state.kills}\n최고 기록: ${["victory", "defeat"].includes(state.phase) ? bestRun() : ""} · ‘재시작’을 눌러 다시 도전하세요.`,
      defeat: `패배\n본관이 함락되었습니다. 성화가 꺼졌습니다.\n${state.wave + 1}웨이브에서 함락 · 무너진 성벽 ${state.walls.filter((w) => w.hp <= 0).length}/${state.walls.length} · 총 처치 ${state.kills}\n최고 기록: ${["victory", "defeat"].includes(state.phase) ? bestRun() : ""} · ‘재시작’을 눌러 다시 도전하세요.`,
      paused: "일시정지 중",
    }[state.phase]);
    // The ready-state overlay covered the eastern wall; controls remain visible.
    const shown = state.phase === "ready" ? scoutOpen : state.phase === "settlement" ? !reportClosed : state.phase !== "combat";
    const display = shown ? "" : "none";
    const result = ["victory", "defeat"].includes(state.phase);
    if ($("#message").classList.contains("result") !== result) $("#message").classList.toggle("result", result);
    const reportCard = state.phase === "settlement";
    if ($("#message").classList.contains("report") !== reportCard) $("#message").classList.toggle("report", reportCard);
    if (document.body.dataset.phase !== state.phase) document.body.dataset.phase = state.phase;
    const hp = `${Math.round((100 * state.keep) / C.keep.hp)}%`;
    if ($("#keep").style.getPropertyValue("--hp") !== hp) $("#keep").style.setProperty("--hp", hp);
    const scoutButton = $("#scout");
    const scoutable = ["ready", "settlement"].includes(state.phase);
    if (scoutButton.disabled === scoutable) scoutButton.disabled = !scoutable;
    if ($("#message").style.display !== display) $("#message").style.display = display;
    text("#pause", state.phase === "paused" ? "계속" : "일시정지");
    const today = window.calendarDate(C, Math.min(C.waves.length - 1, state.wave + (state.phase === "settlement" ? 1 : 0)), state.year);
    text("#date", `${today.text} · ${today.weatherName}`);
    text("#hope", `희망 ${Math.round(state.hope)} · ${window.hopeTier(C, state.hope).name}`);
    // A pending decision waits as a chip; the card opens on tap and never blocks the next battle.
    const pending = ["ready", "settlement"].includes(state.phase) && C.decisions.find((e) => e.id === state.decision);
    if (!pending && !$("#decision-card").hidden) $("#decision-card").hidden = true;
    if ($("#decision-chip").hidden !== !pending) $("#decision-chip").hidden = !pending;
    if (pending) text("#decision-chip", `결단: ${pending.title} ▸`);
    const beaconStatus = window.beaconStatus(state, C);
    if ($("#beacon").disabled === beaconStatus.ok) $("#beacon").disabled = !beaconStatus.ok;
    text("#beacon", state.beaconUntil > state.timer && state.phase === "combat" ? `성화 ${Math.ceil(state.beaconUntil - state.timer)}초` : `성화 −${window.beaconCost(state, C)}`);
    constructionUI?.update();
    ordersUI?.update();
    heroUI?.update();
    menuInstance?.update();
    updateGuide();
    // After a year is held the campaign goes on; after a fall the month can be tried again from the last save.
    const next = $("#campaign-next"), retry = state.phase === "defeat" && persistent && readSaveCached();
    const label = state.phase === "victory" ? `${window.calendarDate(C, 0, (state.year || 0) + 1).text}로 ▸` : retry ? "이 달 다시 도전" : "";
    if (next.textContent !== label) next.textContent = label;
    if (next.hidden !== !label) next.hidden = !label;
    autosave();
  }
  function start() {
    scoutOpen = false;
    reportClosed = false;
    constructionUI?.close();
    ordersUI?.close();
    $("#toast").hidden = true;
    if (window.startWave(state, C)) {
      enemyAnimator.clear();
      unitAnimator.clear();
      wallAnimator.clear();
      toast(C.waves[state.wave].west ? `⚠ ${state.wave + 1}웨이브 — 서쪽 암문에 기습! 남쪽·동쪽도 계속 옵니다` : `${window.calendarDate(C, state.wave, state.year).text} — ${state.wave + 1}웨이브 시작 · 남쪽과 동쪽을 지키세요`);
    }
    syncLifecycle();
    updateUI();
  }
  function syncLifecycle() {
    const unavailable = document.visibilityState === "hidden" || portrait.matches;
    if (unavailable && state.phase === "combat") {
      state.previous = "combat";
      state.phase = "paused";
      automaticallyPaused = true;
      updateUI();
    } else if (!unavailable && automaticallyPaused) {
      automaticallyPaused = false;
      if (state.phase === "paused" && state.previous === "combat") {
        state.phase = "combat";
        last = performance.now();
        updateUI();
      }
    }
  }
  function tick(dt) {
    unitAnimator.observe(state);
    enemyAnimator.observe(state);
    wallAnimator.observe(state);
    window.advanceCombat(state, C, dt);
    enemyAnimator.update(state, dt, document.visibilityState === "hidden" || portrait.matches);
    unitAnimator.update(state, dt, document.visibilityState === "hidden" || portrait.matches);
    wallAnimator.update(state, dt, document.visibilityState === "hidden" || portrait.matches);
    updateUI();
  }
  function rect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }
  function label(text, x, y, color = "#fff") {
    ctx.fillStyle = color;
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(text, x, y);
  }
  function person(x, y, size, color, type, variant, flip, since, frame) {
    const ready = (sheet) => sheet && sheet.image.complete && sheet.image.naturalWidth;
    const s = ready(variant) ? variant : window.spriteLibrary[type];
    if (ready(s)) {
      // Animation follows combat time, so pause and settlement freeze the scene.
      // One-shot sheets (attacks) start at "since" and hold the last frame; others loop.
      const f = frame !== undefined ? Math.max(0, Math.min(s.frames - 1, frame)) : since === undefined
        ? Math.floor((state.timer * 1000) / s.duration) % s.frames
        : Math.min(s.frames - 1, Math.floor(((state.timer - since) * 1000) / s.duration));
      ctx.save();
      ctx.translate(Math.round(x), Math.round(y));
      if (flip) ctx.scale(-1, 1);
      ctx.drawImage(s.image, f * s.frameSize, 0, s.frameSize, s.frameSize, -size / 2, -size / 2, size, size);
      ctx.restore();
      return;
    }
    rect(x - size * 0.25, y - size * 0.48, size * 0.5, size * 0.35, "#e3bb8c");
    rect(x - size * 0.32, y - size * 0.12, size * 0.64, size * 0.45, color);
    rect(x - size * 0.3, y + size * 0.3, size * 0.22, size * 0.2, "#332d27");
    rect(x + size * 0.08, y + size * 0.3, size * 0.22, size * 0.2, "#332d27");
  }
  const enemySheet = (type, key) => key === 'walk' ? window.spriteLibrary[type] : window.spriteVariants[type]?.[key];
  const sheetReady = sheet => sheet?.image.complete && sheet.image.naturalWidth;
  function draw() {
    const v = view();
    // The viewport can be wider than the world on mobile. Paint the entire
    // backing canvas first so pixels from the previous camera do not persist.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = C.field.grass.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(
      canvas.width / v.w,
      0,
      0,
      canvas.height / v.h,
      (-v.x * canvas.width) / v.w,
      (-v.y * canvas.height) / v.h,
    );
    window.drawFieldGround(ctx, C);
    // Ambient clock: real time in play, combat time under ?debug so test captures stay identical.
    const air = debugMode ? state.timer : ambient;
    atmosphere.ground(ctx, state, v);
    window.drawFortressCurtains(ctx, C, state.walls);
    const body = C.keep.body, roof = C.keep.roof;
    const keepArt = window.ASSETS.keep;
    const keepImage = keepArt && ((state.keep <= C.keep.hp / 2 && window.assetImage(keepArt.damaged)) || window.assetImage(keepArt.src));
    if (keepImage) {
      ctx.drawImage(keepImage, C.keep.x + keepArt.offsetX, C.keep.y + keepArt.offsetY, keepArt.width, keepArt.height);
      window.snowRoof(ctx, state, window.ASSETS.snow?.keep, C.keep.x + keepArt.offsetX, C.keep.y + keepArt.offsetY, keepArt.width, keepArt.height);
    }
    else {
      rect(body.x, body.y, body.w, body.h, "#8b9285");
      rect(roof.x, roof.y, roof.w, roof.h, "#a15e4c");
    }
    label("본관", C.keep.label.x, C.keep.label.y);
    constructionUI.draw(ctx);
    ordersUI.draw(ctx);
    const bounds = canvas.getBoundingClientRect();
    const hud = $("#hud").getBoundingClientRect();
    const controls = $("#controls").getBoundingClientRect();
    const minLabel = v.y + ((hud.bottom - bounds.top + 18) / bounds.height) * v.h;
    const maxLabel = v.y + ((controls.top - bounds.top - 18) / bounds.height) * v.h;
    const drawUnit = (u) => {
      // Show the attack sheet for a moment after each attack (cooldown just reset).
      const stats = C.units[u.type], attack = window.spriteVariants[u.type]?.attack;
      const sinceAttack = stats.interval - u.cool;
      const attacking = attack && state.phase !== "ready" && !u.retreat && !u.movement && u.cool > 0 && sinceAttack >= 0 && sinceAttack < (attack.frames * attack.duration) / 1000;
      // Sprites face south-east; west-lane defenders are mirrored to face their gate.
      const pose = unitAnimator.sample(u);
      if (pose) {
        const resolved = window.resolveUnitPose(u.type, pose, window.spriteLibrary, window.spriteVariants);
        person(u.x, u.y + resolved.sheet.offsetY, resolved.sheet.drawSize || stats.size || 52, stats.color, u.type, resolved.sheet, resolved.flip, undefined, resolved.frame);
      } else person(u.x, u.y, stats.size || 52, stats.color, u.type, attacking ? attack : null, u.lane === "west", attacking ? state.timer - sinceAttack : undefined);
      if (C.units[u.type].hero) label("★", u.x, u.y - (u.retreat || u.movement || u.holding ? 58 : 42), "#ffd76a");
      if (u.guardUntil > state.timer) {
        ctx.strokeStyle = "#9fe6ff"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(u.x, u.y, 30, 0, Math.PI * 2); ctx.stroke();
      }
      rect(u.x - 20, u.y - 36, 40, 4, "#433");
      rect(u.x - 20, u.y - 36, (40 * u.hp) / C.units[u.type].hp, 4, "#9c9");
      if (u.retreat) label("후퇴 중", u.x, u.y - 44, "#f5dc91");
      else if(u.movement) label("이동 중",u.x,u.y-44,"#c5ddf1");
      else if(u.holding) label("사수",u.x,u.y-44,"#e9d499");
    };
    const drawEnemy = (e) => {
      // East-lane enemies march west: mirror the east-facing sheet. South-lane
      // enemies march north and use a north-facing sheet when the art provides one.
      let pose = enemyAnimator.sample(e, state.timer);
      if (!sheetReady(enemySheet(e.type, pose.key))) pose = enemyAnimator.walk(e, state.timer);
      const sheet = enemySheet(e.type, pose.key);
      person(e.x, e.y + (sheet?.offsetY || 0), sheet?.drawSize || e.size, e.color, e.type, sheet, pose.flip, undefined, pose.frame);
      if (e.stunUntil > state.timer) label("기절", e.x, e.y - e.size * 0.8, "#fff39a");
      else if (e.slowUntil > state.timer) label("둔화", e.x, e.y - e.size * 0.8, "#a8e6ff");
      rect(e.x - 20, e.y - e.size * 0.65, 40, 5, "#433");
      rect(
        e.x - 20,
        e.y - e.size * 0.65,
        40 * Math.max(0, e.hp / (e.maxHp || C.enemies[e.type].hp)),
        5,
        "#e88",
      );
    };
    // Depth order: whatever stands lower on the screen is drawn later, so a
    // soldier in front of a tower covers it and one behind a wall is covered.
    const scene = [
      ...state.buildings.map((b) => [constructionUI.buildingBase(b), () => constructionUI.drawBuilding(ctx, b)]),
      ...state.walls.map((w) => [w.y + (C.lanes[w.lane].axis === "y" ? 20 : 0), () => window.drawCitadelWall(ctx, C, w)]),
      ...state.units.filter((u) => u.hp > 0).map((u) => [u.y + (C.units[u.type].size || 52) / 2, () => drawUnit(u)]),
      ...state.enemies.map((e) => [e.y + e.size / 2, () => drawEnemy(e)]),
      ...unitAnimator.corpses.map((corpse) => [corpse.y + (C.units[corpse.type].size || 52) / 2 - 1, () => {
        const resolved = window.resolveUnitPose(corpse.type, unitAnimator.corpsePose(corpse), window.spriteLibrary, window.spriteVariants);
        if (resolved) person(corpse.x, corpse.y + resolved.sheet.offsetY, resolved.sheet.drawSize || C.units[corpse.type].size || 52, C.units[corpse.type].color,
          corpse.type, resolved.sheet, resolved.flip, undefined, resolved.frame);
      }]),
      // Corpses sort slightly behind the living at the same spot.
      ...enemyAnimator.corpses.map((corpse) => [corpse.y + corpse.size / 2 - 1, () => {
        const sheet = enemySheet(corpse.type, corpse.key);
        if (sheetReady(sheet)) person(corpse.x, corpse.y + sheet.offsetY, sheet.drawSize || corpse.size, corpse.color, corpse.type,
          sheet, corpse.flip, undefined, enemyAnimator.corpseFrame(corpse));
      }]),
    ];
    scene.sort((a, b) => a[0] - b[0]).forEach(([, paint]) => paint());
    wallAnimator.draw(ctx);
    // Ambient motion: water glints on the river and slow cloud shadows over the field.
    {
      const t = air, river = C.field.river, m = C.field.margin;
      for (let i = 0; i < 60; i++) {
        const phase = Math.sin(t * 1.7 + i * 2.39);
        if (phase < 0.55) continue;
        const x = -m.x + ((i * 97.3 + t * (6 + (i % 5) * 3)) % (C.world.width + 2 * m.x)), y = river.y + 10 + ((i * 53) % (river.height - 22));
        if (x > C.field.bridge.x - 14 && x < C.field.bridge.x + C.field.bridge.width + 14) continue;
        ctx.fillStyle = `rgba(255,255,255,${(0.25 + (phase - 0.55) * 0.9).toFixed(2)})`;
        ctx.fillRect(Math.round(x), y, 9, 2);
      }
      ctx.fillStyle = "rgba(10,20,30,0.09)";
      for (let i = 0; i < 4; i++) {
        const span = C.world.width + 2 * m.x + 700;
        const x = -m.x - 350 + ((i * 640 + t * (9 + i * 2)) % span), y = 150 + i * 290 + Math.sin(i * 1.9) * 80;
        ctx.beginPath(); ctx.ellipse(x, y, 260 + i * 30, 105 + i * 14, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + 170, y + 50, 170, 80, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
    for (const fx of state.effects || []) {
      const life = clamp((fx.until - state.timer) / (fx.until - fx.start), 0, 1);
      if (fx.kind === "gold") {
        ctx.save();
        ctx.globalAlpha = life;
        ctx.fillStyle = "#00000055";
        ctx.beginPath(); ctx.ellipse(fx.x1, fx.y1 + 14, 16 * life, 6 * life, 0, 0, Math.PI * 2); ctx.fill();
        label(fx.text, fx.x1, fx.y1 - 18 - (1 - life) * 26, "#ffd76a");
        ctx.restore();
        continue;
      }
      const age = state.timer - fx.start, flight = C.combat.projectileSeconds;
      const set = window.ASSETS.attackFx?.[fx.kind] || {}, sheets = window.ASSETS.fx || {};
      // Draw frame "index" of a sheet centred on (x, y), optionally rotated and stretched.
      const stamp = (name, x, y, index, angle = 0, stretch = 0) => {
        const sheet = sheets[name], image = sheet && window.assetImage(sheet.src);
        if (!image) return false;
        const frame = Math.min(sheet.frames - 1, Math.max(0, index));
        const width = stretch || sheet.size, height = stretch ? sheet.h * 1.6 : (sheet.size * sheet.h) / sheet.w;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.drawImage(image, frame * sheet.w, 0, sheet.w, sheet.h, stretch ? 0 : -width / 2, -height / 2, width, height);
        ctx.restore();
        return true;
      };
      const angle = Math.atan2(fx.y2 - fx.y1, fx.x2 - fx.x1), reach = Math.hypot(fx.x2 - fx.x1, fx.y2 - fx.y1);
      if (fx.kind === "death") {
        const death = enemyAnimator.death(fx);
        if (death && sheetReady(enemySheet(fx.type, death.key))) continue;
        const sheet = sheets.death;
        if (!stamp("death", fx.x1, fx.y1, Math.floor(age * (sheet?.fps || 15)))) { /* no placeholder: the gold marker is enough */ }
        continue;
      }
      let drawn = false;
      if (age < flight) {
        // Flight: a projectile travelling to the target, or a beam stretched between both ends.
        const t = age / flight;
        if (set.beam) drawn = stamp(set.beam, fx.x1, fx.y1, Math.floor(age * (sheets[set.beam]?.fps || 8) * 3), angle, reach);
        else if (set.projectile) drawn = stamp(set.projectile, fx.x1 + (fx.x2 - fx.x1) * t, fx.y1 + (fx.y2 - fx.y1) * t,
          Math.floor(age * (sheets[set.projectile]?.fps || 8)), angle);
        else drawn = true;   // melee: nothing flies
      } else if (set.impact) {
        const sheet = sheets[set.impact], index = Math.floor((age - flight) * (sheet?.fps || 20));
        drawn = sheet && index >= sheet.frames ? true : stamp(set.impact, fx.x2, fx.y2, index);
      }
      if (drawn) continue;
      // Placeholder drawing when a sheet is missing: a line and a ring or square.
      const color = { archer: "#ffe9a8", archerTower: "#ffe9a8", windArcher: "#b8fff0", mage: "#ffb070", magicTower: "#d7a8ff", stormMage: "#9cc4ff", storm: "#fff39a" }[fx.kind] || "#ffffff";
      ctx.save();
      ctx.globalAlpha = 0.25 + 0.75 * life;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      if (!["infantry", "scaleKnight"].includes(fx.kind)) {
        ctx.lineWidth = fx.splash ? 4 : 2;
        ctx.beginPath();
        ctx.moveTo(fx.x1, fx.y1);
        ctx.lineTo(fx.x2, fx.y2);
        ctx.stroke();
      }
      if (fx.splash) {
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(fx.x2, fx.y2, fx.splash * (1 - life * 0.5), 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillRect(fx.x2 - 5, fx.y2 - 5, 10, 10);
      }
      ctx.restore();
    }
    atmosphere.beacon(ctx, state, air);
    // Everything that burns is a light: the beacon, gates, towers, buildings, lanterns, soldiers, and lit windows.
    const L = C.lights, tier = window.hopeTier(C, state.hope).index;
    const lights = [{x: C.keep.x, y: C.keep.y - 60, r: L.keep + tier * L.keepPerTier},
      ...state.walls.filter((w) => w.hp > 0).map((w) => ({x: w.x, y: w.y, r: L.gate + ((w.level || 1) - 1) * 30})),
      ...(window.fortressLayout?.(C).towers || []).map((p) => ({x: p.x, y: p.y, r: L.tower})),
      ...state.buildings.filter((b) => b.hp > 0 && !C.construction.buildings[b.type].trap && b.type !== "barricade").map((b) => ({x: b.x, y: b.y - 20, r: L.building + ((b.level || 1) - 1) * 20})),
      ...(window.fieldLights || []).map((p) => ({x: p.x, y: p.y, r: L.lantern})),
      ...state.units.filter((u) => u.hp > 0).map((u) => ({x: u.x, y: u.y, r: L.unit})),
      ...(tier >= 2 ? C.field.houses.map((h) => ({x: h.x, y: h.y - 20, r: L.house})) : [])];
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    atmosphere.sky(ctx, state, v, air, lights, performance.now());
    ctx.setTransform(
      canvas.width / v.w,
      0,
      0,
      canvas.height / v.h,
      (-v.x * canvas.width) / v.w,
      (-v.y * canvas.height) / v.h,
    );
    const battlefieldTop = v.y + ((hud.bottom - bounds.top) / bounds.height) * v.h;
    const battlefieldBottom = v.y + ((controls.top - bounds.top) / bounds.height) * v.h;
    const visibleWalls = state.walls.filter(w => w.x >= v.x && w.x <= v.x + v.w &&
      w.y >= battlefieldTop && w.y <= battlefieldBottom);
    for (const entry of window.layoutWallLabels(visibleWalls, minLabel, maxLabel)) {
      window.drawWallLabel(ctx, entry.wall, entry.y);
    }
    constructionUI.drawLabels(ctx);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  function loop(t) {
    const dt = last ? clamp((t - last) / 1000, 0, C.combat.maxFrameDelta) : 0;
    last = t;
    tick(dt * speed);
    if (state.phase !== "paused") ambient += dt;
    feedback();
    updateWarnings(state);
    draw();
    requestAnimationFrame(loop);
  }
  canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const before = view();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const anchorX = before.x + px * before.w;
      const anchorY = before.y + py * before.h;
      cam.zoom = clamp(
        cam.zoom * (e.deltaY > 0 ? 0.9 : 1.1),
        C.world.minZoom,
        C.world.maxZoom,
      );
      const h = C.world.baseHeight / cam.zoom;
      const w = h * rect.width / rect.height;
      cam.x = anchorX + (0.5 - px) * w;
      cam.y = anchorY + (0.5 - py) * h;
      view();
    },
    { passive: false },
  );
  document.querySelectorAll("[data-camera]").forEach(
    (b) =>
      (b.onclick = () => {
        const p = C.camera.presets[b.dataset.camera];
        cam.x = p.x;
        cam.y = p.y;
      }),
  );
  $("#scout").onclick = () => {
    if (state.phase === "ready") scoutOpen = !scoutOpen;
    else if (state.phase === "settlement") reportClosed = !reportClosed;
    updateUI();
  };
  // The settlement report is a card: tap it away to start preparing.
  $("#message").onclick = () => {
    if (state.phase !== "settlement") return;
    reportClosed = true;
    updateUI();
  };
  $("#beacon").onclick = () => {
    const result = window.raiseBeacon(state, C);
    toast(result.reason);
    updateUI();
  };
  $("#decision-chip").onclick = () => {
    const event = C.decisions.find((e) => e.id === state.decision);
    if (!event) return;
    constructionUI.close(); ordersUI.close(); reportClosed = true;
    $("#decision-title").textContent = event.title;
    const art = window.ASSETS.decisions?.[event.id], picture = $("#decision-art");
    picture.hidden = !art;
    if (art) picture.src = `${window.ASSETS.decisionPath}${art}.png`;
    $("#decision-text").textContent = event.text;
    $("#decision-options").replaceChildren(...event.options.map((option, index) => {
      const status = window.decisionStatus(state, C, index), button = document.createElement("button"), small = document.createElement("small");
      button.textContent = option.label;
      small.textContent = status.ok ? window.decisionEffectText(C, option) : status.reason;
      button.append(document.createElement("br"), small);
      button.disabled = !status.ok;
      button.onclick = () => { const result = window.decide(state, C, index); $("#decision-card").hidden = true; toast(result.reason); updateUI(); };
      return button;
    }));
    $("#decision-card").hidden = false;
    updateUI();
  };
  $("#decision-later").onclick = () => { $("#decision-card").hidden = true; };
  let cachedSave = null, cachedFor = "";
  function readSaveCached() {   // reading storage every frame would be wasteful
    const key = `${state.year}:${state.wave}:${state.phase}`;
    if (cachedFor !== key) { cachedFor = key; cachedSave = readSave(); }
    return cachedSave;
  }
  $("#campaign-next").onclick = () => {
    if (state.phase === "victory") { const result = window.advanceYear(state, C); adopt(state); toast(result.reason); }
    else if (state.phase === "defeat") { const saved = readSave(); if (saved) { adopt(saved); toast("마지막 준비 단계로 돌아왔습니다"); } }
  };
  $("#guide-close").onclick = () => { finishGuide(); updateGuide(); };
  $("#speed").onclick = () => {
    speed = speed === 1 ? 2 : 1;
    $("#speed").textContent = `배속 ×${speed}`;
    $("#speed").setAttribute("aria-pressed", String(speed === 2));
  };
  $("#start").onclick = start;
  // Restart asks for a second tap while a run is in progress.
  let restartArmedUntil = 0;
  const disarmRestart = () => { restartArmedUntil = 0; $("#restart").textContent = "재시작"; };
  $("#restart").onclick = () => {
    const untouched = state.phase === "ready" && state.wave === 0 && !state.buildings.length &&
      state.units.length === C.defenders.length && state.resources.gold === C.economy.initial.gold;
    const finished = ["victory", "defeat"].includes(state.phase);
    if (!untouched && !finished && performance.now() > restartArmedUntil) {
      restartArmedUntil = performance.now() + 3000;
      $("#restart").textContent = "한 번 더";
      toast("진행 중인 판이 사라집니다. 재시작하려면 한 번 더 누르세요");
      setTimeout(() => { if (performance.now() >= restartArmedUntil) disarmRestart(); }, 3100);
      return;
    }
    disarmRestart();
    reset();
  };
  $("#pause").onclick = () => {
    if (automaticallyPaused) return;
    if (state.phase === "paused") state.phase = state.previous;
    else if (state.phase === "combat") {
      state.previous = state.phase;
      state.phase = "paused";
    }
    updateUI();
  };
  window.addEventListener("resize", dimensions);
  document.addEventListener("visibilitychange", syncLifecycle);
  portrait.addEventListener("change", syncLifecycle);
  dimensions();
  const resumed = persistent ? readSave() : null;
  reset();
  updateWarnings = window.createWallWarnings(canvas, cam, C, view);
  window.installCameraInput(canvas, cam, view, C.world);
  constructionUI=window.createConstructionUI(canvas,C,()=>state,view);
  constructionUI.update();
  ordersUI=window.createArmyUI(C,()=>state,()=>constructionUI.close(),canvas,view,(m)=>toast(m));
  heroUI = window.createHeroUI(C, () => state);
  const menuUI = window.createMenuUI(C, () => state, cam, view, {construction: constructionUI, army: ordersUI}, (m) => toast(m));
  menuInstance = menuUI;
  if (window.ASSETS.hopeIcon) { $("#hope").classList.add("has-icon"); $("#hope").style.setProperty("--icon", `url("${window.ASSETS.hopeIcon}")`); }
  if (resumed) { adopt(resumed); toast(`이어서 합니다 — ${window.calendarDate(C, state.wave, state.year).text}`); }
  if (new URLSearchParams(location.search).has("debug"))
    window.citadel = {
      get state() {
        return state;
      },
      get camera() {
        return cam;
      },
      view,
      step: tick,
      reset,
      start,
      get corpses() { return enemyAnimator.corpses; },
      get unitCorpses() { return unitAnimator.corpses; },
      unitPose: u => unitAnimator.sample(u),
      enemyPose: e => enemyAnimator.sample(e, state.timer),
      get observedEnemies() { return enemyAnimator.observedEnemies; },
      get wallEffects() { return wallAnimator.active; },
      drawWallEffects: context => wallAnimator.draw(context),
    };
  requestAnimationFrame(loop);
})();
