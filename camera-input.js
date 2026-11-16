window.installCameraInput = function (canvas, cam, view, limits) {
  const points = new Map();
  let previous = null;
  const measure = () => {
    const p = [...points.values()];
    if (!p.length) return null;
    if (p.length === 1) return { x: p[0].x, y: p[0].y, distance: 0 };
    return { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2,
      distance: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) };
  };
  canvas.addEventListener('pointerdown', e => {
    points.set(e.pointerId, { x: e.clientX, y: e.clientY });
    canvas.setPointerCapture(e.pointerId);
    previous = measure();
  });
  canvas.addEventListener('pointermove', e => {
    if (!points.has(e.pointerId)) return;
    points.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const current = measure();
    if (previous && current) {
      const v = view();
      const rect = canvas.getBoundingClientRect();
      const anchorX = v.x + (previous.x - rect.left) * v.w / rect.width;
      const anchorY = v.y + (previous.y - rect.top) * v.h / rect.height;
      if (current.distance && previous.distance) {
        cam.zoom = Math.max(limits.minZoom, Math.min(limits.maxZoom,
          cam.zoom * current.distance / previous.distance));
      }
      const h = limits.baseHeight / cam.zoom;
      const w = h * rect.width / rect.height;
      cam.x = anchorX - (current.x - rect.left) * w / rect.width + w / 2;
      cam.y = anchorY - (current.y - rect.top) * h / rect.height + h / 2;
      view();
    }
    previous = current;
  });
  const release = e => { points.delete(e.pointerId); previous = measure(); };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('lostpointercapture', release);
  const panel = document.createElement('div');
  panel.id = 'zoom-controls';
  panel.setAttribute('aria-label', '지도 확대 축소');
  const buttons = [
    ['넓게', '넓은 전장 보기', () => { cam.zoom = limits.minZoom; }],
    ['기본', '기본 배율로 복귀', () => { cam.zoom = limits.zoom; }]
  ];
  for (const [text, label, action] of buttons) {
    const button = document.createElement('button');
    button.textContent = text;
    button.setAttribute('aria-label', label);
    button.onclick = () => {
      action();
      cam.zoom = Math.max(limits.minZoom, Math.min(limits.maxZoom, cam.zoom));
      view();
    };
    panel.append(button);
  }
  // Zoom buttons sit under the minimap; pinch and the mouse wheel also zoom.
  (document.querySelector('#minimap') || document.querySelector('#controls')).append(panel);
};
