import { merge, bounds, orbit, renderView, createGl, createGpu } from './engine/index.js';

const stage = document.getElementById('loader-stage');
const svg = document.getElementById('loader-svg');
const loading = document.getElementById('loader-loading');
const error = document.getElementById('viewer-error');
const canvases = {
  webgpu: document.getElementById('loader-webgpu'),
  webgl2: document.getElementById('loader-webgl2')
};
const buttons = [...document.querySelectorAll('[data-renderer]')];
const backends = {};
let scene, parts, palette, fit;
let yaw = 0.75, pitch = 0.35, mode = 'svg';
let pointer = null, raf = 0, request = 0;

function draw() {
  raf = 0;
  if (!scene) return;
  const size = Math.max(240, Math.min(stage.clientWidth, stage.clientHeight));
  const view = orbit({ yaw, pitch, name: '' });
  if (mode === 'svg') {
    svg.innerHTML = renderView(scene, view, {
      size, fit, palette, occlude: true, points: false,
      background: '#091719', stroke: '#213941'
    });
  } else if (backends[mode]) {
    const canvas = canvases[mode];
    canvas.style.width = canvas.style.height = `${size}px`;
    backends[mode].render(scene, view, {
      size, fit, parts, palette, background: [0.035, 0.09, 0.095],
      smooth: 40, studio: true, edges: false, dpr: Math.min(devicePixelRatio || 1, 2)
    });
  }
}
function redraw() { if (!raf) raf = requestAnimationFrame(draw); }
async function setMode(next) {
  const current = ++request;
  error.textContent = '';
  if (next !== 'svg' && !backends[next]) {
    try {
      backends[next] = await (next === 'webgpu'
        ? createGpu(canvases[next])
        : createGl(canvases[next]));
    } catch (e) {
      if (current !== request) return;
      error.textContent = `${next.toUpperCase()} unavailable: ${e.message || e}. SVG remains available.`;
      return;
    }
  }
  if (current !== request) return;
  mode = next;
  for (const [key, canvas] of Object.entries(canvases)) canvas.hidden = key !== mode;
  svg.hidden = mode !== 'svg';
  buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.renderer === mode)));
  redraw();
}
buttons.forEach(button => button.addEventListener('click', () => setMode(button.dataset.renderer)));
stage.addEventListener('pointerdown', event => {
  if (!scene) return;
  pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
  stage.setPointerCapture(event.pointerId);
});
stage.addEventListener('pointermove', event => {
  if (!pointer || pointer.id !== event.pointerId) return;
  yaw += (event.clientX - pointer.x) * 0.008;
  pitch = Math.max(-1.4, Math.min(1.4, pitch + (event.clientY - pointer.y) * 0.008));
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  redraw();
});
stage.addEventListener('pointerup', () => { pointer = null; });
stage.addEventListener('pointercancel', () => { pointer = null; });
new ResizeObserver(redraw).observe(stage);

try {
  const response = await fetch('assets/R45-Rakodo.scene.json');
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  parts = data.objects.map(o => o.mesh);
  scene = merge(...parts);
  palette = Object.fromEntries((data.palette || []).map(({name, ...material}) => [name, material]));
  const box = bounds(scene);
  fit = { ...box, dist: box.radius * 3.4 };
  loading.remove();
  // WebGL2 is available on more devices; WebGPU remains one click away.
  await setMode('webgl2');
  if (mode !== 'webgl2') await setMode('svg');
} catch (e) {
  loading.textContent = `Could not load 3Draft scene: ${e.message || e}`;
}
