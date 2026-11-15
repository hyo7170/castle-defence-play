// Image loading. Everything comes from assets/asset-manifest.js; a slot that is
// missing or fails to load falls back to placeholder drawing in the game code.
(() => {
  const A = window.ASSETS, cache = new Map();
  // Optional images: load on first use, report readiness without blocking.
  window.assetImage = function (src) {
    if (!src) return null;
    let image = cache.get(src);
    if (!image) { image = new Image(); image.src = src; cache.set(src, image); }
    return image.complete && image.naturalWidth ? image : null;
  };
  const sheet = s => ({image: Object.assign(new Image(), {src: s.src}), frameSize: s.frame, frames: s.frames, duration: s.ms,
    drawSize: Number.isFinite(s.drawSize) && s.drawSize > 0 ? s.drawSize : undefined,
    offsetY: Number.isFinite(s.offsetY) ? s.offsetY : 0});
  // Required sheets, keyed by unit or enemy type (tests wait for all of these).
  window.spriteLibrary = {};
  window.spriteVariants = {};
  for (const [type, entry] of Object.entries(A.units)) {
    window.spriteLibrary[type] = sheet(entry.idle);
    window.spriteVariants[type] = {attack: entry.attack ? sheet(entry.attack) : null,
      directions: entry.directions ? Object.fromEntries(Object.entries(entry.directions).map(([direction, actions]) =>
        [direction, Object.fromEntries(Object.entries(actions).map(([action, definition]) => [action, sheet(definition)]))])) : null};
  }
  for (const [type, entry] of Object.entries(A.enemies)) {
    window.spriteLibrary[type] = sheet(entry.walk_e);
    window.spriteVariants[type] = {
      north: entry.walk_n ? sheet(entry.walk_n) : null,
      attackEast: entry.attack_e ? sheet(entry.attack_e) : null,
      attackNorth: entry.attack_n ? sheet(entry.attack_n) : null,
      hurtEast: entry.hurt_e ? sheet(entry.hurt_e) : null,
      hurtNorth: entry.hurt_n ? sheet(entry.hurt_n) : null,
      deathEast: entry.death_e ? sheet(entry.death_e) : null,
      deathNorth: entry.death_n ? sheet(entry.death_n) : null
    };
  }
  window.fieldTextures = {};
  for (const name of ['grass', 'floor', 'road', 'yard']) if (A.tiles[name]) window.fieldTextures[name] = Object.assign(new Image(), {src: A.tiles[name]});
  const south = A.walls.south?.levels?.[0];
  window.fieldTextures.southWall = Object.assign(new Image(), {src: south || window.CONFIG.field.southWallSprite.path});
  // Start loading every optional image now so it is ready when first drawn.
  const terrain = () => [...(A.props.house || []), ...(A.props.tree || []), ...(A.props.fixed || []), A.props.bridge].filter(Boolean).map(p => p.src)
    .concat([A.tiles.cliff, A.tiles.water], Object.values(A.fortress?.props || {}).map(p => p.src),
      Object.values(A.medieval?.props || {}).map(p => p.src)).filter(Boolean);
  const optional = [A.keep?.src, A.keep?.damaged, ...terrain(), ...Object.values(A.buildings).flatMap(b => [...(b.levels || []), b.ruin]),
    ...Object.values(A.walls).flatMap(w => [...(w.levels || []), ...(w.damaged || []), w.ruin]),
    ...Object.values(A.fx || {}).map(f => f.src),
    ...Object.values(A.wallCollapse?.gates || {}).map(s => s.src), A.wallCollapse?.curtain?.src,
    ...['horizontal','vertical','tower'].flatMap(k => A.fortress?.[k] ? [...A.fortress[k].levels,A.fortress[k].ruin] : [])];
  optional.filter(Boolean).forEach(window.assetImage);
  // Changes whenever an optional terrain image finishes loading (terrain cache key).
  window.propAssetsKey = () => terrain().map(src => window.assetImage(src) ? 1 : 0).join('');
})();
