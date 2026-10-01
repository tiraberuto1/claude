// 庭: 白砂のコート・池と橋の周り・松と紅葉・岩・篝火台・太鼓・酒樽
import * as THREE from 'three';
import { M, Batch, tf, mulberry32, fbm } from './util.js';
import { POND, POND_ISLE, WALL, pondRadiusPoint, pondNorthZ } from './layout.js';
import { addLamp } from './lights.js';

const UP = new THREE.Vector3(0, 1, 0);
function seg(b, mat, rt, rb, p0, p1, sides = 7) {
  const d = new THREE.Vector3().subVectors(p1, p0), len = d.length();
  const q = new THREE.Quaternion().setFromUnitVectors(UP, d.normalize());
  const m = new THREE.Matrix4().compose(p0.clone().add(p1).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1));
  b.add(new THREE.CylinderGeometry(rt, rb, len, sides), mat, m);
}

function pine(b, x, z, s = 1, seed = 1) {
  const r = mulberry32(seed * 131 + 7);
  let p = new THREE.Vector3(x, 0, z);
  const lean = r() * Math.PI * 2;
  const pts = [p.clone()];
  for (let i = 0; i < 5; i++) {
    const ang = lean + Math.sin(i * 1.3 + seed) * 1.0;
    p = p.clone().add(new THREE.Vector3(Math.cos(ang) * 0.22 * s, 0.95 * s, Math.sin(ang) * 0.22 * s));
    pts.push(p.clone());
    seg(b, M.pineTrunk, 0.2 * s * (1 - i * 0.14), 0.26 * s * (1 - i * 0.12), pts[i], pts[i + 1]);
  }
  for (let i = 2; i < 6; i++) {
    const c = pts[i];
    const a = r() * Math.PI * 2, o = (i === 5 ? 0 : 0.9 + r() * 0.5) * s;
    const bx = c.x + Math.cos(a) * o, bz = c.z + Math.sin(a) * o;
    if (o > 0) seg(b, M.pineTrunk, 0.06 * s, 0.1 * s, c, new THREE.Vector3(bx, c.y + 0.15 * s, bz), 5);
    const sc = (1.35 - (i - 2) * 0.15) * s;
    b.sph(i % 2 ? M.pineLeaf : M.pineLeaf2, 1, bx, c.y + 0.3 * s, bz, sc * 1.25, sc * 0.5, sc * 1.1, 1);
    if (i > 2) b.sph(M.pineLeaf, 1, bx + 0.4 * s, c.y + 0.55 * s, bz - 0.2 * s, sc * 0.8, sc * 0.35, sc * 0.75, 1);
  }
}

function maple(b, x, z, s = 1, seed = 1) {
  const r = mulberry32(seed * 71 + 3);
  const p0 = new THREE.Vector3(x, 0, z), p1 = new THREE.Vector3(x + 0.1 * s, 1.5 * s, z), p2 = new THREE.Vector3(x - 0.2 * s, 2.5 * s, z + 0.1 * s);
  seg(b, M.pineTrunk, 0.17 * s, 0.26 * s, p0, p1); seg(b, M.pineTrunk, 0.1 * s, 0.17 * s, p1, p2);
  const cols = [M.maple1, M.maple2, M.maple3, M.maple2];
  for (let i = 0; i < 7; i++) {
    const a = r() * Math.PI * 2, d = r() * 1.2 * s;
    b.sph(cols[i % 4], 1, x + Math.cos(a) * d, 2.6 * s + r() * 1.3 * s, z + Math.sin(a) * d, (0.9 + r() * 0.6) * s, (0.75 + r() * 0.4) * s, (0.9 + r() * 0.6) * s, 1);
  }
}

function rock(b, x, y, z, s, seed, mat = M.rock) {
  const r = mulberry32(seed * 17 + 5);
  const geo = new THREE.IcosahedronGeometry(1, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const k = 1 + (fbm(pos.getX(i) * 1.6 + seed, pos.getZ(i) * 1.6 + pos.getY(i), 2) - 0.5) * 0.7;
    pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * k, pos.getZ(i) * k);
  }
  geo.computeVertexNormals();
  b.add(geo, mat, tf(x, y, z, 0, r() * 6, 0, s * (0.9 + r() * 0.5), s * (0.55 + r() * 0.35), s * (0.9 + r() * 0.5)));
  if (s > 0.9 && y > -0.2) b.add(new THREE.IcosahedronGeometry(1, 0), M.moss, tf(x, y + s * 0.38, z, 0, r() * 6, 0, s * 0.6, s * 0.22, s * 0.55));
}

export function makeGarden() {
  const b = new Batch();
  const group = new THREE.Group();
  const r = mulberry32(2024);

  // ---- 白砂のコート ----
  b.box(M.gravel, 23.8, 0.07, 5.2, 0, 0.035, -0.2);
  for (let i = 0; i < 22; i++) { // 砂の箒目
    const z = -2.55 + i * 0.235;
    const gap = Math.abs(z) < 1.75;
    if (gap) { b.box(M.gravelLine, 9.6, 0.006, 0.028, -7.0, 0.072, z); b.box(M.gravelLine, 9.6, 0.006, 0.028, 7.0, 0.072, z); }
    else b.box(M.gravelLine, 23, 0.006, 0.028, 0, 0.072, z);
  }
  for (let i = 1; i <= 3; i++) { // 篝火のまわりの輪
    b.add(new THREE.TorusGeometry(1.5 + i * 0.28, 0.014, 4, 40), M.gravelLine, tf(0, 0.075, 0, Math.PI / 2));
  }
  // 敷石
  const stones = [[0, 12.7], [0, 12.0], [0, 2.1], [-0.9, 1.3], [-2.0, 0.5], [-2.0, -0.5], [-1.2, -1.4], [0, -1.7]];
  for (const [x, z] of stones) b.cyl(M.stoneDark, 0.5, 0.55, 0.09, 7, x, 0.1, z);
  // 敷物（宴の円座）
  for (const [x, z, w, d, c] of [[-6.2, 0.9, 2.2, 1.4, 0x5b2335], [-5.0, -1.2, 1.8, 1.2, 0x2f3d63], [5.0, 1.6, 2.0, 1.3, 0x5b2335]]) {
    b.box(new THREE.MeshStandardMaterial({ color: c, roughness: 1 }), w, 0.05, d, x, 0.095, z, r() * 0.5);
  }
  // 酒樽
  for (const [x, z, n] of [[-10.4, -0.6, 3], [9.8, -1.4, 2], [-9.6, 1.4, 1]]) {
    for (let i = 0; i < n; i++) {
      const bx = x + (i % 2) * 0.95 - (n > 2 ? 0.4 : 0), by = i < 2 ? 0.45 : 1.35, bz = z + (i === 2 ? 0.45 : 0);
      b.cyl(M.barrel, 0.44, 0.44, 0.9, 14, bx, by, bz);
      b.cyl(M.barrelBand, 0.465, 0.465, 0.07, 14, bx, by - 0.25, bz); b.cyl(M.barrelBand, 0.465, 0.465, 0.07, 14, bx, by + 0.25, bz);
      b.box(M.shu, 0.3, 0.28, 0.04, bx, by, bz + 0.45);
    }
  }

  // ---- 篝火台 ----
  const bf = { x: 0, z: 0 };
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    seg(b, M.iron, 0.05, 0.07, new THREE.Vector3(bf.x + Math.cos(a) * 0.75, 0.05, bf.z + Math.sin(a) * 0.75), new THREE.Vector3(bf.x + Math.cos(a) * 0.35, 0.95, bf.z + Math.sin(a) * 0.35), 6);
  }
  b.cyl(M.iron, 0.78, 0.45, 0.4, 14, 0, 1.02, 0);
  b.cyl(M.coal, 0.7, 0.7, 0.04, 14, 0, 1.23, 0);
  for (let i = 0; i < 5; i++) b.box(M.woodDark, 0.16, 0.16, 1.3, Math.cos(i * 1.26) * 0.12, 1.34, Math.sin(i * 1.26) * 0.12, i * 1.26);
  addLamp(0, 1.9, 0, { size: 1.5, power: 0.8, color: [1.0, 0.5, 0.2], flicker: 0.28 });

  // ---- 門の篝火 ----
  for (const sx of [-1, 1]) {
    const px = sx * 3.7, pz = 14.3;
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.5;
      seg(b, M.iron, 0.04, 0.06, new THREE.Vector3(px + Math.cos(a) * 0.5, 0.05, pz + Math.sin(a) * 0.5), new THREE.Vector3(px + Math.cos(a) * 0.22, 0.85, pz + Math.sin(a) * 0.22), 6);
    }
    b.cyl(M.iron, 0.5, 0.3, 0.32, 12, px, 0.92, pz);
    b.cyl(M.coal, 0.46, 0.46, 0.04, 12, px, 1.1, pz);
    addLamp(px, 1.7, pz, { size: 1.7, power: 1.05, color: [1.0, 0.52, 0.2], flicker: 0.28 });
  }

  // ---- 池まわり ----
  for (let i = 0; i < 72; i++) {
    const th = (i / 72) * Math.PI * 2;
    const [x, z] = pondRadiusPoint(th, 1.03);
    if (Math.abs(x) < 1.5 && (z > 10.4 || z < 3.4)) continue;
    rock(b, x, 0.06, z, 0.3 + r() * 0.42, i + 3, r() < 0.3 ? M.rockDark : M.rock);
  }
  // 池の中の島
  b.cyl(M.moss, POND_ISLE.r - 0.1, POND_ISLE.r + 0.1, 0.5, 18, POND_ISLE.x, POND_ISLE.h - 0.25, POND_ISLE.z);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    rock(b, POND_ISLE.x + Math.cos(a) * (POND_ISLE.r + 0.05), 0.02, POND_ISLE.z + Math.sin(a) * (POND_ISLE.r + 0.05), 0.4 + r() * 0.3, 50 + i);
  }
  pine(b, -1.35, 7.7, 1.1, 4);
  // 蓮の葉
  const lily = new THREE.MeshStandardMaterial({ color: 0x5b8a45, roughness: 0.8, side: THREE.DoubleSide });
  const flower = new THREE.MeshStandardMaterial({ color: 0xeaa3b8, roughness: 0.7, emissive: 0x3a1020 });
  for (let i = 0; i < 16; i++) {
    const th = r() * Math.PI * 2, d = 0.3 + r() * 0.6;
    let [x, z] = pondRadiusPoint(th, d);
    if (Math.hypot(x - POND_ISLE.x, z - POND_ISLE.z) < POND_ISLE.r + 0.5) continue;
    if (Math.abs(x) < 1.4) continue;
    const s = 0.35 + r() * 0.3;
    b.add(new THREE.CircleGeometry(1, 12, 0.35, Math.PI * 2 - 0.5), lily, tf(x, 0.158, z, -Math.PI / 2, r() * 6, 0, s, s, s));
    if (r() < 0.3) b.sph(flower, 0.14, x + 0.12, 0.24, z, 1, 1.2, 1, 0);
  }

  // ---- 木々・岩 ----
  const pines = [[-14.6, -11.3, 1.5], [14.9, -11.6, 1.4], [-14.6, 10.3, 1.0], [14.8, 11.2, 0.8], [-16, 4.2, 1.0], [-9.5, -12.0, 1.2], [9.6, -12.0, 1.2],
    [-18.6, -6, 1.6], [18.7, -5.5, 1.5], [-18.4, 9, 1.2], [-6, -14.7, 1.8], [7.5, -14.8, 1.7], [0, -15.2, 1.5], [-12.5, -14.2, 1.4], [13, -14, 1.5]];
  pines.forEach(([x, z, s], i) => pine(b, x, z, s, i + 10));
  const maples = [[-15.6, 1.6, 1.1], [15.9, 1.0, 1.0], [-11, 11.8, 0.85], [-17.9, -10.4, 1.3], [17.6, -9.2, 1.3], [-8, -12.3, 1.0]];
  maples.forEach(([x, z, s], i) => maple(b, x, z, s, i + 3));
  const rocks = [[-16, -14.3, 2.4], [-9, -15.2, 2.0], [2, -15.6, 2.8], [10, -15.2, 2.3], [16, -14, 2.5], [-18.8, -1, 1.7], [18.6, 3.5, 1.8], [-5.6, 14.9, 1.1], [6.0, 15.1, 1.0], [-17.8, 12.3, 1.5], [17.5, 12.5, 1.4],
    [-12.5, 3.2, 0.8], [12.8, 3.0, 0.8], [-16.2, 7.2, 0.9], [16.4, 6.5, 0.9]];
  rocks.forEach(([x, z, s], i) => rock(b, x, 0, z, s, 100 + i, i % 3 ? M.rock : M.rockDark));
  // 岩の上に鬼火台座（小さな石積み）
  for (const [x, z] of [[-12.5, -0.2], [12.8, -0.4]]) { rock(b, x, 0.1, z, 0.6, 200 + x); rock(b, x + 0.5, 0.05, z + 0.3, 0.4, 210 + x); }

  group.add(b.build());

  // ---- 太鼓（動く部分あり） ----
  const drum = new THREE.Group();
  drum.position.set(7.5, 0, 0.5);
  const dm = (m, geo, x, y, z, rz = 0) => { const mesh = new THREE.Mesh(geo, m); mesh.position.set(x, y, z); mesh.rotation.z = rz; mesh.castShadow = true; mesh.receiveShadow = true; drum.add(mesh); return mesh; };
  dm(M.shuDark, new THREE.CylinderGeometry(0.8, 0.8, 1.15, 20), 0, 1.15, 0, Math.PI / 2);
  const headL = dm(M.white, new THREE.CylinderGeometry(0.74, 0.74, 0.04, 20), -0.59, 1.15, 0, Math.PI / 2);
  const headR = dm(M.white, new THREE.CylinderGeometry(0.74, 0.74, 0.04, 20), 0.59, 1.15, 0, Math.PI / 2);
  for (const sx of [-1, 1]) { dm(M.gold, new THREE.TorusGeometry(0.76, 0.035, 6, 24), sx * 0.58, 1.15, 0, 0).rotation.y = Math.PI / 2; }
  dm(M.lacquer, new THREE.BoxGeometry(0.2, 0.9, 1.6), 0, 0.45, 0);
  dm(M.lacquer, new THREE.BoxGeometry(1.5, 0.12, 0.3), 0, 0.06, 0.6); dm(M.lacquer, new THREE.BoxGeometry(1.5, 0.12, 0.3), 0, 0.06, -0.6);
  drum.userData.heads = [headL, headR];
  group.add(drum);

  const fires = [
    { x: 0, y: 1.25, z: 0, s: 1.25, embers: 70 },
    { x: -3.7, y: 1.1, z: 14.3, s: 0.8, embers: 26 },
    { x: 3.7, y: 1.1, z: 14.3, s: 0.8, embers: 26 },
  ];
  const mapleSpots = maples.map(([x, z]) => [x, z]);
  return { group, drum, fires, mapleSpots, waterY: 0.14 };
}
