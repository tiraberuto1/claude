// 建物: 寝殿・対屋・渡殿・釣殿・鉄の門・築地塀・橋・灯籠など（すべてプリミティブの組み合わせ）
import * as THREE from 'three';
import { M, Batch, tf, mulberry32 } from './util.js';
import { FLOOR, HALL, DAIS, WALL, BRIDGE, POND_ISLE, bridgeArch } from './layout.js';
import { addLamp } from './lights.js';

// ---------- 屋根ジオメトリ（寄棟・反り・瓦の筋・厚み付き） ----------
export function hipRoofGeometry({ a, b, r, H, up = 0.7, nx = 64, nz = 40, thick = 0.24, c1 = 0x3d4759, c2 = 0x323b4b }) {
  const col1 = new THREE.Color(c1), col2 = new THREE.Color(c2), dark = new THREE.Color(0x2b231f);
  const pos = [], col = [], idx = [];
  const W = nx + 1;
  for (let j = 0; j <= nz; j++) {
    for (let i = 0; i <= nx; i++) {
      const x = -a + (2 * a * i) / nx, z = -b + (2 * b * j) / nz;
      const fz = (b - Math.abs(z)) / b;
      const fx = (a - Math.abs(x)) / (a - r);
      const f = Math.max(0, Math.min(1, fz, fx));
      const lift = up * Math.pow(Math.abs(x) / a, 3) * Math.pow(Math.abs(z) / b, 3) * Math.pow(1 - f, 2);
      pos.push(x, H * Math.pow(f, 1.3) + lift, z);
      const endSlope = fx < fz;
      const par = (endSlope ? j : i) % 2;
      const c = par ? col1 : col2;
      const k = 0.92 + 0.12 * f;
      col.push(c.r * k, c.g * k, c.b * k);
    }
  }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const p = j * W + i;
    idx.push(p, p + W, p + 1, p + 1, p + W, p + W + 1);
  }
  const top = new THREE.BufferGeometry();
  top.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  top.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  top.setIndex(idx); top.computeVertexNormals();

  // 裏面
  const bpos = [], bcol = [];
  for (let n = 0; n < pos.length; n += 3) { bpos.push(pos[n], pos[n + 1] - thick, pos[n + 2]); bcol.push(dark.r, dark.g, dark.b); }
  const bidx = [];
  for (let n = 0; n < idx.length; n += 3) bidx.push(idx[n], idx[n + 2], idx[n + 1]);
  const bot = new THREE.BufferGeometry();
  bot.setAttribute('position', new THREE.Float32BufferAttribute(bpos, 3));
  bot.setAttribute('color', new THREE.Float32BufferAttribute(bcol, 3));
  bot.setIndex(bidx); bot.computeVertexNormals();

  // 縁取り
  const ring = [];
  for (let i = 0; i <= nx; i++) ring.push(0 * W + i);
  for (let j = 1; j <= nz; j++) ring.push(j * W + nx);
  for (let i = nx - 1; i >= 0; i--) ring.push(nz * W + i);
  for (let j = nz - 1; j > 0; j--) ring.push(j * W);
  const spos = [], scol = [], sidx = [];
  ring.forEach((v, n) => {
    spos.push(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2], pos[v * 3], pos[v * 3 + 1] - thick, pos[v * 3 + 2]);
    scol.push(dark.r, dark.g, dark.b, dark.r, dark.g, dark.b);
    const m = ring.length, n2 = (n + 1) % m;
    sidx.push(n * 2, n2 * 2, n * 2 + 1, n2 * 2, n2 * 2 + 1, n * 2 + 1);
  });
  const skirt = new THREE.BufferGeometry();
  skirt.setAttribute('position', new THREE.Float32BufferAttribute(spos, 3));
  skirt.setAttribute('color', new THREE.Float32BufferAttribute(scol, 3));
  skirt.setIndex(sidx); skirt.computeVertexNormals();
  const out = mergeSimple([top, bot, skirt]);
  return out;
}

function mergeSimple(geos) {
  let n = 0, ni = 0;
  geos.forEach((g) => { n += g.attributes.position.count; ni += g.index.count; });
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), idx = new Uint32Array(ni);
  let o = 0, oi = 0;
  geos.forEach((g) => {
    pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); col.set(g.attributes.color.array, o * 3);
    for (let i = 0; i < g.index.count; i++) idx[oi + i] = g.index.array[i] + o;
    o += g.attributes.position.count; oi += g.index.count;
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  return out;
}

// ---------- 小物ヘルパー ----------
function rail(b, x0, z0, x1, z1, y0, h = 0.95, post = 1.5) {
  const dx = x1 - x0, dz = z1 - z0, len = Math.hypot(dx, dz), ry = Math.atan2(dx, dz);
  const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
  b.box(M.shu, 0.15, 0.13, len, mx, y0 + h, mz, ry);
  b.box(M.shu, 0.1, 0.09, len, mx, y0 + h * 0.52, mz, ry);
  b.box(M.shuDark, 0.12, 0.1, len, mx, y0 + 0.14, mz, ry);
  const n = Math.max(1, Math.round(len / post));
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = x0 + dx * t, z = z0 + dz * t;
    b.cyl(M.shu, 0.075, 0.085, h + 0.08, 8, x, y0 + h / 2, z);
    b.sph(M.gold, 0.1, x, y0 + h + 0.12, z, 1, 1.2, 1, 0);
  }
}

function shoji(b, cx, y0, cz, len, h, axis) { // axis 'x' = 壁が x 方向に伸びる
  const t = 0.08;
  const [w, d] = axis === 'x' ? [len, t] : [t, len];
  b.box(M.shojiLit, w, h, d, cx, y0 + h / 2, cz);
  const n = Math.max(2, Math.round(len / 0.95));
  for (let i = 0; i <= n; i++) {
    const u = -len / 2 + (len * i) / n;
    if (axis === 'x') b.box(M.woodDark, 0.07, h, 0.14, cx + u, y0 + h / 2, cz);
    else b.box(M.woodDark, 0.14, h, 0.07, cx, y0 + h / 2, cz + u);
  }
  for (const f of [0.02, 0.35, 0.68, 0.98]) {
    if (axis === 'x') b.box(M.woodDark, len, 0.08, 0.15, cx, y0 + h * f, cz);
    else b.box(M.woodDark, 0.15, 0.08, len, cx, y0 + h * f, cz);
  }
}

export function paperLantern(b, x, y, z, s = 1, lamp = true) {
  b.cyl(M.lampPaper, 0.27 * s, 0.27 * s, 0.55 * s, 12, x, y, z);
  b.cyl(M.shuDark, 0.28 * s, 0.28 * s, 0.07 * s, 12, x, y + 0.3 * s, z);
  b.cyl(M.shuDark, 0.28 * s, 0.28 * s, 0.07 * s, 12, x, y - 0.3 * s, z);
  b.cyl(M.woodDark, 0.012, 0.012, 0.5, 4, x, y + 0.6 * s, z);
  if (lamp) addLamp(x, y, z, { size: 0.85 * s, power: 0.9 });
}

export function stoneLantern(b, x, z, s = 1) {
  b.cyl(M.stone, 0.3 * s, 0.34 * s, 0.22 * s, 6, x, 0.11 * s, z);
  b.cyl(M.stone, 0.1 * s, 0.13 * s, 0.7 * s, 6, x, 0.57 * s, z);
  b.cyl(M.stone, 0.32 * s, 0.22 * s, 0.14 * s, 6, x, 0.99 * s, z);
  b.box(M.lampWarm, 0.32 * s, 0.34 * s, 0.32 * s, x, 1.23 * s, z);
  for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) b.box(M.stoneDark, 0.06 * s, 0.38 * s, 0.06 * s, x + dx * 0.17 * s, 1.23 * s, z + dz * 0.17 * s);
  b.cone(M.stone, 0.52 * s, 0.38 * s, 6, x, 1.6 * s, z);
  b.sph(M.stone, 0.1 * s, x, 1.85 * s, z, 1, 1.2, 1, 0);
  addLamp(x, 1.25 * s, z, { size: 1.0 * s, power: 1.0 });
}

function pillar(b, x, y0, h, z, r = 0.2) {
  b.cyl(M.lacquer, r, r * 1.04, h, 12, x, y0 + h / 2, z);
  b.cyl(M.stoneDark, r * 1.5, r * 1.6, 0.18, 10, x, y0 + 0.09, z);
  b.box(M.shuDark, r * 3.2, 0.14, r * 3.2, x, y0 + h - 0.07, z);
  b.box(M.shu, r * 4.6, 0.14, r * 4.6, x, y0 + h + 0.07, z);
}

function lathe(points, seg = 14) {
  return new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), seg);
}

// ---------- 建物本体 ----------
export function makeBuildings() {
  const b = new Batch();          // 静的（屋根以外）
  const rbOther = new Batch();    // 屋根（常時表示）
  const group = new THREE.Group();
  const cz = HALL.cz;

  // ===== 寝殿 =====
  b.box(M.wood, 15.3, 0.25, 9.1, 0, FLOOR - 0.125, cz);
  b.box(M.lacquer, 14.7, FLOOR - 0.25, 8.4, 0, (FLOOR - 0.25) / 2, cz);
  for (let i = -3; i <= 3; i++) for (const zz of [cz - 3.8, cz + 3.8, cz]) {
    b.box(M.woodDark, 0.22, FLOOR - 0.25, 0.22, i * 2.3, (FLOOR - 0.25) / 2, zz + (zz > cz ? 0.5 : zz < cz ? -0.5 : 0));
  }
  for (let k = 0; k < 5; k++) { // 階段
    const h = 0.26 * (k + 1);
    b.box(M.stone, 3.6, h, 0.22, 0, h / 2, -2.0 - k * 0.2 - 0.1);
  }
  const xs = [-7, -3.5, 0, 3.5, 7];
  for (const x of xs) { pillar(b, x, FLOOR, 3.4, -3.3); pillar(b, x, FLOOR, 3.4, -11.3); }
  for (const x of [-7, 7]) pillar(b, x, FLOOR, 3.4, cz);
  // 梁・長押
  const by = FLOOR + 3.3;
  b.box(M.lacquer, 14.6, 0.3, 0.36, 0, by, -3.3); b.box(M.lacquer, 14.6, 0.3, 0.36, 0, by, -11.3);
  b.box(M.lacquer, 0.36, 0.3, 8.0, -7, by, cz); b.box(M.lacquer, 0.36, 0.3, 8.0, 7, by, cz);
  b.box(M.shu, 14.6, 0.16, 0.4, 0, FLOOR + 2.85, -3.3);
  // 屋根を外したときに内部が見えるよう、天井板は張らず梁だけにする
  for (const zz of [-3.3, -11.3]) b.box(M.woodDark, 14.9, 0.3, 0.45, 0, FLOOR + 3.55, zz);
  for (const xx of [-7, 7]) b.box(M.woodDark, 0.45, 0.3, 8.4, xx, FLOOR + 3.55, cz);
  // 奥の壁（黒漆と朱）
  b.box(M.lacquer, 14.2, 3.0, 0.2, 0, FLOOR + 1.5, -11.25);
  b.box(M.shu, 14.2, 0.14, 0.26, 0, FLOOR + 2.6, -11.2);
  for (const sx of [-1, 1]) shoji(b, sx * 7, FLOOR + 0.1, cz, 7.5, 2.75, 'z');
  // 簾（巻き上げ）
  for (const x of [-5.25, -1.75, 1.75, 5.25]) {
    b.cyl(M.bamboo, 0.13, 0.13, 3.1, 8, x, FLOOR + 3.0, -3.12, 0, 0, Math.PI / 2);
    b.box(M.shuDark, 0.1, 0.5, 0.05, x - 1.45, FLOOR + 2.75, -3.12); b.box(M.shuDark, 0.1, 0.5, 0.05, x + 1.45, FLOOR + 2.75, -3.12);
  }
  // 高欄
  rail(b, -7.55, -2.95, -1.95, -2.95, FLOOR); rail(b, 1.95, -2.95, 7.55, -2.95, FLOOR);
  rail(b, -7.55, -2.95, -7.55, -11.7, FLOOR); rail(b, 7.55, -2.95, 7.55, -11.7, FLOOR);
  // 壇（上げ畳）
  b.box(M.lacquer, 5.8, 0.4, 3.0, DAIS.x, FLOOR + 0.2, DAIS.z);
  b.box(M.tatami, 5.5, 0.12, 2.7, DAIS.x, FLOOR + 0.46, DAIS.z);
  b.box(M.tatamiEdge, 5.56, 0.05, 0.14, DAIS.x, FLOOR + 0.54, DAIS.z + 1.36);
  b.box(M.tatamiEdge, 5.56, 0.05, 0.14, DAIS.x, FLOOR + 0.54, DAIS.z - 1.36);
  b.box(M.tatamiEdge, 0.14, 0.05, 2.7, DAIS.x - 2.75, FLOOR + 0.54, DAIS.z);
  b.box(M.tatamiEdge, 0.14, 0.05, 2.7, DAIS.x + 2.75, FLOOR + 0.54, DAIS.z);
  b.box(M.woodDark, 6.0, 0.14, 3.2, DAIS.x, FLOOR + 0.07, DAIS.z);
  // 屏風
  const by0 = DAIS.y;
  for (const [x, z, ry] of [[-1.7, -10.55, 0.55], [0, -10.8, 0], [1.7, -10.55, -0.55]]) {
    b.box(M.lacquer, 1.92, 2.6, 0.08, x, by0 + 1.3, z - 0.03, ry);
    b.box(M.goldPanel, 1.78, 2.46, 0.06, x, by0 + 1.3, z, ry);
  }
  b.cyl(M.shu, 0.55, 0.55, 0.05, 24, 0, by0 + 1.55, -10.73, Math.PI / 2);
  // 脇息
  b.box(M.lacquer, 0.95, 0.5, 0.28, 1.55, by0 + 0.25, DAIS.z + 0.15);
  b.box(M.gold, 1.0, 0.05, 0.32, 1.55, by0 + 0.52, DAIS.z + 0.15);
  // 行灯 ×2
  for (const x of [-3.4, 3.4]) {
    b.box(M.lampPaper, 0.5, 0.95, 0.5, x, by0 + 0.75, -9.0);
    for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) b.box(M.woodDark, 0.07, 1.0, 0.07, x + dx * 0.27, by0 + 0.75, -9.0 + dz * 0.27);
    b.box(M.woodDark, 0.65, 0.07, 0.65, x, by0 + 0.28, -9.0); b.box(M.woodDark, 0.65, 0.07, 0.65, x, by0 + 1.26, -9.0);
    addLamp(x, by0 + 0.75, -9.0, { size: 1.0, power: 0.9 });
  }
  // 大甕と樽
  const jarGeo = lathe([[0.001, 0], [0.5, 0], [0.78, 0.35], [0.82, 0.72], [0.64, 1.08], [0.44, 1.22], [0.5, 1.3], [0.001, 1.3]], 18);
  b.add(jarGeo, M.woodDark, tf(4.7, FLOOR, -10.0));
  b.box(M.shu, 0.5, 0.55, 0.05, 4.7, FLOOR + 0.7, -10.0 + 0.83);
  b.add(lathe([[0.001, 0], [0.4, 0], [0.62, 0.3], [0.64, 0.6], [0.5, 0.9], [0.34, 1.0], [0.001, 1.0]], 16), M.ceramic, tf(5.9, FLOOR, -9.9));
  for (const [x, z] of [[-5.2, -10.2], [-6.15, -10.0], [-5.7, -9.2]]) {
    b.cyl(M.barrel, 0.44, 0.44, 0.9, 14, x, FLOOR + 0.45, z);
    b.cyl(M.barrelBand, 0.465, 0.465, 0.07, 14, x, FLOOR + 0.2, z); b.cyl(M.barrelBand, 0.465, 0.465, 0.07, 14, x, FLOOR + 0.7, z);
  }
  // 吊灯籠（正面の梁）
  for (const x of [-5.25, -1.75, 1.75, 5.25]) paperLantern(b, x, FLOOR + 2.35, -3.1, 1.1);

  // ===== 対屋 + 渡殿 + 釣殿 =====
  for (const sx of [-1, 1]) {
    const wx = sx * 13.2, wz = cz;
    b.box(M.wood, 6.9, 0.25, 6.9, wx, FLOOR - 0.125, wz);
    b.box(M.lacquer, 6.3, FLOOR - 0.25, 6.3, wx, (FLOOR - 0.25) / 2, wz);
    for (const dx of [-3, 0, 3]) for (const dz of [-3, 0, 3]) if (dx || dz) pillar(b, wx + dx, FLOOR, 3.0, wz + dz, 0.18);
    shoji(b, wx, FLOOR + 0.1, wz - 3, 6.0, 2.6, 'x'); shoji(b, wx, FLOOR + 0.1, wz + 3, 6.0, 2.6, 'x');
    shoji(b, wx - 3, FLOOR + 0.1, wz, 6.0, 2.6, 'z'); shoji(b, wx + 3, FLOOR + 0.1, wz, 6.0, 2.6, 'z');
    b.box(M.woodDark, 7.1, 0.3, 7.1, wx, FLOOR + 3.15, wz);
    rail(b, wx - 3.45, wz + 3.45, wx + 3.45, wz + 3.45, FLOOR, 0.8, 1.7);
    rail(b, wx - 3.45, wz - 3.45, wx + 3.45, wz - 3.45, FLOOR, 0.8, 1.7);
    rbOther.add(hipRoofGeometry({ a: 5.2, b: 5.2, r: 1.6, H: 2.9, up: 0.6, nx: 48, nz: 48 }), M.roof, tf(wx, FLOOR + 3.3, wz));
    rbOther.cyl(M.iron, 0.2, 0.25, 0.3, 8, wx, FLOOR + 3.3 + 2.95, wz);
    rbOther.cone(M.gold, 0.18, 1.0, 6, wx, FLOOR + 3.3 + 3.45, wz);
    for (const e of [-1, 1]) rbOther.cone(M.gold, 0.2, 1.0, 6, wx + e * 1.8, FLOOR + 3.3 + 3.0, wz, 0, 0, -e * 0.5);
    rbOther.box(M.iron, 3.2, 0.2, 0.34, wx, FLOOR + 3.3 + 2.8, wz);
    for (const dx of [-2.2, 2.2]) paperLantern(b, wx + dx, FLOOR + 2.15, wz + 3.65, 1.0);

    // 寝殿→対屋の渡殿
    const cx2 = sx * 8.7;
    b.box(M.wood, 2.4, 0.22, 2.5, cx2, FLOOR - 0.11, wz);
    b.box(M.lacquer, 2.0, FLOOR - 0.22, 2.1, cx2, (FLOOR - 0.22) / 2, wz);
    for (const dz of [-1.2, 1.2]) for (const dx of [-1.0, 1.0]) pillar(b, cx2 + dx, FLOOR, 2.5, wz + dz, 0.14);
    rail(b, cx2 - 1.2, wz - 1.2, cx2 + 1.2, wz - 1.2, FLOOR, 0.8, 1.5); rail(b, cx2 - 1.2, wz + 1.2, cx2 + 1.2, wz + 1.2, FLOOR, 0.8, 1.5);
    rbOther.add(hipRoofGeometry({ a: 2.2, b: 1.9, r: 0.6, H: 1.3, up: 0.3, nx: 24, nz: 20 }), M.roof, tf(cx2, FLOOR + 2.65, wz));

    // 南へ延びる渡殿
    const cz2 = 0.45;
    b.box(M.wood, 2.5, 0.22, 9.2, wx, FLOOR - 0.11, cz2);
    b.box(M.lacquer, 2.1, FLOOR - 0.22, 8.8, wx, (FLOOR - 0.22) / 2, cz2);
    for (const z of [-3.6, -0.5, 2.6, 4.9]) for (const dx of [-1.1, 1.1]) pillar(b, wx + dx, FLOOR, 2.5, z, 0.14);
    rail(b, wx - 1.25, -4.0, wx - 1.25, 5.0, FLOOR, 0.8, 1.6); rail(b, wx + 1.25, -4.0, wx + 1.25, 5.0, FLOOR, 0.8, 1.6);
    rbOther.add(hipRoofGeometry({ a: 5.2, b: 2.0, r: 2.8, H: 1.4, up: 0.3, nx: 48, nz: 20 }), M.roof, tf(wx, FLOOR + 2.65, cz2, 0, Math.PI / 2));
    paperLantern(b, wx, FLOOR + 1.85, -1.2, 0.9); paperLantern(b, wx, FLOOR + 1.85, 3.0, 0.9);

    // 釣殿
    const tz = 7.0;
    b.box(M.wood, 4.6, 0.25, 4.6, wx, FLOOR - 0.125, tz);
    b.box(M.lacquer, 4.2, FLOOR - 0.25, 4.2, wx, (FLOOR - 0.25) / 2, tz);
    for (const dx of [-2, 2]) for (const dz of [-2, 2]) pillar(b, wx + dx, FLOOR, 2.7, tz + dz, 0.16);
    rail(b, wx - 2.3, tz + 2.3, wx + 2.3, tz + 2.3, FLOOR, 0.85, 1.6);
    rail(b, wx - 2.3, tz - 2.3, wx - 2.3, tz + 2.3, FLOOR, 0.85, 1.6); rail(b, wx + 2.3, tz - 2.3, wx + 2.3, tz + 2.3, FLOOR, 0.85, 1.6);
    rail(b, wx - 2.3, tz - 2.3, wx - 0.9, tz - 2.3, FLOOR, 0.85, 1.6); rail(b, wx + 0.9, tz - 2.3, wx + 2.3, tz - 2.3, FLOOR, 0.85, 1.6);
    b.box(M.woodDark, 4.7, 0.25, 4.7, wx, FLOOR + 2.95, tz);
    rbOther.add(hipRoofGeometry({ a: 3.2, b: 3.2, r: 0.5, H: 1.6, up: 0.45, nx: 40, nz: 40 }), M.roof, tf(wx, FLOOR + 3.1, tz));
    rbOther.cone(M.gold, 0.16, 0.9, 6, wx, FLOOR + 3.1 + 1.85, tz);
    paperLantern(b, wx, FLOOR + 2.1, tz, 1.05);
  }

  // ===== 鉄の門 =====
  const gz = WALL.zFront;
  for (const sx of [-1, 1]) {
    const px = sx * 2.7;
    b.box(M.lacquer, 0.78, 4.4, 0.78, px, 2.2, gz);
    for (const y of [0.55, 1.6, 2.8]) b.box(M.iron, 0.86, 0.16, 0.86, px, y, gz);
    b.box(M.stoneDark, 1.1, 0.3, 1.1, px, 0.15, gz);
    // 扉
    const hx = sx * 2.35, phi = sx > 0 ? -1.2 : 1.2;
    const w = 2.2, h = 3.7;
    b.add(new THREE.BoxGeometry(w, h, 0.2).translate(-sx * w / 2, h / 2 + 0.1, 0), M.iron, tf(hx, 0, gz, 0, phi));
    for (const yy of [0.6, 1.9, 3.1]) b.add(new THREE.BoxGeometry(w, 0.16, 0.26).translate(-sx * w / 2, yy, 0), M.ironLight, tf(hx, 0, gz, 0, phi));
    for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) {
      b.add(new THREE.IcosahedronGeometry(0.075, 0).translate(-sx * (0.25 + i * 0.4), 0.55 + j * 0.9, 0.14), M.gold, tf(hx, 0, gz, 0, phi));
    }
  }
  b.box(M.lacquer, 6.8, 0.5, 0.95, 0, 4.4, gz);
  b.box(M.shu, 6.4, 0.2, 1.05, 0, 3.95, gz);
  b.box(M.gold, 2.1, 0.9, 0.1, 0, 3.4, gz + 0.5); b.box(M.lacquer, 1.9, 0.7, 0.12, 0, 3.4, gz + 0.52);
  b.sph(M.shu, 0.28, 0, 3.4, gz + 0.6, 1, 1, 0.5, 1);
  rbOther.add(hipRoofGeometry({ a: 4.6, b: 2.7, r: 2.4, H: 1.45, up: 0.5, nx: 56, nz: 32 }), M.roof, tf(0, 4.65, gz));
  rbOther.cone(M.gold, 0.2, 1.0, 6, 0, 4.65 + 1.95, gz);
  for (const e of [-1, 1]) rbOther.cone(M.gold, 0.22, 1.0, 6, e * 2.6, 4.65 + 1.7, gz, 0, 0, -e * 0.5);
  paperLantern(b, -1.5, 3.2, gz - 0.2, 1.1); paperLantern(b, 1.5, 3.2, gz - 0.2, 1.1);

  // ===== 築地塀 =====
  const wallSeg = (x0, z0, x1, z1) => {
    const dx = x1 - x0, dz = z1 - z0, len = Math.hypot(dx, dz), ry = Math.atan2(dx, dz);
    const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
    b.box(M.stone, 0.75, 0.3, len, mx, 0.15, mz, ry);
    b.box(M.plaster, 0.52, 1.25, len, mx, 0.9, mz, ry);
    for (const y of [0.55, 0.8, 1.05, 1.3]) b.box(M.gravelLine, 0.56, 0.035, len, mx, y, mz, ry);
    rbOther.box(M.iron, 0.9, 0.18, len + 0.1, mx, 1.62, mz, ry);
    rbOther.box(M.ironLight, 0.5, 0.12, len + 0.1, mx, 1.76, mz, ry);
    const n = Math.max(1, Math.round(len / 4.5));
    for (let i = 0; i <= n; i++) b.box(M.woodDark, 0.34, 1.35, 0.62, x0 + (dx * i) / n, 0.97, z0 + (dz * i) / n, ry);
  };
  const X = WALL.x, zb = WALL.zBack, zf = WALL.zFront, gh = WALL.gateHalf;
  wallSeg(-X, zb, X, zb); wallSeg(-X, zb, -X, zf); wallSeg(X, zb, X, zf);
  wallSeg(-X, zf, -gh - 0.4, zf); wallSeg(gh + 0.4, zf, X, zf);

  // ===== 橋 =====
  const bridge = (zA, zB) => {
    const N = 14, pts = [];
    for (let i = 0; i <= N; i++) { const u = i / N; pts.push([zA + (zB - zA) * u, POND_ISLE.h * u + bridgeArch(u) + 0.1]); }
    for (let i = 0; i < N; i++) {
      const [z0, y0] = pts[i], [z1, y1] = pts[i + 1];
      const len = Math.hypot(z1 - z0, y1 - y0) + 0.02, mz = (z0 + z1) / 2, my = (y0 + y1) / 2;
      const phi = -Math.atan2(y1 - y0, z1 - z0);
      b.box(i % 2 ? M.shu : M.shuDark, 1.7, 0.1, len, 0, my, mz, 0, phi);
      b.box(M.lacquer, 0.12, 0.34, len, -0.8, my - 0.15, mz, 0, phi); b.box(M.lacquer, 0.12, 0.34, len, 0.8, my - 0.15, mz, 0, phi);
    }
    for (let i = 0; i <= N; i += 2) {
      const [z, y] = pts[i];
      for (const sx of [-1, 1]) { b.cyl(M.shu, 0.07, 0.08, 0.85, 8, sx * 0.84, y + 0.5, z); b.sph(M.gold, 0.1, sx * 0.84, y + 0.98, z, 1, 1.2, 1, 0); }
    }
    for (const sx of [-1, 1]) for (let i = 0; i < N; i++) {
      const [z0, y0] = pts[i], [z1, y1] = pts[i + 1];
      const len = Math.hypot(z1 - z0, y1 - y0) + 0.02;
      b.box(M.shu, 0.1, 0.1, len, sx * 0.84, (y0 + y1) / 2 + 0.88, (z0 + z1) / 2, 0, -Math.atan2(y1 - y0, z1 - z0));
    }
  };
  bridge(BRIDGE.z1a, BRIDGE.z1b);
  bridge(BRIDGE.z2b, BRIDGE.z2a);

  const bridgeLamps = [[-1.25, 11.9], [1.25, 11.9], [-1.25, 2.1], [1.25, 2.1]];
  for (const [x, z] of bridgeLamps) {
    b.cyl(M.woodDark, 0.07, 0.09, 0.9, 6, x, 0.45, z);
    b.box(M.lampPaper, 0.26, 0.3, 0.26, x, 1.0, z);
    b.cone(M.iron, 0.25, 0.16, 4, x, 1.23, z, 0, Math.PI / 4);
    addLamp(x, 1.0, z, { size: 0.65, power: 0.8 });
  }

  // ===== 石灯籠 =====
  for (const [x, z, s] of [[-5.6, 2.1, 1.1], [5.6, 2.1, 1.1], [-3.7, -1.5, 1.0], [3.7, -1.5, 1.0], [-9.4, 10.4, 1.0], [9.4, 10.4, 1.0]]) stoneLantern(b, x, z, s);
  stoneLantern(b, 1.1, 7.8, 0.9);

  group.add(b.build());
  const roofsOther = rbOther.build({ receive: false });
  group.add(roofsOther);

  // ===== 寝殿の屋根（外せる） =====
  const roofMat = M.roof.clone(), goldMat = M.gold.clone(), ironMat = M.iron.clone();
  const rb = new Batch();
  const y0 = FLOOR + 3.7;
  rb.add(hipRoofGeometry({ a: 9.5, b: 6.4, r: 3.6, H: 4.0, up: 0.8, nx: 96, nz: 56 }), roofMat, tf(0, y0, cz));
  rb.box(ironMat, 7.6, 0.34, 0.5, 0, y0 + 4.05, cz);
  for (const e of [-1, 1]) {
    rb.cone(goldMat, 0.34, 1.6, 6, e * 4.2, y0 + 4.5, cz, 0, 0, -e * 0.55);
    rb.cone(goldMat, 0.2, 1.0, 6, e * 4.55, y0 + 5.15, cz, 0, 0, -e * 0.95);
  }
  rb.sph(goldMat, 0.34, 0, y0 + 4.45, cz, 1, 1.4, 1, 1);
  const roofMain = rb.build({ receive: false });
  roofMain.position.y = 0;
  roofMain.userData.mats = [roofMat, goldMat, ironMat];
  group.add(roofMain);

  return { group, roofMain };
}
