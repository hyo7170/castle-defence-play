// Low-health or collapsed walls outside the visible battlefield remain actionable.
window.createWallWarnings = function (canvas, camera, config, getView) {
  const buttons = {};
  for (const lane of Object.keys(config.lanes)) {
    const button = document.createElement('button');
    button.className = `wall-warning wall-warning-${lane}`;
    button.hidden = true;
    button.onclick = () => {
      const wall = button.wall;
      if (!wall) return;
      camera.x = wall.x;
      camera.y = wall.y;
      getView();
    };
    document.body.append(button);
    buttons[lane] = button;
  }
  return function update(state) {
    const v = getView();
    const rect = canvas.getBoundingClientRect();
    const top = document.querySelector('#hud').getBoundingClientRect().bottom;
    const bottom = document.querySelector('#controls').getBoundingClientRect().top;
    for (const lane of Object.keys(config.lanes)) {
      const candidates = state.walls.filter(w => {
        const x = rect.left + (w.x - v.x) / v.w * rect.width;
        const y = rect.top + (w.y - v.y) / v.h * rect.height;
        const offscreen = x < rect.left || x > rect.right || y < top || y > bottom;
        return w.lane === lane && offscreen && w.hp / w.max <= config.camera.warningHpFraction;
      }).sort((a, b) => {
        // Still-standing walls are actionable before already-collapsed walls.
        if ((a.hp === 0) !== (b.hp === 0)) return a.hp === 0 ? 1 : -1;
        return a.hp / a.max - b.hp / b.max;
      });
      const button = buttons[lane], wall = candidates[0];
      button.wall = wall;
      if (button.hidden !== !wall) button.hidden = !wall;
      if (wall) {
        const status = wall.hp ? `${Math.ceil(wall.hp / wall.max * 100)}%` : '붕괴';
        const text = `⚠ ${wall.id} ${status}`;
        if (button.textContent !== text) button.textContent = text;
        const label = `${wall.id} ${status}, 탭하여 이동`;
        if (button.getAttribute('aria-label') !== label) button.setAttribute('aria-label', label);
      }
    }
  };
};
