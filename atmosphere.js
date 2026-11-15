// The long night, weather, the beacon flame and the dawn. Drawing only: nothing here changes combat.
window.createAtmosphere = function (config, canvas) {
  const mask = document.createElement('canvas'), m = mask.getContext('2d');
  const hash = (a, b) => { const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return n - Math.floor(n); };
  let endedAt = 0, endedPhase = '';
  // Month shown on screen: during settlement the player is already preparing for the next one.
  const monthIndex = state => Math.min(config.calendar.months.length - 1, state.wave + (state.phase === 'settlement' ? 1 : 0));

  const snowing = state => window.calendarDate(config, monthIndex(state), state.year).weather === 'snow';
  // Draw a snow overlay over a piece of art, in the same frame, when it is a snowy month.
  window.snowRoof = function (ctx, state, src, left, top, width, height) {
    if (!src || !snowing(state)) return;
    const image = window.assetImage(src);
    if (image) ctx.drawImage(image, left, top, width, height);
  };
  // A wash over the ground itself (world space): snow lies, rain darkens.
  function ground(ctx, state, v) {
    const weather = window.calendarDate(config, monthIndex(state), state.year).weather;
    // Houses are part of the cached terrain, so their snow is laid on here. Same pick as field.js.
    const snow = window.ASSETS.snow, houseArt = window.ASSETS.props.house;
    if (weather === 'snow' && snow?.houses && houseArt.length) for (const house of config.field.houses) {
      const index = Math.floor(hash(house.x, house.y) * houseArt.length), art = houseArt[index];
      window.snowRoof(ctx, state, snow.houses[index], house.x - art.width / 2, house.y + 14 - art.height, art.width, art.height);
    }
    const wash = {snow: 'rgba(226,236,246,0.24)', rain: 'rgba(18,28,44,0.10)', storm: 'rgba(14,22,40,0.16)', fog: 'rgba(190,200,210,0.08)', ash: 'rgba(70,52,44,0.14)'}[weather];
    if (wash) { ctx.fillStyle = wash; ctx.fillRect(v.x, v.y, v.w, v.h); }
  }

  // The keep's beacon: a flame whose size shows the hope tier.
  function beacon(ctx, state, t) {
    if (state.hope === undefined || state.phase === 'defeat') return;
    const tier = window.hopeTier(config, state.hope).index, lit = state.beaconUntil > state.timer;
    const size = [7, 11, 16, 22][tier] * (lit ? 1.7 : 1), x = config.keep.x, y = config.keep.y - 118;
    const flicker = Math.sin(t * 9) * 0.12 + Math.sin(t * 23) * 0.06;
    ctx.save();
    ctx.fillStyle = 'rgba(255,170,60,0.18)'; ctx.beginPath(); ctx.arc(x, y, size * 3.2, 0, Math.PI * 2); ctx.fill();
    for (const [scale, color] of [[1, '#e2572b'], [0.72, '#ffa23a'], [0.42, '#ffe08a']]) {
      ctx.fillStyle = color; ctx.beginPath();
      ctx.ellipse(x + flicker * size * 0.6, y - size * scale * (0.5 + flicker), size * scale * 0.62, size * scale * (1.15 + flicker), 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#3a3530'; ctx.fillRect(x - size * 0.9, y + size * 0.35, size * 1.8, 5);
    ctx.restore();
  }

  // Darkness with holes of light, then weather, in screen space.
  function sky(ctx, state, v, t, lights, now) {
    const month = window.calendarDate(config, monthIndex(state), state.year);
    if (state.phase !== endedPhase) { endedPhase = state.phase; endedAt = now; }
    const since = (now - endedAt) / 1000;
    let dark = month.darkness, dawn = 0, lightScale = 1;
    if (state.beaconUntil > state.timer) dark *= config.lights.beaconBoost;
    if (state.phase === 'victory') { dawn = Math.min(1, since / 5); dark *= 1 - dawn; }
    if (state.phase === 'defeat') { const fall = Math.min(1, since / 3); dark += (0.9 - dark) * fall; lightScale = 1 - fall * 0.75; }
    const W = canvas.width, H = canvas.height;
    if (dark > 0.01) {
      const mw = Math.ceil(W / 4), mh = Math.ceil(H / 4);
      if (mask.width !== mw || mask.height !== mh) { mask.width = mw; mask.height = mh; }
      m.globalCompositeOperation = 'source-over';
      m.clearRect(0, 0, mw, mh);
      m.fillStyle = `rgba(9,13,28,${dark.toFixed(3)})`;
      m.fillRect(0, 0, mw, mh);
      m.globalCompositeOperation = 'destination-out';
      for (const light of lights) {
        const x = (light.x - v.x) / v.w * mw, y = (light.y - v.y) / v.h * mh, r = light.r * lightScale / v.w * mw;
        if (x < -r || y < -r || x > mw + r || y > mh + r || r < 1) continue;
        const glow = m.createRadialGradient(x, y, 0, x, y, r);
        glow.addColorStop(0, 'rgba(0,0,0,0.95)'); glow.addColorStop(0.55, 'rgba(0,0,0,0.6)'); glow.addColorStop(1, 'rgba(0,0,0,0)');
        m.fillStyle = glow; m.beginPath(); m.arc(x, y, r, 0, Math.PI * 2); m.fill();
      }
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(mask, 0, 0, W, H);
      // Warm tint inside the light, strongest when the night is deepest.
      ctx.globalCompositeOperation = 'lighter';
      for (const light of lights) {
        const x = (light.x - v.x) / v.w * W, y = (light.y - v.y) / v.h * H, r = light.r * lightScale * 0.8 / v.w * W;
        if (x < -r || y < -r || x > W + r || y > H + r || r < 2) continue;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
        glow.addColorStop(0, `rgba(255,170,70,${(0.16 * dark).toFixed(3)})`); glow.addColorStop(1, 'rgba(255,170,70,0)');
        ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      ctx.imageSmoothingEnabled = false;
    }
    // Weather. Stops once the sun is up.
    const unit = W / 832, weather = dawn > 0.6 ? 'clear' : month.weather;
    ctx.save();
    if (weather === 'snow') {
      ctx.fillStyle = 'rgba(245,248,252,0.88)';
      for (let i = 0; i < 130; i++) {
        const speed = 26 + (i % 5) * 9, size = (1.6 + (i % 3)) * unit;
        const x = ((hash(i, 1) * W + Math.sin(t * 0.7 + i) * 18 * unit + t * 9 * unit) % W + W) % W;
        const y = (hash(i, 2) * H + t * speed * unit) % H;
        ctx.fillRect(x, y, size, size);
      }
    } else if (weather === 'rain' || weather === 'storm') {
      const count = weather === 'storm' ? 230 : 150, slant = weather === 'storm' ? 7 : 3.5;
      ctx.strokeStyle = 'rgba(172,202,232,0.5)'; ctx.lineWidth = 1.2 * unit; ctx.beginPath();
      for (let i = 0; i < count; i++) {
        const speed = 430 + (i % 7) * 40;
        const y = (hash(i, 4) * H + t * speed * unit) % H, x = ((hash(i, 3) * W - y * slant / 14 + W * 4) % W);
        ctx.moveTo(x, y); ctx.lineTo(x - slant * unit, y + 14 * unit);
      }
      ctx.stroke();
      if (weather === 'storm') {   // lightning: two quick flashes every few seconds
        const beat = t % 7.3;
        if (beat < 0.08 || (beat > 0.2 && beat < 0.26)) { ctx.fillStyle = 'rgba(225,235,255,0.3)'; ctx.fillRect(0, 0, W, H); }
      }
    } else if (weather === 'fog') {
      ctx.fillStyle = 'rgba(198,208,220,0.085)';
      for (let i = 0; i < 7; i++) {
        const x = ((hash(i, 5) * W * 1.6 + t * (7 + i * 2) * unit) % (W * 1.6)) - W * 0.3, y = H * (0.18 + hash(i, 6) * 0.7);
        ctx.beginPath(); ctx.ellipse(x, y, W * 0.32, H * 0.14, 0, 0, Math.PI * 2); ctx.fill();
      }
    } else if (weather === 'ash') {
      for (let i = 0; i < 80; i++) {
        const x = ((hash(i, 7) * W + Math.sin(t * 0.5 + i * 1.3) * 26 * unit) % W + W) % W;
        const y = H - ((hash(i, 8) * H + t * (10 + (i % 4) * 5) * unit) % H);
        ctx.fillStyle = i % 4 === 0 ? 'rgba(255,150,80,0.8)' : 'rgba(150,146,140,0.6)';
        ctx.fillRect(x, y, (1.5 + (i % 2)) * unit, (1.5 + (i % 2)) * unit);
      }
    }
    ctx.restore();
    // Dawn: warm light spreading from the east.
    if (dawn > 0) {
      const glow = ctx.createLinearGradient(W, 0, 0, 0);
      glow.addColorStop(0, `rgba(255,196,120,${(0.34 * Math.sin(dawn * Math.PI * 0.5)).toFixed(3)})`);
      glow.addColorStop(1, 'rgba(255,196,120,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    }
  }
  return {ground, beacon, sky};
};
