// 共通ユーティリティ: 乱数・ノイズ・マテリアル・静的メッシュのバッチ化・テクスチャ生成（すべてコードで生成）
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let _rng = mulberry32(1031);
export const reseed = (s) => { _rng = mulberry32(s); };
export const rnd = (a = 0, b = 1) => a + (b - a) * _rng();
export const pick = (arr) => arr[Math.floor(_rng() * arr.length)];

function hash2(ix, iy) {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
export function vnoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy), b = hash2(ix + 1, iy), c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x, y, oct = 4) {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { s += a * vnoise(x * f, y * f); f *= 2; a *= 0.5; }
  return s;
}

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
export function lerpAngle(a, b, t) {
  let d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  return a + d * t;
}

// ---- マテリアル -------------------------------------------------------
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...o });
const hdr = (r, g, b, k = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(r * k, g * k, b * k), toneMapped: false });

export const M = {
  grass: std(0xffffff, { vertexColors: true, roughness: 1 }),
  earth: std(0xffffff, { vertexColors: true, roughness: 1, flatShading: true }),
  rock: std(0x8d9097, { roughness: 0.95, flatShading: true }),
  rockDark: std(0x5f636b, { roughness: 0.95, flatShading: true }),
  moss: std(0x56733f, { roughness: 1, flatShading: true }),
  gravel: std(0xcdc9be, { roughness: 1 }),
  gravelLine: std(0xb4b0a5, { roughness: 1 }),
  stone: std(0xa7a79f, { roughness: 0.9, flatShading: true }),
  stoneDark: std(0x74746f, { roughness: 0.9, flatShading: true }),
  plaster: std(0xe6dfcf, { roughness: 0.95 }),
  wood: std(0x7b5a3d, { roughness: 0.8 }),
  woodDark: std(0x4a3426, { roughness: 0.85 }),
  lacquer: std(0x2a1f20, { roughness: 0.35, metalness: 0.15 }),
  shu: std(0xb83a24, { roughness: 0.55 }),
  shuDark: std(0x8a2a1c, { roughness: 0.6 }),
  gold: std(0xe0b84a, { roughness: 0.35, metalness: 0.6, emissive: 0x3a2808 }),
  goldPanel: std(0xe3bf62, { roughness: 0.5, metalness: 0.3, emissive: 0x5a4210 }),
  iron: std(0x2b2f38, { roughness: 0.45, metalness: 0.55 }),
  ironLight: std(0x4a505c, { roughness: 0.5, metalness: 0.5 }),
  roof: std(0xffffff, { vertexColors: true, roughness: 0.55, metalness: 0.2, side: THREE.DoubleSide }),
  bamboo: std(0xc8a45e, { roughness: 0.8 }),
  tatami: std(0x93a463, { roughness: 1 }),
  tatamiEdge: std(0x4e2c60, { roughness: 0.8 }),
  cushion: std(0x7a2f3c, { roughness: 0.9 }),
  pineTrunk: std(0x4b382c, { roughness: 1, flatShading: true }),
  pineLeaf: std(0x35563a, { roughness: 1, flatShading: true }),
  pineLeaf2: std(0x436a42, { roughness: 1, flatShading: true }),
  maple1: std(0xc23a22, { roughness: 1, flatShading: true }),
  maple2: std(0xe0612a, { roughness: 1, flatShading: true }),
  maple3: std(0xe9993a, { roughness: 1, flatShading: true }),
  barrel: std(0x9a7448, { roughness: 0.8 }),
  barrelBand: std(0x2a2522, { roughness: 0.6, metalness: 0.3 }),
  ceramic: std(0xd9d2c0, { roughness: 0.4 }),
  white: std(0xf1ede2, { roughness: 0.7 }),
  food1: std(0xd9553a, { roughness: 0.7 }),
  food2: std(0xe8c65a, { roughness: 0.7 }),
  food3: std(0x7aa04b, { roughness: 0.7 }),
  // 発光（HDR値でブルームに乗せる）
  lampWarm: hdr(1.0, 0.66, 0.28, 1.9),
  lampPaper: hdr(1.0, 0.72, 0.38, 1.5),
  shojiLit: hdr(1.0, 0.8, 0.5, 1.15),
  coal: hdr(1.0, 0.4, 0.1, 2.0),
};

// ---- 静的メッシュのバッチ化（マテリアルごとに結合） -------------------------
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
export function tf(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  _e.set(rx, ry, rz, 'YXZ'); _q.setFromEuler(_e);
  return new THREE.Matrix4().compose(_p.set(x, y, z), _q, _s.set(sx, sy, sz));
}

export class Batch {
  constructor() { this.map = new Map(); }
  add(geo, mat, matrix) {
    if (matrix) geo.applyMatrix4(matrix);
    const g = geo.index ? geo.toNonIndexed() : geo;
    for (const k of Object.keys(g.attributes)) {
      if (!['position', 'normal', 'uv', 'color'].includes(k)) g.deleteAttribute(k);
    }
    const n = g.attributes.position.count;
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
    if (mat.vertexColors && !g.attributes.color) g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3));
    if (!mat.vertexColors && g.attributes.color) g.deleteAttribute('color');
    if (!this.map.has(mat)) this.map.set(mat, []);
    this.map.get(mat).push(g);
    return this;
  }
  box(mat, w, h, d, x, y, z, ry = 0, rx = 0, rz = 0) {
    return this.add(new THREE.BoxGeometry(w, h, d), mat, tf(x, y, z, rx, ry, rz));
  }
  cyl(mat, rt, rb, h, seg, x, y, z, rx = 0, ry = 0, rz = 0) {
    return this.add(new THREE.CylinderGeometry(rt, rb, h, seg), mat, tf(x, y, z, rx, ry, rz));
  }
  cone(mat, r, h, seg, x, y, z, rx = 0, ry = 0, rz = 0) {
    return this.add(new THREE.ConeGeometry(r, h, seg), mat, tf(x, y, z, rx, ry, rz));
  }
  sph(mat, r, x, y, z, sx = 1, sy = 1, sz = 1, detail = 1) {
    return this.add(new THREE.IcosahedronGeometry(r, detail), mat, tf(x, y, z, 0, 0, 0, sx, sy, sz));
  }
  build({ cast = true, receive = true } = {}) {
    const group = new THREE.Group();
    for (const [mat, geos] of this.map) {
      const merged = mergeGeometries(geos, false);
      const mesh = new THREE.Mesh(merged, mat);
      mesh.castShadow = cast; mesh.receiveShadow = receive;
      group.add(mesh);
      geos.forEach((g) => g.dispose());
    }
    return group;
  }
}

// ---- テクスチャ（canvas で描く） ------------------------------------------
export function glowTexture(size = 128, stops) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  (stops || [[0, 1], [0.12, 0.62], [0.32, 0.22], [0.6, 0.06], [1, 0]]).forEach(([o, a]) => gr.addColorStop(o, `rgba(255,255,255,${a})`));
  g.fillStyle = gr; g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function cloudTexture(size = 256, seed = 7) {
  const r = mulberry32(seed);
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  for (let i = 0; i < 26; i++) {
    const a = r() * Math.PI * 2, d = Math.pow(r(), 0.7) * size * 0.26;
    const x = size / 2 + Math.cos(a) * d * 1.25, y = size / 2 + Math.sin(a) * d * 0.7;
    const rad = size * (0.1 + r() * 0.17);
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.2)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, size, size);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
