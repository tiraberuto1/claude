// 世界の組み立て: 島・建物・庭・演出・人物と、その動きの台本（ループ／頼光一行の来訪）
import * as THREE from 'three';
import { M, Batch, tf, rnd, smooth } from './util.js';
import { FLOOR, DAIS, pondNorthZ } from './layout.js';
import { makeIsland } from './island.js';
import { makeBuildings } from './buildings.js';
import { makeGarden } from './garden.js';
import { lampGroup, updateLamps, lamps } from './lights.js';
import * as FX from './fx.js';
import { Agent, buildOni, buildWoman, buildMan, buildShuten } from './characters.js';

const go = (x, z, speed) => ({ t: 'go', x, z, speed });
const wait = (dur, act = 'idle', face) => ({ t: 'wait', dur, act, face });
const PI = Math.PI;

// 鬼の肌の色
const SKIN = { aka: 0xd9473a, ao: 0x4f78b8, midori: 0x4e9a62, ki: 0xd9a93a };

export function createWorld() {
  const group = new THREE.Group();
  const T0 = { v: 0 };

  const island = makeIsland();
  const bld = makeBuildings();
  const garden = makeGarden();
  group.add(island.group, bld.group, garden.group);

  // 寝殿の内装（座布団・膳・琴）
  const pb = new Batch();
  const seats = [{ x: -4.5, z: -6.2, yaw: 2.2 }, { x: 4.5, z: -6.4, yaw: -2.2 }];
  for (const s of seats) {
    pb.box(M.cushion, 1.05, 0.14, 1.05, s.x, FLOOR + 0.07, s.z, s.yaw);
    const fx = Math.sin(s.yaw), fz = Math.cos(s.yaw);
    const tx = s.x + fx * 1.4, tz = s.z + fz * 1.4;
    pb.box(M.lacquer, 1.5, 0.4, 0.8, tx, FLOOR + 0.2, tz, s.yaw);
    for (let i = 0; i < 4; i++) {
      const ox = (i - 1.5) * 0.3, oz = (i % 2 ? 0.1 : -0.1);
      const px = tx + Math.cos(s.yaw) * ox + Math.sin(s.yaw) * oz, pz = tz - Math.sin(s.yaw) * ox + Math.cos(s.yaw) * oz;
      pb.cyl([M.food1, M.food2, M.food3, M.ceramic][i], 0.12, 0.12, 0.07, 10, px, FLOOR + 0.45, pz);
    }
    pb.cyl(M.ceramic, 0.07, 0.09, 0.28, 8, tx + Math.cos(s.yaw) * 0.6, FLOOR + 0.55, tz - Math.sin(s.yaw) * 0.6);
  }
  pb.box(M.lacquer, 2.3, 0.3, 0.7, 0, DAIS.y + 0.15, -8.35);
  for (let i = 0; i < 5; i++) pb.cyl([M.food1, M.food2, M.food3, M.ceramic, M.food1][i], 0.14, 0.14, 0.07, 10, (i - 2) * 0.42, DAIS.y + 0.34, -8.35 + (i % 2 ? 0.1 : -0.1));
  // 琴
  const kx = 5.4, kz = -3.75;
  pb.box(M.lacquer, 1.9, 0.18, 0.36, kx, FLOOR + 0.27, kz); pb.box(M.woodDark, 1.95, 0.05, 0.4, kx, FLOOR + 0.38, kz);
  for (let i = 0; i < 6; i++) pb.box(M.gold, 1.8, 0.012, 0.012, kx, FLOOR + 0.42, kz - 0.14 + i * 0.056);
  pb.box(M.shuDark, 0.1, 0.4, 0.5, kx - 0.7, FLOOR + 0.1, kz); pb.box(M.shuDark, 0.1, 0.4, 0.5, kx + 0.7, FLOOR + 0.1, kz);
  group.add(pb.build());

  // 灯り・霧・水・炎・鬼火・紅葉・雲・鯉
  const water = FX.makeWater(garden.waterY);
  const mist = FX.makeMist();
  const fires = FX.makeFires(garden.fires);
  const onibi = FX.makeOnibi(18);
  const leaves = FX.makeLeaves(garden.mapleSpots);
  const clouds = FX.makeClouds(20);
  const koi = FX.makeKoi();
  const puffs = FX.makePuffs();
  group.add(water, mist.group, lampGroup, fires.group, onibi.group, leaves.group, clouds.group, koi.group, puffs.group);

  // 実光源（霧のにじみは別に表現しているので数は絞る）
  const pls = [
    { l: new THREE.PointLight(0xff8a3c, 14, 16, 2), p: [0, 2.4, 0], fl: 0.3 },
    { l: new THREE.PointLight(0xffb060, 10, 14, 2), p: [0, 4.6, -7.4], fl: 0.08 },
    { l: new THREE.PointLight(0xff9a50, 8, 12, 2), p: [0, 2.8, 13.6], fl: 0.2 },
    { l: new THREE.PointLight(0xffb070, 7, 14, 2), p: [0, 2.2, 6.5], fl: 0.1 },
  ];
  pls.forEach((o) => { o.l.position.set(...o.p); o.l.castShadow = false; group.add(o.l); });

  // ---- 人物 ----
  const agents = [];
  const add = (rig, o) => { const a = new Agent(rig, { ...o, scale: (o.scale ?? 1) * (rig.kind === 'shuten' ? 1 : 1.15) }); group.add(a.root); agents.push(a); return a; };

  // 酒呑童子（一人だけ）
  const shuten = add(buildShuten(), { x: 0, z: DAIS.z, y: DAIS.y, yaw: 0, scale: 1.25, name: '酒呑童子', script: [wait(Infinity, 'shuten')] });
  // 酌をする女
  add(buildWoman({ robe: 0xb8465f, accent: 0xe8c36a, obi: 0x2f3d78, bottle: true }), { x: -1.9, z: DAIS.z + 0.7, y: DAIS.y, yaw: 1.97, script: [{ t: 'wait', dur: Infinity, act: 'pour', face: 1.97 }] });
  // 寝殿で呑む鬼
  seats.forEach((s, i) => add(buildOni({ skin: i ? SKIN.midori : SKIN.ao, cup: true, horns: i ? 1 : 2 }), { x: s.x, z: s.z, y: FLOOR, yaw: s.yaw, scale: 1.2, script: [{ t: 'wait', dur: Infinity, act: 'drink', face: s.yaw }] }));
  // 琴
  add(buildWoman({ robe: 0x4e7a9a, accent: 0xe9d9a8, obi: 0xb83a24 }), { x: kx, z: kz - 0.75, y: FLOOR, yaw: 0, script: [{ t: 'wait', dur: Infinity, act: 'koto', face: 0 }] });
  // 扇を持つ女（寝殿の廊下を行き来）
  add(buildWoman({ robe: 0x7a5aa8, accent: 0xf0d8e0, obi: 0xe0b84a, fan: true }), {
    x: -3.8, z: -4.2, speed: 0.9, armMode: 'fan',
    script: [go(3.8, -4.2), wait(3, 'fanwave', PI), go(-3.8, -4.2), wait(3, 'fanwave', PI)],
  });
  // 膳を運ぶ女（寝殿 ↔ 庭の宴）
  add(buildWoman({ robe: 0x3f8a6a, accent: 0xf3e6b0, obi: 0xb83a24, tray: true }), {
    x: -2.4, z: -5.6, speed: 1.0, armMode: 'tray',
    script: [wait(2.5), go(-1.0, -3.6), go(0, -3.0), go(0, -2.0), go(-2.2, 0.7), go(-5.4, 0.9), wait(2.6, 'bow', -PI / 2), go(-2.2, 0.8), go(0, -1.8), go(0, -3.2), go(-2.4, -5.6)],
  });
  // 洗濯する女
  const wx = -7.0, wz = pondNorthZ(wx) - 0.6;
  add(buildWoman({ robe: 0xc9806a, accent: 0xf1e3c0, obi: 0x4a3a7a, cloth: true }), { x: wx, z: wz, yaw: 0, script: [{ t: 'wait', dur: Infinity, act: 'wash', face: 0 }] });
  // 橋を渡る二人連れ
  [[-0.4, 0xd88aa8, 0xf4e6c0, PI / 2], [0.4, 0x6a8ac0, 0xf4e6c0, -PI / 2]].forEach(([x, c1, c2, fc]) => {
    add(buildWoman({ robe: c1, accent: c2, obi: 0x7a1d24, fan: x > 0 }), {
      x, z: 2.0, speed: 0.8, armMode: x > 0 ? 'fan' : 'hands',
      script: [go(x, 6.0), go(x, 7.4), wait(4, 'talk', fc), go(x, 11.2), wait(3.6, 'talk', fc), go(x, 7.4), wait(2.5, 'talk', fc), go(x, 2.0), wait(2, 'talk', fc)],
    });
  });

  // 門番の鬼
  add(buildOni({ skin: SKIN.aka, club: true }), { x: -3.5, z: 11.9, yaw: 0, scale: 1.3, armMode: 'club', script: [wait(5, 'idle', 0), wait(0.9, 'stomp', 0), wait(2, 'idle', 0.6), wait(3.2, 'laugh', 0), wait(4, 'idle', -0.3)] });
  add(buildOni({ skin: SKIN.ao, club: true, horns: 1 }), { x: 3.5, z: 11.9, yaw: 0, scale: 1.3, armMode: 'club', script: [wait(3, 'idle', 0), wait(2.5, 'laugh', 0), wait(4.5, 'idle', -0.5), wait(0.9, 'stomp', 0), wait(2, 'idle', 0.3)] });
  // 見回りの鬼（提灯の棒）
  add(buildOni({ skin: SKIN.midori, pole: true }), { x: -11, z: 1.4, speed: 1.0, scale: 1.2, armMode: 'pole', script: [go(11, 1.4), wait(2.5, 'idle', PI / 2), go(-11, 1.4), wait(2.5, 'idle', -PI / 2)] });
  // 酒樽を運ぶ鬼
  const barrelRoute = [[0, 12.4], [0, 10.0], [0, 7.0], [0, 4.2], [0, 2.4], [-2.4, 0.6], [-1.6, -1.5], [0.2, -2.1], [0.2, -3.2], [2.6, -5.0]];
  add(buildOni({ skin: SKIN.ki, barrel: true }), {
    x: 0, z: 12.4, speed: 1.25, scale: 1.2, armMode: 'carry',
    script: [...barrelRoute.slice(1).map(([x, z]) => go(x, z)), wait(3, 'idle', PI), ...barrelRoute.slice(0, -1).reverse().map(([x, z]) => go(x, z)), wait(2.5, 'idle', 0)],
  });
  // 篝火を囲んで踊る鬼
  [[SKIN.aka, 0], [SKIN.midori, PI]].forEach(([c, ph], i) => add(buildOni({ skin: c, horns: i ? 1 : 2 }), {
    x: 0, z: 2.7, scale: 1.25, script: [{ t: 'orbit', cx: 0, cz: 0, r: 2.8, dir: 1, ph, dur: 1e9, act: 'dance', speed: 1.2 }],
  }));
  // 太鼓を打つ鬼
  const drummer = add(buildOni({ skin: SKIN.ao }), { x: 6.1, z: 0.5, yaw: PI / 2, scale: 1.3, script: [{ t: 'wait', dur: Infinity, act: 'drum', face: PI / 2 }] });
  // 小鬼（走り回る）
  const kp = [[-6, -0.8], [-3, 1.9], [3, -0.6], [5.5, 2.0], [2, -2.0], [-5, -2.2]];
  add(buildOni({ skin: SKIN.ki, horns: 1 }), { x: -6, z: -0.8, speed: 3.0, scale: 0.75, script: kp.flatMap(([x, z], i) => [go(x, z), ...(i % 2 ? [wait(0.5, 'idle')] : [])]) });

  // ---- 源頼光の一行（山伏姿） ----
  const party = [
    { name: '源頼光', robe: 0xf1ede2, sash: 0x1c2a5c, item: 'staff', sword: true, scale: 1.1, slot: [0, -6.7], mode: 'staff' },
    { name: '渡辺綱', robe: 0xf1ede2, sash: 0x2f6a4a, item: 'staff', slot: [-1.5, -6.0], mode: 'staff' },
    { name: '坂田金時', robe: 0xefe6d8, sash: 0xb83a24, item: 'axe', skin: 0xd98a6a, slot: [1.5, -6.0], mode: 'axe', scale: 1.1 },
    { name: '卜部季武', robe: 0xf1ede2, sash: 0xc08a30, item: 'staff', slot: [-2.8, -5.3], mode: 'staff' },
    { name: '碓井貞光', robe: 0xf1ede2, sash: 0x6a3a7a, item: 'staff', slot: [2.8, -5.3], mode: 'staff' },
    { name: '藤原保昌', robe: 0xe9e2f0, sash: 0x3a5a8a, item: 'flute', slot: [0, -5.2], mode: 'free' },
  ];
  const inPath = [[0, 13.6], [0, 11.8], [0, 9.0], [0, 6.0], [0, 3.0], [-2.3, 0.7], [-1.5, -1.5], [0, -2.1], [0, -3.3]];
  const visit = { active: false, nextAt: 14, running: 0 };
  const partyAgents = party.map((p, i) => {
    const a = add(buildMan(p), { x: 0, z: 15.2, scale: p.scale ?? 1, armMode: p.mode, speed: 1.3, active: false, name: p.name, loop: false });
    a.partyIndex = i; a.partyDef = p;
    return a;
  });
  const startVisit = () => {
    if (visit.active) return;
    visit.active = true; visit.running = partyAgents.length;
    partyAgents.forEach((a, i) => {
      const p = a.partyDef;
      a.script = [
        { t: 'jump', x: 0, z: 15.2, yaw: PI }, { t: 'show' },
        ...(i === 0 ? [{ t: 'say', msg: '源頼光の一行が、門前の霧の中から現れた', key: 'arrive' }] : []),
        ...inPath.map(([x, z]) => go(x, z)),
        go(p.slot[0], p.slot[1]),
        wait(0.4, 'idle', PI),
        wait(2.4, 'bow', PI),
        ...(i === 0 ? [{ t: 'say', msg: '一行、山伏に身をやつして寝殿に上がる', key: 'hall' }] : []),
        wait(10 + (i % 3), 'seiza', PI),
        wait(0.8, 'idle', PI),
        ...(i === 0 ? [{ t: 'say', msg: '宴を終え、一行は霧の中へ戻っていく', key: 'leave' }] : []),
        go(0, -3.3), go(0, -2.1), go(-1.5, -1.5), go(-2.3, 0.7), go(0, 3.0), go(0, 6.0), go(0, 9.0), go(0, 11.8), go(0, 13.6), go(0, 15.0),
        { t: 'hide' }, wait(1.6, 'idle'), { t: 'end' },
      ];
      a.onDone = () => { visit.running--; if (visit.running <= 0) { visit.active = false; visit.nextAt = T0.v + rnd(45, 85); } };
      a.start(i * 1.0);
    });
  };

  // ---- 文脈（人物から呼ばれる） ----
  const ctx = {
    pourK: 0, shutenOffer: 0,
    beat: (side) => { drumPulse = 1; },
    puff: (x, y, z) => puffs.spawn(x, y, z),
    say: (msg, agent, key) => { world.onSay?.(msg, key); },
  };
  let drumPulse = 0;

  const roof = { k: 0, target: 0 };
  const heads = garden.drum.userData.heads;

  const world = {
    group, agents, shuten, partyAgents, roof, ctx, startVisit, visit, onSay: null,
    labelTargets: [
      { name: '酒呑童子', cls: 'shuten', obj: shuten.rig.limbs.head, off: new THREE.Vector3(0, 1.5, 0), isVisible: () => true },
      { name: '源頼光', cls: 'raiko', obj: partyAgents[0].rig.limbs.head, off: new THREE.Vector3(0, 0.95, 0), isVisible: () => partyAgents[0].active && partyAgents[0].appear > 0.5 },
    ],
    setRoof(on) { roof.target = on ? 1 : 0; },
    update(dt, T, cam) {
      T0.v = T;
      const bob = Math.sin(T * 0.55) * 0.16;
      group.position.y = bob; group.rotation.z = Math.sin(T * 0.37) * 0.0035; group.rotation.x = Math.cos(T * 0.31) * 0.003;
      // 宴の時計（酒呑童子の盃 ↔ 酌の女を同期）
      const ph = T % 14;
      ctx.pourK = smooth((ph - 1.5) / 0.5) * (1 - smooth((ph - 3.2) / 0.5));
      for (const a of agents) a.update(dt, T, ctx);
      if (!visit.active && T >= visit.nextAt) startVisit();
      // 屋根
      roof.k += (roof.target - roof.k) * (1 - Math.exp(-dt * 3.2));
      const k = roof.k;
      bld.roofMain.visible = k > 0.015;
      bld.roofMain.position.y = (1 - k) * 3.2;
      for (const m of bld.roofMain.userData.mats) { m.opacity = k; m.transparent = k < 0.985; }
      // 演出
      updateLamps(T);
      FX.updateLampUniforms(T, bob);
      fires.update(T); leaves.update(T); clouds.update(T, cam); koi.update(T); puffs.update(dt);
      pls.forEach((o) => { o.l.intensity = (o.l.userData.base ??= o.l.intensity) * (1 + o.fl * Math.sin(T * 9 + o.p[0]) * Math.sin(T * 5.3)); });
      drumPulse *= Math.exp(-dt * 9);
      heads.forEach((h) => h.scale.setScalar(1 + drumPulse * 0.04));
      island.pebbles.forEach((p) => { p.mesh.position.y = p.base.y + Math.sin(T * 0.4 + p.ph) * 0.5; p.mesh.rotation.y += p.spin * dt; p.mesh.rotation.x = Math.sin(T * 0.3 + p.ph) * 0.2; });
    },
  };
  return world;
}
