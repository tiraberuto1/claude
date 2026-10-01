// 浮島: 苔むした天面・地層の側面・岩の底・周りに漂う小岩
import * as THREE from 'three';
import { M, Batch, tf, fbm, rnd, mulberry32 } from './util.js';
import { ISLAND } from './layout.js';

export function islandEdge(theta) {
  const { A, B, N } = ISLAND;
  const c = Math.cos(theta), s = Math.sin(theta);
  const t = 1 / Math.pow(Math.pow(Math.abs(c / A), N) + Math.pow(Math.abs(s / B), N), 1 / N);
  const wob = 1 + 0.06 * (fbm(c * 1.7 + 3, s * 1.7 + 5, 3) - 0.5) * 2;
  return [c * t * wob, s * t * wob];
}

export function makeIsland() {
  const group = new THREE.Group();
  const NT = 112;

  // ---- 天面 ----
  const K = 18;
  const tp = [], tc = [], ti = [];
  const grassCols = [0x4f6d3d, 0x6a8650, 0x7f9158, 0x435f37, 0x8a8f55].map((h) => new THREE.Color(h));
  for (let k = 0; k <= K; k++) {
    const s = k / K;
    for (let i = 0; i < NT; i++) {
      const th = (i / NT) * Math.PI * 2;
      const [ex, ez] = islandEdge(th);
      const x = ex * s, z = ez * s;
      const droop = s > 0.94 ? -Math.pow((s - 0.94) / 0.06, 2) * 0.18 : 0;
      tp.push(x, droop, z);
      const n = fbm(x * 0.22 + 10, z * 0.22 + 4, 3);
      const n2 = fbm(x * 0.7, z * 0.7 + 9, 2);
      const c = grassCols[Math.min(4, Math.floor(n * 5.2))].clone().lerp(grassCols[Math.min(4, Math.floor(n2 * 5.2))], 0.4);
      c.multiplyScalar(s > 0.95 ? 0.8 : 1);
      tc.push(c.r, c.g, c.b);
    }
  }
  for (let k = 0; k < K; k++) {
    for (let i = 0; i < NT; i++) {
      const a = k * NT + i, b = k * NT + ((i + 1) % NT), c = (k + 1) * NT + i, d = (k + 1) * NT + ((i + 1) % NT);
      ti.push(a, c, b, b, c, d);
    }
  }
  const topGeo = new THREE.BufferGeometry();
  topGeo.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3));
  topGeo.setAttribute('color', new THREE.Float32BufferAttribute(tc, 3));
  topGeo.setIndex(ti);
  topGeo.computeVertexNormals();
  const top = new THREE.Mesh(topGeo, M.grass);
  top.receiveShadow = true;
  group.add(top);

  // ---- 側面と底（地層） ----
  const ys = [0.02, -0.9, -2.3, -3.9, -5.6, -7.2, -8.7, -10.0, -11.1, -11.9, -12.5];
  const scs = [1.0, 1.0, 0.965, 0.9, 0.8, 0.69, 0.56, 0.42, 0.28, 0.15, 0.05];
  const strata = [0x5c7a42, 0x3d2f27, 0x7b6450, 0x5a493d, 0x8c7b67, 0x6e6e72, 0x6f5a49, 0x5d5d62, 0x4c4038, 0x55504d, 0x4a4543].map((h) => new THREE.Color(h));
  const sp = [], sc = [], si = [];
  const M_ = ys.length;
  for (let m = 0; m < M_; m++) {
    const u = m / (M_ - 1);
    for (let i = 0; i < NT; i++) {
      const th = (i / NT) * Math.PI * 2;
      const [ex, ez] = islandEdge(th);
      const n = fbm(Math.cos(th) * 2.4 + m * 0.9, Math.sin(th) * 2.4 + m * 0.6, 3) - 0.5;
      const jr = 1 + n * 0.55 * Math.pow(u, 0.7);
      const jy = (fbm(i * 0.13 + m * 3.1, m * 1.7, 2) - 0.5) * 1.1 * u;
      const r = scs[m] * jr;
      sp.push(ex * r, ys[m] + jy, ez * r);
      const base = strata[m];
      const v = 0.85 + 0.3 * fbm(i * 0.21, m * 2.3, 2);
      sc.push(base.r * v, base.g * v, base.b * v);
    }
  }
  const tipIndex = sp.length / 3;
  sp.push(0, ys[M_ - 1] - 0.6, 0); sc.push(0.25, 0.22, 0.2);
  for (let m = 0; m < M_ - 1; m++) {
    for (let i = 0; i < NT; i++) {
      const a = m * NT + i, b = m * NT + ((i + 1) % NT), c = (m + 1) * NT + i, d = (m + 1) * NT + ((i + 1) % NT);
      si.push(a, b, c, b, d, c);
    }
  }
  for (let i = 0; i < NT; i++) si.push((M_ - 1) * NT + i, (M_ - 1) * NT + ((i + 1) % NT), tipIndex);
  const sideGeo = new THREE.BufferGeometry();
  sideGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  sideGeo.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3));
  sideGeo.setIndex(si);
  sideGeo.computeVertexNormals();
  const side = new THREE.Mesh(sideGeo, M.earth);
  side.castShadow = true; side.receiveShadow = true;
  group.add(side);

  // ---- 底から垂れる岩のトゲ、縁の岩塊 ----
  const b = new Batch();
  const r = mulberry32(77);
  for (let i = 0; i < 9; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 4.2;
    const h = 3 + r() * 5, rad = 0.6 + r() * 1.1;
    b.add(new THREE.ConeGeometry(rad, h, 6), r() < 0.5 ? M.rockDark : M.rock, tf(Math.cos(a) * d, -10.2 - h / 2 + 0.4, Math.sin(a) * d * 0.8, Math.PI, r() * 3, (r() - 0.5) * 0.3, 1, 1, 1));
  }
  for (let i = 0; i < 26; i++) { // 側面に張り出す岩
    const th = r() * Math.PI * 2;
    const [ex, ez] = islandEdge(th);
    const m = 1 + Math.floor(r() * 4);
    const k = scs[m] * 1.02;
    b.sph(r() < 0.5 ? M.rock : M.rockDark, 0.8 + r() * 1.3, ex * k, ys[m] + 0.3, ez * k, 1, 0.75 + r() * 0.4, 1, 0);
  }
  group.add(b.build());

  // ---- 周りに浮かぶ小岩 ----
  const pebbles = [];
  const pr = mulberry32(5);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + pr() * 0.5;
    const d = 25 + pr() * 9;
    const rad = 0.5 + pr() * 1.5;
    const geo = new THREE.IcosahedronGeometry(rad, 0);
    const mesh = new THREE.Mesh(geo, i % 2 ? M.rock : M.earth);
    if (mesh.material === M.earth) mesh.material = M.rockDark;
    mesh.scale.set(1, 0.6 + pr() * 0.5, 1);
    const base = new THREE.Vector3(Math.cos(a) * d * 1.05, -2 - pr() * 12, Math.sin(a) * d * 0.85);
    mesh.position.copy(base);
    mesh.castShadow = true;
    group.add(mesh);
    pebbles.push({ mesh, base, ph: pr() * 10, spin: (pr() - 0.5) * 0.5 });
  }
  return { group, pebbles };
}
