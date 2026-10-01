// 酒呑童子の邸宅 — 箱庭。レンダラー・カメラ・UI・ループ
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { createWorld } from './world.js';

const stage = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
const PR = Math.min(window.devicePixelRatio || 1, 2);
renderer.setPixelRatio(PR);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NoToneMapping; // 白い空間を白のまま出す
renderer.setClearColor(0xffffff, 1);
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(1, 1, 1);

const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 500);

// ---- 光（黄昏の薄明かり。暖かい灯りが映えるよう青みを残す） ----
scene.add(new THREE.HemisphereLight(0xc4d0ee, 0x6a5a62, 0.95));
const sun = new THREE.DirectionalLight(0xdfe6ff, 1.5);
sun.position.set(-22, 34, 24);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
const sc = sun.shadow.camera; sc.left = -28; sc.right = 28; sc.top = 24; sc.bottom = -24; sc.near = 5; sc.far = 110;
sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.04; sun.shadow.radius = 3;
scene.add(sun, sun.target);
const under = new THREE.DirectionalLight(0x9fb0d8, 0.5); // 島の下面を少し起こす
under.position.set(8, -30, 14);
scene.add(under);

const world = createWorld();
scene.add(world.group);

// ---- ポストプロセス（ブルーム=灯りのにじみ） ----
const composer = new EffectComposer(renderer);
composer.renderTarget1.samples = 4; composer.renderTarget2.samples = 4;
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.5, 0.6, 1.0);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---- カメラ操作 ----
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.07;
controls.rotateSpeed = 0.55; controls.zoomSpeed = 0.8; controls.panSpeed = 0.7;
controls.minDistance = 10; controls.maxDistance = 130;
controls.maxPolarAngle = Math.PI * 0.62; controls.minPolarAngle = 0.04;
controls.autoRotateSpeed = 0.55;

const VIEWS = {
  zen: { pos: [13, 52, 42], tgt: [0, 0.5, 0.5] },
  top: { pos: [2, 76, 14], tgt: [0, 0, 0] },
  hall: { pos: [6, 14, 4], tgt: [0, 2.2, -8.2], roof: false },
  garden: { pos: [-15, 5.2, 21], tgt: [0, 1.4, 4.5] },
  gate: { pos: [-7, 6, 27], tgt: [0, 1.8, 11.5] },
  under: { pos: [28, -14, 38], tgt: [0, -4, 0] },
};
let tween = null;
// 縦長の画面では島全体が入るよう、全景系の視点を引く
const fitScale = () => Math.min(2.4, Math.max(1, 1.55 / camera.aspect));
function setView(name, dur = 1.6) {
  const v = VIEWS[name]; if (!v) return;
  const t1 = new THREE.Vector3(...v.tgt), p1 = new THREE.Vector3(...v.pos);
  if (['zen', 'top', 'under'].includes(name)) p1.sub(t1).multiplyScalar(fitScale()).add(t1);
  const s0 = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
  const s1 = new THREE.Spherical().setFromVector3(p1.clone().sub(t1));
  let dth = s1.theta - s0.theta; dth = Math.atan2(Math.sin(dth), Math.cos(dth));
  tween = { t: 0, dur, t0: controls.target.clone(), t1, s0, s1, dth };
  if (v.roof === false) setRoof(false);
  document.querySelectorAll('[data-view]').forEach((b) => b.classList.toggle('on', b.dataset.view === name));
}
const cancelTween = () => { tween = null; document.querySelectorAll('[data-view]').forEach((b) => b.classList.remove('on')); };
renderer.domElement.addEventListener('pointerdown', cancelTween);
renderer.domElement.addEventListener('wheel', cancelTween, { passive: true });

function stepTween(dt) {
  if (!tween) return;
  tween.t += dt;
  const u = Math.min(1, tween.t / tween.dur), e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
  controls.target.lerpVectors(tween.t0, tween.t1, e);
  const r = tween.s0.radius + (tween.s1.radius - tween.s0.radius) * e;
  const ph = tween.s0.phi + (tween.s1.phi - tween.s0.phi) * e;
  const th = tween.s0.theta + tween.dth * e;
  camera.position.setFromSpherical(new THREE.Spherical(r, ph, th)).add(controls.target);
  if (u >= 1) tween = null;
}



// ---- UI ----
document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
const roofBtn = document.getElementById('roof');
function setRoof(on) { world.setRoof(on); roofBtn.setAttribute('aria-pressed', String(on)); roofBtn.querySelector('b').textContent = on ? '屋根をはずす' : '屋根をかける'; }
roofBtn.addEventListener('click', () => setRoof(world.roof.target < 0.5));
setRoof(false);
const rotBtn = document.getElementById('rot');
rotBtn.addEventListener('click', () => { controls.autoRotate = !controls.autoRotate; rotBtn.setAttribute('aria-pressed', String(controls.autoRotate)); });

const toast = document.getElementById('toast');
let toastTimer = 0;
world.onSay = (msg) => {
  toast.textContent = msg; toast.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 5200);
};

// 名札
const tagsEl = document.getElementById('tags');
const tags = world.labelTargets.map((t) => { const el = document.createElement('div'); el.className = 'tag ' + t.cls; el.textContent = t.name; tagsEl.appendChild(el); return { ...t, el }; });
const tmp = new THREE.Vector3();
function updateTags() {
  const w = window.innerWidth, h = window.innerHeight;
  for (const t of tags) {
    if (!t.isVisible()) { t.el.style.opacity = 0; continue; }
    t.obj.getWorldPosition(tmp).add(t.off);
    tmp.project(camera);
    const ok = tmp.z < 1 && Math.abs(tmp.x) < 1.05 && Math.abs(tmp.y) < 1.05;
    t.el.style.opacity = ok ? 1 : 0;
    t.el.style.transform = `translate(${((tmp.x * 0.5 + 0.5) * w).toFixed(1)}px, ${((-tmp.y * 0.5 + 0.5) * h).toFixed(1)}px) translate(-50%, -100%)`;
  }
}

// ---- ループ ----
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h); composer.setSize(w, h); bloom.setSize(w, h);
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();
setView('zen', 0.001); stepTween(1);
controls.update();

let T = 0, last = performance.now(), paused = false;
function simulate(dt) {
  T += dt;
  stepTween(dt);
  world.update(dt, T, camera);
  controls.update();
  const t = controls.target; t.x = THREE.MathUtils.clamp(t.x, -26, 26); t.z = THREE.MathUtils.clamp(t.z, -22, 24); t.y = THREE.MathUtils.clamp(t.y, -12, 10);
}
// 重い環境では段階的に画質を落とす（解像度 → 影 → ブルーム）
let ema = 16, slow = 0, level = 0, warm = 0;
function governor(ms) {
  if (paused || document.hidden || ++warm < 40) return;
  ema += (Math.min(ms, 250) - ema) * 0.05;
  slow = ema > 34 ? slow + 1 : Math.max(0, slow - 2);
  if (slow < 150 || level >= 3) return;
  level++; slow = 0; ema = 16;
  if (level === 1 && renderer.getPixelRatio() > 1) { renderer.setPixelRatio(1); resize(); }
  else if (level === 2) { sun.shadow.mapSize.set(2048, 2048); sun.shadow.map?.dispose(); sun.shadow.map = null; }
  else if (level === 3) bloom.enabled = false;
}
function frame(now) {
  requestAnimationFrame(frame);
  governor(now - last);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!paused) simulate(dt);
  composer.render();
  updateTags();
}
requestAnimationFrame(frame);

// 検証用フック（スクリーンショットや自動確認で使う）
window.__hako = {
  setView, setRoof, summon: () => world.startVisit(), world, camera, controls, composer, bloom, renderer, scene,
  pause: (p = true) => { paused = p; },
  advance: (sec, step = 1 / 30) => { for (let t = 0; t < sec; t += step) simulate(step); },
  tweenDone: () => !tween,
  time: () => T,
};
document.documentElement.dataset.ready = '1';
