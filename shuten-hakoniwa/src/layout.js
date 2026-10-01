// 箱庭の配置定数と地面の高さ関数（人物の歩行・橋の反り・階段の高さに使う）
// 座標: x=東, z=南（手前）, y=上。単位は箱庭内の「間」ほどの任意単位。
export const FLOOR = 1.3; // 寝殿・渡殿の床の高さ

export const ISLAND = { A: 20, B: 16, N: 6 }; // 浮島の輪郭（超楕円）の半径
export const WALL = { x: 17, zBack: -13, zFront: 13, gateHalf: 2.8 };
export const HALL = { cx: 0, cz: -7.3, hw: 7, hd: 4 }; // 寝殿の柱列の半幅・半奥行
export const DAIS = { x: 0, z: -9.5, y: FLOOR + 0.52 };
export const POND = { cx: 0, cz: 7, a: 10.4, b: 4.4, n: 2.8 };
export const POND_ISLE = { x: 0, z: 7, r: 2.2, h: 0.18 };
export const BRIDGE = { z1a: 11.6, z1b: 9.2, z2a: 4.8, z2b: 2.4, peak: 0.95 };

// 池の輪郭（極座標）
export function pondRadiusPoint(theta, grow = 1) {
  const c = Math.cos(theta), s = Math.sin(theta);
  const { a, b, n } = POND;
  const t = 1 / Math.pow(Math.pow(Math.abs(c / a), n) + Math.pow(Math.abs(s / b), n), 1 / n);
  const wob = 1 + 0.045 * Math.sin(theta * 3 + 0.7) + 0.03 * Math.sin(theta * 5 + 2.1);
  return [POND.cx + c * t * wob * grow, POND.cz + s * t * wob * grow];
}

// 池の北岸（コート側）の z を x から求める
export function pondNorthZ(x) {
  const { a, b, n } = POND;
  const u = Math.min(0.999, Math.abs(x) / a);
  return POND.cz - b * Math.pow(1 - Math.pow(u, n), 1 / n);
}

export function bridgeArch(u) { return BRIDGE.peak * Math.sin(Math.PI * u); }

export function groundHeight(x, z) {
  const ax = Math.abs(x);
  // 橋
  if (ax < 1.2) {
    if (z > BRIDGE.z1b && z < BRIDGE.z1a) {
      const u = (BRIDGE.z1a - z) / (BRIDGE.z1a - BRIDGE.z1b);
      return POND_ISLE.h * u + bridgeArch(u) + 0.12;
    }
    if (z > BRIDGE.z2b && z < BRIDGE.z2a) {
      const u = (z - BRIDGE.z2b) / (BRIDGE.z2a - BRIDGE.z2b);
      return POND_ISLE.h * u + bridgeArch(u) + 0.12;
    }
  }
  // 池中の島
  if (Math.hypot(x - POND_ISLE.x, z - POND_ISLE.z) < POND_ISLE.r - 0.1) return POND_ISLE.h;
  // 寝殿の床と階段
  if (ax < HALL.hw + 0.55 && z < -2.9 && z > -11.8) return FLOOR;
  if (ax < 1.9 && z <= -1.9 && z >= -2.9) return FLOOR * (-(z + 1.9)) / 1.0;
  return 0;
}
