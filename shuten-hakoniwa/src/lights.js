// 灯り: 各ランプのグロー（にじみ）スプライトを作り、霧・水面シェーダーへ渡す共通レジストリ
import * as THREE from 'three';
import { glowTexture, vnoise } from './util.js';

export const lampGroup = new THREE.Group();
export const lamps = [];
export const MAX_LAMPS = 40;

const haloTex = glowTexture(128, [[0, 0.9], [0.1, 0.5], [0.3, 0.2], [0.6, 0.06], [1, 0]]);
const coreTex = glowTexture(64, [[0, 1], [0.25, 0.7], [0.6, 0.15], [1, 0]]);

// size: ハロの半径の目安。power: 霧への寄与の強さ。
export function addLamp(x, y, z, { color = [1.0, 0.62, 0.26], power = 1, size = 1, flicker = 0.12 } = {}) {
  const col = new THREE.Color(color[0], color[1], color[2]);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: haloTex, color: col, transparent: true, opacity: 0.5 * power, depthWrite: false, fog: false, toneMapped: false,
  }));
  halo.scale.setScalar(7.5 * size); halo.position.set(x, y, z);
  const core = new THREE.Sprite(new THREE.SpriteMaterial({
    map: coreTex, color: new THREE.Color(1, 0.86, 0.55), transparent: true, opacity: 0.9, depthWrite: false,
    blending: THREE.AdditiveBlending, fog: false, toneMapped: false,
  }));
  core.scale.setScalar(1.6 * size); core.position.set(x, y, z);
  halo.renderOrder = 6; core.renderOrder = 7;
  lampGroup.add(halo, core);
  const l = { pos: new THREE.Vector3(x, y, z), col, power, size, flicker, phase: Math.random() * 100, halo, core, f: 1, baseOp: halo.material.opacity, baseScale: halo.scale.x, coreScale: core.scale.x };
  lamps.push(l);
  return l;
}

export function updateLamps(t) {
  for (const l of lamps) {
    const n = vnoise(t * 3.2 + l.phase, l.phase * 0.7) * 2 - 1;
    const f = 1 + l.flicker * n;
    l.f = f;
    l.halo.material.opacity = l.baseOp * (0.85 + 0.15 * f);
    l.halo.scale.setScalar(l.baseScale * (0.96 + 0.04 * f));
    l.core.scale.setScalar(l.coreScale * f);
  }
}
