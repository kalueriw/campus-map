import * as THREE from '../vendor/three/three.module.js';
import { mat, addMesh, box, cyl, instanced, rng } from './lib.js';
import { BUILDINGS } from './data.js';

/* ───────── 植物与街道家具 ───────── */

const rnd = rng(90210);
const R = (a, b) => a + rnd() * (b - a);

/* 道路和人行道扫出来的地面。site.js 按曲线逐点交回 [x, z, 半径]，这里
   直接拿来当禁种区——比手写矩形准，路弯到哪里，树就退到哪里。 */
let RIBBONS = [];

/* 剩下几处不是带状的地方：门口广场、停车位 */
const ROADS = [
  [-70, 20, 120, 40],        /* the gate forecourt */
  [240, -150, 40, 100]       /* the parking bay */
];
const YARDS = [
  /* the buildings, with a margin for their aprons */
  ...BUILDINGS.filter((b) => b.kind !== 'lake').map((b) => [b.x, b.z, b.w + 12, b.d + 12]),
  /* the lake, its bank and the jogging ring */
  [154.7, -63.8, 74, 84],
  /* the running track and its bank */
  [-286.1, -63.9, 112, 152],
  /* the courts, their hedges and the two pools */
  [-217.3, -66.5, 82, 152],
  /* the paved aprons and the forecourts */
  [-104, -20, 96, 34],
  [-104, -31, 90, 64],   /* welcome-center building, canopy and east-side planter */
  [-70, -78, 100, 14],
  [-70, -152, 110, 14],
  [10, -122, 100, 14],
  [10, -78, 100, 14],
  [40, -100, 90, 90],
  [175, -100, 60, 70],
  [175, -180, 60, 60],
  [190, -40, 40, 30],
  [240, -150, 40, 100],
  [-140, 24, 40, 24]
];

/* The site plate, in scene metres: plan x 8..1956, y 8..694. */
const SITE = { x0: -88 + (8 - 788) * 0.3375, x1: -88 + (1956 - 788) * 0.3375,
               z0: -110 + (8 - 290) * 0.3375, z1: -110 + (694 - 290) * 0.3375 };

/* 一条带子上的点，落进禁种区没有 */
const BLOCK_GRID = 4;
const blockCells = new Set();
let gridReady = false;

function primeGrid() {
  const key = (i, j) => i * 100003 + j;
  for (const list of RIBBONS) {
    for (const [x, z, r] of list) {
      const i0 = Math.floor((x - r) / BLOCK_GRID);
      const i1 = Math.floor((x + r) / BLOCK_GRID);
      const j0 = Math.floor((z - r) / BLOCK_GRID);
      const j1 = Math.floor((z + r) / BLOCK_GRID);
      for (let i = i0; i <= i1; i++) {
        for (let j = j0; j <= j1; j++) { blockCells.add(key(i, j)); }
      }
    }
  }
  gridReady = true;
}

/* All vegetation uses the same road mask, including fixed specimens and the
   exterior belt. Radius includes crown/frond overhang, not just the trunk. */
function onRoute(x, z, radius = 0) {
  if (!gridReady) primeGrid();
  for (let i = Math.floor((x - radius) / BLOCK_GRID); i <= Math.floor((x + radius) / BLOCK_GRID); i++) {
    for (let j = Math.floor((z - radius) / BLOCK_GRID); j <= Math.floor((z + radius) / BLOCK_GRID); j++) {
      if (blockCells.has(i * 100003 + j)) return true;
    }
  }
  for (const [cx, cz, w, d] of ROADS) {
    if (Math.abs(x - cx) < w / 2 + radius && Math.abs(z - cz) < d / 2 + radius) return true;
  }
  return false;
}

function blocked(x, z, radius = 0) {
  if (x < SITE.x0 + 2 || x > SITE.x1 - 2 || z < SITE.z0 + 2 || z > SITE.z1 - 2) return true;
  if (onRoute(x, z, radius)) return true;
  for (const [cx, cz, w, d] of YARDS) {
    if (Math.abs(x - cx) < w / 2 + radius && Math.abs(z - cz) < d / 2 + radius) return true;
  }
  return false;
}

export function plantTrees(scene, ribbons) {
  RIBBONS = ribbons || [];
  blockCells.clear();
  gridReady = false;
  /* The site's fixed court hedges predate this scatter. Apply the same mask
     to their instances too, without changing the courts or other site models. */
  scene.updateMatrixWorld(true);
  const matrix = new THREE.Matrix4(), world = new THREE.Matrix4();
  const position = new THREE.Vector3(), scale = new THREE.Vector3(), rotation = new THREE.Quaternion();
  scene.traverse((mesh) => {
    if (!mesh.isInstancedMesh || mesh.material.color?.getHexString() !== '4f7345') return;
    for (let i = 0; i < mesh.count; i++) {
      mesh.getMatrixAt(i, matrix);
      world.multiplyMatrices(mesh.matrixWorld, matrix).decompose(position, rotation, scale);
      if (onRoute(position.x, position.z, Math.hypot(scale.x, scale.z) / 2)) {
        matrix.scale(new THREE.Vector3(0, 0, 0));
        mesh.setMatrixAt(i, matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  });
  const g = new THREE.Group();
  scene.add(g);

  const trunks = [], crowns = [];
  const spots = [];
  for (let i = 0; i < 300; i++) {
    const x = R(-355, 306), z = R(-205, 28);
    if (blocked(x, z)) continue;
    spots.push([x, z]);
  }
  /* the avenue either side of the main approach, and the path up campus */
  for (let z = 6; z >= -8; z -= 8) spots.push([-92, z], [-40, z]);
  for (let x = -230; x <= -60; x += 14) spots.push([x, -56], [x, -70]);

  const stakes = [];
  spots.forEach(([x, z], i) => {
    const h = R(6.5, 10.0), r = R(2.4, 3.4);
    if (blocked(x, z, r * 1.05 + 2.3)) return;
    trunks.push({ p: [x, h / 2, z], s: [R(0.3, 0.5), h, R(0.3, 0.5)] });
    /* 三脚支撑，照片里每棵新栽的树都有 */
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + 0.4;
      stakes.push({
        p: [x + Math.cos(a) * 0.75, h * 0.28, z + Math.sin(a) * 0.75],
        s: [0.06, h * 0.58, 0.06], r: [Math.cos(a) * 0.34, 0, -Math.sin(a) * 0.34]
      });
    }
    for (let k = 0; k < 3; k++) {
      crowns.push({
        p: [x + R(-1.6, 1.6), h + R(-0.8, 1.8), z + R(-1.6, 1.6)],
        s: [r * R(0.72, 1.05), r * R(0.62, 0.92), r * R(0.72, 1.05)],
        c: i % 3 === 0 ? '#4f7146' : i % 3 === 1 ? '#5d8050' : '#456538'
      });
    }
  });

  /* 围墙外的林带，压住边界 */
  for (let i = 0; i < 420; i++) {
    const side = i % 4;
    let x, z;
    const s0 = -88 + (8 - 788) * 0.3375, s1 = -88 + (1956 - 788) * 0.3375;
    const t0 = -110 + (8 - 290) * 0.3375, t1 = -110 + (694 - 290) * 0.3375;
    /* 墙是实的，树只能长在墙外，不能探进校园这一侧 */
    if (side === 0) { x = R(s0 + 3, s1 - 3); z = R(t1 + 3, t1 + 13); }
    else if (side === 1) { x = R(s0 + 3, s1 - 3); z = R(t0 - 13, t0 - 3); }
    else if (side === 2) { x = R(s0 - 13, s0 - 3); z = R(t0 + 10, t1 - 10); }
    else { x = R(s1 + 3, s1 + 13); z = R(t0 + 10, t1 - 10); }
    const h = R(8, 14), r = R(3.5, 5.5);
    if (onRoute(x, z, r + 2.2)) continue;
    trunks.push({ p: [x, h / 2, z], s: [0.4, h, 0.4] });
    for (let k = 0; k < 2; k++) {
      crowns.push({
        p: [x + R(-1.5, 1.5), h + R(-0.6, 1.6), z + R(-1.5, 1.5)],
        s: [r, r * 0.8, r], c: i % 2 ? '#48663f' : '#3f5c38'
      });
    }
  }
  instanced(g, new THREE.CylinderGeometry(0.6, 1, 1, 6), mat('#7a5a3f', 0.95), trunks);
  instanced(g, new THREE.CylinderGeometry(1, 1, 1, 4), mat('#8b6b45', 0.95), stakes, false, false);
  instanced(g, new THREE.SphereGeometry(1, 9, 7), mat('#ffffff', 0.92), crowns);

  /* 棕榈 */
  const palmAt = [
    [-64, 12], [-40, 12], [4, 12], [28, 12],
    [-72, -70], [-40, -70], [96, -112], [128, -112],
    [236, -196], [236, -156], [150, -112], [30, -150],
    [-190, -6], [-150, -6]
  ];
  const pTrunk = [], pLeaf = [];
  palmAt.forEach(([x, z]) => {
    if (blocked(x, z, 5)) return;
    const h = R(7, 10);
    pTrunk.push({ p: [x, h / 2, z], s: [0.36, h, 0.36] });
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + R(-0.1, 0.1);
      pLeaf.push({
        p: [x + Math.cos(a) * 2.1, h + R(-0.2, 0.4), z + Math.sin(a) * 2.1],
        s: [5.0, 0.18, 0.95], r: [0, -a, R(0.18, 0.42)]
      });
    }
  });
  instanced(g, new THREE.CylinderGeometry(0.7, 1, 1, 7), mat('#8a7052', 0.95), pTrunk);
  instanced(g, new THREE.BoxGeometry(1, 1, 1), mat('#4f7a45', 0.9), pLeaf);

  /* 灌木 */
  const shrubs = [];
  for (let i = 0; i < 700; i++) {
    const x = R(-355, 306), z = R(-205, 28);
    if (blocked(x, z)) continue;
    const s = R(1.0, 2.0);
    if (blocked(x, z, s * 1.5)) continue;
    shrubs.push({ p: [x, s * 0.55, z], s: [s * 1.5, s * 0.85, s * 1.5], c: i % 5 === 0 ? '#7a6a3f' : '#527647' });
  }
  /* Welcome-center flowerbed: kept on the east side of the building, clear
     of the entrance road and its paved forecourt. */
  for (let i = 0; i < 42; i++) {
    const a = rnd() * Math.PI * 2, rad = Math.sqrt(rnd()) * 3.0;
    const x = 12 + Math.cos(a) * rad, z = -26 + Math.sin(a) * rad;
    if (blocked(x, z, 0.8) || onRoute(x, z, 1)) continue;
    shrubs.push({ p: [x, 0.45, z], s: [0.72, 0.38, 0.72], c: i % 3 ? '#7d3f5e' : '#8f4a6b' });
  }
  instanced(g, new THREE.IcosahedronGeometry(1, 1), mat('#ffffff', 0.95), shrubs);

  /* 草丛 */
  const tufts = [];
  for (let i = 0; i < 4200; i++) {
    const x = R(-355, 306), z = R(-205, 28);
    if (blocked(x, z, 0.15)) continue;
    tufts.push({ p: [x, 0.12, z], s: [R(0.5, 1.1), R(0.5, 1.3), R(0.5, 1.1)], r: [0, rnd() * 6.28, 0] });
  }
  instanced(g, new THREE.ConeGeometry(0.07, 0.34, 3), mat('#75904f', 1), tufts, false);
  return g;
}

/* Hedges, planters and the scooter rank. The lamps, benches, bollards and
   parked cars are part of the site (site.js), so they are not repeated here. */
export function streetFurniture(scene) {
  const g = new THREE.Group();
  scene.add(g);

  /* hedge runs along the aprons of the teaching buildings and the axis */
  const hedge = [];
  for (let x = -118; x <= -60; x += 2.6) hedge.push({ p: [x, 0.55, -84], s: [2.2, 1.1, 1.5] });
  for (let x = 8; x <= 76; x += 2.6) hedge.push({ p: [x, 0.55, -84], s: [2.2, 1.1, 1.5] });
  for (let z = -30; z >= -70; z -= 2.6) hedge.push({ p: [-176, 0.55, z], s: [1.5, 1.1, 2.2] });
  for (let z = -128; z >= -160; z -= 2.6) hedge.push({ p: [206, 0.55, z], s: [1.5, 1.1, 2.2] });
  instanced(g, new THREE.BoxGeometry(1, 1, 1), mat('#4f7345', 0.95), hedge.filter(({ p, s }) => !onRoute(p[0], p[2], Math.hypot(s[0], s[2]) / 2)), false);

  /* shared scooters in ranks, where students leave them */
  const escooters = [];
  for (let i = 0; i < 26; i++) {
    const x = -120 + (i % 13) * 1.6;
    const z = -74 + Math.floor(i / 13) * 2.3;
    if (onRoute(x, z, 1.2)) continue;
    escooters.push({ p: [x, 0.55, z], s: [0.45, 0.95, 1.55], r: [0, 0.1, 0] });
  }
  instanced(g, new THREE.BoxGeometry(1, 1, 1), mat('#2f8f86', 0.6), escooters);

  /* low planters along the gate forecourt */
  const planters = [];
  for (let i = 0; i < 8; i++) {
    planters.push({ p: [-8 + i * 9, 0.42, 10], s: [7.4, 0.84, 1.4] });
  }
  instanced(g, new THREE.BoxGeometry(1, 1, 1), mat('#bdb7a8', 0.9), planters);
  return g;
}
