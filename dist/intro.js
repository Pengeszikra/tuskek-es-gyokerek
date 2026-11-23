// Story intro: a silent, self-running canvas animation that takes the place of
// the hero logo a few seconds after someone lands on the page.
// English only, no audio, no narration — the text on screen carries the story.
// No dependencies; every scene is drawn with Canvas 2D from simple geometry.

const W = 800, H = 800;
const C = {
  paper: '#f3e8cf', ink: '#102e30', orange: '#d95120', ember: '#ef835b',
  night: '#08171a', deep: '#0c2225', mint: '#68d6b0', gold: '#dfb95b', mist: '#f3e8cf99'
};
const HEAD = '800 {s}px "Barlow Condensed", sans-serif';
const BODY = '500 {s}px "DM Sans", sans-serif';
const MONO = '600 {s}px ui-monospace, Menlo, monospace';
const font = (f, s) => f.replace('{s}', s);

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const out = t => 1 - Math.pow(1 - clamp(t), 3);
const span = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ---------- tiny 3D: boxes and beams, flat shaded, painter-sorted ---------- */
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = a => { const l = Math.hypot(...a) || 1; return mul(a, 1 / l); };
const FACES = [[0, 2, 6, 4], [1, 5, 7, 3], [0, 4, 5, 1], [2, 3, 7, 6], [0, 1, 3, 2], [4, 6, 7, 5]];

function box(c, s, color) {
  const v = [];
  for (let i = 0; i < 8; i++) v.push([c[0] + (i & 1 ? 1 : -1) * s[0] / 2, c[1] + (i & 2 ? 1 : -1) * s[1] / 2, c[2] + (i & 4 ? 1 : -1) * s[2] / 2]);
  return { v, color };
}
function beam(a, b, w, color) {
  const d = norm(sub(b, a));
  let u = cross(d, [0, 1, 0]); if (Math.hypot(...u) < 1e-3) u = cross(d, [1, 0, 0]);
  u = mul(norm(u), w / 2); const n = mul(norm(cross(d, u)), w / 2);
  const v = [];
  for (let i = 0; i < 8; i++) {
    const base = i & 1 ? b : a;
    v.push(add(add(base, mul(u, i & 2 ? 1 : -1)), mul(n, i & 4 ? 1 : -1)));
  }
  return { v, color };
}
function rotY(p, a) { const c = Math.cos(a), s = Math.sin(a); return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c]; }
function rotX(p, a) { const c = Math.cos(a), s = Math.sin(a); return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c]; }
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255;
  const f = x => Math.round(clamp(x * k, 0, 255));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}
// cam: {yaw, pitch, dist, f, cx, cy, target}
function view(p, cam) {
  let q = sub(p, cam.target || [0, 0, 0]);
  q = rotY(q, -cam.yaw); q = rotX(q, cam.pitch);
  const z = q[2] + cam.dist;
  return { x: cam.cx + cam.f * q[0] / z, y: cam.cy - cam.f * q[1] / z, z, w: q };
}
const LIGHT = norm([0.5, 0.9, 0.7]);
function drawSolids(ctx, solids, cam, opt = {}) {
  const polys = [];
  for (const s of solids) {
    const centre = s.v.reduce((a, p) => add(a, p), [0, 0, 0]).map(x => x / 8);
    const pv = s.v.map(p => view(p, cam));
    for (const f of FACES) {
      const pts = f.map(i => pv[i]);
      if (pts.some(p => p.z < 0.05)) continue;
      const a = s.v[f[0]], b = s.v[f[1]], c = s.v[f[2]];
      let n = norm(cross(sub(b, a), sub(c, a)));
      const fc = f.reduce((acc, i) => add(acc, s.v[i]), [0, 0, 0]).map(x => x / 4);
      if (dot(n, sub(fc, centre)) < 0) n = mul(n, -1);
      const depth = pts.reduce((acc, p) => acc + p.z, 0) / 4;
      polys.push({ pts, depth, k: 0.55 + 0.6 * Math.max(0, dot(n, LIGHT)), color: s.color, alpha: s.alpha ?? 1 });
    }
  }
  polys.sort((a, b) => b.depth - a.depth);
  for (const p of polys) {
    ctx.beginPath();
    p.pts.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y));
    ctx.closePath();
    ctx.globalAlpha = p.alpha * (opt.alpha ?? 1);
    ctx.fillStyle = shade(p.color, p.k); ctx.fill();
    if (opt.edges) { ctx.strokeStyle = opt.edges; ctx.lineWidth = 1; ctx.stroke(); }
  }
  ctx.globalAlpha = 1;
}

/* ---------- text helpers ---------- */
function text(ctx, str, x, y, f, color, align = 'left', alpha = 1, spacing = 0) {
  ctx.save(); ctx.globalAlpha *= alpha; ctx.font = f; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  if (spacing) ctx.letterSpacing = spacing + 'px';
  ctx.fillText(str, x, y); ctx.restore();
}
// Kicker + headline + one line, sliding in and out with the scene.
function caption(ctx, t, d, kicker, title, line, color = C.paper, accent = C.ember, y = 600) {
  const a = ease(span(t, 0.25, 0.9)) * (1 - ease(span(t, d - 0.7, d - 0.15)));
  const slide = (1 - out(span(t, 0.25, 1.1))) * 24;
  text(ctx, kicker, 70, y - 70 + slide, font(MONO, 15), accent, 'left', a, 3);
  const lines = title.split('\n');
  lines.forEach((l, i) => text(ctx, l, 66, y + i * 64 + slide * 1.4, font(HEAD, 70), color, 'left', a, -1));
  if (line) text(ctx, line, 70, y + lines.length * 64 - 18 + slide * 1.8, font(BODY, 22), color, 'left', a * 0.82);
}
function typed(str, t, cps = 28) { return t <= 0 ? '' : str.slice(0, Math.floor(t * cps)); }
function keycap(ctx, label, x, y, a, hot) {
  ctx.save(); ctx.globalAlpha *= a;
  ctx.fillStyle = hot ? C.orange : '#173a3d'; ctx.strokeStyle = C.mist; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(x, y, 46, 46, 7); ctx.fill(); ctx.stroke();
  text(ctx, label, x + 23, y + 31, font(MONO, 20), C.paper, 'center');
  ctx.restore();
}

/* ---------- the scenes ---------- */

// 1 · Thorns & roots grow out of one line.
const ROOTS = (() => {
  const r = rng(7), segs = [];
  function grow(x, y, ang, len, depth, dir, t0) {
    if (depth > 6 || len < 6) return;
    const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
    segs.push({ x, y, x2, y2, depth, dir, t0, w: Math.max(1, 7 - depth) });
    const n = depth < 2 ? 3 : 2;
    for (let i = 0; i < n; i++) grow(x2, y2, ang + (r() - 0.5) * 1.1, len * (0.62 + r() * 0.18), depth + 1, dir, t0 + 0.35);
  }
  for (let i = 0; i < 7; i++) grow(230 + i * 57, 400, Math.PI / 2 + (r() - 0.5) * 0.7, 70 + r() * 30, 0, 1, r() * 0.4);
  for (let i = 0; i < 9; i++) segs.push({ thorn: true, x: 200 + i * 50 + r() * 20, h: 50 + r() * 90, t0: 0.6 + r() * 0.8 });
  return segs;
})();
function sceneRoots(ctx, t, d) {
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
  const g = t / 1.0;
  for (const s of ROOTS) {
    if (s.thorn) {
      const k = out(span(g, s.t0, s.t0 + 1.2));
      if (!k) continue;
      ctx.fillStyle = C.orange;
      ctx.beginPath(); ctx.moveTo(s.x - 9, 400); ctx.lineTo(s.x, 400 - s.h * k); ctx.lineTo(s.x + 9, 400); ctx.fill();
      continue;
    }
    const k = out(span(g, s.t0 + s.depth * 0.32, s.t0 + s.depth * 0.32 + 0.6));
    if (!k) continue;
    ctx.strokeStyle = C.ink; ctx.lineWidth = s.w; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(lerp(s.x, s.x2, k), lerp(s.y, s.y2, k)); ctx.stroke();
  }
  ctx.fillStyle = C.ink; ctx.fillRect(140, 397, 520 * out(span(t, 0, 0.8)), 6);
  const a = ease(span(t, 1.2, 2)) * (1 - ease(span(t, d - 0.6, d - 0.1)));
  text(ctx, 'THORNS & ROOTS', 400, 150, font(MONO, 16), C.orange, 'center', a, 6);
  text(ctx, 'Tüskék és Gyökerek', 400, 225, font(HEAD, 74), C.ink, 'center', a, -1);
  text(ctx, 'A one-person software workshop.', 400, 690, font(BODY, 25), C.ink, 'center', ease(span(t, 2.4, 3.1)) * (1 - ease(span(t, d - 0.6, d - 0.1))));
  text(ctx, 'Old roots. New worlds.', 400, 728, font(BODY, 19), C.ink, 'center', 0.6 * ease(span(t, 3, 3.6)) * (1 - ease(span(t, d - 0.6, d - 0.1))));
}

// 2 · HEXAW: readable tokens collapse into real WebAssembly bytes.
const TOK = ['(module', '  (func $add', '    (param i32 i32)', '    (result i32)', '    local.get 0', '    local.get 1', '    i32.add)', '  (export "add"))'];
const BYTES = ['00 61 73 6D', '01 00 00 00', '01 07 01 60', '02 7F 7F 01', '7F 03 02 01', '00 07 07 01', '03 61 64 64', '00 00 0A 09'];
function sceneHexaw(ctx, t, d) {
  ctx.fillStyle = C.night; ctx.fillRect(0, 0, W, H);
  const m = ease(span(t, 2.4, 3.6));
  TOK.forEach((line, i) => {
    const show = typed(line, t - i * 0.18, 34);
    const y = 120 + i * 44;
    text(ctx, show, 70, y, font(MONO, 26), C.gold, 'left', 1 - m);
    text(ctx, BYTES[i], lerp(70, 470, 1) - 0, y, font(MONO, 30), C.mint, 'left', m, 4);
    if (m > 0 && m < 1) {
      ctx.strokeStyle = `rgba(104,214,176,${0.5 * (1 - Math.abs(m - 0.5) * 2)})`;
      ctx.beginPath(); ctx.moveTo(70 + 300 * m, y - 9); ctx.lineTo(470, y - 9); ctx.stroke();
    }
  });
  text(ctx, 'readable', 70, 82, font(MONO, 13), C.gold, 'left', 0.7 * (1 - m), 3);
  text(ctx, 'executable', 470, 82, font(MONO, 13), C.mint, 'left', 0.7 * m, 3);
  caption(ctx, t, d, 'THE FOUNDATION', 'HEXAW', 'WebAssembly, made readable.', C.paper, C.mint, 620);
}

// 3 · 3Draft: one material per face, three renderers.
const PAL = ['#d95120', '#dfb95b', '#68d6b0', '#f3e8cf', '#4f7f86', '#a64220', '#8fb79a'];
const DRAFT = (() => {
  const s = [], r = rng(3);
  for (let x = -2; x <= 2; x++) for (let z = -2; z <= 2; z++) {
    const h = 0.3 + r() * 1.8 * (1 - Math.hypot(x, z) / 3.4);
    s.push(box([x * 0.62, h / 2, z * 0.62], [0.52, h, 0.52], PAL[Math.floor(r() * PAL.length)]));
  }
  return s;
})();
function scene3Draft(ctx, t, d) {
  ctx.fillStyle = C.deep; ctx.fillRect(0, 0, W, H);
  const cam = { yaw: 0.6 + t * 0.28, pitch: -0.55, dist: 7.5, f: 560, cx: 400, cy: 330, target: [0, 0.4, 0] };
  const k = out(span(t, 0, 2.2));
  const solids = DRAFT.map((s, i) => {
    const kk = out(span(t, i * 0.05, i * 0.05 + 0.9));
    return { v: s.v.map(p => [p[0], p[1] * kk, p[2]]), color: s.color };
  });
  const mode = t > d * 0.62 ? 'svg' : t > d * 0.36 ? 'webgl2' : 'webgpu';
  drawSolids(ctx, solids, cam, { edges: mode === 'svg' ? C.paper : null, alpha: mode === 'svg' ? 0.35 : k });
  ['WebGPU', 'WebGL2', 'SVG'].forEach((m, i) => {
    const on = m.toLowerCase() === mode;
    ctx.save(); ctx.globalAlpha = ease(span(t, 0.8, 1.4));
    ctx.strokeStyle = C.paper; ctx.fillStyle = on ? C.paper : 'transparent';
    ctx.beginPath(); ctx.roundRect(70 + i * 112, 60, 100, 34, 17); ctx.fill(); ctx.stroke();
    text(ctx, m, 120 + i * 112, 83, font(MONO, 14), on ? C.ink : C.paper, 'center');
    ctx.restore();
  });
  caption(ctx, t, d, 'THE ENGINE', '3Draft', 'Tiny scenes. One material per face.', C.paper, C.ember, 640);
}

// 4 · Spider Paint: first person, shoot prisms, string spider bars.
const SHOTS = [[-1.8, 6, 0.9], [1.4, 5.2, 1.4], [0.1, 8, 2.2], [2.8, 7.5, 0.8], [-3, 8.6, 1.6]];
function sceneSpider(ctx, t, d) {
  ctx.fillStyle = '#0a1c1f'; ctx.fillRect(0, 0, W, H);
  const cam = { yaw: Math.sin(t * 0.4) * 0.12, pitch: -0.18, dist: 0.01, f: 520, cx: 400, cy: 330, target: [0, 1.6, -0.0] };
  const toView = p => view(p, cam);
  // floor grid
  ctx.strokeStyle = 'rgba(243,232,207,.13)'; ctx.lineWidth = 1;
  for (let i = -6; i <= 6; i++) {
    const a = toView([i, 0, 0.6]), b = toView([i, 0, 12]);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  for (let z = 1; z <= 12; z++) {
    const a = toView([-6, 0, z]), b = toView([6, 0, z]);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  const solids = [], tops = [];
  SHOTS.forEach(([x, z, h], i) => {
    const t0 = 0.5 + i * 0.55, k = span(t, t0, t0 + 0.45);
    if (!k) return;
    const y = h / 2 + (1 - out(k)) * 3;
    solids.push(box([x, y, z], [0.7, h, 0.7], PAL[i % PAL.length]));
    tops.push([x, h, z]);
  });
  drawSolids(ctx, solids, { ...cam, target: [0, 1.6, 0] });
  // spider bars (V … V)
  const bars = [[0, 1], [1, 2], [2, 3], [0, 2], [2, 4], [4, 0]];
  bars.forEach(([a, b], i) => {
    const k = out(span(t, 3.6 + i * 0.3, 4 + i * 0.3));
    if (!k || !tops[a] || !tops[b]) return;
    const p = toView(tops[a]), q = toView(tops[b]);
    ctx.strokeStyle = C.paper; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(lerp(p.x, q.x, k), lerp(p.y, q.y, k)); ctx.stroke();
  });
  // crosshair
  ctx.strokeStyle = C.orange; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(380, 330); ctx.lineTo(420, 330); ctx.moveTo(400, 310); ctx.lineTo(400, 350); ctx.stroke();
  const keyA = ease(span(t, 0.3, 0.8)) * (1 - ease(span(t, d - 0.6, d - 0.1)));
  const hotM = t > 0.4 && t < 3.4 && (t * 1.8 % 1) < 0.4, hotV = t > 3.5 && t < 5.6 && (t * 1.8 % 1) < 0.4;
  keycap(ctx, 'M', 620, 60, keyA, hotM); keycap(ctx, 'V', 676, 60, keyA, hotV);
  text(ctx, 'shoot · connect', 722, 128, font(MONO, 12), C.mist, 'right', keyA);
  caption(ctx, t, d, 'THE WORKSHOP', 'Spider Paint', 'Build it. Walk in. Take the controls.', C.paper, C.ember, 640);
}

// 5 · MCP: a sentence becomes geometry.
function spiderSolids(k, legLift = 0, col = C.ink) {
  const s = [box([0, 0.75, 0], [1.1, 0.42, 1.5], col), box([0, 0.8, 1.0], [0.6, 0.34, 0.5], C.orange)];
  for (let i = 0; i < 8; i++) {
    const side = i < 4 ? 1 : -1, j = i % 4;
    const z = -0.55 + j * 0.37, lift = Math.sin(legLift + i * 1.7) * 0.12;
    const hip = [side * 0.5, 0.78, z], knee = [side * 1.15, 1.25 + lift, z * 1.35], foot = [side * 1.7, 0, z * 1.8];
    if (k > 0.2 + i * 0.08) { s.push(beam(hip, knee, 0.11, '#4f7f86')); s.push(beam(knee, foot, 0.08, C.mint)); }
  }
  return k < 0.15 ? s.slice(0, 1) : s;
}
const CALLS = ['add_box  body', 'add_box  head', 'add_mesh leg_fl …', 'transform legs', 'place_on worktable', 'render  → editable'];
function sceneMcp(ctx, t, d) {
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.ink; ctx.beginPath(); ctx.roundRect(60, 60, 680, 72, 12); ctx.fill();
  text(ctx, '› ' + typed('model an eight-legged mechanical spider', t, 30), 86, 106, font(MONO, 20), C.paper);
  CALLS.forEach((c, i) => {
    const a = ease(span(t, 1.6 + i * 0.35, 1.9 + i * 0.35));
    text(ctx, c, 70, 182 + i * 30, font(MONO, 15), i === CALLS.length - 1 ? C.orange : C.ink, 'left', a);
  });
  const k = span(t, 1.8, 3.8);
  const cam = { yaw: 0.9 + t * 0.35, pitch: -0.42, dist: 6.4, f: 470, cx: 520, cy: 330, target: [0, 0.6, 0] };
  ctx.fillStyle = '#e7dac0'; ctx.beginPath(); ctx.ellipse(520, 400, 230, 40, 0, 0, Math.PI * 2); ctx.fill();
  drawSolids(ctx, spiderSolids(k, t * 3), cam);
  caption(ctx, t, d, 'AI AT THE WORKBENCH · MCP', 'Words become\ngeometry.', '', C.ink, C.orange, 590);
}

// 6 · Five Percent: SNP drive through real star positions.
const STARS = (() => { const r = rng(11), a = []; for (let i = 0; i < 520; i++) a.push({ x: (r() - 0.5) * 1600, y: (r() - 0.5) * 1600, z: r() * 1000 + 1, c: r() }); return a; })();
function sceneFive(ctx, t, d) {
  ctx.fillStyle = '#03090b'; ctx.fillRect(0, 0, W, H);
  const level = Math.min(9, Math.floor(span(t, 1.4, 5.4) * 9));
  const speed = 2 + Math.pow(1.85, level) * 1.2;
  for (const s of STARS) {
    const z = ((s.z - t * speed * 40) % 1000 + 1000) % 1000 + 1;
    const z2 = z + speed * 3;
    const x = 400 + s.x / z * 220, y = 340 + s.y / z * 220;
    const x2 = 400 + s.x / z2 * 220, y2 = 340 + s.y / z2 * 220;
    const b = clamp(1.4 - z / 900);
    ctx.strokeStyle = s.c > 0.85 ? `rgba(239,131,91,${b})` : s.c > 0.7 ? `rgba(223,185,91,${b})` : `rgba(243,232,207,${b})`;
    ctx.lineWidth = Math.max(0.6, 2.4 - z / 400);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2 + 0.5, y2 + 0.5); ctx.stroke();
  }
  // HUD
  const hud = ease(span(t, 0.4, 1)) * (1 - ease(span(t, d - 0.6, d - 0.1)));
  text(ctx, 'SNP DRIVE · LEVEL ' + level, 70, 80, font(MONO, 15), C.gold, 'left', hud, 3);
  ctx.save(); ctx.globalAlpha = hud;
  for (let i = 0; i < 9; i++) { ctx.fillStyle = i < level ? C.gold : 'rgba(243,232,207,.18)'; ctx.fillRect(70 + i * 22, 94, 16, 8); }
  ctx.restore();
  text(ctx, 'META QUEST 3 · BARE HANDS · 11 DAYS', 730, 80, font(MONO, 13), C.mist, 'right', hud, 2);
  const a1 = ease(span(t, 0.6, 1.4)) * (1 - ease(span(t, 3.6, 4.2)));
  text(ctx, 'Only 5% of the universe', 400, 330, font(HEAD, 64), C.paper, 'center', a1, -1);
  text(ctx, 'is known matter.', 400, 392, font(HEAD, 64), C.paper, 'center', a1, -1);
  const a2 = ease(span(t, 4.2, 5)) * (1 - ease(span(t, d - 0.6, d - 0.1)));
  text(ctx, 'Take a starship.', 400, 330, font(HEAD, 64), C.paper, 'center', a2, -1);
  text(ctx, 'Explore the 95%.', 400, 392, font(HEAD, 64), C.orange, 'center', a2, -1);
  caption(ctx, t, d, 'VR · META VR START COMPETITION 2026', 'Five Percent', 'A frozen snapshot of Spider Paint.', C.paper, C.gold, 650);
}

// 7 · Scale: from the workbench out to the universe — and down to atoms.
const RUNGS = [
  { e: -10, name: 'atom', plan: true }, { e: -9, name: 'molecule', plan: true }, { e: 0, name: 'workbench' },
  { e: 7, name: 'Earth' }, { e: 16, name: 'nearest stars' }, { e: 21, name: 'galaxies' }, { e: 26, name: 'universe', short: 'universe' }
];
function drawIcon(ctx, name, x, y, r, t) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = C.paper; ctx.fillStyle = C.paper; ctx.lineWidth = 2;
  if (name === 'atom') {
    ctx.fillStyle = C.orange; ctx.beginPath(); ctx.arc(0, 0, r * 0.18, 0, 7); ctx.fill();
    for (let i = 0; i < 3; i++) { ctx.save(); ctx.rotate(i * Math.PI / 3 + t * 0.6); ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.36, 0, 0, 7); ctx.stroke(); ctx.restore(); }
  } else if (name === 'molecule') {
    const p = [[-0.6, 0.2], [0, -0.3], [0.6, 0.2], [0, 0.65]];
    ctx.beginPath(); p.forEach(([a, b], i) => i && (ctx.moveTo(0, -0.3 * r), ctx.lineTo(a * r, b * r))); ctx.stroke();
    p.forEach(([a, b], i) => { ctx.fillStyle = i === 1 ? C.orange : C.mint; ctx.beginPath(); ctx.arc(a * r, b * r, r * 0.22, 0, 7); ctx.fill(); });
  } else if (name === 'workbench') {
    ctx.fillStyle = C.gold; ctx.fillRect(-r, -r * 0.1, r * 2, r * 0.22); ctx.fillRect(-r * 0.9, 0, r * 0.15, r * 0.8); ctx.fillRect(r * 0.75, 0, r * 0.15, r * 0.8);
    ctx.fillStyle = C.orange; ctx.fillRect(-r * 0.3, -r * 0.6, r * 0.5, r * 0.5);
  } else if (name === 'Earth') {
    ctx.fillStyle = '#2f6e86'; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
    ctx.fillStyle = C.mint; ctx.beginPath(); ctx.ellipse(-r * 0.25, -r * 0.2, r * 0.4, r * 0.28, 0.5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(r * 0.35, r * 0.35, r * 0.25, r * 0.18, -0.4, 0, 7); ctx.fill();
  } else if (name === 'nearest stars') {
    [[0, 0, 1], [-0.6, -0.4, 0.5], [0.7, 0.3, 0.6], [0.2, 0.75, 0.4], [-0.4, 0.6, 0.35]].forEach(([a, b, s]) => {
      ctx.fillStyle = s > 0.9 ? C.gold : C.paper; ctx.beginPath(); ctx.arc(a * r, b * r, r * 0.16 * s + 1, 0, 7); ctx.fill();
    });
  } else if (name === 'galaxies') {
    for (let i = 0; i < 160; i++) { const a = i * 0.25 + t * 0.4, rr = (i / 160) * r; ctx.fillStyle = i % 9 ? 'rgba(243,232,207,.8)' : C.ember; ctx.fillRect(Math.cos(a) * rr, Math.sin(a) * rr * 0.55, 2, 2); }
  } else {
    for (let i = 0; i < 4; i++) { ctx.globalAlpha = 0.25 + i * 0.18; ctx.beginPath(); ctx.arc(0, 0, r * (0.3 + i * 0.24), 0, 7); ctx.stroke(); }
  }
  ctx.restore();
}
function sceneScale(ctx, t, d) {
  ctx.fillStyle = C.deep; ctx.fillRect(0, 0, W, H);
  const p = ease(span(t, 0.6, d - 1.2));
  const e = lerp(26, -10, p);
  const sup = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const exp = String(Math.round(e)).split('').map(c => sup[c]).join('');
  text(ctx, '10' + exp + ' m', 400, 175, font(HEAD, 120), C.paper, 'center', ease(span(t, 0.2, 0.8)), -2);
  // axis
  const x0 = 100, x1 = 700, step = (x1 - x0) / (RUNGS.length - 1);
  const ax = v => { // piecewise: exponent -> evenly spaced rung position
    for (let i = 0; i < RUNGS.length - 1; i++) { const a = RUNGS[i].e, b = RUNGS[i + 1].e; if (v <= b) return x0 + step * (i + clamp((v - a) / (b - a))); }
    return x1; };
  ctx.strokeStyle = C.mist; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, 470); ctx.lineTo(x1, 470); ctx.stroke();
  for (const r of RUNGS) {
    const x = ax(r.e), near = Math.abs(e - r.e);
    const big = 1 + 1.4 * clamp(1 - near / 4);
    drawIcon(ctx, r.name, x, 400, 18 * big, t);
    ctx.fillStyle = r.plan ? C.gold : C.paper; ctx.beginPath(); ctx.arc(x, 470, 5, 0, 7); ctx.fill();
    text(ctx, r.short || r.name, x, RUNGS.indexOf(r) % 2 ? 524 : 504, font(MONO, 12), r.plan ? C.gold : C.paper, 'center', 0.4 + 0.6 * clamp(1 - near / 4));
  }
  ctx.fillStyle = C.orange; ctx.beginPath(); ctx.moveTo(ax(e), 456); ctx.lineTo(ax(e) - 9, 440); ctx.lineTo(ax(e) + 9, 440); ctx.fill();
  text(ctx, 'today', ax(13), 556, font(MONO, 12), C.paper, 'center', 0.55);
  text(ctx, 'next', ax(-9.5), 556, font(MONO, 12), C.gold, 'center', 0.8);
  caption(ctx, t, d, 'SCIENCE & EDUCATION', 'Atoms to galaxies.', 'One engine. Real data through MCP.', C.paper, C.gold, 650);
}

// 8 · spi3der: a 3D channel inside every AI chat.
function sceneSpi3der(ctx, t, d) {
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#e7dac0'; ctx.beginPath(); ctx.roundRect(70, 60, 660, 470, 16); ctx.fill();
  const bubble = (x, y, w, str, mine, a) => {
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = mine ? C.ink : C.paper;
    ctx.beginPath(); ctx.roundRect(x, y, w, 44, 12); ctx.fill();
    text(ctx, str, x + 18, y + 29, font(BODY, 17), mine ? C.paper : C.ink); ctx.restore();
  };
  bubble(360, 84, 340, 'Show me how the legs move.', true, ease(span(t, 0.3, 0.8)));
  const pa = ease(span(t, 1, 1.6));
  ctx.save(); ctx.globalAlpha = pa; ctx.fillStyle = C.deep; ctx.beginPath(); ctx.roundRect(100, 144, 520, 300, 12); ctx.fill(); ctx.restore();
  if (pa > 0) {
    ctx.save(); ctx.beginPath(); ctx.roundRect(100, 144, 520, 300, 12); ctx.clip(); ctx.globalAlpha = pa;
    drawSolids(ctx, spiderSolids(1, t * 4, '#1e4a4f'), { yaw: t * 0.5, pitch: -0.45, dist: 6, f: 330, cx: 360, cy: 300, target: [0, 0.6, 0] });
    text(ctx, 'spi3der · live 3D', 118, 170, font(MONO, 12), C.mint, 'left', 0.9, 2);
    ctx.restore();
  }
  ctx.fillStyle = C.paper; ctx.beginPath(); ctx.roundRect(100, 462, 600, 46, 23); ctx.fill();
  const cmd = t > 2.2 ? typed('/orbit leg_fl', t - 2.2, 12) : '';
  text(ctx, cmd, 126, 492, font(MONO, 18), C.ink);
  ctx.font = font(MONO, 18);
  if ((t * 2 % 1) < 0.5) text(ctx, '▏', 128 + ctx.measureText(cmd).width, 492, font(MONO, 18), C.orange);
  caption(ctx, t, d, 'THE LONG GAME · spi3der', 'A 3D channel\nfor every AI chat.', 'Claude first.', C.ink, C.orange, 640);
}

// 9 · Outro.
function sceneOutro(ctx, t, d) {
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
  const a = ease(span(t, 0.2, 1));
  text(ctx, 'From roots', 400, 330, font(HEAD, 110), C.ink, 'center', a, -2);
  ctx.font = font(HEAD, 110); ctx.letterSpacing = '-2px';
  const w1 = ctx.measureText('to the ').width, w2 = ctx.measureText('universe.').width;
  ctx.letterSpacing = '0px';
  const sx = 400 - (w1 + w2) / 2;
  text(ctx, 'to the ', sx, 440, font(HEAD, 110), C.ink, 'left', ease(span(t, 0.6, 1.4)), -2);
  text(ctx, 'universe.', sx + w1, 440, font(HEAD, 110), C.orange, 'left', ease(span(t, 1, 1.8)), -2);
  const b = ease(span(t, 2, 2.8));
  text(ctx, '3Draft · HEXAW · Spider Paint · Five Percent · spi3der', 400, 540, font(MONO, 15), C.ink, 'center', b * 0.75, 1);
  ctx.fillStyle = C.orange; ctx.fillRect(400 - 160 * b, 575, 320 * b, 4);
}

const SCENES = [
  { d: 5.2, draw: sceneRoots }, { d: 5.2, draw: sceneHexaw }, { d: 5.6, draw: scene3Draft },
  { d: 6.2, draw: sceneSpider }, { d: 5.8, draw: sceneMcp }, { d: 7, draw: sceneFive },
  { d: 6.6, draw: sceneScale }, { d: 6, draw: sceneSpi3der }, { d: 4.6, draw: sceneOutro }
];
const TOTAL = SCENES.reduce((a, s) => a + s.d, 0);

/* ---------- player ---------- */
const root = document.getElementById('hero-visual');
if (root) {
  const intro = root.querySelector('.intro');
  const canvas = intro.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const bar = intro.querySelector('.intro-bar i');
  const toggle = intro.querySelector('[data-intro=toggle]');
  const replayBtn = root.querySelector('.intro-replay');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let time = 0, last = 0, playing = false, raf = 0, started = false;

  function size() {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
  }
  function frame() {
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    let t = time, i = 0;
    while (i < SCENES.length - 1 && t >= SCENES[i].d) { t -= SCENES[i].d; i++; }
    const s = SCENES[i];
    ctx.save(); s.draw(ctx, Math.min(t, s.d), s.d); ctx.restore();
    // short dip between scenes
    const edge = Math.min(t, s.d - t);
    if (edge < 0.18 && !(i === 0 && t < s.d / 2)) { ctx.fillStyle = `rgba(8,23,26,${(1 - edge / 0.18) * 0.9})`; ctx.fillRect(0, 0, W, H); }
    bar.style.width = (time / TOTAL * 100) + '%';
  }
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (playing) time += dt;
    if (time >= TOTAL) { time = TOTAL - 0.001; frame(); finish(); return; }
    frame();
    raf = requestAnimationFrame(tick);
  }
  function play() { if (playing) return; playing = true; last = performance.now(); toggle.textContent = 'Pause'; toggle.setAttribute('aria-pressed', 'false'); cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); }
  function pause() { playing = false; toggle.textContent = 'Play'; toggle.setAttribute('aria-pressed', 'true'); }
  function open() {
    started = true; time = 0;
    root.classList.add('is-playing'); intro.hidden = false; replayBtn.hidden = true;
    size(); frame();
    requestAnimationFrame(() => intro.classList.add('on'));
    // wait briefly for the web fonts, but never longer than a second
    Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, 1000))]).then(play);
  }
  function finish() {
    playing = false; cancelAnimationFrame(raf);
    intro.classList.remove('on'); root.classList.remove('is-playing');
    setTimeout(() => { intro.hidden = true; replayBtn.hidden = false; }, 700);
    try { sessionStorage.setItem('tg-intro-seen', '1'); } catch {}
  }
  toggle.addEventListener('click', () => playing ? pause() : play());
  intro.querySelector('[data-intro=replay]').addEventListener('click', () => { time = 0; play(); });
  intro.querySelector('[data-intro=close]').addEventListener('click', finish);
  replayBtn.addEventListener('click', open);
  addEventListener('resize', () => { if (!intro.hidden) { size(); frame(); } });
  document.addEventListener('visibilitychange', () => { if (document.hidden && playing) pause(); });

  // Arrive proactively: a few seconds after the hero is in view, unless the
  // visitor prefers reduced motion or has already seen it in this session.
  let seen = false; try { seen = sessionStorage.getItem('tg-intro-seen') === '1'; } catch {}
  const forced = new URLSearchParams(location.search).has('intro');
  if ((reduced || seen) && !forced) replayBtn.hidden = false;
  else {
    let timer = 0;
    const io = new IntersectionObserver(([e]) => {
      clearTimeout(timer);
      if (e.isIntersecting && !started) timer = setTimeout(() => { if (!document.hidden && !started) { open(); io.disconnect(); } }, forced ? 300 : 3800);
    }, { threshold: 0.6 });
    io.observe(root);
  }
}
