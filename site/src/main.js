import * as THREE from 'three';
import { pieces } from './pieces/index.js';
const W = 680, H = 247;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const cam = new THREE.OrthographicCamera(0, W, 0, H, -100, 100); // y 下向き=画像座標
pieces.forEach((p, i) => {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  p.draw(c.getContext('2d'), W, H);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.minFilter = t.magFilter = THREE.NearestFilter; t.flipY = false; t.generateMipmaps = false;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(W, H),
    new THREE.MeshBasicMaterial({ map: t, transparent: true, depthTest: false, side: THREE.DoubleSide }));
  m.position.set(W / 2, H / 2, 0); m.renderOrder = i; m.name = p.name; scene.add(m);
});
renderer.render(scene, cam); // t=0 静止
window.__ready = true;
