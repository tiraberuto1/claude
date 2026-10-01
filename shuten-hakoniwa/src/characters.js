// 人物: 鬼・女・山伏姿の頼光一行・酒呑童子。すべてプリミティブで組み、手続き的にポーズを付ける。
import * as THREE from 'three';
import { clamp, lerpAngle, smooth } from './util.js';
import { groundHeight } from './layout.js';

// ---------- ジオメトリ・マテリアルのキャッシュ ----------
const G = {
  sph: new THREE.SphereGeometry(1, 14, 10),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 12),
  cylT: new THREE.CylinderGeometry(0.78, 1, 1, 12),
  box: new THREE.BoxGeometry(1, 1, 1),
  cone: new THREE.ConeGeometry(1, 1, 8),
  hemi: new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.56),
  torus: new THREE.TorusGeometry(1, 0.12, 6, 20),
};
const matCache = new Map();
export function mc(hex, o = {}) {
  const k = hex + JSON.stringify(o);
  if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial({ color: hex, roughness: 0.72, ...o }));
  return matCache.get(k);
}
const glow = (hex, k = 1.6) => { const c = new THREE.Color(hex).multiplyScalar(k); const m = new THREE.MeshBasicMaterial({ color: c, toneMapped: false }); return m; };

function mesh(g, mat, sx, sy, sz, x, y, z, parent, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(G[g], mat);
  m.scale.set(sx, sy, sz); m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  if (parent) parent.add(m);
  return m;
}
function pivot(parent, x, y, z) { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; }
function latheMesh(points, mat, parent, x, y, z, seg = 16) {
  const m = new THREE.Mesh(new THREE.LatheGeometry(points.map(([r, yy]) => new THREE.Vector2(r, yy)), seg), mat);
  m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m;
}
const DS = { side: THREE.DoubleSide };

// ---------- 共通の人体（脚・腕・胴） ----------
function humanBase(o) {
  const root = new THREE.Group();
  const L = {}; const hands = {};
  const skin = mc(o.skin), cloth = mc(o.cloth), pants = mc(o.pants ?? o.cloth), shoe = mc(o.shoe ?? 0x2a2420);
  const body = pivot(root, 0, 0.66, 0); L.body = body;
  mesh('cylT', cloth, o.tw ?? 0.27, 0.72, o.td ?? 0.19, 0, 0.36, 0, body);
  L.head = pivot(body, 0, 0.74, 0);
  for (const [sd, key] of [[1, 'L'], [-1, 'R']]) {
    const hip = pivot(root, sd * 0.13, 0.66, 0); L['leg' + key] = hip;
    mesh('cyl', pants, 0.095 * (o.legT ?? 1), 0.33, 0.095 * (o.legT ?? 1), 0, -0.165, 0, hip);
    const knee = pivot(hip, 0, -0.33, 0); L['knee' + key] = knee;
    mesh('cyl', pants, 0.08 * (o.legT ?? 1), 0.31, 0.08 * (o.legT ?? 1), 0, -0.155, 0, knee);
    mesh('box', shoe, 0.14, 0.08, 0.27, 0, -0.31, 0.05, knee);
    const sh = pivot(body, sd * (o.sw ?? 0.33), 0.62, 0); L['arm' + key] = sh;
    const aT = o.armT ?? 1;
    mesh('cyl', mc(o.sleeve ?? o.cloth), 0.07 * aT, 0.32, 0.07 * aT, 0, -0.16, 0, sh);
    const el = pivot(sh, 0, -0.32, 0); L['elbow' + key] = el;
    mesh('cyl', mc(o.sleeve2 ?? o.sleeve ?? o.cloth), 0.065 * aT, 0.3, 0.065 * aT, 0, -0.15, 0, el);
    const hs = o.hand ?? 0.075;
    mesh('sph', skin, hs, hs, hs, 0, -0.31, 0, el);
    hands[key] = pivot(el, 0, -0.31, 0);
  }
  return { root, L, hands, body, skin, cloth };
}

// ---------- 鬼 ----------
function oniHead(parent, skinHex, o = {}) {
  const skin = mc(skinHex);
  const k = o.k ?? 1;
  mesh('sph', skin, 0.35 * k, 0.32 * k, 0.33 * k, 0, 0.3 * k, 0, parent);
  const white = mc(0xf6f1de), black = mc(0x16110f), ivory = mc(0xf1e6c8);
  for (const sd of [-1, 1]) {
    mesh('sph', mc(o.eye ?? 0xf6f1de, o.eyeGlow ? { emissive: o.eye, emissiveIntensity: 0.6 } : {}), 0.075 * k, 0.07 * k, 0.05 * k, sd * 0.13 * k, 0.37 * k, 0.285 * k, parent);
    mesh('sph', black, 0.032 * k, 0.045 * k, 0.03 * k, sd * 0.13 * k, 0.37 * k, 0.33 * k, parent);
    mesh('box', black, 0.17 * k, 0.045 * k, 0.06 * k, sd * 0.14 * k, 0.46 * k, 0.29 * k, parent, 0, 0, -sd * 0.45);
    mesh('cone', ivory, 0.036 * k, 0.13 * k, 0.036 * k, sd * 0.085 * k, 0.185 * k, 0.315 * k, parent);
    mesh('cone', skin, 0.065 * k, 0.2 * k, 0.065 * k, sd * 0.35 * k, 0.32 * k, 0, parent, 0, 0, -sd * Math.PI / 2);
  }
  mesh('sph', skin, 0.065 * k, 0.055 * k, 0.06 * k, 0, 0.28 * k, 0.34 * k, parent);
  mesh('box', black, 0.26 * k, 0.05 * k, 0.06 * k, 0, 0.14 * k, 0.31 * k, parent);
  const horn = (x, h, r, rz, rx = 0) => mesh('cone', ivory, r * k, h * k, r * k, x * k, 0.6 * k, 0.08 * k, parent, rx, 0, rz);
  if (o.horns === 1) horn(0, 0.34, 0.085, 0, 0.1); else { horn(-0.15, 0.34, 0.075, 0.38); horn(0.15, 0.34, 0.075, -0.38); }
  const hair = mesh('hemi', mc(o.hair ?? 0x14100e), 0.37 * k, 0.37 * k, 0.35 * k, 0, 0.3 * k, -0.04 * k, parent, -0.55);
  for (let i = 0; i < 5; i++) mesh('cone', mc(o.hair ?? 0x14100e), 0.085 * k, 0.22 * k, 0.085 * k, (i - 2) * 0.1 * k, 0.62 * k, -0.08 * k, parent, -0.25, 0, (i - 2) * -0.25);
  return hair;
}

export function buildOni(o = {}) {
  const b = humanBase({ skin: o.skin, cloth: o.skin, pants: o.skin, shoe: o.skin, tw: 0.31, td: 0.22, sw: 0.4, armT: 1.3, legT: 1.2, hand: 0.1, sleeve: o.skin });
  const { root, L, body, hands } = b;
  const tiger = mc(0xe0a62a), blk = mc(0x181210);
  mesh('cylT', tiger, 0.34, 0.3, 0.26, 0, -0.04, 0, body);
  for (const y of [-0.1, 0.02]) mesh('cyl', blk, 0.345, 0.05, 0.265, 0, y, 0, body);
  mesh('sph', mc(o.skin), 0.27, 0.22, 0.2, 0, 0.3, 0.09, body);
  for (const sd of [-1, 1]) mesh('sph', mc(o.skin), 0.15, 0.13, 0.14, sd * 0.38, 0.66, 0, body);
  oniHead(L.head, o.skin, { horns: o.horns ?? 2 });
  const items = {};
  if (o.club) {
    const club = pivot(hands.R, 0, 0, 0); club.rotation.x = -0.9;
    mesh('cyl', mc(0x4a3426), 0.05, 0.5, 0.05, 0, -0.2, 0, club);
    const hd = mesh('cyl', mc(0x30343c, { metalness: 0.5, roughness: 0.5 }), 0.14, 0.75, 0.14, 0, -0.85, 0, club);
    for (let i = 0; i < 12; i++) mesh('cone', mc(0x9aa0ac, { metalness: 0.6 }), 0.035, 0.1, 0.035, Math.cos(i * 1.4) * 0.14, -0.6 - (i % 4) * 0.17, Math.sin(i * 1.4) * 0.14, club, 0, 0, 0, 0).rotation.set(Math.sin(i * 1.4) * 1.57, 0, -Math.cos(i * 1.4) * 1.57);
    items.club = club;
  }
  if (o.cup) {
    const cup = pivot(hands.R, 0, -0.04, 0.02);
    mesh('cyl', mc(0xb83a24), 0.2, 0.08, 0.2, 0, 0, 0, cup);
    mesh('cyl', mc(0x1a0e0e), 0.17, 0.02, 0.17, 0, 0.045, 0, cup);
    mesh('torus', mc(0xe0b84a, { metalness: 0.5 }), 0.2, 0.2, 0.2, 0, 0.04, 0, cup, Math.PI / 2);
    items.cup = cup;
  }
  if (o.barrel) {
    const br = pivot(body, 0, 1.55, 0.05);
    mesh('cyl', mc(0x9a7448), 0.38, 0.8, 0.38, 0, 0, 0, br);
    for (const y of [-0.22, 0.22]) mesh('cyl', mc(0x2a2522), 0.395, 0.07, 0.395, 0, y, 0, br);
    mesh('box', mc(0xb83a24), 0.26, 0.26, 0.04, 0, 0, 0.38, br);
    items.barrel = br;
  }
  if (o.pole) { // 提灯を下げた棒
    const pole = pivot(hands.R, 0, 0, 0); pole.rotation.x = -0.5;
    mesh('cyl', mc(0x4a3426), 0.035, 1.9, 0.035, 0, -0.5, 0, pole);
    const lamp = mesh('cyl', glow(0xffb060, 1.8), 0.17, 0.3, 0.17, 0, -1.3, 0.0, pole);
    items.pole = pole;
  }
  return { root, limbs: L, hands, items, kind: 'oni' };
}

// ---------- 女（十二単ふう） ----------
export function buildWoman(o = {}) {
  const root = new THREE.Group(); const L = {}; const hands = {}; const items = {};
  const robeM = mc(o.robe, { roughness: 0.6, ...DS }), accM = mc(o.accent, { roughness: 0.6, ...DS }), skin = mc(0xf1d6b8), hairM = mc(0x15100f, { roughness: 0.4 });
  const body = pivot(root, 0, 0.7, 0); L.body = body;
  const robe = pivot(body, 0, 0.66, 0); L.robe = robe;
  latheMesh([[0.45, -1.33], [0.42, -1.0], [0.35, -0.6], [0.28, -0.28], [0.24, 0], [0.13, 0.05]], robeM, robe, 0, 0, 0, 18);
  mesh('cyl', accM, 0.46, 0.1, 0.46, 0, -1.28, 0, robe).material = mc(o.accent, { ...DS });
  mesh('cylT', mc(o.obi ?? 0x7a1d24), 0.25, 0.2, 0.2, 0, -0.45, 0, robe);
  mesh('box', mc(o.obi ?? 0x7a1d24), 0.34, 0.26, 0.1, 0, -0.45, -0.25, robe);
  mesh('box', mc(o.obi ?? 0x7a1d24), 0.12, 0.35, 0.05, 0.08, -0.7, -0.27, robe, 0, 0, 0.15);
  mesh('box', mc(0xf3eee0), 0.17, 0.4, 0.03, 0, -0.1, 0.2, robe, -0.15);
  mesh('box', accM, 0.17, 0.05, 0.035, 0, 0.06, 0.2, robe, -0.15);
  L.head = pivot(body, 0, 0.74, 0);
  mesh('sph', skin, 0.26, 0.27, 0.25, 0, 0.27, 0, L.head);
  mesh('hemi', hairM, 0.285, 0.3, 0.285, 0, 0.29, -0.03, L.head, -0.6);
  mesh('box', hairM, 0.34, 1.0, 0.1, 0, -0.2, -0.24, L.head);
  mesh('sph', hairM, 0.11, 0.09, 0.09, 0, 0.58, -0.12, L.head);
  mesh('sph', mc(0xe0b84a, { metalness: 0.5 }), 0.045, 0.045, 0.045, 0.14, 0.52, 0.04, L.head);
  mesh('cyl', mc(0xe0b84a, { metalness: 0.5 }), 0.012, 0.3, 0.012, 0.2, 0.5, -0.1, L.head, 0, 0, 0.7);
  for (const sd of [-1, 1]) mesh('sph', mc(0x16110f), 0.025, 0.032, 0.02, sd * 0.09, 0.3, 0.235, L.head);
  mesh('sph', mc(0xc43d3d), 0.032, 0.018, 0.02, 0, 0.2, 0.245, L.head);
  for (const [sd, key] of [[1, 'L'], [-1, 'R']]) {
    const sh = pivot(body, sd * 0.25, 0.6, 0); L['arm' + key] = sh;
    mesh('cyl', robeM, 0.08, 0.3, 0.08, 0, -0.15, 0, sh);
    const el = pivot(sh, 0, -0.3, 0); L['elbow' + key] = el;
    mesh('cyl', robeM, 0.072, 0.28, 0.072, 0, -0.14, 0, el);
    mesh('box', robeM, 0.05, 0.46, 0.3, 0, -0.26, 0, el);
    mesh('box', accM, 0.054, 0.08, 0.31, 0, -0.5, 0, el);
    mesh('sph', skin, 0.065, 0.065, 0.065, 0, -0.29, 0, el);
    hands[key] = pivot(el, 0, -0.29, 0);
    const hip = pivot(root, sd * 0.1, 0.5, 0); L['leg' + key] = hip;
    mesh('box', mc(0xf3eee0), 0.13, 0.07, 0.25, 0, -0.45, 0.13, hip);
  }
  if (o.tray) {
    const tray = pivot(body, 0, 0.3, 0.38);
    mesh('box', mc(0x2a1f20), 0.5, 0.04, 0.34, 0, 0, 0, tray);
    mesh('cyl', mc(0xe6dccb), 0.06, 0.07, 0.06, -0.14, 0.05, 0, tray); mesh('cyl', mc(0xe6dccb), 0.06, 0.07, 0.06, 0.02, 0.05, 0.04, tray);
    mesh('cyl', mc(0xd9d2c0), 0.04, 0.16, 0.04, 0.16, 0.1, -0.02, tray);
    items.tray = tray;
  }
  if (o.fan) {
    const fan = pivot(hands.R, 0, -0.04, 0.05); fan.rotation.set(-1.2, 0, 0);
    mesh('cone', mc(0xe9d9a8, DS), 0.22, 0.05, 0.22, 0, 0.12, 0, fan, 0, 0, 0).scale.set(0.2, 0.02, 0.2);
    const f = mesh('cyl', mc(0xe9d9a8, DS), 0.2, 0.02, 0.2, 0, 0.18, 0, fan); f.scale.set(0.26, 0.015, 0.26);
    mesh('cyl', mc(0xb83a24), 0.2, 0.012, 0.03, 0, 0.18, 0, fan, 0, 0, 0).scale.set(0.26, 0.017, 0.03);
    items.fan = fan;
  }
  if (o.bottle) {
    const bt = pivot(hands.R, 0, -0.08, 0.04);
    mesh('cyl', mc(0xf1ece0), 0.07, 0.22, 0.07, 0, 0.1, 0, bt); mesh('cyl', mc(0xf1ece0), 0.035, 0.12, 0.035, 0, 0.27, 0, bt);
    mesh('box', mc(0xb83a24), 0.08, 0.1, 0.02, 0, 0.1, 0.07, bt);
    items.bottle = bt;
  }
  if (o.cloth) {
    const cl = pivot(hands.R, 0, -0.1, 0.12);
    mesh('box', mc(0xe8e3d4), 0.4, 0.03, 0.34, 0.0, 0, 0.1, cl);
    mesh('box', mc(0x5a78a8), 0.4, 0.034, 0.1, 0.0, 0, 0.1, cl);
    items.cloth = cl;
  }
  return { root, limbs: L, hands, items, kind: 'woman', robe };
}

// ---------- 山伏姿の男（頼光一行） ----------
export function buildMan(o = {}) {
  const b = humanBase({ skin: o.skin ?? 0xeac9a0, cloth: o.robe ?? 0xf1ede2, pants: 0x2a2a34, shoe: 0x26201c, sleeve: o.robe ?? 0xf1ede2 });
  const { root, L, body, hands } = b;
  const items = {};
  const robeM = mc(o.robe ?? 0xf1ede2, { roughness: 0.8, ...DS });
  latheMesh([[0.4, -0.5], [0.36, -0.2], [0.3, 0.2], [0.26, 0.5], [0.2, 0.7]], robeM, body, 0, 0, 0, 16);
  mesh('cyl', mc(0x2a2a34), 0.285, 0.1, 0.22, 0, 0.1, 0, body);
  const sc = mc(o.sash ?? 0x2f3d78);
  for (const y of [0.55, 0.42, 0.29]) mesh('sph', sc, 0.05, 0.05, 0.05, 0, y, 0.21, body);
  mesh('box', sc, 0.04, 0.5, 0.03, 0, 0.42, 0.2, body);
  mesh('box', mc(0x7a5238), 0.36, 0.5, 0.2, 0, 0.42, -0.26, body);
  mesh('cyl', sc, 0.1, 0.4, 0.1, 0, 0.74, -0.26, body, 0, 0, Math.PI / 2);
  const skin = mc(o.skin ?? 0xeac9a0), black = mc(0x16110f);
  mesh('sph', skin, 0.27, 0.28, 0.26, 0, 0.28, 0, L.head);
  mesh('hemi', black, 0.285, 0.3, 0.285, 0, 0.29, -0.03, L.head, -0.35);
  mesh('cyl', black, 0.1, 0.1, 0.1, 0, 0.59, 0.11, L.head, 0.35);
  mesh('box', sc, 0.03, 0.03, 0.4, 0, 0.45, 0.0, L.head);
  for (const sd of [-1, 1]) { mesh('sph', black, 0.025, 0.03, 0.02, sd * 0.09, 0.3, 0.245, L.head); mesh('box', black, 0.08, 0.02, 0.02, sd * 0.09, 0.36, 0.25, L.head); }
  mesh('box', mc(0xb0523c), 0.06, 0.014, 0.02, 0, 0.19, 0.255, L.head);
  if (o.item === 'staff') {
    const st = pivot(hands.R, 0, 0, 0); st.rotation.x = 0.1;
    mesh('cyl', mc(0x6a4a30), 0.03, 2.1, 0.03, 0, 0.1, 0, st);
    mesh('torus', mc(0xe0b84a, { metalness: 0.6 }), 0.13, 0.13, 0.13, 0, 1.15, 0, st, Math.PI / 2);
    for (const a of [0, 2.1, 4.2]) mesh('torus', mc(0xe0b84a, { metalness: 0.6 }), 0.05, 0.05, 0.05, Math.cos(a) * 0.1, 1.0, Math.sin(a) * 0.1, st);
    items.staff = st;
  } else if (o.item === 'axe') {
    const ax = pivot(hands.R, 0, 0, 0); ax.rotation.x = -0.9;
    mesh('cyl', mc(0x5a3e28), 0.04, 1.2, 0.04, 0, -0.45, 0, ax);
    mesh('box', mc(0xb8bec8, { metalness: 0.7, roughness: 0.35 }), 0.04, 0.34, 0.42, 0, -1.0, 0.18, ax);
    items.axe = ax;
  } else if (o.item === 'flute') {
    const fl = pivot(hands.R, 0, 0, 0); fl.rotation.x = -1.2;
    mesh('cyl', mc(0x3a2a20), 0.02, 0.5, 0.02, 0, -0.1, 0, fl);
    items.flute = fl;
  }
  if (o.sword) {
    const sw = pivot(body, 0.32, 0.05, 0.0); sw.rotation.set(1.25, 0, -0.1);
    mesh('cyl', mc(0x14100e), 0.03, 0.95, 0.03, 0, -0.45, 0, sw);
    mesh('cyl', mc(0xe0b84a, { metalness: 0.6 }), 0.05, 0.05, 0.05, 0, 0.0, 0, sw).scale.set(0.07, 0.05, 0.07);
    mesh('box', mc(0xe0b84a, { metalness: 0.6 }), 0.1, 0.12, 0.012, 0, -0.78, 0, sw);
    items.sword = sw;
  }
  return { root, limbs: L, hands, items, kind: 'man' };
}

// ---------- 酒呑童子 ----------
export function buildShuten() {
  const root = new THREE.Group(); const L = {}; const hands = {}; const items = {};
  const skinHex = 0xcf3d30, skin = mc(skinHex, { roughness: 0.6 });
  const robe = mc(0x4a2368, { roughness: 0.55, ...DS }), gold = mc(0xe0b84a, { metalness: 0.6, roughness: 0.4 });
  const black = mc(0x14100e, { roughness: 0.4 }), ivory = mc(0xf1e6c8);
  latheMesh([[1.35, 0.0], [1.2, 0.16], [0.95, 0.4], [0.68, 0.62], [0.46, 0.8]], robe, root, 0, 0, 0, 22);
  mesh('torus', gold, 1.32, 1.32, 1.32, 0, 0.04, 0, root, Math.PI / 2).scale.set(1.32, 1.32, 0.3);
  mesh('torus', mc(0xb83a24), 1.1, 1.1, 1.1, 0, 0.2, 0, root, Math.PI / 2).scale.set(1.08, 1.08, 0.3);
  const body = pivot(root, 0, 0.55, 0); L.body = body;
  mesh('cylT', skin, 0.46, 0.95, 0.32, 0, 0.47, 0, body);
  mesh('sph', skin, 0.46, 0.25, 0.3, 0, 0.62, 0.06, body);
  mesh('cylT', mc(0x7a1d24), 0.5, 0.22, 0.36, 0, 0.0, 0, body);
  mesh('cyl', gold, 0.51, 0.06, 0.37, 0, 0.06, 0, body);
  // 肩に羽織った紫の衣
  mesh('cylT', robe, 0.55, 0.38, 0.4, 0, 0.88, -0.02, body);
  mesh('box', robe, 1.25, 0.12, 0.62, 0, 1.03, -0.02, body);
  mesh('box', gold, 0.07, 0.8, 0.04, 0.2, 0.55, 0.3, body, 0, 0, -0.1); mesh('box', gold, 0.07, 0.8, 0.04, -0.2, 0.55, 0.3, body, 0, 0, 0.1);
  L.head = pivot(body, 0, 1.0, 0);
  const H = L.head;
  const k = 1.15;
  mesh('sph', skin, 0.42 * k, 0.4 * k, 0.4 * k, 0, 0.36, 0, H);
  mesh('box', mc(0xa02a24), 0.3, 0.04, 0.05, 0, 0.55, 0.38, H, 0.1);
  const eyeM = mc(0xffe28a, { emissive: 0xffc040, emissiveIntensity: 0.9 });
  for (const sd of [-1, 1]) {
    mesh('sph', eyeM, 0.09, 0.075, 0.06, sd * 0.17, 0.44, 0.37, H);
    mesh('box', black, 0.015, 0.09, 0.02, sd * 0.17, 0.44, 0.43, H);
    mesh('box', black, 0.24, 0.07, 0.08, sd * 0.17, 0.55, 0.38, H, 0, 0, -sd * 0.5);
    mesh('cone', skin, 0.08, 0.28, 0.08, sd * 0.46, 0.4, 0, H, 0, 0, -sd * Math.PI / 2);
    mesh('cone', ivory, 0.045, 0.2, 0.045, sd * 0.12, 0.2, 0.4, H, -0.1);
    mesh('cone', ivory, 0.04, 0.14, 0.04, sd * 0.26, 0.19, 0.34, H, 0, 0, sd * 0.2);
  }
  mesh('sph', skin, 0.09, 0.075, 0.08, 0, 0.35, 0.43, H);
  mesh('box', black, 0.38, 0.07, 0.07, 0, 0.17, 0.39, H);
  mesh('box', mc(0x4a0d0d), 0.3, 0.05, 0.05, 0, 0.17, 0.4, H).position.z = 0.4;
  // 髪
  mesh('hemi', black, 0.5, 0.5, 0.48, 0, 0.36, -0.05, H, -0.55);
  const tuft = (x, y, z, h, rz, rx) => mesh('cone', black, 0.12, h, 0.12, x, y, z, H, rx, 0, rz);
  for (let i = 0; i < 9; i++) tuft((i - 4) * 0.1, 0.78 + (i % 2) * 0.05, -0.1, 0.34, (i - 4) * -0.13, -0.25);
  // 角
  const horn = (x, y, h, r, rz, rx = 0, z = 0.05) => mesh('cone', ivory, r, h, r, x, y, z, H, rx, 0, rz);
  horn(-0.2, 0.86, 0.62, 0.1, 0.5); horn(0.2, 0.86, 0.62, 0.1, -0.5);
  horn(-0.44, 1.12, 0.3, 0.07, 1.0); horn(0.44, 1.12, 0.3, 0.07, -1.0);
  horn(0, 0.88, 0.3, 0.06, 0, 0.45, 0.3);
  const hair = pivot(body, 0, 1.0, -0.4); L.hair = hair;
  mesh('box', black, 0.78, 1.55, 0.2, 0, -0.55, 0, hair);
  for (let i = 0; i < 5; i++) mesh('cone', black, 0.14, 0.5, 0.14, (i - 2) * 0.17, -1.4, 0, hair, Math.PI, 0, 0);
  for (const [sd, key] of [[1, 'L'], [-1, 'R']]) {
    const sh = pivot(body, sd * 0.66, 0.84, 0); L['arm' + key] = sh;
    mesh('cyl', skin, 0.13, 0.5, 0.13, 0, -0.25, 0, sh);
    mesh('cylT', robe, 0.2, 0.34, 0.2, 0, -0.1, 0, sh);
    const el = pivot(sh, 0, -0.5, 0); L['elbow' + key] = el;
    mesh('cyl', skin, 0.11, 0.44, 0.11, 0, -0.22, 0, el);
    mesh('box', robe, 0.1, 0.6, 0.48, 0, -0.35, 0, el);
    mesh('box', gold, 0.104, 0.07, 0.49, 0, -0.65, 0, el);
    mesh('sph', skin, 0.125, 0.125, 0.125, 0, -0.48, 0, el);
    hands[key] = pivot(el, 0, -0.48, 0);
  }
  const cup = pivot(hands.R, 0, -0.12, 0.08);
  mesh('cyl', mc(0xb83a24, { roughness: 0.4 }), 0.36, 0.1, 0.36, 0, 0, 0, cup);
  mesh('cyl', mc(0x1a0e0e), 0.32, 0.03, 0.32, 0, 0.055, 0, cup);
  mesh('torus', gold, 0.37, 0.37, 0.37, 0, 0.05, 0, cup, Math.PI / 2).scale.set(0.37, 0.37, 0.3);
  items.cup = cup;
  return { root, limbs: L, hands, items, kind: 'shuten' };
}

// ---------- ポーズとエージェント ----------
const E = (t, a, b, c, d) => smooth((t - a) / (b - a)) * (1 - smooth((t - c) / (d - c)));

const POSE = {
  idle(a, t) { a.bodyYT = Math.sin(t * 1.8 + a.seed) * 0.008; a.look(t); },
  bow(a, t, d) {
    const k = smooth(Math.min(1, t / 0.8, (d - t) / 0.8));
    a.set('body', 0.95 * k); a.set('head', 0.2 * k);
    a.set('armL', -0.1 * k, 0, 0.1); a.set('armR', -0.1 * k, 0, -0.1);
  },
  sit(a, t) { // あぐら
    a.dropT = -0.46;
    a.set('legL', -1.3, 0, 0.55); a.set('legR', -1.3, 0, -0.55); a.set('kneeL', 2.2); a.set('kneeR', 2.2);
    a.set('body', 0.05); a.bodyYT = Math.sin(t * 1.6 + a.seed) * 0.01; a.look(t);
  },
  seiza(a, t) { // 正座（人）
    a.dropT = a.kind === 'woman' ? -0.42 : -0.46;
    if (a.kind === 'woman') { a.robeS = [1.2, 0.69]; } else {
      a.set('legL', -1.55, 0, 0.05); a.set('legR', -1.55, 0, -0.05); a.set('kneeL', 2.9); a.set('kneeR', 2.9);
    }
    a.bodyYT = Math.sin(t * 1.6 + a.seed) * 0.008;
  },
  drink(a, t) {
    POSE.sit(a, t);
    const u = (t % 7.5) / 7.5;
    const k = E(u, 0.3, 0.45, 0.68, 0.8);
    a.set('armR', -0.5 - 0.75 * k, 0, -0.2); a.set('elbowR', -0.8 - 1.45 * k);
    a.set('armL', -0.55, 0, 0.1); a.set('elbowL', -0.3);
    a.set('head', -0.38 * k, a.cur.head ? 0 : 0, 0); a.set('body', 0.05 - 0.1 * k);
    if (E(u, 0.78, 0.85, 0.95, 1.0) > 0) { a.bodyYT += Math.sin(t * 24) * 0.015; a.set('head', -0.15, 0, 0); }
  },
  dance(a, t) {
    const w = a.danceW ?? 2.6, s = Math.sin(t * w * 2), c = Math.cos(t * w * 2);
    a.dropT = Math.abs(Math.sin(t * w)) * 0.28;
    a.set('legL', -0.7 * Math.max(0, s), 0, 0.15); a.set('legR', -0.7 * Math.max(0, -s), 0, -0.15);
    a.set('kneeL', 1.0 * Math.max(0, s)); a.set('kneeR', 1.0 * Math.max(0, -s));
    a.set('armL', -2.5 + 0.55 * s, 0, 0.5); a.set('armR', -2.5 - 0.55 * s, 0, -0.5);
    a.set('elbowL', -0.5 - 0.3 * c); a.set('elbowR', -0.5 + 0.3 * c);
    a.set('body', 0.05, 0.5 * Math.sin(t * w), 0.12 * s); a.set('head', 0, 0.3 * Math.sin(t * w * 2), 0.2 * c);
  },
  drum(a, t) {
    const f = 3.4, s = Math.sin(t * f * Math.PI), n = Math.floor(t * f);
    if (n !== a._bn) { a._bn = n; a.ctx?.beat?.(n % 2); }
    const r = Math.max(0, s), l = Math.max(0, -s);
    a.set('armR', -1.1 - 0.9 * r, 0, -0.35); a.set('elbowR', -0.9 - 0.6 * r);
    a.set('armL', -1.1 - 0.9 * l, 0, 0.35); a.set('elbowL', -0.9 - 0.6 * l);
    a.set('body', 0.15, 0.1 * s, 0); a.set('legL', 0, 0, 0.22); a.set('legR', 0, 0, -0.22);
    a.set('kneeL', 0.2); a.set('kneeR', 0.2); a.set('head', 0.05, 0.2 * Math.sin(t * 0.8), 0.1 * s);
    a.dropT = -0.04 + Math.abs(s) * 0.03;
  },
  pour(a, t) {
    POSE.seiza(a, t);
    const k = a.ctx ? a.ctx.pourK : 0;
    a.set('armR', -1.1, 0, -0.1); a.set('elbowR', -0.65);
    a.set('armL', -0.45, 0, -0.25); a.set('elbowL', -1.4);
    a.set('head', 0.12 + 0.05 * k, -0.3, 0); a.set('body', 0.1 + 0.08 * k, -0.3);
    if (a.rig.items.bottle) a.rig.items.bottle.userData.tilt = 0.95 * k;
  },
  wash(a, t) {
    POSE.seiza(a, t);
    const s = Math.sin(t * 9);
    a.set('body', 0.55); a.set('head', 0.25);
    a.set('armR', -1.05 + 0.28 * s, 0, -0.15); a.set('elbowR', -0.5); a.set('armL', -1.05 - 0.28 * s, 0, 0.15); a.set('elbowL', -0.5);
  },
  koto(a, t) {
    POSE.seiza(a, t);
    a.set('armR', -0.95, 0, -0.1); a.set('elbowR', -0.9 + 0.2 * Math.sin(t * 7.3)); a.set('armL', -0.9, 0, 0.18); a.set('elbowL', -1.1 + 0.25 * Math.sin(t * 5.1));
    a.set('head', 0.15, 0.25 * Math.sin(t * 0.7), 0.06 * Math.sin(t * 0.9)); a.set('body', 0.08 + 0.03 * Math.sin(t * 1.2), 0, 0.04 * Math.sin(t * 1.2));
  },
  stomp(a, t) {
    const u = clamp(t / 0.55, 0, 1), s = Math.sin(Math.PI * u);
    a.set('legL', -0.95 * s); a.set('kneeL', 1.3 * s); a.dropT = u > 0.9 ? -0.03 : 0.0; a.look(t); a.set('body', -0.05 * s);
  },
  laugh(a, t) {
    a.set('body', -0.28); a.set('head', -0.4); a.bodyYT = Math.sin(t * 26) * 0.025;
    a.set('armL', -0.6, 0, 0.3); a.set('armR', -0.6, 0, -0.3); a.set('elbowL', -1.0); a.set('elbowR', -1.0);
  },
  talk(a, t) {
    a.set('armR', -0.8 + 0.3 * Math.sin(t * 3), 0, -0.25); a.set('elbowR', -1.0 + 0.4 * Math.sin(t * 3.7 + 1));
    a.set('head', 0.05 * Math.sin(t * 3), 0.25 * Math.sin(t * 0.8 + a.seed), 0); a.set('body', 0.03 * Math.sin(t * 2));
  },
  fanwave(a, t) {
    a.set('armR', -1.0 + 0.15 * Math.sin(t * 4), 0, -0.25); a.set('elbowR', -1.2 + 0.25 * Math.sin(t * 4));
    a.set('head', 0.05, 0.3 * Math.sin(t * 0.6 + a.seed), 0); a.bodyYT = Math.sin(t * 1.8) * 0.006;
  },
  shuten(a, t) {
    const T = a.T % 14;
    const offer = E(T, 0.0, 1.2, 3.3, 4.5) , drink = E(T, 3.6, 4.6, 5.8, 7.0);
    const laugh = E(T, 7.2, 7.8, 9.0, 9.6);
    const rest = 1 - Math.max(offer, drink);
    const aR = [-0.55 * rest - 1.05 * offer * (1 - drink) - 1.4 * drink, 0.2 * rest, -0.3 * rest - 0.15 * (1 - rest)];
    a.set('armR', aR[0], aR[1], aR[2]);
    a.set('elbowR', -1.0 * rest - 0.35 * offer * (1 - drink) - 2.35 * drink);
    a.set('armL', -0.5, 0, 0.12); a.set('elbowL', -0.6);
    a.set('head', -0.38 * drink - 0.22 * laugh + 0.04 * Math.sin(t * 0.8), 0.35 * Math.sin(t * 0.45) * (1 - drink), 0.05 * Math.sin(t * 0.6));
    a.set('body', -0.08 * drink - 0.12 * laugh, 0.15 * Math.sin(t * 0.45), 0);
    a.bodyYT = Math.sin(t * 1.4) * 0.012 + laugh * Math.sin(t * 27) * 0.022;
    a.set('hair', 0.05 * Math.sin(t * 1.1) + laugh * 0.08 * Math.sin(t * 24));
    a.ctx && (a.ctx.shutenOffer = offer);
  },
};

export class Agent {
  constructor(rig, o = {}) {
    this.rig = rig; this.root = rig.root; this.kind = rig.kind;
    this.sc = o.scale ?? 1; this.root.scale.setScalar(this.sc);
    this.pos = new THREE.Vector3(o.x ?? 0, 0, o.z ?? 0); this.yaw = o.yaw ?? 0;
    this.speed = o.speed ?? 1.5; this.script = o.script ?? []; this.loop = o.loop !== false;
    this.armMode = o.armMode ?? 'free'; this.active = o.active !== false; this.delay = o.delay ?? 0;
    this.y0 = o.y ?? null; // 固定の高さ（壇など）
    this.si = 0; this.t = 0; this.T = 0; this.phase = Math.random() * 6; this.seed = Math.random() * 100;
    this.groundY = this.y0 ?? groundHeight(this.pos.x, this.pos.z);
    this.drop = 0; this.dropT = 0; this.bodyY = 0; this.bodyYT = 0; this.robeS = [1, 1]; this.robeCur = [1, 1];
    this.cur = {}; this.tg = {}; this.act = 'idle'; this.actDur = 0; this.moving = false; this.vel = 0;
    this.appear = this.active ? 1 : 0; this.appearT = this.active ? 1 : 0; this.name = o.name ?? ''; this.onDone = o.onDone;
    this.root.visible = this.active && this.appear > 0.01;
    this.root.traverse((m) => { m.userData.agent = this; });
    this.updateTransform(0);
    this.cur = {};
  }
  set(k, x = 0, y = 0, z = 0) { this.tg[k] = [x, y, z]; }
  look(t) { this.set('head', Math.sin(t * 0.6 + this.seed) * 0.1, Math.sin(t * 0.55 + this.seed) * 0.5, 0); }
  start(delay = 0) { this.si = 0; this.t = 0; this.active = true; this.delay = delay; this.appear = 0; this.appearT = 1; this.root.visible = false; }
  next() { this.si++; this.t = 0; }
  say(s) { this.ctx?.say?.(s, this); }

  update(dt, T, ctx) {
    this.ctx = ctx; this.T = T;
    if (this.delay > 0) { this.delay -= dt; if (this.delay > 0) return; }
    if (!this.active) { this.root.visible = false; return; }
    this.appear += (this.appearT - this.appear) * (1 - Math.exp(-dt * 3.2));
    if (this.appearT === 0 && this.appear < 0.02) { this.active = false; this.root.visible = false; this.onDone?.(this); return; }
    this.root.visible = this.appear > 0.015;
    this.moving = false; this.act = 'idle'; this.actDur = 0; this.vel = 0;
    let guard = 4;
    while (guard-- > 0) {
      const st = this.script[this.si];
      if (!st) { if (this.loop && this.script.length) { this.si = 0; this.t = 0; continue; } break; }
      this.t += 0; // (ステップ内時間は各case内で加算)
      if (this.runStep(st, dt)) continue;
      break;
    }
    this.computePose(dt);
    this.applyPose(dt);
    this.updateTransform(dt);
  }

  // true を返すと次のステップをすぐ処理する
  runStep(st, dt) {
    switch (st.t) {
      case 'go': {
        const dx = st.x - this.pos.x, dz = st.z - this.pos.z, dist = Math.hypot(dx, dz);
        if (dist < 0.1) { this.next(); return true; }
        const sp = st.speed ?? this.speed;
        const ty = Math.atan2(dx, dz);
        this.yaw = lerpAngle(this.yaw, ty, 1 - Math.exp(-dt * 8));
        let d = Math.abs(((ty - this.yaw + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI);
        if (d < 1.0) {
          const mv = Math.min(dist, sp * dt);
          this.pos.x += (dx / dist) * mv; this.pos.z += (dz / dist) * mv;
          this.phase += (mv * 3.9) / this.sc; this.vel = sp;
        }
        this.moving = true; return false;
      }
      case 'orbit': {
        this.t += dt;
        if (this.t >= st.dur) { this.next(); return true; }
        const w = (st.speed ?? this.speed) / st.r, ph = (st.ph ?? 0) + st.dir * w * this.t;
        const tx = st.cx + st.r * Math.sin(ph), tz = st.cz + st.r * Math.cos(ph);
        if (this.t === dt) { this.pos.set(tx, 0, tz); }
        const px = this.pos.x, pz = this.pos.z;
        this.pos.x += (tx - px) * Math.min(1, dt * 8); this.pos.z += (tz - pz) * Math.min(1, dt * 8);
        const vx = st.dir * Math.cos(ph), vz = -st.dir * Math.sin(ph);
        this.yaw = lerpAngle(this.yaw, Math.atan2(vx, vz), 1 - Math.exp(-dt * 8));
        this.act = st.act ?? 'dance'; this.actDur = st.dur; return false;
      }
      case 'wait': {
        this.t += dt;
        if (this.t >= st.dur) { this.next(); return true; }
        if (st.face !== undefined) this.yaw = lerpAngle(this.yaw, st.face, 1 - Math.exp(-dt * 6));
        if (st.at) { this.pos.x += (st.at[0] - this.pos.x) * Math.min(1, dt * 6); this.pos.z += (st.at[1] - this.pos.z) * Math.min(1, dt * 6); }
        this.act = st.act ?? 'idle'; this.actDur = st.dur; return false;
      }
      case 'jump': this.pos.set(st.x, 0, st.z); if (st.yaw !== undefined) this.yaw = st.yaw; this.next(); return true;
      case 'show': this.appearT = 1; this.appear = Math.max(this.appear, 0.0); this.ctx?.puff?.(this.pos.x, groundHeight(this.pos.x, this.pos.z), this.pos.z); this.next(); return true;
      case 'hide': this.appearT = 0; this.ctx?.puff?.(this.pos.x, groundHeight(this.pos.x, this.pos.z), this.pos.z); this.next(); return false;
      case 'say': this.ctx?.say?.(st.msg, this, st.key); this.next(); return true;
      case 'end': this.script = []; this.loop = false; this.appearT = 0; return false;
      default: this.next(); return true;
    }
  }

  computePose(dt) {
    this.tg = {}; this.dropT = 0; this.bodyYT = 0; this.robeS = [1, 1];
    const sw = this.moving ? clamp(this.vel / 1.4, 0.5, 1.4) : 0;
    this.baseArms(sw);
    if (this.moving) this.walk(sw);
    else (POSE[this.act] || POSE.idle)(this, this.t, this.actDur);
    if (this.act === 'idle' && !this.moving) this.look(this.T);
  }
  baseArms(sw) {
    const s = Math.sin(this.phase), W = sw;
    const A = 0.5 * W;
    const arms = this.armMode;
    const free = () => { this.set('armL', s * A, 0, 0.08); this.set('armR', -s * A, 0, -0.08); this.set('elbowL', -0.25 - 0.1 * W); this.set('elbowR', -0.25 - 0.1 * W); };
    if (arms === 'free') free();
    else if (arms === 'club') { free(); this.set('armR', -0.4, 0, -0.1); this.set('elbowR', -1.9); }
    else if (arms === 'staff') { free(); this.set('armR', -0.25 - 0.06 * s * W, 0, -0.12); this.set('elbowR', -0.4); }
    else if (arms === 'axe') { free(); this.set('armR', -0.5, 0, -0.1); this.set('elbowR', -1.7); }
    else if (arms === 'tray') { this.set('armL', -0.85, 0, -0.12); this.set('armR', -0.85, 0, 0.12); this.set('elbowL', -0.9); this.set('elbowR', -0.9); }
    else if (arms === 'carry') { this.set('armL', -2.75, 0, 0.2); this.set('armR', -2.75, 0, -0.2); this.set('elbowL', -0.4); this.set('elbowR', -0.4); }
    else if (arms === 'hands') { this.set('armL', -0.45, 0, -0.18); this.set('armR', -0.45, 0, 0.18); this.set('elbowL', -1.25); this.set('elbowR', -1.25); }
    else if (arms === 'fan') { this.set('armL', -0.45, 0, -0.18); this.set('elbowL', -1.25); this.set('armR', -1.0, 0, -0.25); this.set('elbowR', -1.2); }
    else if (arms === 'pole') { free(); this.set('armR', -0.6, 0, -0.1); this.set('elbowR', -0.8); }
  }
  walk(sw) {
    const s = Math.sin(this.phase), c = Math.cos(this.phase);
    const woman = this.kind === 'woman';
    const A = (woman ? 0.45 : 0.7) * (0.75 + 0.35 * clamp(this.vel / 3, 0, 1));
    this.set('legL', -s * A); this.set('legR', s * A);
    this.set('kneeL', Math.max(0, c) * (woman ? 0.3 : 0.95) * sw); this.set('kneeR', Math.max(0, -c) * (woman ? 0.3 : 0.95) * sw);
    this.bodyYT = Math.abs(s) * (woman ? 0.02 : 0.045);
    this.set('body', 0.05 + (this.vel > 2.6 ? 0.15 : 0), -s * 0.1, s * 0.03);
    this.set('head', 0, Math.sin(this.T * 0.7 + this.seed) * 0.2, 0);
    if (this.armMode === 'carry' || this.armMode === 'tray') this.bodyYT *= 0.4;
  }

  applyPose(dt) {
    const k = 1 - Math.exp(-dt * 13);
    for (const name in this.rig.limbs) {
      const g = this.rig.limbs[name];
      if (name === 'robe') continue;
      const t = this.tg[name] || [0, 0, 0];
      const c = (this.cur[name] ??= [0, 0, 0]);
      c[0] += (t[0] - c[0]) * k; c[1] += (t[1] - c[1]) * k; c[2] += (t[2] - c[2]) * k;
      g.rotation.set(c[0], c[1], c[2]);
    }
    // 手持ち品
    const bt = this.rig.items.bottle;
    if (bt) { bt.userData.cur = (bt.userData.cur ?? 0) + ((bt.userData.tilt ?? 0) - (bt.userData.cur ?? 0)) * k; bt.rotation.set(0, 0, -bt.userData.cur); }
    this.bodyY += (this.bodyYT - this.bodyY) * k;
    this.drop += (this.dropT - this.drop) * (1 - Math.exp(-dt * 9));
    this.rig.limbs.body.position.y = (this.rig.kind === 'shuten' ? 0.55 : this.rig.kind === 'woman' ? 0.7 : 0.66) + this.bodyY;
    if (this.rig.robe) {
      this.robeCur[0] += (this.robeS[0] - this.robeCur[0]) * k; this.robeCur[1] += (this.robeS[1] - this.robeCur[1]) * k;
      this.rig.robe.scale.set(this.robeCur[0], this.robeCur[1], this.robeCur[0]);
    }
  }

  updateTransform(dt) {
    const gy = this.y0 ?? groundHeight(this.pos.x, this.pos.z);
    this.groundY += (gy - this.groundY) * (dt > 0 ? 1 - Math.exp(-dt * 14) : 1);
    this.root.position.set(this.pos.x, this.groundY + this.drop * this.sc, this.pos.z);
    this.root.rotation.y = this.yaw;
    this.root.scale.setScalar(this.sc * Math.max(0.001, this.appear));
  }
}
