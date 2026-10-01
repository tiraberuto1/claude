// 演出: 灯りでにじむ霧・水面・炎と火の粉・鬼火・舞い散る紅葉・島の下の雲・錦鯉
import * as THREE from 'three';
import { vnoise, cloudTexture, rnd, mulberry32, M } from './util.js';
import { lamps, MAX_LAMPS } from './lights.js';
import { ISLAND, POND, pondRadiusPoint, POND_ISLE } from './layout.js';

// ---- 灯りユニフォーム（霧と水面で共有） ----
export const lampUniforms = {
  uLampP: { value: Array.from({ length: MAX_LAMPS }, () => new THREE.Vector4()) },
  uLampC: { value: Array.from({ length: MAX_LAMPS }, () => new THREE.Vector4()) },
  uCount: { value: 0 },
  uTime: { value: 0 },
};
export function updateLampUniforms(t, bobY) {
  lampUniforms.uTime.value = t;
  lampUniforms.uCount.value = Math.min(MAX_LAMPS, lamps.length);
  for (let i = 0; i < lampUniforms.uCount.value; i++) {
    const l = lamps[i];
    lampUniforms.uLampP.value[i].set(l.pos.x, l.pos.y + bobY, l.pos.z, 2.3 * l.size + 0.6);
    const k = l.power * l.f;
    lampUniforms.uLampC.value[i].set(l.col.r * k, l.col.g * k, l.col.b * k, 0.55 * k);
  }
}

const NOISE_GLSL = /* glsl */`
float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float s=0., a=.5; for(int i=0;i<4;i++){ s+=a*vn(p); p*=2.03; a*=.5; } return s; }
`;

// ---- 霧: 低く漂う層。ランプの色を拾ってにじむ ----
export function makeMist() {
  const group = new THREE.Group();
  const layers = [[0.2, 0.28, 1.3], [0.62, 0.22, 7.7], [1.05, 0.18, 3.1], [1.6, 0.1, 11.2]];
  const mats = [];
  for (const [y, alpha, seed] of layers) {
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: {
        ...lampUniforms, uAlpha: { value: alpha }, uSeed: { value: seed }, uCol: { value: new THREE.Vector3(0.36, 0.43, 0.58) },
        uExt: { value: new THREE.Vector2(ISLAND.A * 1.02, ISLAND.B * 1.02) },
      },
      vertexShader: `varying vec3 vW; void main(){ vec4 wp=modelMatrix*vec4(position,1.); vW=wp.xyz; gl_Position=projectionMatrix*viewMatrix*wp; }`,
      fragmentShader: /* glsl */`
        precision highp float;
        #define MAXL ${MAX_LAMPS}
        uniform float uTime, uAlpha, uSeed; uniform vec3 uCol; uniform vec2 uExt;
        uniform vec4 uLampP[MAXL]; uniform vec4 uLampC[MAXL]; uniform int uCount;
        varying vec3 vW;
        ${NOISE_GLSL}
        void main(){
          vec2 p = vW.xz*0.15 + uSeed;
          vec2 w = vec2(fbm(p*1.3+vec2(uTime*0.03,0.)), fbm(p*1.1-vec2(0.,uTime*0.026)));
          float n = fbm(p + 1.7*w + vec2(uTime*0.018, -uTime*0.011));
          float d = smoothstep(0.30,0.74,n);
          vec2 q = vW.xz/uExt; float e = pow(pow(abs(q.x),6.)+pow(abs(q.y),6.),1./6.);
          float mask = 1.-smoothstep(0.80,1.12,e);
          vec2 pq=(vW.xz-vec2(0.,7.))/vec2(12.,5.5);
          float pond = 1.-smoothstep(0.5,1.25,length(pq));
          d *= mask*(0.6+0.2*pond);
          vec3 warm=vec3(0.); float gl=0.;
          for(int i=0;i<MAXL;i++){ if(i>=uCount) break;
            vec3 dv=vW-uLampP[i].xyz; float g=exp(-dot(dv,dv)/(uLampP[i].w*uLampP[i].w));
            warm+=uLampC[i].rgb*g; gl+=g*uLampC[i].a; }
          warm = vec3(1.)-exp(-warm*0.8);
          gl = 1.-exp(-gl*0.9);
          float a = d*uAlpha*(1.+0.7*gl) + 0.07*gl*mask;
          vec3 col = uCol*(0.8+0.25*d) + warm*0.7*(0.35+d);
          col = min(col, vec3(0.97));
          a *= smoothstep(-0.05, 0.45, normalize(cameraPosition - vW).y);
          gl_FragColor = vec4(col, clamp(a,0.,0.7));
        }`,
    });
    mats.push(mat);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(ISLAND.A * 2.6, ISLAND.B * 2.6), mat);
    m.rotation.x = -Math.PI / 2; m.position.y = y; m.renderOrder = 4;
    group.add(m);
  }
  return { group };
}

// ---- 水面 ----
export function makeWater(y = 0.14) {
  const pts = [];
  const N = 90;
  const pos = [POND.cx, y, POND.cz];
  for (let i = 0; i < N; i++) { const [x, z] = pondRadiusPoint((i / N) * Math.PI * 2, 1.0); pos.push(x, y, z); }
  const idx = [];
  for (let i = 0; i < N; i++) idx.push(0, 1 + ((i + 1) % N), 1 + i);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(Array.from({ length: pos.length / 3 }, () => [0, 1, 0]).flat(), 3));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: { ...lampUniforms, uY: { value: y } },
    vertexShader: `varying vec3 vW; void main(){ vec4 wp=modelMatrix*vec4(position,1.); vW=wp.xyz; gl_Position=projectionMatrix*viewMatrix*wp; }`,
    fragmentShader: /* glsl */`
      precision highp float;
      #define MAXL ${MAX_LAMPS}
      uniform float uTime; uniform vec4 uLampP[MAXL]; uniform vec4 uLampC[MAXL]; uniform int uCount;
      varying vec3 vW;
      float H(vec2 p){ float t=uTime;
        return sin(p.x*1.9+t*0.8)*0.5 + sin(p.y*2.4-t*0.65)*0.5 + sin((p.x+p.y)*3.3+t*1.2)*0.3 + sin((p.x-p.y*1.3)*5.1-t*1.7)*0.18; }
      void main(){
        vec2 p=vW.xz; float e=0.04;
        float h0=H(p), hx=H(p+vec2(e,0.)), hz=H(p+vec2(0.,e));
        vec3 n=normalize(vec3((h0-hx)*0.07,1.,(h0-hz)*0.07));
        vec3 V=normalize(cameraPosition-vW);
        float fres=pow(1.-max(dot(n,V),0.),3.)*0.85+0.05;
        vec3 R=reflect(-V,n);
        vec3 sky=mix(vec3(0.1,0.13,0.2), vec3(0.34,0.39,0.5), smoothstep(-0.05,0.9,R.y));
        vec3 deep=vec3(0.02,0.07,0.11);
        vec3 col=mix(deep, sky, fres+0.1);
        for(int i=0;i<MAXL;i++){ if(i>=uCount) break;
          vec3 L=uLampP[i].xyz; vec3 toL=L-vW; float t=dot(toL,R);
          if(t>0.){ vec3 c=vW+R*t; float d=length(c-L); float s2=0.22+0.05*t;
            float g=exp(-d*d/s2); col+=uLampC[i].rgb*g*1.7/(1.+0.04*t); } }
        float a=mix(0.5,0.92,fres);
        gl_FragColor=vec4(col,a);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 2;
  // 池の底
  const bed = new THREE.Mesh(geo.clone().translate(0, -(y - 0.03), 0), new THREE.MeshStandardMaterial({ color: 0x1a2f3a, roughness: 1 }));
  bed.receiveShadow = true;
  const g = new THREE.Group(); g.add(bed, mesh);
  return g;
}

// ---- 炎と火の粉 ----
function flameGeo(h, r) {
  const g = new THREE.ConeGeometry(r, h, 8, 4, true);
  g.translate(0, h / 2, 0);
  g.userData.h = h;
  return g;
}
const flameMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  vertexShader: /* glsl */`
    varying float vH; varying vec3 vN; varying vec3 vV;
    attribute float aH;
    void main(){
      vH = clamp(position.y / aH, 0., 1.);
      vN = normalMatrix * normal;
      vec4 mv = modelViewMatrix * vec4(position, 1.);
      vV = -mv.xyz;
      gl_Position = projectionMatrix * mv; }`,
  fragmentShader: /* glsl */`
    varying float vH; varying vec3 vN; varying vec3 vV;
    void main(){
      float rim = abs(dot(normalize(vN), normalize(vV)));
      float a = pow(rim, 0.8) * (1. - pow(vH, 1.6)) * 0.5;
      vec3 col = mix(vec3(1., .36, .06), vec3(1., .86, .38), pow(vH, .8)) * 1.15;
      gl_FragColor = vec4(col, a); }`,
});

export function makeFires(list) {
  const group = new THREE.Group();
  const flames = [];
  const emberMat = (size) => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: lampUniforms.uTime, uSize: { value: size } },
    vertexShader: /* glsl */`
      attribute vec4 aSeed; uniform float uTime, uSize; varying float vA;
      void main(){
        float life = fract(uTime*(0.14+aSeed.w*0.12) + aSeed.x);
        vec3 p = position + vec3(sin(uTime*1.3+aSeed.y*20.)*0.35*life + (aSeed.y-0.5)*0.5*life, life*(2.6+aSeed.z*2.6), cos(uTime*1.1+aSeed.z*17.)*0.35*life + (aSeed.z-0.5)*0.5*life);
        vA = (1.-life)*smoothstep(0.,0.05,life);
        vec4 mv = modelViewMatrix*vec4(p,1.);
        gl_PointSize = uSize*(0.5+aSeed.w)*(1.-life*0.6)*(120./-mv.z);
        gl_Position = projectionMatrix*mv; }`,
    fragmentShader: /* glsl */`
      varying float vA;
      void main(){ vec2 c=gl_PointCoord-.5; float d=length(c); if(d>.5) discard;
        gl_FragColor=vec4(vec3(1.,.55,.18)*2.2, vA*smoothstep(.5,.0,d)); }`,
  });
  for (const f of list) {
    const g = new THREE.Group(); g.position.set(f.x, f.y, f.z);
    const cones = [];
    const defs = [[0, 0, 1.0, 0.34], [0.22, 0.1, 0.72, 0.24], [-0.2, 0.12, 0.8, 0.26], [0.05, -0.22, 0.66, 0.22], [-0.1, -0.15, 0.9, 0.28]];
    defs.forEach(([x, z, h, r], i) => {
      const fg = flameGeo(h * 1.5 * f.s, r * f.s); fg.setAttribute('aH', new THREE.BufferAttribute(new Float32Array(fg.attributes.position.count).fill(fg.userData.h), 1));
      const m = new THREE.Mesh(fg, flameMat);
      m.position.set(x * f.s, 0, z * f.s); m.renderOrder = 5;
      g.add(m); cones.push({ m, ph: Math.random() * 10, sp: 5 + Math.random() * 4 });
    });
    group.add(g); flames.push({ cones, s: f.s });
    // 火の粉
    const n = f.embers, arr = new Float32Array(n * 3), seed = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) { arr[i * 3] = (Math.random() - 0.5) * 0.5 * f.s; arr[i * 3 + 1] = 0.2; arr[i * 3 + 2] = (Math.random() - 0.5) * 0.5 * f.s; seed.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4); }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(arr, 3)); pg.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
    const pts = new THREE.Points(pg, emberMat(f.s > 1 ? 7 : 5)); pts.frustumCulled = false;
    g.add(pts);
  }
  return {
    group,
    update(t) {
      for (const f of flames) for (const c of f.cones) {
        const n = vnoise(t * c.sp + c.ph, c.ph) * 2 - 1;
        c.m.scale.set(1 + 0.12 * n, 0.82 + 0.3 * (n * 0.5 + 0.5) + 0.08 * Math.sin(t * c.sp * 1.7 + c.ph), 1 + 0.12 * n);
        c.m.rotation.z = 0.14 * Math.sin(t * c.sp * 0.8 + c.ph); c.m.rotation.x = 0.1 * Math.cos(t * c.sp * 0.7 + c.ph);
      }
    },
  };
}

// ---- 鬼火 ----
export function makeOnibi(n = 18) {
  const arr = new Float32Array(n * 3), seed = new Float32Array(n * 4);
  const r = mulberry32(31);
  for (let i = 0; i < n; i++) {
    const th = r() * Math.PI * 2, d = 0.4 + r() * 0.85;
    const [x, z] = pondRadiusPoint(th, d * 1.15);
    arr.set([x, 0.8 + r() * 1.4, z], i * 3);
    seed.set([r(), r(), r(), r()], i * 4);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(arr, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: lampUniforms.uTime },
    vertexShader: /* glsl */`
      attribute vec4 aSeed; uniform float uTime; varying float vA;
      void main(){
        float t=uTime*(0.25+aSeed.w*0.3)+aSeed.x*30.;
        vec3 p=position+vec3(sin(t)*1.8+sin(t*2.3)*0.4, sin(t*1.7+aSeed.y*9.)*0.5, cos(t*0.9)*1.3);
        vA=0.55+0.45*sin(uTime*(2.+aSeed.z*3.)+aSeed.y*20.);
        vec4 mv=modelViewMatrix*vec4(p,1.);
        gl_PointSize=(13.+aSeed.z*8.)*(120./-mv.z);
        gl_Position=projectionMatrix*mv; }`,
    fragmentShader: /* glsl */`
      varying float vA;
      void main(){ vec2 c=gl_PointCoord-.5; float d=length(c); if(d>.5) discard;
        float core=smoothstep(.2,.0,d); float halo=smoothstep(.5,.0,d);
        gl_FragColor=vec4(mix(vec3(.2,.5,1.0),vec3(.8,.93,1.),core)*(1.0+core*0.9), vA*halo*0.6); }`,
  });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false; pts.renderOrder = 8;
  return { group: pts };
}

// ---- 舞い散る紅葉 ----
export function makeLeaves(spots, n = 70) {
  const geo = new THREE.PlaneGeometry(0.34, 0.24);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, side: THREE.DoubleSide });
  const mesh = new THREE.InstancedMesh(geo, mat, n);
  const cols = [0xc23a22, 0xe0612a, 0xe9993a, 0xb12d1e].map((h) => new THREE.Color(h));
  const data = [];
  for (let i = 0; i < n; i++) {
    mesh.setColorAt(i, cols[i % 4]);
    const sp = spots[i % spots.length];
    data.push({ sx: sp[0], sz: sp[1], t0: Math.random() * 20, v: 0.35 + Math.random() * 0.35, sw: 0.5 + Math.random() * 1.2, ph: Math.random() * 6.28, spin: 1 + Math.random() * 3, drift: (Math.random() - 0.5) * 1.2 });
  }
  mesh.instanceColor.needsUpdate = true;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3(1, 1, 1);
  mesh.frustumCulled = false;
  return {
    group: mesh,
    update(t) {
      data.forEach((d, i) => {
        const H = 7;
        const life = ((t * d.v + d.t0) % H);
        const y = H - life;
        const x = d.sx + Math.sin(t * 0.6 * d.sw + d.ph) * 1.4 + d.drift * life * 0.7;
        const z = d.sz + Math.cos(t * 0.5 * d.sw + d.ph) * 1.2 + 0.4 * life;
        e.set(t * d.spin + d.ph, t * d.spin * 0.7, Math.sin(t + d.ph) * 0.8);
        q.setFromEuler(e); p.set(x, y + 0.05, z);
        const sc = Math.min(1, y * 2 + 0.2) * Math.min(1, life * 2);
        s.setScalar(Math.max(0.001, sc));
        m4.compose(p, q, s); mesh.setMatrixAt(i, m4);
      });
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

// ---- 島の下の雲 ----
export function makeClouds(n = 20) {
  const group = new THREE.Group();
  const tex = cloudTexture(256, 11), tex2 = cloudTexture(256, 23);
  const items = [];
  const r = mulberry32(99);
  for (let i = 0; i < n; i++) {
    const mat = new THREE.SpriteMaterial({ map: i % 2 ? tex : tex2, color: new THREE.Color(0.9, 0.93, 0.98), transparent: true, opacity: 0.32 + r() * 0.2, depthWrite: false, fog: false });
    const s = new THREE.Sprite(mat);
    const a = r() * Math.PI * 2, d = 12 + r() * 22;
    s.scale.set(14 + r() * 14, 8 + r() * 6, 1);
    const base = new THREE.Vector3(Math.cos(a) * d * 1.15, -7 - r() * 11, Math.sin(a) * d * 0.9);
    s.position.copy(base); s.renderOrder = 1;
    group.add(s); items.push({ s, base, ph: r() * 10, sp: 0.05 + r() * 0.07, amp: 1.5 + r() * 2.5, op: mat.opacity });
  }
  return { group, update(t, cam) { for (const c of items) { c.s.position.x = c.base.x + Math.sin(t * c.sp + c.ph) * c.amp; c.s.position.z = c.base.z + Math.cos(t * c.sp * 0.8 + c.ph) * c.amp * 0.6; c.s.position.y = c.base.y + Math.sin(t * 0.3 + c.ph) * 0.4;
    if (cam) { const d = c.s.position.distanceTo(cam.position); const k = Math.min(1, Math.max(0, (d - 16) / 26)); c.s.material.opacity = c.op * k * k * (3 - 2 * k); c.s.visible = c.s.material.opacity > 0.01; } } } };
}

// ---- 錦鯉 ----
export function makeKoi() {
  const group = new THREE.Group();
  const koi = [];
  const specs = [[0xe8553a, 0xf4efe6, 0], [0xf4efe6, 0xe0612a, 1], [0x2a2a30, 0xf4efe6, 2], [0xe9b23a, 0xf4efe6, 3], [0xe8553a, 0x2a2a30, 4]];
  specs.forEach(([c1, c2, k]) => {
    const g = new THREE.Group();
    const m1 = new THREE.MeshStandardMaterial({ color: c1, roughness: 0.5 }), m2 = new THREE.MeshStandardMaterial({ color: c2, roughness: 0.5 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), m1); body.scale.set(0.34, 0.2, 1.0); g.add(body);
    const patch = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), m2); patch.scale.set(0.3, 0.2, 0.42); patch.position.set(0, 0.03, 0.06); g.add(patch);
    const tail = new THREE.Group(); tail.position.z = -0.45;
    const tf1 = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 4), m1); tf1.rotation.x = -Math.PI / 2; tf1.scale.y = 0.2; tf1.position.z = -0.22; tf1.scale.set(1, 1, 0.25); tail.add(tf1);
    g.add(tail);
    g.scale.setScalar(0.85 + k * 0.08);
    g.position.y = 0.075;
    group.add(g);
    koi.push({ g, tail, cx: (k - 2) * 1.2, cz: POND.cz + (k % 2 ? 0.4 : -0.3), ax: 5 + (k % 3) * 1.4, az: 2.2 + (k % 2) * 0.4, w: (0.12 + k * 0.012) * (k % 2 ? 1 : -1), ph: k * 1.7 });
  });
  return {
    group,
    update(t) {
      for (const k of koi) {
        const a = t * k.w + k.ph;
        const x = k.cx + Math.cos(a) * k.ax, z = k.cz + Math.sin(a) * k.az;
        const dx = -Math.sin(a) * k.ax * k.w, dz = Math.cos(a) * k.az * k.w;
        k.g.position.x = x; k.g.position.z = z;
        k.g.rotation.y = Math.atan2(dx, dz);
        k.tail.rotation.y = Math.sin(t * 4 + k.ph) * 0.5;
      }
    },
  };
}

// ---- 霧の湧き（現れ・消え） ----
export function makePuffs(n = 6) {
  const group = new THREE.Group();
  const tex = cloudTexture(256, 5);
  const pool = [];
  for (let i = 0; i < n; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: new THREE.Color(0.82, 0.87, 0.95), transparent: true, opacity: 0, depthWrite: false }));
    s.visible = false; s.renderOrder = 9; group.add(s); pool.push({ s, t: 99, dur: 2.6 });
  }
  return {
    group,
    spawn(x, y, z) { const p = pool.find((q) => q.t > q.dur) || pool[0]; p.t = 0; p.s.position.set(x, y + 1.4, z); p.s.visible = true; },
    update(dt) {
      for (const p of pool) {
        if (p.t > p.dur) { p.s.visible = false; continue; }
        p.t += dt; const u = p.t / p.dur;
        p.s.scale.setScalar(4 + u * 6); p.s.material.opacity = 0.85 * Math.sin(Math.PI * Math.min(1, u * 1.1)) ** 1.2;
      }
    },
  };
}
