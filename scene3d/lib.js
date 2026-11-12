import * as THREE from '../vendor/three/three.module.js';

/* 通用工具：材质、贴图、几何体、实例化 */
export const mat = (color, roughness = 0.85, metalness = 0, opts = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness, ...opts });

export function canvasTex(w, h, draw, repeat = [1, 1]) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat[0] !== 1 || repeat[1] !== 1) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
}

export const addMesh = (parent, geo, material, x = 0, y = 0, z = 0, cast = true, receive = true) => {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = cast;
  m.receiveShadow = receive;
  parent.add(m);
  return m;
};

export const box = (parent, w, h, d, material, x, y, z, ry = 0) => {
  const m = addMesh(parent, new THREE.BoxGeometry(w, h, d), material, x, y, z);
  m.rotation.y = ry;
  return m;
};

export const cyl = (parent, rt, rb, h, material, x, y, z, seg = 16) =>
  addMesh(parent, new THREE.CylinderGeometry(rt, rb, h, seg), material, x, y, z);

/* 一批同几何体同材质的东西 → 一个 InstancedMesh */
export function instanced(parent, geo, material, items, cast = true, receive = true) {
  const mesh = new THREE.InstancedMesh(geo, material, items.length);
  const d = new THREE.Object3D();
  const c = new THREE.Color();
  let colored = false;
  items.forEach((it, i) => {
    d.position.set(it.p[0], it.p[1], it.p[2]);
    d.scale.set(it.s ? it.s[0] : 1, it.s ? it.s[1] : 1, it.s ? it.s[2] : 1);
    d.rotation.set(it.r ? it.r[0] : 0, it.r ? it.r[1] : 0, it.r ? it.r[2] : 0);
    d.updateMatrix();
    mesh.setMatrixAt(i, d.matrix);
    if (it.c) { mesh.setColorAt(i, c.set(it.c)); colored = true; }
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (colored) mesh.instanceColor.needsUpdate = true;
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  parent.add(mesh);
  return mesh;
}

export const rng = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
