// One skill button per hired hero, shown under the HUD.
window.createHeroUI = function (config, getState) {
  const bar = document.createElement('div'); bar.id = 'hero-bar'; bar.setAttribute('aria-label', '영웅 스킬');
  const notice = document.createElement('span'); notice.id = 'hero-notice'; notice.setAttribute('role', 'status');
  document.body.append(bar);
  const buttons = new Map();
  let noticeUntil = 0;
  function update() {
    const state = getState();
    const heroes = window.hiredHeroes(state, config);
    for (const [type, button] of buttons) if (!heroes.some(u => u.type === type)) { button.remove(); buttons.delete(type); }
    for (const unit of heroes) {
      const hero = config.units[unit.type];
      let button = buttons.get(unit.type);
      if (!button) {
        button = document.createElement('button');
        button.setAttribute('aria-label', `${hero.name} 스킬 ${hero.skill.name}`);
        button.onclick = () => {
          const result = window.useHeroSkill(getState(), config, unit.type);
          notice.textContent = result.ok ? result.reason : `${hero.skill.name}: ${result.reason}`;
          noticeUntil = performance.now() + 2500;
          update();
        };
        buttons.set(unit.type, button); bar.insertBefore(button, notice.parentNode === bar ? notice : null);
      }
      const status = window.heroSkillStatus(state, config, unit.type);
      const text = `★ ${hero.name} · ${hero.skill.name}${status.ok || state.phase !== 'combat' ? '' : ` (${status.reason})`}`;
      // Portrait: the first frame of the hero's idle sheet (or a dedicated portrait from the manifest).
      if (!button.firstChild) {
        const entry = window.ASSETS.units[unit.type], face = document.createElement('i'), label = document.createElement('span');
        face.className = 'portrait';
        if (entry?.portrait) { face.style.backgroundImage = `url("${entry.portrait}")`; face.style.backgroundSize = 'cover'; }
        else if (entry?.idle) { face.style.backgroundImage = `url("${entry.idle.src}")`; face.style.backgroundSize = `${entry.idle.frames * 100}% 100%`; }
        button.append(face, label);
      }
      const label = button.lastChild;
      if (label.textContent !== text) label.textContent = text;
      if (button.disabled === status.ok) button.disabled = !status.ok;
    }
    if (notice.parentNode !== bar) bar.append(notice);
    if (notice.textContent && performance.now() > noticeUntil) notice.textContent = '';
    const hidden = !heroes.length;
    if (bar.hidden !== hidden) bar.hidden = hidden;
  }
  return {update};
};
