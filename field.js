// Compile a seamless repeat by stitching paired boundary bands. The source
// artwork stays unchanged; most pixels retain their original irregular layout.
window.fieldRepeatSurface = (() => {
  const cache = new WeakMap();
  return (image, size = image.naturalWidth) => {
    let sizes = cache.get(image);
    if (!sizes) { sizes = new Map(); cache.set(image,sizes); }
    if (sizes.has(size)) return sizes.get(size);
    const surface=document.createElement('canvas');surface.width=surface.height=size;
    const p=surface.getContext('2d');p.imageSmoothingEnabled=false;p.drawImage(image,0,0,size,size);
    const pixels=p.getImageData(0,0,size,size),data=pixels.data,band=Math.max(2,Math.round(size/24));
    function blend(a,b,weight){
      for(let channel=0;channel<4;channel++){
        const originalA=data[a+channel],originalB=data[b+channel],mean=(originalA+originalB)/2;
        data[a+channel]=Math.round(originalA*(1-weight)+mean*weight);
        data[b+channel]=Math.round(originalB*(1-weight)+mean*weight);
      }
    }
    for(let y=0;y<size;y++)for(let x=0;x<band;x++)blend((y*size+x)*4,(y*size+size-1-x)*4,1-x/(band-1));
    for(let x=0;x<size;x++)for(let y=0;y<band;y++)blend((y*size+x)*4,((size-1-y)*size+x)*4,1-y/(band-1));
    p.putImageData(pixels,0,0);sizes.set(size,surface);return surface;
  };
})();
// Terrain is drawn once into a cached surface that extends past the world
// edges, so wide phones show forest, cliffs and river instead of blank margins.
window.drawFieldGround = function (ctx, config) {
  const f = config.field, W = config.world.width, H = config.world.height, m = f.margin;
  const X0 = -m.x, X1 = W + m.x, Y0 = -m.y, Y1 = H + m.y;
  const box = (x,y,w,h,color) => {ctx.fillStyle=color;ctx.fillRect(x,y,w,h)};
  const hash = (a,b) => { const n = Math.sin(a*127.1 + b*311.7) * 43758.5453; return n - Math.floor(n); };
  const grass = window.fieldTextures.grass;
  ctx.fillStyle = f.grass.color;
  if (grass.complete && grass.naturalWidth) {
    const tile = window.fieldRepeatSurface(grass,window.ASSETS.tiles.grassSize || f.grass.tileSize);
    ctx.fillStyle = ctx.createPattern(tile, 'repeat');
  }
  const grassFill = ctx.fillStyle;
  ctx.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
  // Smooth value noise for organic patches; everything is painted in chunky cells to stay pixel-art.
  const noise = (x, y, size) => {
    const X = Math.floor(x / size), Y = Math.floor(y / size), fx = x / size - X, fy = y / size - Y;
    const a = hash(X, Y), b = hash(X + 1, Y), c = hash(X, Y + 1), d = hash(X + 1, Y + 1);
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  const meadow = (x, y) => noise(x, y, 170) * 0.65 + noise(x + 900, y + 300, 64) * 0.35;
  const inRect = (x, y, r, pad = 0) => x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad;
  const roadRect = (r, i) => i === 0 ? {...r, h: Y1 - r.y} : i === 1 ? {...r, w: X1 - r.x} : r;
  const onBuilt = (x, y, pad = 0) => f.roads.some((r, i) => inRect(x, y, roadRect(r, i), pad)) ||
    f.courtyards.some(c => inRect(x, y, c, pad)) || f.farms.some(c => inRect(x, y, c, pad)) ||
    (y > f.river.y - 14 - pad && y < f.river.y + f.river.height + 14 + pad);
  for (let x = Math.floor(X0 / 8) * 8; x < X1; x += 8)
    for (let y = Math.floor(Y0 / 8) * 8; y < Y1; y += 8) {
      // A little per-cell jitter breaks up the contour lines of the noise.
      const n = meadow(x, y) + (hash(x, y) - 0.5) * 0.05;
      // Darker hollows, sunlit rises and a few bare-earth patches.
      if (n > 0.58) box(x, y, 8, 8, `rgba(18,38,12,${Math.min(0.24, (n - 0.58) * 0.9).toFixed(3)})`);
      else if (n < 0.42) box(x, y, 8, 8, `rgba(214,218,120,${Math.min(0.18, (0.42 - n) * 0.75).toFixed(3)})`);
      const bare = noise(x + 5000, y + 77, 120) + (hash(y, x) - 0.5) * 0.04;
      if (bare > 0.8) box(x, y, 8, 8, `rgba(126,100,62,${Math.min(0.5, (bare - 0.8) * 3.2).toFixed(3)})`);
      // Forest floor: darker under the trees, fading out raggedly at the edge.
      const shade = Math.max(...f.forests.map(a => 1 - Math.max(a.x - x, x - a.x - a.w, a.y - y, y - a.y - a.h, 0) / 34));
      if (shade > hash(x + 3, y + 7) * 0.9) box(x, y, 8, 8, `rgba(14,40,18,${(0.17 * Math.min(1, shade + 0.3)).toFixed(3)})`);
    }
  // Grass tufts everywhere, flower clusters on the sunlit rises.
  for (let i = 0; i < 1500; i++) {
    const x = X0 + hash(i, 11) * (X1 - X0), y = Y0 + hash(13, i) * (Y1 - Y0);
    if (onBuilt(x, y, 4)) continue;
    box(x, y, 2, 6, '#3f6a2f'); box(x + 3, y + 2, 2, 4, '#4f7d39'); box(x - 3, y + 3, 2, 3, '#35592a');
  }
  for (let i = 0; i < 150; i++) {
    const cx = X0 + hash(i, 41) * (X1 - X0), cy = Y0 + hash(43, i) * (Y1 - Y0);
    if (meadow(cx, cy) > 0.47 || onBuilt(cx, cy, 20)) continue;
    const color = ['#f6f1d2', '#f2d34c', '#e995b6', '#c9b8f2'][(hash(i, i + 5) * 4) | 0];
    for (let k = 0; k < 5; k++) {
      const x = cx + (hash(i, k) - 0.5) * 40, y = cy + (hash(k, i + 3) - 0.5) * 28;
      box(x, y, 3, 3, color); box(x + 1, y + 3, 1, 3, '#3f6a2f');
    }
  }
  const tile = (area, type) => {
    const image = window.fieldTextures[type];
    ctx.fillStyle = image?.complete && image.naturalWidth ? ctx.createPattern(window.fieldRepeatSurface(image), 'repeat') : '#8b795b';
    ctx.fillRect(area.x,area.y,area.w,area.h);
  };
  // Impassable northern and western escarpments: rock faces in mixed greys.
  const cliffImage = window.assetImage(window.ASSETS.tiles.cliff), cliffPattern = cliffImage && ctx.createPattern(cliffImage, 'repeat');
  const waterImage = window.assetImage(window.ASSETS.tiles.water), waterPattern = waterImage && ctx.createPattern(waterImage, 'repeat');
  const rock = (x, y, w, h) => {
    if (cliffPattern) { ctx.fillStyle = cliffPattern; ctx.fillRect(x, y, w, h); return; }
    const shade = ['#6b6f66', '#7a7d72', '#85877a', '#70746a'][(hash(x, y) * 4) | 0];
    box(x, y, w, h, '#565a52'); box(x + 3, y + 3, w - 6, h - 9, shade); box(x + 3, y + 3, w - 6, 5, '#9a9c8e');
  };
  for (let x=Math.floor(X0/64)*64;x<X1;x+=64) {
    const depth = 80+(((x%192)+192)%192)/4;
    for (let y = Y0; y < depth; y += 48) rock(x, y, 64, Math.min(48, depth - y));
  }
  for (let y=0;y<f.river.y-30;y+=64) {
    const depth = 95+(y%192)/5;
    for (let x = Math.floor(X0/64)*64; x < depth; x += 64) rock(x, y, Math.min(64, depth - x), 64);
  }
  // Cliffs cast a shadow on the ground at their foot, which reads as height.
  for (let x=Math.floor(X0/64)*64;x<X1;x+=64) {
    const depth = 80+(((x%192)+192)%192)/4;
    box(x, depth, 64, 10, 'rgba(0,0,0,0.28)'); box(x, depth + 10, 64, 8, 'rgba(0,0,0,0.12)');
  }
  for (let y=0;y<f.river.y-30;y+=64) {
    const depth = 95+(y%192)/5;
    box(depth, y, 10, 64, 'rgba(0,0,0,0.24)'); box(depth + 10, y, 8, 64, 'rgba(0,0,0,0.1)');
  }
  for (let i = 0; i < 46; i++) {   // fallen boulders along the cliff foot
    const top = hash(i, 71) < 0.55, t = hash(i, 73);
    const x = top ? 110 + t * (W - 120) : 100 + hash(i, 75) * 34, y = top ? 108 + hash(i, 77) * 30 : 120 + t * (f.river.y - 200);
    if (onBuilt(x, y, 10)) continue;
    const size = 8 + hash(i, 79) * 12;
    box(x - 1, y + size * 0.55, size + 3, 4, 'rgba(0,0,0,0.22)');
    box(x, y, size, size * 0.7, '#74786d'); box(x + 2, y - 2, size - 5, 4, '#9a9d90'); box(x, y + size * 0.45, size, size * 0.25, '#5c6058');
  }
  // River across the whole surface.
  box(X0, f.river.y - 10, X1 - X0, f.river.height + 20, f.river.bank);
  box(X0, f.river.y, X1 - X0, f.river.height, waterPattern || f.river.color);
  for (let x = Math.floor(X0/f.waterSpacing)*f.waterSpacing; x < X1 && !waterPattern; x += f.waterSpacing) {
    box(x + 12, f.river.y + 25, 26, 3, f.river.ripple);
    box(x + 45, f.river.y + 66, 19, 3, f.river.ripple);
  }
  // River dressing: ragged sandy banks, a deeper mid-channel, stones, reeds and foam.
  const overBridge = x => x > f.bridge.x - 26 && x < f.bridge.x + f.bridge.width + 26;
  box(X0, f.river.y + 26, X1 - X0, f.river.height - 52, 'rgba(8,28,48,0.22)');
  for (let x = Math.floor(X0 / 12) * 12; x < X1; x += 12) {
    const a = 5 + hash(x, 5) * 9, b = 5 + hash(x, 9) * 9;
    box(x, f.river.y - 10, 12, a, '#b7a777'); box(x, f.river.y - 10 + a, 12, 3, '#8f8460');
    box(x, f.river.y + f.river.height + 10 - b, 12, b, '#b7a777'); box(x, f.river.y + f.river.height + 7 - b, 12, 3, 'rgba(255,255,255,0.28)');
    if (hash(x, 21) > 0.8) box(x + 2, f.river.y + 6 + hash(x, 23) * 8, 8, 2, 'rgba(255,255,255,0.35)');
  }
  for (let i = 0; i < 90; i++) {
    const x = X0 + hash(i, 101) * (X1 - X0);
    if (overBridge(x)) continue;
    if (i % 3 === 0) {   // stones in the water
      const y = f.river.y + 14 + hash(i, 103) * (f.river.height - 30), size = 7 + hash(i, 105) * 9;
      box(x - 2, y + size * 0.5, size + 4, 3, 'rgba(255,255,255,0.3)');
      box(x, y, size, size * 0.6, '#6f756f'); box(x + 2, y - 2, size - 4, 3, '#9aa09a');
    } else {             // reeds on either bank
      const y = hash(i, 107) < 0.5 ? f.river.y - 4 : f.river.y + f.river.height - 8;
      for (let k = 0; k < 4; k++) { const h = 9 + hash(i, k) * 9; box(x + k * 4, y - h + 8, 2, h, k % 2 ? '#4c7a3a' : '#35602c'); box(x + k * 4, y - h + 6, 2, 3, '#8a6a3a'); }
    }
  }
  // Farmland: striped crop patches.
  for (const original of f.farms) {
    const field = {...original, x:Math.max(original.x, f.fortress?.farmStartX || original.x)};
    field.w = Math.max(0, original.x + original.w - field.x);
    if (!field.w) continue;
    box(field.x-4, field.y-4, field.w+8, field.h+8, '#5b4a33');
    for (let y = field.y, row = 0; y < field.y + field.h; y += 10, row++)
      box(field.x, y, field.w, 10, row % 2 ? field.colors[0] : field.colors[1]);
    for (let x = field.x + 8; x < field.x + field.w - 6; x += 16)
      for (let y = field.y + 3; y < field.y + field.h - 4; y += 20)
        box(x + (hash(x,y) * 6 | 0), y, 4, 4, field.colors[2]);
  }
  // Paved inner ward and worn military/village yards make the enclosure legible.
  for (const area of f.fortress?.wards || []) {
    if (area.kind === 'floor') tile(area,'floor');
    else if (window.fieldTextures.yard?.naturalWidth) tile(area,'yard');
    else {
      box(area.x,area.y,area.w,area.h,'#777347');
      for(let y=area.y+8;y<area.y+area.h-8;y+=18)
        for(let x=area.x+8;x<area.x+area.w-8;x+=24)
          if(hash(x,y)>.35)box(x+hash(y,x)*8,y,14,5,'#8a8055');
    }
  }
  for (const area of f.fortress?.paths || []) tile(area,'road');
  for (const [i, field] of f.farms.entries()) {
    // Post-and-rail fence with a gap on the side facing the village, plus hay bales.
    const post = (x, y) => { box(x - 2, y - 9, 5, 12, '#5c432b'); box(x - 2, y - 9, 5, 2, '#8a6a45'); };
    for (const y of [field.y - 8, field.y + field.h + 6]) {
      box(field.x - 8, y - 5, field.w + 16, 2, '#7a5a3a'); box(field.x - 8, y - 1, field.w + 16, 2, '#6a4c30');
      for (let x = field.x - 8; x <= field.x + field.w + 8; x += 24) post(x, y);
    }
    for (let y = field.y + 16; y < field.y + field.h; y += 24) { post(field.x + field.w + 8, y); if (y > field.y + 50 || y < field.y + 30) post(field.x - 8, y); }
    for (let k = 0; k < 3; k++) {
      const x = field.x + 14 + hash(i, k + 31) * (field.w - 40), y = field.y + field.h + 22 + hash(k, i + 33) * 10;
      if (onBuilt(x, y, 2) && !inRect(x, y, field, 30)) continue;
      box(x - 1, y + 9, 20, 4, 'rgba(0,0,0,0.2)'); box(x, y, 18, 11, '#d9b85a'); box(x, y, 18, 2, '#efd47c'); box(x + 5, y, 2, 11, '#b3923f'); box(x + 12, y, 2, 11, '#b3923f');
    }
  }
  // Roads run on to the edge of the surface so enemies do not appear from nowhere.
  f.roads.forEach((r, index) => tile(roadRect(r, index), 'road'));
  // Worn roads: wheel ruts down the middle, grass creeping in and dirt spilling out at the edges.
  f.roads.forEach((raw, index) => {
    const r = roadRect(raw, index), vertical = r.h > r.w, length = vertical ? r.h : r.w, across = vertical ? r.w : r.h;
    const at = (along, offset, size, thick, color) => vertical ? box(r.x + offset, r.y + along, thick, size, color) : box(r.x + along, r.y + offset, size, thick, color);
    for (let d = 0; d < length; d += 10) {
      const px = vertical ? r.x : r.x + d, py = vertical ? r.y + d : r.y;
      if (py > f.river.y - 16 && py < f.river.y + f.river.height + 16 && vertical) continue;   // the bridge keeps clean edges
      if (f.courtyards.some(c => inRect(vertical ? r.x + across / 2 : px, vertical ? py : r.y + across / 2, c, 6))) continue;
      for (const side of [0, 1]) {
        const n = hash(d + index * 37, side + 3), creep = 2 + n * 8, spill = 2 + hash(d, side + 9 + index) * 7;
        at(d, side ? across - creep : 0, 10, creep, grassFill);
        at(d, side ? across : -spill, 10, spill, 'rgba(146,116,76,0.55)');
        if (n > 0.82) at(d + 2, side ? across - creep - 7 : creep + 3, 5, 4, '#8c8676');
      }
      if (hash(d, index + 51) > 0.25) { at(d, across * 0.32, 10, 4, 'rgba(60,42,24,0.16)'); at(d, across * 0.66, 10, 4, 'rgba(60,42,24,0.16)'); }
      if (hash(d, index + 61) > 0.93) at(d, across * (0.15 + hash(d, 63) * 0.7), 9, 6, 'rgba(60,42,24,0.2)');
    }
  });
  for (const area of f.courtyards) {
    tile(area,'floor');
    ctx.fillStyle='#eadbb8';ctx.font='16px sans-serif';ctx.textAlign='center';
    ctx.fillText(area.label,area.x+area.w/2,area.y+area.h-8);
  }
  // Bridge: art when provided, otherwise two rails beside the road.
  const bridgeArt = window.ASSETS.props.bridge, bridgeImage = bridgeArt && window.assetImage(bridgeArt.src);
  if (bridgeImage) ctx.drawImage(bridgeImage, f.bridge.x - 10, f.river.y - 12, bridgeArt.width, bridgeArt.height);
  else {
    box(f.bridge.x - 10, f.river.y - 12, 10, f.river.height + 24, f.bridge.rail);
    box(f.bridge.x + f.bridge.width, f.river.y - 12, 10, f.river.height + 24, f.bridge.rail);
  }
  // Pond and well.
  for (const pond of f.ponds) {
    ctx.fillStyle = f.river.bank; ctx.beginPath(); ctx.ellipse(pond.x, pond.y, pond.rx + 7, pond.ry + 7, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = f.river.color; ctx.beginPath(); ctx.ellipse(pond.x, pond.y, pond.rx, pond.ry, 0, 0, Math.PI*2); ctx.fill();
    box(pond.x - 14, pond.y - 4, 22, 3, f.river.ripple);
    for (let k = 0; k < 5; k++) {   // lily pads and reeds
      const a = hash(pond.x, k) * Math.PI * 2, r = 0.25 + hash(k, pond.y) * 0.5;
      box(pond.x + Math.cos(a) * pond.rx * r, pond.y + Math.sin(a) * pond.ry * r, 7, 4, '#5f9a4a');
      const edge = hash(k + 9, pond.x) * Math.PI;
      for (let j = 0; j < 3; j++) box(pond.x + Math.cos(edge) * (pond.rx + 2) + j * 4, pond.y - Math.sin(edge) * (pond.ry + 2) - 10, 2, 12, j % 2 ? '#4c7a3a' : '#35602c');
    }
  }
  // Houses: walls, pitched roof, door and window. Sorted so nearer ones overlap.
  for (const house of [...f.houses].sort((a,b) => a.y - b.y)) {
    const houseArt = window.ASSETS.props.house, pickHouse = houseArt.length && houseArt[Math.floor(hash(house.x, house.y) * houseArt.length)];
    const houseImage = pickHouse && window.assetImage(pickHouse.src);
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(house.x + 6, house.y + 12, 42, 10, 0, 0, Math.PI * 2); ctx.fill();
    if (houseImage) { ctx.drawImage(houseImage, house.x - pickHouse.width / 2, house.y + 14 - pickHouse.height, pickHouse.width, pickHouse.height); continue; }
    const tint = house.roof || '#6d5044';
    box(house.x-34,house.y+8,68,6,'#00000033');
    box(house.x-32,house.y-34,64,46,'#b29b73');
    box(house.x-32,house.y-34,64,5,'#8f7b59');
    box(house.x-40,house.y-56,80,24,tint);
    box(house.x-32,house.y-64,64,10,tint);
    box(house.x-40,house.y-36,80,4,'#00000030');
    box(house.x-8,house.y-14,16,26,'#493e32');
    box(house.x+14,house.y-22,12,12,'#e8d9a0');
    box(house.x-26,house.y-22,12,12,'#e8d9a0');
  }
  // Trees: listed forests inside the world plus the outer margins.
  const tree = (x, y, scale) => {
    const treeArt = window.ASSETS.props.tree, pickTree = treeArt.length && treeArt[Math.floor(hash(x, y) * treeArt.length)];
    const treeImage = pickTree && window.assetImage(pickTree.src);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(x + 3 * scale, y + 8 * scale, 15 * scale, 5 * scale, 0, 0, Math.PI * 2); ctx.fill();
    if (treeImage) { ctx.drawImage(treeImage, x - pickTree.width * scale / 2, y + 10 * scale - pickTree.height * scale, pickTree.width * scale, pickTree.height * scale); return; }
    box(x-3*scale, y-6*scale, 6*scale, 14*scale, '#4d3a28');
    box(x-16*scale, y-30*scale, 32*scale, 26*scale, '#2f5230');
    box(x-12*scale, y-40*scale, 24*scale, 16*scale, '#3d6a3a');
    box(x-8*scale, y-36*scale, 8*scale, 6*scale, '#4f8246');
    box(x-14*scale, y+7*scale, 28*scale, 4*scale, '#00000026');
  };
  const blocked = (x, y) => window.fortressFootprint?.(config,x,y,20) || y > f.river.y - 30 && y < f.river.y + f.river.height + 34 ||
    f.roads.some((r, i) => x > r.x - 26 && x < (i === 1 ? X1 : r.x + r.w) + 26 && y > r.y - 12 && y < (i === 0 ? Y1 : r.y + r.h) + 40);
  const spots = [];
  const plant = (area, step) => {
    for (let x = area.x, i = 0; x < area.x + area.w; x += step, i++)
      for (let y = area.y, j = 0; y < area.y + area.h; y += step, j++) {
        const px = x + hash(i + area.x, j + area.y) * step * 0.7, py = y + hash(j + area.y, i + area.x + 9) * step * 0.7;
        if (hash(px, py) < (area.density ?? 0.85) && !blocked(px, py)) spots.push([px, py, 0.85 + hash(py, px) * 0.45]);
      }
  };
  f.forests.forEach(area => plant(area, 44));
  plant({x: W + 10, y: 110, w: m.x, h: Y1 - 110, density: 0.9}, 44);
  plant({x: X0, y: f.river.y + f.river.height + 40, w: X1 - X0, h: 500, density: 0.5}, 48);
  plant({x: 110, y: H - 10, w: W, h: m.y, density: 0.9}, 44);
  spots.sort((a,b) => a[1] - b[1]).forEach(([x,y,scale]) => tree(x,y,scale));
  // Single props at fixed world positions (cave mouth, well, banners...).
  for (const prop of window.ASSETS.props.fixed || []) {
    const image = window.assetImage(prop.src);
    if (image) ctx.drawImage(image, prop.x - prop.width / 2, prop.y - prop.height, prop.width, prop.height);
  }
  // Lantern posts along the inner roads give the fortress some rhythm.
  window.fieldLights = [];
  const lantern = (x, y) => {
    if (state_walls.some(w => Math.hypot(w.x - x, w.y - y) < 140)) return;
    window.fieldLights.push({x: x + 1, y: y - 18});
    ctx.fillStyle = 'rgba(255,214,110,0.16)'; ctx.beginPath(); ctx.arc(x + 1, y - 18, 15, 0, Math.PI * 2); ctx.fill();
    box(x - 1, y + 2, 6, 3, 'rgba(0,0,0,0.25)'); box(x, y - 16, 3, 20, '#3a3530'); box(x - 3, y - 23, 9, 8, '#3a3530'); box(x - 1, y - 21, 5, 4, '#ffd76a');
  };
  const state_walls = config.walls;
  for (let y = 400; y < 900; y += 96) { lantern(f.roads[0].x - 12, y); lantern(f.roads[0].x + f.roads[0].w + 9, y + 48); }
  for (let x = 660; x < 1500; x += 120) lantern(x, f.roads[1].y - 6);
  for (let x = 20; x < 330; x += 110) lantern(x, 250 - 6);
  // Stumps and logs at the forest edges.
  for (let i = 0; i < 40; i++) {
    const area = f.forests[(hash(i, 301) * f.forests.length) | 0];
    const x = area.x - 30 + hash(i, 303) * (area.w + 60), y = area.y - 20 + hash(i, 305) * (area.h + 50);
    if (onBuilt(x, y, 8)) continue;
    if (hash(i, 307) < 0.6) { box(x - 1, y + 6, 13, 3, 'rgba(0,0,0,0.2)'); box(x, y, 11, 8, '#6b4a2c'); box(x + 1, y - 2, 9, 4, '#c9a878'); box(x + 4, y - 1, 3, 2, '#8a6a45'); }
    else { box(x - 1, y + 5, 24, 3, 'rgba(0,0,0,0.2)'); box(x, y, 22, 7, '#74502c'); box(x, y, 22, 2, '#8f6a40'); box(x + 19, y, 3, 7, '#c9a878'); }
  }
  for (const prop of [...(f.fortress?.props || []),...(f.fortress?.medievalProps || [])].sort((a,b)=>a.y-b.y)) {
    const art=window.ASSETS.fortress?.props[prop.type] || window.ASSETS.medieval?.props[prop.type],image=art&&window.assetImage(art.src);
    if(image)ctx.drawImage(image,prop.x-art.width/2,prop.y-art.height,art.width,art.height);
  }
  // Small rocks and bushes to break up open grass.
  for (let i = 0; i < f.scatter; i++) {
    const x = 120 + hash(i, 3) * (W - 140), y = 110 + hash(7, i) * (f.river.y - 150);
    if (blocked(x, y) || f.courtyards.some(c => x > c.x - 20 && x < c.x + c.w + 20 && y > c.y - 20 && y < c.y + c.h + 20) ||
      f.farms.some(c => x > c.x - 20 && x < c.x + c.w + 20 && y > c.y - 20 && y < c.y + c.h + 20)) continue;
    if (hash(i, i) < 0.5) { box(x, y, 14, 9, '#8a8c80'); box(x + 2, y - 4, 9, 5, '#a3a598'); }
    else { box(x, y, 16, 10, '#3d6a3a'); box(x + 3, y - 5, 10, 6, '#4f8246'); }
  }
};

// Rebuild only when an image completes loading; static terrain does not change per frame.
{
  const drawGround = window.drawFieldGround;
  let surface, lastKey;
  window.drawFieldGround = function(ctx, config) {
    const key = ['grass','road','floor','yard'].map(k => window.fieldTextures[k]?.naturalWidth || 0).join(':') + window.propAssetsKey();
    const m = config.field.margin;
    if (!surface || key !== lastKey) {
      surface = document.createElement('canvas');
      surface.width = config.world.width + m.x * 2; surface.height = config.world.height + m.y * 2;
      const offscreen = surface.getContext('2d');
      offscreen.imageSmoothingEnabled = false;
      offscreen.translate(m.x, m.y);
      drawGround(offscreen, config);
      lastKey = key;
    }
    ctx.drawImage(surface, -m.x, -m.y);
  };
}

window.drawCitadelWall = function (ctx, config, wall) {
  const s=config.field.wallStyle, south=config.lanes[wall.lane].axis==='y';
  ctx.save();ctx.translate(wall.x,wall.y);
  if(!south)ctx.rotate(Math.PI/2);
  const box=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h)};
  // Art from the asset manifest, by lane, fortification level and damage state.
  // The west postern borrows the east art, mirrored, until it has its own.
  const mirrored = !window.ASSETS.walls[wall.lane] && wall.lane === 'west';
  const art = window.ASSETS.walls[wall.lane] || (mirrored && window.ASSETS.walls.east), level = (wall.level || 1) - 1;
  const pick = list => list && (list[level] || list[list.length - 1]);
  const src = art && (wall.hp <= 0 ? art.ruin : (wall.max && wall.hp <= wall.max / 2 && pick(art.damaged)) || pick(art.levels));
  const image = window.assetImage(src);
  if(image){
    ctx.restore();ctx.save();ctx.translate(wall.x,wall.y);   // manifest art is drawn unrotated
    if (mirrored) ctx.scale(-1, 1);
    if (art.bodyClip) { ctx.beginPath();ctx.rect(art.offsetX,art.bodyClip.y,art.width,art.bodyClip.height);ctx.clip(); }
    ctx.drawImage(image,art.offsetX,art.offsetY,art.width,art.height);
  }else if(wall.hp>0){
    box(-s.length/2,-s.depth/2,s.length,s.depth,s.edge);
    for(let x=-s.length/2+2;x<s.length/2;x+=26){
      box(x,-s.depth/2+2,24,s.depth-4,s.stone);
      box(x,-s.depth/2-8,16,10,s.stone);
    }
    box(-s.gate/2,-s.depth/2,s.gate,s.depth,'#72523b');
    for(let x=-s.gate/2+4;x<s.gate/2;x+=12)box(x,-s.depth/2,2,s.depth,'#493f35');
    box(-s.gate/2-18,-s.depth/2-14,18,s.depth+22,s.roof);
    box(s.gate/2,-s.depth/2-14,18,s.depth+22,s.roof);
  }else{
    // Rubble remains beside the cleared gate; the traversable center stays open.
    for(let x=-s.length/2;x<s.length/2;x+=22){
      if(Math.abs(x)<s.gate/2)continue;
      box(x,-8+(x%3),18,14,s.rubble);
    }
  }
  ctx.restore();
};

// Keep labels for walls in the same column from collapsing onto one another.
window.layoutWallLabels = function (walls, minY, maxY) {
  const spacing = 34;
  const result = walls.map(wall => ({wall, y:Math.max(minY,Math.min(maxY,wall.y-66))}));
  result.sort((a,b)=>a.y-b.y);
  for (let i=0;i<result.length;i++) {
    for (let j=0;j<i;j++) {
      if (Math.abs(result[i].wall.x-result[j].wall.x)<140)
        result[i].y=Math.max(result[i].y,result[j].y+spacing);
    }
  }
  for (let i=result.length-1;i>=0;i--) {
    result[i].y=Math.min(maxY,result[i].y);
    for (let j=result.length-1;j>i;j--) {
      if (Math.abs(result[i].wall.x-result[j].wall.x)<140)
        result[i].y=Math.min(result[i].y,result[j].y-spacing);
    }
    result[i].y=Math.max(minY,result[i].y);
  }
  return result;
};

window.drawWallLabel = function(ctx, wall, labelY) {
  ctx.fillStyle='#342e29';ctx.fillRect(wall.x-50,labelY+8,100,7);
  ctx.fillStyle='#b8d079';ctx.fillRect(wall.x-50,labelY+8,100*wall.hp/wall.max,7);
  ctx.fillStyle='#fff1cd';ctx.font='bold 16px sans-serif';ctx.textAlign='center';
  ctx.fillText(`${wall.id}${'★'.repeat((wall.level||1)-1)} ${wall.hp>0?Math.ceil(wall.hp):'붕괴'}`,wall.x,labelY);
};
