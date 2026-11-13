import * as THREE from '../vendor/three/three.module.js';
import { mat, canvasTex, addMesh, box, cyl, instanced } from './lib.js';

/* ───────── 建筑：立面贴图 + 体量 + 标志性构件 ───────── */

export const NIGHT_MATS = [];

const FLOOR = 4.2;
const GROUND = 4.4;

const COL = {
  white: '#eceae1',
  band: '#dcd7ca',
  glass: '#35474f',
  orange: '#c46b3d',
  teal: '#1f6f66',
  yellow: '#f0b428',
  roof: '#cfcabd',
  plinth: '#3a3a38'
};

/* 一个开间 × 一层的立面单元 */
function tile(kind) {
  return canvasTex(256, 256, (g) => {
    g.fillStyle = COL.white;
    g.fillRect(0, 0, 256, 256);

    /* 窗 */
    const wx = 16, wy = 30, ww = 224, wh = 150;
    g.fillStyle = COL.glass;
    g.fillRect(wx, wy, ww, wh);
    const gr = g.createLinearGradient(0, wy, 0, wy + wh);
    gr.addColorStop(0, 'rgba(168,203,214,.60)');
    gr.addColorStop(0.55, 'rgba(58,84,94,.28)');
    gr.addColorStop(1, 'rgba(24,38,45,.42)');
    g.fillStyle = gr;
    g.fillRect(wx, wy, ww, wh);
    g.fillStyle = 'rgba(220,215,200,.85)';
    for (let i = 1; i < 4; i++) g.fillRect(wx + i * (ww / 4) - 2, wy, 3, wh);

    /* 层间腰带 */
    g.fillStyle = COL.band;
    g.fillRect(0, 196, 256, 60);
    g.fillStyle = 'rgba(255,255,255,.45)';
    g.fillRect(0, 196, 256, 6);

    if (kind === 'teach') {
      g.fillStyle = COL.orange;
      g.fillRect(226, 0, 30, 256);
      g.fillStyle = 'rgba(0,0,0,.10)';
      g.fillRect(226, 0, 6, 256);
    }
    if (kind === 'lab') {
      g.fillStyle = COL.orange;
      g.fillRect(0, 0, 56, 256);
      g.fillStyle = 'rgba(255,255,255,.18)';
      g.fillRect(48, 0, 8, 256);
    }
    if (kind === 'dorm') {
      /* 浅灰冲孔网遮阳 */
      g.fillStyle = 'rgba(196,196,190,.92)';
      g.fillRect(0, 0, 132, 256);
      g.fillStyle = 'rgba(120,120,116,.55)';
      for (let y = 6; y < 256; y += 7) for (let x = 6; x < 128; x += 7) g.fillRect(x, y, 2, 2);
      g.fillStyle = 'rgba(255,255,255,.35)';
      g.fillRect(0, 196, 132, 8);
    }
    if (kind === 'apt') {
      g.fillStyle = 'rgba(60,70,72,.85)';
      g.fillRect(0, 176, 256, 10);
      g.fillStyle = 'rgba(255,255,255,.5)';
      g.fillRect(0, 186, 256, 6);
    }
  });
}

/* 夜间窗洞：只有窗是亮的 */
function nightTile(kind) {
  return canvasTex(256, 256, (g) => {
    g.fillStyle = '#000';
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 4; i++) {
      const on = Math.random() < 0.58;
      g.fillStyle = on ? (Math.random() < 0.5 ? '#ffd9a0' : '#ffbe74') : 'rgba(255,190,120,.10)';
      g.fillRect(14 + i * 62, 36, 46, 142);
    }
    g.fillStyle = 'rgba(0,0,0,.92)';
    for (let i = 1; i < 5; i++) g.fillRect(14 + i * 62 - 8, 36, 8, 142);
    g.fillStyle = 'rgba(255,205,150,.10)';
    g.fillRect(0, 196, 256, 8);
  });
}

/* 宿舍整面窗光遮罩：逐开间分配亮暗，不改变白天立面贴图。
 * 坐标与 tile() 一致；窗框、遮阳网、阳台横档及墙面保持黑色。 */
function residentialNightMap(kind, bays, floors) {
  return canvasTex(bays * 128, floors * 128, (g) => {
    g.fillStyle = '#000';
    g.fillRect(0, 0, bays * 128, floors * 128);
    for (let row = 0; row < floors; row++) {
      for (let bay = 0; bay < bays; bay++) {
        // 稳定的约 80% 亮窗，切换昼夜时不重新随机。
        const seed = (bay * 7 + row * 3 + Math.floor(row / 2)) % 10;
        if (seed < 2) continue;
        g.save();
        g.translate(bay * 128, row * 128);
        g.scale(0.5, 0.5);
        const glow = g.createLinearGradient(0, 30, 0, 180);
        glow.addColorStop(0, seed % 2 ? '#ffe2b0' : '#ffdb97');
        glow.addColorStop(1, seed % 2 ? '#eab776' : '#e8aa66');
        g.fillStyle = glow;
        g.fillRect(18, 32, 220, kind === 'apt' ? 142 : 146);
        g.fillStyle = '#000';
        for (let i = 1; i < 4; i++) g.fillRect(16 + i * 56 - 2, 30, 3, 150);
        if (kind === 'dorm') g.fillRect(0, 0, 132, 256);
        g.restore();
      }
    }
  });
}

/* 首层：玻璃店面 + 暖光 */
function shopfront() {
  return canvasTex(256, 128, (g) => {
    g.fillStyle = '#d3cec2';
    g.fillRect(0, 0, 256, 128);
    /* 底座 */
    g.fillStyle = '#b3ada0';
    g.fillRect(0, 108, 256, 20);
    for (let i = 0; i < 4; i++) {
      const x = 8 + i * 62;
      const gr = g.createLinearGradient(0, 14, 0, 106);
      gr.addColorStop(0, 'rgba(196,214,220,.95)');
      gr.addColorStop(0.6, 'rgba(120,146,154,.92)');
      gr.addColorStop(1, 'rgba(84,104,110,.92)');
      g.fillStyle = gr;
      g.fillRect(x, 14, 50, 92);
      g.fillStyle = 'rgba(232,228,216,.95)';
      g.fillRect(x - 3, 14, 4, 92);
      g.fillRect(x + 49, 14, 4, 92);
      g.fillRect(x - 3, 14, 56, 4);
    }
    /* 雨棚底面 */
    g.fillStyle = '#c6c1b4';
    g.fillRect(0, 0, 256, 12);
    g.fillStyle = 'rgba(255,255,255,.45)';
    g.fillRect(0, 10, 256, 3);
  }, [1, 1]);
}

/* 像素化的 A / B 冲孔网 */
function pixelScreen(letter) {
  return canvasTex(512, 640, (g) => {
    g.fillStyle = '#3f5f6e';
    g.fillRect(0, 0, 512, 640);
    const cell = 16;
    const font = 'bold 400px "Microsoft YaHei", Arial';
    const tmp = document.createElement('canvas');
    tmp.width = 512; tmp.height = 640;
    const tc = tmp.getContext('2d');
    tc.fillStyle = '#000';
    tc.font = font;
    tc.textAlign = 'center';
    tc.textBaseline = 'middle';
    tc.fillText(letter, 256, 330);
    const data = tc.getImageData(0, 0, 512, 640).data;
    for (let y = 0; y < 640; y += cell) {
      for (let x = 0; x < 512; x += cell) {
        const a = data[((y + cell / 2 | 0) * 512 + (x + cell / 2 | 0)) * 4 + 3];
        if (a > 128) {
          g.fillStyle = `rgba(${170 + Math.random() * 40 | 0},${198 + Math.random() * 30 | 0},${214},${.55 + Math.random() * .35})`;
          g.fillRect(x + 2, y + 2, cell - 6, cell - 6);
        }
      }
    }
  });
}

function signTexture(lines, bg = '#f2efe6', fg = '#1f6f66') {
  return canvasTex(640, 220, (g) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, 640, 220);
    g.fillStyle = fg;
    g.textAlign = 'center';
    if (lines.length === 1) {
      g.font = 'bold 120px "Microsoft YaHei", Arial';
      g.fillText(lines[0], 320, 145);
    } else {
      g.font = 'bold 96px "Microsoft YaHei", Arial';
      g.fillText(lines[0], 320, 110);
      g.font = '34px Arial';
      g.fillText(lines[1], 320, 170);
    }
  });
}

const roofMat = mat(COL.roof, 0.9);
const frameMat = mat('#f7f5ec', 0.7);
const orangeMat = mat(COL.orange, 0.7);
const darkMat = mat('#2f3336', 0.6, 0.3);
const glassMat = new THREE.MeshPhysicalMaterial({
  color: '#9fc3c6', roughness: 0.08, metalness: 0, transmission: 0.85,
  transparent: true, opacity: 0.42, thickness: 0.6, side: THREE.DoubleSide
});

/* 通用体量：首层 + 标准层 + 女儿墙 */
function block(g, { w, d, floors, kind, y = 0, plinth = true, cx = 0, cz = 0 }) {
  const bodyH = floors * FLOOR;
  if (plinth) {
    const shop = new THREE.MeshStandardMaterial({ map: shopfront(), roughness: 0.4, metalness: 0.1 });
    shop.map.repeat.set(Math.max(1, Math.round(w / 8)), 1);
    shop.map.wrapS = THREE.RepeatWrapping;
    box(g, w + 0.6, GROUND, d + 0.6, shop, cx, y + GROUND / 2, cz);
  }
  const bays = Math.max(2, Math.round(w / 4.2));
  const tex = tile(kind);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(bays, floors);
  const residential = kind === 'dorm' || kind === 'apt';
  const side = new THREE.MeshStandardMaterial({
    map: tex, roughness: 0.62, metalness: 0.05,
    emissive: new THREE.Color(residential ? '#ffffff' : '#ffb974'),
    emissiveMap: residential ? residentialNightMap(kind, bays, floors) : nightTile(kind),
    emissiveIntensity: 0
  });
  if (residential) {
    side.userData.nightWindow = true;
    side.userData.nightIntensity = 1.35;
  }
  NIGHT_MATS.push(side);
  const body = addMesh(g, new THREE.BoxGeometry(w, bodyH, d),
    [side, side, roofMat, roofMat, side, side], cx, y + GROUND + bodyH / 2, cz);
  /* 每层挑出的楼板 */
  for (let f = 1; f <= floors; f++) {
    box(g, w + 1.1, 0.34, d + 1.1, frameMat, cx, y + GROUND + f * FLOOR, cz);
  }
  /* 女儿墙 */
  box(g, w + 0.5, 0.9, d + 0.5, frameMat, cx, y + GROUND + bodyH + 0.45, cz);
  return body;
}

/* 竖向遮阳鳍 */
function fins(g, w, h, z, color, count, y) {
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push({ p: [-w / 2 + 1.4 + i * ((w - 2.8) / (count - 1)), y + h / 2, z], s: [0.32, h, 0.9] });
  }
  instanced(g, new THREE.BoxGeometry(1, 1, 1), mat(color, 0.7), items);
}

/* ── 以下为按总平面图重建的各建筑 ── */

/* A / B 教学楼：长方形板楼 + 竖向交通核 + 屋面下沉天窗带 */
export function teachBuilding(cfg) {
  const g = new THREE.Group();
  g.position.set(cfg.x, 0, cfg.z);
  g.rotation.y = THREE.MathUtils.degToRad(cfg.rot || 0);
  const W = cfg.w, D = cfg.d;
  const floors = cfg.floors - 1;
  const roofY = GROUND + floors * FLOOR;
  block(g, { w: W, d: D, floors, kind: 'teach' });

  const east = cfg.accent === 'blue';
  const side = east ? 1 : -1;

  /* 竖向交通核：贴一端，比主体高一截，外侧一排横档（总平面上的“梯子”） */
  const cw = 6.2, ch = roofY + 3.4, cxp = side * (W / 2 - cw / 2 - 0.5);
  box(g, cw, ch, D - 4, mat('#e4e1d6', 0.82), cxp, ch / 2, 0);
  box(g, cw + 1.0, 0.7, D - 3, frameMat, cxp, ch + 0.35, 0);
  const rungs = [];
  const n = Math.floor((ch - 3) / 1.5);
  for (let i = 0; i < n; i++) {
    rungs.push({ p: [cxp + side * (cw / 2 + 0.2), 2.4 + i * 1.5, 0], s: [0.5, 0.55, D - 7] });
  }
  instanced(g, new THREE.BoxGeometry(1, 1, 1), mat('#b6b3a7', 0.85), rungs, false, false);

  /* 屋面下沉天窗带 44×16：一圈矮墙 + 玻璃底面 + 分格 */
  const sw = 44, sd = 16;
  box(g, sw + 1.4, 1.6, 0.8, frameMat, 0, roofY + 0.8, -(sd / 2 + 0.4));
  box(g, sw + 1.4, 1.6, 0.8, frameMat, 0, roofY + 0.8, sd / 2 + 0.4);
  box(g, 0.8, 1.6, sd + 1.6, frameMat, -(sw / 2 + 0.4), roofY + 0.8, 0);
  box(g, 0.8, 1.6, sd + 1.6, frameMat, sw / 2 + 0.4, roofY + 0.8, 0);
  box(g, sw, 0.4, 0.4, mat('#8d8a7e', 0.8), 0, roofY - 0.2, 0);
  const sky = addMesh(g, new THREE.BoxGeometry(sw, 0.22, sd), new THREE.MeshPhysicalMaterial({
    color: '#a9c6d4', roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.72
  }), 0, roofY - 1.35, 0, false, false);
  const bars = [];
  for (let i = -5; i <= 5; i++) bars.push({ p: [i * 4, roofY - 1.2, 0], s: [0.32, 0.16, sd] });
  for (let i = -1; i <= 1; i++) bars.push({ p: [0, roofY - 1.2, i * 5.2], s: [sw, 0.16, 0.32] });
  instanced(g, new THREE.BoxGeometry(1, 1, 1), mat('#6f7d84', 0.7, 0.3), bars, false, false);

  /* Panels stay inside the roof's north service strip and have real legs. */
  const panels = [], feet = [];
  for (let i = 0; i < 2; i++) {
    for (let k = 0; k < 2; k++) {
      const x = (i === 0 ? -1 : 1) * 27, z = (k === 0 ? -1 : 1) * 5.2;
      const tilt = 0.12, depth = 4.6;
      panels.push({ p: [x, roofY + 1.22, z], s: [5.8, 0.16, depth], r: [tilt, 0, 0] });
      for (const dx of [-2.5, 2.5]) for (const dz of [-1.8, 1.8]) {
        const top = roofY + 1.14 - Math.sin(tilt) * dz;
        const base = roofY + 0.42;
        feet.push({ p: [x + dx, (base + top) / 2, z + dz], s: [0.12, top - base, 0.12] });
      }
    }
  }
  instanced(g, new THREE.BoxGeometry(1, 1, 1), mat('#3a5470', 0.34, 0.4), panels, false, false);
  instanced(g, new THREE.BoxGeometry(1, 1, 1), mat('#929a9a', 0.7), feet, false, false);

  /* 冲孔铝板像素屏 */
  const t = pixelScreen(east ? 'A' : 'B');
  const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.45, metalness: 0.25, emissive: '#173040', emissiveIntensity: 0.25 });
  const screen = addMesh(g, new THREE.BoxGeometry(15, 18, 0.8), m, side * (W / 2 - 13), GROUND + 11, D / 2 + 0.5);
  screen.castShadow = true;

  /* 橙色竖向遮阳鳍（南立面） */
  fins(g, W, floors * FLOOR - 3, D / 2 + 0.55, east ? COL.orange : '#b8b5a8', 14, GROUND + 1.2);

  /* 入口门斗 */
  box(g, 12, 6.4, 3.2, glassMat, 0, GROUND + 3.2, D / 2 + 1.6);
  box(g, 14, 0.7, 4.6, frameMat, 0, GROUND + 6.9, D / 2 + 1.8);

  /* 屋顶设备 */
  /* Roof service housing sits directly on the roof deck, not suspended above it. */
  box(g, 6, 2.4, 4, mat('#c3c0b6', 0.9), side * (W / 2 - 22), roofY + 1.2, -10);
  return g;
}

/* C 实训楼：回字形平面，中间 55×27 内院 + 圆形水盘 + 一片草地 */
export function labBuilding(cfg) {
  const g = new THREE.Group();
  g.position.set(cfg.x, 0, cfg.z);
  g.rotation.y = THREE.MathUtils.degToRad(cfg.rot || 0);
  const W = cfg.w, D = cfg.d;
  const floors = cfg.floors - 1;
  const roofY = GROUND + floors * FLOOR;
  const cw = 55, cd = 27;
  const ew = (W - cw) / 2, ed = (D - cd) / 2;

  block(g, { w: W, d: ed, floors, kind: 'lab', cz: -(D - ed) / 2 });
  block(g, { w: W, d: ed, floors, kind: 'lab', cz: (D - ed) / 2 });
  block(g, { w: ew, d: cd, floors, kind: 'lab', cx: -(W - ew) / 2 });
  block(g, { w: ew, d: cd, floors, kind: 'lab', cx: (W - ew) / 2 });

  /* 内院：草地 + 圆形水盘 */
  const lawn = addMesh(g, new THREE.PlaneGeometry(cw - 4, cd - 3), mat('#6c8b4e', 1), -8, 0.09, 0, false, true);
  lawn.rotation.x = -Math.PI / 2;
  cyl(g, 5.6, 5.8, 0.42, mat('#d6d1c2', 0.82), 17.4, 0.21, -1.1, 36);
  const pool = addMesh(g, new THREE.CylinderGeometry(4.9, 4.9, 0.2, 36), new THREE.MeshPhysicalMaterial({
    color: '#7fb2ae', roughness: 0.1, metalness: 0, transmission: 0.3, transparent: true, opacity: 0.92
  }), 17.4, 0.5, -1.1, false, false);
  /* 内院二层的连桥 */
  box(g, cw, 0.5, 3.2, frameMat, 0, GROUND + 4.2, 0);

  /* 转角白色标识盒 */
  const sx = W / 2 - 8;
  box(g, 13, 6.6, 6.4, mat('#f6f4ea', 0.8), sx, roofY + 3.2, D / 2 - 1);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(11, 3.8),
    new THREE.MeshBasicMaterial({ map: signTexture(['C 实训楼', 'Laboratory Building']), toneMapped: false })
  );
  sign.position.set(sx, roofY + 3.4, D / 2 + 2.3);
  g.add(sign);

  /* 橙色竖向遮阳鳍（南立面） */
  fins(g, W, floors * FLOOR - 2, D / 2 + 0.5, COL.orange, 12, GROUND + 1);

  /* 室外钢梯 */
  const stair = new THREE.Group();
  stair.position.set(-W / 2 + 5, 0, D / 2 + 1.4);
  g.add(stair);
  for (let i = 0; i < 12; i++) box(stair, 3.4, 0.14, 0.9, mat('#b9b6ac', 0.7), 0, 0.3 + i * 0.42, -i * 0.55);

  /* 屋面设备 */
  const units = [];
  for (let i = 0; i < 5; i++) units.push({ p: [-W / 2 + 8 + i * 13, roofY + 1.4, -D / 2 + 2.2], s: [7, 1.8, 3.4] });
  instanced(g, new THREE.BoxGeometry(1, 1, 1), mat('#c8c5ba', 0.9), units, false, false);
  return g;
}

/* 学生宿舍：单廊板楼 + 屋面采光带 */
export function dormBuilding(cfg) {
  const g = new THREE.Group();
  g.position.set(cfg.x, 0, cfg.z);
  g.rotation.y = THREE.MathUtils.degToRad(cfg.rot || 0);
  const W = cfg.w, D = cfg.d;
  const floors = cfg.floors - 1;
  const roofY = GROUND + floors * FLOOR;
  block(g, { w: W, d: D, floors, kind: 'dorm' });

  /* 屋面采光带 35×7 */
  const sw = W - 14, sd = 7;
  box(g, sw + 1.2, 1.5, 0.7, frameMat, 0, roofY + 0.75, -(sd / 2 + 0.35));
  box(g, sw + 1.2, 1.5, 0.7, frameMat, 0, roofY + 0.75, sd / 2 + 0.35);
  addMesh(g, new THREE.BoxGeometry(sw, 0.2, sd), new THREE.MeshPhysicalMaterial({
    color: '#a9c6d4', roughness: 0.08, transparent: true, opacity: 0.7
  }), 0, roofY - 1.1, 0, false, false);
  const bars = [];
  for (let i = -4; i <= 4; i++) bars.push({ p: [i * 3.4, roofY - 1.0, 0], s: [0.3, 0.16, sd] });
  instanced(g, new THREE.BoxGeometry(1, 1, 1), mat('#6f7d84', 0.7, 0.3), bars, false, false);

  /* 黄色竖带 + DORM */
  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, floors * FLOOR - 2, 0.6),
    new THREE.MeshStandardMaterial({
      map: canvasTex(128, 512, (c) => {
        c.fillStyle = COL.yellow; c.fillRect(0, 0, 128, 512);
        c.save(); c.translate(64, 256); c.rotate(-Math.PI / 2);
        c.fillStyle = '#fff'; c.font = 'bold 92px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('DORM', 0, 0); c.restore();
      }),
      roughness: 0.6
    }),
    W / 2 + 0.4, GROUND + floors * FLOOR / 2, D / 2 - 1.6
  );
  g.add(strip);

  /* 北侧墨绿百叶 */
  const louvres = [];
  for (let i = 0; i < 24; i++) {
    louvres.push({ p: [-W / 2 + 2 + i * 2.0, GROUND + floors * FLOOR / 2, -D / 2 - 0.3], s: [0.5, floors * FLOOR - 3, 0.3] });
  }
  instanced(g, new THREE.BoxGeometry(1, 1, 1), mat(COL.teal, 0.7), louvres, false, false);

  /* Ground-floor shops are placed individually by storefronts.js. */
  /* 雨棚 */
  box(g, W - 4, 0.4, 2.6, frameMat, 0, 5.0, D / 2 + 1.2);

  /* 空调板 */
  const acc = [];
  for (let f = 0; f < floors; f++) {
    for (let i = 0; i < 6; i++) {
      acc.push({ p: [-W / 2 + 5 + i * 8.4, GROUND + f * FLOOR + 2.6, -D / 2 - 0.45], s: [0.9, 0.7, 0.5] });
    }
  }
  instanced(g, new THREE.BoxGeometry(1, 1, 1), mat('#9a9a94', 0.8), acc, false, false);
  return g;
}

/* 教师公寓：六层板楼，南面通长阳台廊 */
export function aptBuilding(cfg) {
  const g = new THREE.Group();
  g.position.set(cfg.x, 0, cfg.z);
  g.rotation.y = THREE.MathUtils.degToRad(cfg.rot || 0);
  const W = cfg.w, D = cfg.d;
  const floors = cfg.floors - 1;
  block(g, { w: W, d: D, floors, kind: 'apt' });

  /* 通长阳台板 + 栏板 */
  for (let f = 1; f <= floors; f++) {
    box(g, W - 2, 0.22, 1.9, mat('#e9e6dc', 0.85), 0, GROUND + f * FLOOR - 0.6, D / 2 + 0.95);
    box(g, W - 2, 1.0, 0.12, glassMat, 0, GROUND + f * FLOOR, D / 2 + 1.85);
  }
  /* 首层架空柱廊 */
  const posts = [];
  for (let i = 0; i < 5; i++) posts.push({ p: [-W / 2 + 2.5 + i * ((W - 5) / 4), GROUND / 2, D / 2 + 1.6], s: [0.5, GROUND, 0.5] });
  instanced(g, new THREE.BoxGeometry(1, 1, 1), mat('#dcd8cb', 0.85), posts);
  box(g, W, 0.4, 2.2, frameMat, 0, GROUND - 0.2, D / 2 + 1.2);

  /* 屋顶女儿墙加高一块 + 设备 */
  box(g, 5, 2.2, 4, mat('#c8c5ba', 0.9), W / 2 - 6, GROUND + floors * FLOOR + 1.6, 0);
  return g;
}

/* 湖畔坊餐厅：架在湖面上的两座深色坡屋顶亭子 + 木甲板 */
export function lakesidePavilion(cfg) {
  const g = new THREE.Group();
  g.position.set(cfg.x, 0, cfg.z);

  const deckMat = new THREE.MeshStandardMaterial({
    map: canvasTex(256, 256, (c) => {
      c.fillStyle = '#9a7d5d'; c.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 16; i++) { c.fillStyle = i % 2 ? '#a68a68' : '#94795a'; c.fillRect(0, i * 16, 256, 15); }
    }, [10, 8]),
    roughness: 0.9
  });
  const railMat = mat('#2c2f2c', 0.65, 0.35);
  const wallMat = mat('#4a3d33', 0.8);
  const glassW = new THREE.MeshStandardMaterial({ color: '#9db4b2', roughness: 0.1, metalness: 0.15, transparent: true, opacity: 0.55 });
  const roofD = new THREE.MeshStandardMaterial({ color: '#3c4348', roughness: 0.5, metalness: 0.35, side: THREE.DoubleSide });
  const roofL = new THREE.MeshStandardMaterial({ color: '#7d848a', roughness: 0.45, metalness: 0.3, side: THREE.DoubleSide });

  // Warm evening dining lights: two interiors, the terrace and the entrance.
  const diningLamp = new THREE.MeshStandardMaterial({ color: '#fff0ce',
    emissive: '#ffd28b', emissiveIntensity: 0, roughness: 0.45 });
  diningLamp.userData.nightGlow = true;
  diningLamp.userData.nightIntensity = 2;
  for (const [x, y, z, intensity, reach] of [
    [-9, 4.1, -8, 95, 19], [10, 4.3, 8, 95, 19],
    [19, 3.4, 11, 65, 14], [-20, 2.8, 5, 45, 12]
  ]) {
    const light = new THREE.PointLight('#ffd49a', 0, reach, 2);
    light.position.set(x, y, z);
    light.name = 'lakeside-dining-light';
    light.userData.nightIntensity = intensity;
    g.add(light);
    box(g, 0.65, 0.16, 0.65, diningLamp, x, y + 0.12, z);
  }

  /* 主甲板 + 伸向水面的栈桥；可行走的甲板面 */
  const mainDeck = box(g, 35, 0.6, 25, deckMat, 5, 0.95, 0);
  mainDeck.userData.walkSurface = true;
  const accessDeck = box(g, 14, 0.55, 6, deckMat, -22, 0.92, 5);
  accessDeck.userData.walkSurface = true;
  const piers = [];
  for (let i = 0; i < 12; i++) piers.push({ p: [-16 + (i % 6) * 7, 0.3, -13 + Math.floor(i / 6) * 26], s: [0.9, 1.6, 0.9] });
  instanced(g, new THREE.BoxGeometry(1, 1, 1), mat('#6b6257', 0.9), piers, false, false);

  /* 一号亭（深色木构，浅灶平坡屋面） */
  const pav = (px, pz, w, d, wh, rh, rm, dark) => {
    const y0 = 1.25;
    const pavilionDeck = box(g, w + 1.6, 0.3, d + 1.6, deckMat, px, y0 - 0.05, pz);
    pavilionDeck.userData.walkSurface = true;
    for (let i = 0; i < 5; i++) {
      for (const sg of [-1, 1]) {
        box(g, 0.26, wh, 0.26, dark ? mat('#3c332b', 0.8) : mat('#8b8578', 0.8),
          px - w / 2 + 0.6 + i * (w - 1.2) / 4, y0 + wh / 2, pz + sg * (d / 2 - 0.5));
      }
    }
    // Glazed perimeter walls leave a real south-facing doorway between the posts.
    const wallH = wh - 0.9, wallY = y0 + 0.45 + wallH / 2;
    const wallT = 0.12, doorW = 2.4, doorH = 2.8;
    // Keep the original translucent glazing; collision is handled separately.
    const solidWall = (width, height, depth, x, y, z) => {
      const panel = box(g, width, height, depth, glassW, x, y, z);
      panel.userData.walkBlocker = true;
      return panel;
    };
    solidWall(wallT, wallH, d - 1.0, px - (w - 1.0) / 2, wallY, pz);
    solidWall(wallT, wallH, d - 1.0, px + (w - 1.0) / 2, wallY, pz);
    solidWall(w - 1.0, wallH, wallT, px, wallY, pz - (d - 1.0) / 2);
    const southZ = pz + (d - 1.0) / 2;
    const sideW = (w - 1.0 - doorW) / 2;
    solidWall(sideW, wallH, wallT, px - doorW / 2 - sideW / 2, wallY, southZ);
    solidWall(sideW, wallH, wallT, px + doorW / 2 + sideW / 2, wallY, southZ);
    solidWall(doorW, wallH - doorH, wallT, px, y0 + doorH + (wallH - doorH) / 2, southZ);
    // Open door frame: intentionally no leaf across the walking opening.
    const doorMat = mat('#5b4433', 0.75);
    box(g, 0.16, doorH, 0.18, doorMat, px - doorW / 2, y0 + doorH / 2, southZ);
    box(g, 0.16, doorH, 0.18, doorMat, px + doorW / 2, y0 + doorH / 2, southZ);
    box(g, doorW + 0.16, 0.16, 0.18, doorMat, px, y0 + doorH, southZ);
    box(g, w + 0.4, 0.5, d + 0.4, dark ? wallMat : mat('#cfc9ba', 0.8), px, y0 + wh, pz);
    const rf = new THREE.Mesh(hipRoof(w + 3.0, d + 3.0, rh), rm);
    rf.position.set(px, y0 + wh + 0.25, pz);
    rf.castShadow = true; rf.receiveShadow = true;
    g.add(rf);
    return y0 + wh + 0.25;
  };
  pav(-9, -8, 20, 13, 3.5, 1.9, roofD, true);
  pav(10, 8, 17, 14, 3.7, 2.1, roofL, false);

  /* 屋面脊线小护边 */
  for (const [px, pz, w] of [[-9, -5, 20], [10, 7, 17]]) {
    box(g, w + 3.2, 0.16, 0.2, railMat, px, 1.25 + 3.6 + 0.5 + (px < 0 ? 1.9 : 2.1), pz);
  }

  /* 平台栏杆 */
  const rail = [];
  for (let i = 0; i <= 17; i++) rail.push({ p: [-12 + i * 2, 1.75, -12.5], s: [0.1, 1.0, 0.1] });
  for (let i = 0; i <= 17; i++) rail.push({ p: [-12 + i * 2, 1.75, 12.5], s: [0.1, 1.0, 0.1] });
  for (let i = 0; i <= 12; i++) rail.push({ p: [22, 1.75, -12.5 + i * 2], s: [0.1, 1.0, 0.1] });
  for (let i = 0; i <= 12; i++) rail.push({ p: [-12, 1.75, -12.5 + i * 2], s: [0.1, 1.0, 0.1] });
  instanced(g, new THREE.BoxGeometry(1, 1, 1), railMat, rail, false, false);
  box(g, 35, 0.12, 0.12, railMat, 5, 2.25, -12.5);
  box(g, 35, 0.12, 0.12, railMat, 5, 2.25, 12.5);
  box(g, 0.12, 0.12, 25, railMat, 22, 2.25, 0);

  /* 露天餐位：桌 + 遮阳伞 + 黄椅子 */
  const chairM = mat('#e0a92a', 0.8);
  const umbM = mat('#f0ece0', 0.85);
  for (const [tx, tz] of [[6, 11], [12, 11], [18, 11], [6, 4], [12, 4]]) {
    cyl(g, 0.75, 0.75, 0.12, mat('#d8d2c2', 0.8), tx, 1.85, tz, 12);
    cyl(g, 0.08, 0.08, 0.65, railMat, tx, 1.5, tz, 8);
    cyl(g, 0.05, 0.05, 2.1, umbM, tx, 2.8, tz, 6);
    cyl(g, 1.9, 1.5, 0.28, umbM, tx, 3.85, tz, 12);
    for (const [dx, dz] of [[-1.1, 0], [1.1, 0]]) {
      box(g, 0.5, 0.06, 0.5, chairM, tx + dx, 1.62, tz);
      box(g, 0.5, 0.55, 0.06, chairM, tx + dx, 1.9, tz + (dz === 0 ? -0.22 : 0));
    }
  }
  return g;
}

/* 四坡屋面（屋脊沿 X 向） */
function hipRoof(w, d, h) {
  const rx = Math.max(0.6, (w - d) / 2);
  const P = [
    [-w / 2, 0, -d / 2], [w / 2, 0, -d / 2], [w / 2, 0, d / 2], [-w / 2, 0, d / 2]
  ];
  const R1 = [-rx, h, 0], R2 = [rx, h, 0];
  const tri = [
    [P[0], P[1], R2], [P[0], R2, R1],       /* 北坡 */
    [P[2], P[3], R1], [P[2], R1, R2],       /* 南坡 */
    [P[1], P[2], R2],                        /* 东歇山 */
    [P[3], P[0], R1]                         /* 西歇山 */
  ];
  const arr = [];
  for (const t of tri) for (const v of [t[2], t[1], t[0]]) arr.push(v[0], v[1], v[2]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
  geo.computeVertexNormals();
  return geo;
}

/* 教师中心：贴水的单层四坡屋面小房子 */
export function lakePavilion(cfg) {
  const g = new THREE.Group();
  g.position.set(cfg.x, 0, cfg.z);
  g.rotation.y = THREE.MathUtils.degToRad(cfg.rot || 0);
  const W = cfg.w, D = cfg.d;
  const h = 4.6;                                  /* 檐口高 */
  const deckMat2 = new THREE.MeshStandardMaterial({
    map: canvasTex(256, 256, (c) => {
      c.fillStyle = '#9d6f47'; c.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 16; i++) { c.fillStyle = i % 2 ? '#a5764c' : '#93663f'; c.fillRect(0, i * 16, 256, 15); }
    }, [6, 4]),
    roughness: 0.85
  });
  /* 木栈道 */
  box(g, W + 5, 0.3, D + 5, deckMat2, 0, 0.16, 0);
  for (let i = 0; i < 9; i++) {
    box(g, 0.12, 0.95, 2.2, mat('#8a7a63', 0.9), -W / 2 - 3.6 + i * (W + 7.2) / 8, 0.6, D / 2 + 5.2);
  }
  /* 玻璃体量 + 木柱 */
  box(g, W - 5.4, h - 1.2, D - 5.0, glassMat, 0, 0.9 + (h - 1.2) / 2, 0);
  box(g, W - 5.4, 0.3, D - 5.0, mat('#3a3f3c', 0.8), 0, 0.9 + (h - 1.2) + 0.15, 0);
  for (let i = 0; i < 5; i++) {
    const x = -W / 2 + 1.4 + i * (W - 2.8) / 4;
    for (const s of [-1, 1]) cyl(g, 0.28, 0.32, h, mat('#8c6544', 0.8), x, h / 2, s * (D / 2 - 1.2), 10);
  }
  /* 四坡深色金属屋面 */
  const roof = new THREE.Mesh(hipRoof(W + 3.6, D + 3.6, 2.9), new THREE.MeshStandardMaterial({
    color: '#4b5350', roughness: 0.55, metalness: 0.35, side: THREE.DoubleSide
  }));
  roof.position.y = h;
  roof.castShadow = true;
  roof.receiveShadow = true;
  g.add(roof);
  box(g, W + 3.4, 0.36, 0.36, mat('#22262a', 0.6, 0.3), 0, h + 0.2, 0);
  /* 檐口一圈细梁 */
  for (const s of [-1, 1]) {
    box(g, W + 3.8, 0.28, 0.3, mat('#2b2f2d', 0.7), 0, h - 0.1, s * (D / 2 + 1.8));
    box(g, 0.3, 0.28, D + 3.8, mat('#2b2f2d', 0.7), s * (W / 2 + 1.8), h - 0.1, 0);
  }
  return g;
}

/* 学生中心：矩形环 + 椭圆中庭 + 南侧矩形天窗 + 西北角屋面百叶 */
export function studentCenter(cfg) {
  const g = new THREE.Group();
  g.position.set(cfg.x, 0, cfg.z);
  const W = cfg.w, D = cfg.d;
  const floors = cfg.floors;
  const H = floors * FLOOR;                 /* 12.6 */
  const roofY = GROUND + H;
  const t = 12;                             /* 环的进深 */
  const side = (() => {
    const tex = tile('teach');
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, floors);
    const s = new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.62,
      emissive: new THREE.Color('#ffb974'), emissiveMap: nightTile('teach'), emissiveIntensity: 0
    });
    NIGHT_MATS.push(s);
    return s;
  })();

  /* 四条边围合 */
  box(g, W, H, t, side, 0, GROUND + H / 2, D / 2 - t / 2);
  box(g, W, H, t, side, 0, GROUND + H / 2, -D / 2 + t / 2);
  box(g, t, H, D - 2 * t, side, -W / 2 + t / 2, GROUND + H / 2, 0);
  box(g, t, H, D - 2 * t, side, W / 2 - t / 2, GROUND + H / 2, 0);
  /* 首层玻璃、二层以上楼板与橙色檐口 */
  box(g, W - 1, GROUND, D - 1, new THREE.MeshStandardMaterial({ map: shopfront(), roughness: 0.4, metalness: 0.1 }), 0, GROUND / 2, 0);
  for (let f = 1; f <= floors; f++) {
    box(g, W + 1.6, 0.36, t + 1.0, frameMat, 0, GROUND + f * FLOOR, D / 2 - t / 2);
    box(g, W + 1.6, 0.36, t + 1.0, frameMat, 0, GROUND + f * FLOOR, -D / 2 + t / 2);
    box(g, t + 1.0, 0.36, D - 2 * t - 1.0, frameMat, -W / 2 + t / 2, GROUND + f * FLOOR, 0);
    box(g, t + 1.0, 0.36, D - 2 * t - 1.0, frameMat, W / 2 - t / 2, GROUND + f * FLOOR, 0);
    if (f < floors) {
      box(g, W + 2.2, 0.95, 0.5, orangeMat, 0, GROUND + f * FLOOR, D / 2 + 0.2);
      box(g, W + 2.2, 0.95, 0.5, orangeMat, 0, GROUND + f * FLOOR, -D / 2 - 0.2);
    }
  }

  /* 屋面：矩形带椭圆洞 + 矩形洞（局部坐标，shape.y = -world.z） */
  const oval = { x: -1.7, z: 2.5, rx: 14.7, rz: 8.1 };
  const rect = { x: -0.7, z: 21.6, w: 32.7, d: 15.2 };
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-W / 2, -D / 2); roofShape.lineTo(W / 2, -D / 2);
  roofShape.lineTo(W / 2, D / 2); roofShape.lineTo(-W / 2, D / 2);
  roofShape.closePath();
  const h1 = new THREE.Path();
  h1.absellipse(oval.x, -oval.z, oval.rx, oval.rz, 0, Math.PI * 2, false, 0);
  roofShape.holes.push(h1);
  const h2 = new THREE.Path();
  h2.moveTo(rect.x - rect.w / 2, -(rect.z - rect.d / 2));
  h2.lineTo(rect.x + rect.w / 2, -(rect.z - rect.d / 2));
  h2.lineTo(rect.x + rect.w / 2, -(rect.z + rect.d / 2));
  h2.lineTo(rect.x - rect.w / 2, -(rect.z + rect.d / 2));
  h2.closePath();
  roofShape.holes.push(h2);
  const roof = addMesh(g, new THREE.ShapeGeometry(roofShape, 32), roofMat, 0, roofY + 0.02, 0, false, true);
  roof.rotation.x = -Math.PI / 2;

  /* 椭圆中庭：铺地 + 树 + 洞口玻璃 */
  const court = addMesh(g, new THREE.CircleGeometry(oval.rx, 44), mat('#cbc5b4', 0.9), oval.x, 0.09, oval.z, false, true);
  court.rotation.x = -Math.PI / 2;
  court.scale.set(1, oval.rz / oval.rx, 1);
  cyl(g, 0.34, 0.5, 7.4, mat('#7a5a3d', 0.9), oval.x + 2, 3.7, oval.z + 2, 8);
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2;
    const leaf = addMesh(g, new THREE.SphereGeometry(2.3, 8, 6), mat('#54774a', 0.9),
      oval.x + 2 + Math.cos(a) * 2.1, 8.2 + (i % 2), oval.z + 2 + Math.sin(a) * 2.1);
    leaf.scale.set(1.1, 0.7, 1.1);
  }
  const ovalGlass = addMesh(g, new THREE.CircleGeometry(oval.rx, 44), new THREE.MeshPhysicalMaterial({
    color: '#a9c6d4', roughness: 0.1, transparent: true, opacity: 0.34, side: THREE.DoubleSide
  }), oval.x, roofY + 0.4, oval.z, false, false);
  ovalGlass.rotation.x = -Math.PI / 2;
  ovalGlass.scale.set(1, oval.rz / oval.rx, 1);

  /* 矩形天窗：下沉一格 + 分格 */
  const sky = addMesh(g, new THREE.BoxGeometry(rect.w, 0.2, rect.d), new THREE.MeshPhysicalMaterial({
    color: '#a9c6d4', roughness: 0.08, transparent: true, opacity: 0.72
  }), rect.x, roofY - 1.4, rect.z, false, false);
  for (const s of [-1, 1]) {
    box(g, rect.w + 1.2, 1.6, 0.6, frameMat, rect.x, roofY + 0.6, rect.z + s * (rect.d / 2 + 0.3));
    box(g, 0.6, 1.6, rect.d + 1.2, frameMat, rect.x + s * (rect.w / 2 + 0.3), roofY + 0.6, rect.z);
  }
  const sbars = [];
  for (let i = -4; i <= 4; i++) sbars.push({ p: [rect.x + i * 3.6, roofY - 1.25, rect.z], s: [0.28, 0.14, rect.d] });
  instanced(g, new THREE.BoxGeometry(1, 1, 1), mat('#6f7d84', 0.7, 0.3), sbars, false, false);

  /* 西北角屋面百叶 */
  for (let i = 0; i < 5; i++) {
    box(g, 21, 0.24, 2.3, mat('#b9b5a8', 0.8), -W / 2 + 12.4, roofY + 1.1 + i * 0.12, -D / 2 + 8.2 + i * 3.0);
  }

  /* 入口雨棚（南） */
  box(g, 16, 0.45, 6, frameMat, 0, GROUND + 4.2, D / 2 + 2.4);
  for (const dx of [-6.5, 6.5]) box(g, 0.35, 4.0, 0.35, frameMat, dx, 2.0, D / 2 + 4.6);
  return g;
}

/* 欢迎中心：三层玻璃盒子 + 一片 67×40 的菱形木格构顶棚 */
export function welcomeCenter(cfg) {
  const g = new THREE.Group();
  g.position.set(cfg.x, 0, cfg.z);
  const W = cfg.w, D = cfg.d;
  const bw = 44, bd = 26, bh = 12.2;

  const bodyMat = new THREE.MeshStandardMaterial({
    map: canvasTex(256, 256, (c) => {
      c.fillStyle = '#e9e6dd'; c.fillRect(0, 0, 256, 256);
      c.fillStyle = 'rgba(72,98,106,.92)'; c.fillRect(8, 24, 240, 170);
      const gr = c.createLinearGradient(0, 24, 0, 194);
      gr.addColorStop(0, 'rgba(180,210,218,.55)'); gr.addColorStop(1, 'rgba(40,58,64,.5)');
      c.fillStyle = gr; c.fillRect(8, 24, 240, 170);
      c.fillStyle = '#e9e6dd'; c.fillRect(0, 194, 256, 62);
      c.fillStyle = 'rgba(120,120,116,.5)';
      for (let i = 1; i < 6; i++) c.fillRect(8 + i * 40, 24, 3, 170);
    }),
    roughness: 0.55, metalness: 0.1
  });
  bodyMat.map.wrapS = bodyMat.map.wrapT = THREE.RepeatWrapping;
  bodyMat.map.repeat.set(7, 2);
  addMesh(g, new THREE.BoxGeometry(bw, bh, bd), bodyMat, 0, bh / 2, 0);
  /* the roof deck, set in a little: the canopy is the roof, this is the
     plant deck under it */
  box(g, bw - 6, 0.5, bd - 6, roofMat, 0, bh + 0.25, 0);
  box(g, bw - 6, 4.2, 0.4, glassMat, 0, 3.0, bd / 2 + 0.2);
  /* service plant on the deck */
  for (const [x, z, w, d] of [[-12, -4, 5, 3.4], [-3, -4, 4, 3.0], [8, -4, 6, 3.6]]) {
    box(g, w, 1.6, d, mat('#c9c6bb', 0.9), x, bh + 1.3, z);
  }

  /* 顶棚：照片里是一片很疏的菱形木格构，浅拱，靠一排在场地里立着
     的细木柱撑着，天光从格子里漏下来。这里用真的构件搭：每根木条
     都是一条扁的长方体，沿两个方向交叉，支在拱面的位置上。 */
  const roofY = 13.6;
  const archH = 2.1;
  const timber = mat('#c9a56f', 0.86);
  const timberDeep = mat('#b8915a', 0.86);

  /* 拱面高度：以中心为最高，向四边落到檐口 */
  const canopyY = (x, z) => roofY +
    archH * Math.cos((x / (W / 2)) * Math.PI * 0.5) * Math.cos((z / (D / 2)) * Math.PI * 0.5);

  /* 一组斜向木条：沿 +45° 方向，间隔 1.5 米 */
  const slats = [];
  const step = 1.55;
  const along = (dir) => {
    for (let t = -(W + D) / 2; t <= (W + D) / 2; t += step) {
      /* 从一角扫到另一角，每一根裁在场地矩形里 */
      const n = 10;
      for (let i = 0; i < n; i++) {
        const u = -0.5 + (i + 0.5) / n;
        let x = dir > 0 ? t + u * step : u * step - t;
        let z = dir > 0 ? u * step : -u * step;
        x += t * 0.0;
        const x0 = dir > 0 ? (t + D / 2) : (t - D / 2);
        /* 简单起见：按参数化取点，超出范围就跳过 */
      }
    }
  };

  /* 两个斜向各铺一遍木条：把平面旋转 ±45° 取格子，再裁到矩形里。
     交点自然落在同一张网格上，所以两个方向的间距一致。 */
  const segs = [];
  const spacing = 1.7;
  const diag = (W + D) / 2;
  for (const dir of [-1, 1]) {
    for (let t = -diag; t <= diag; t += spacing) {
      /* 这条线上的点：(x, z) = (t/√2 + u/√2, t/√2 - u/√2) */
      const bx = t / Math.SQRT2 * dir;
      const bz = t / Math.SQRT2;
      /* 求这条线与矩形的交点，只画矩形里的那一段 */
      const pts = [];
      for (let k = 0; k <= 60; k++) {
        const u = -diag + (2 * diag * k) / 60;
        const x = bx + (u / Math.SQRT2) * dir;
        const z = bz - u / Math.SQRT2;
        if (Math.abs(x) <= W / 2 && Math.abs(z) <= D / 2) { pts.push([x, z]); }
      }
      /* 只要最长的那一段连续的 */
      let best = []; let cur = [];
      for (let k = 0; k < pts.length; k++) {
        const gap = k && Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]) > spacing * 1.6;
        if (gap) { if (cur.length > best.length) { best = cur; } cur = []; }
        cur.push(pts[k]);
      }
      if (cur.length > best.length) { best = cur; }
      if (best.length < 2) { continue; }
      for (let k = 0; k < best.length - 1; k++) {
        const [xa, za] = best[k];
        const [xb, zb] = best[k + 1];
        const y1 = canopyY(xa, za), y2 = canopyY(xb, zb);
        const len = Math.hypot(xb - xa, y2 - y1, zb - za);
        segs.push({
          p: [(xa + xb) / 2, (y1 + y2) / 2, (za + zb) / 2],
          s: [0.15, 0.12, len],
          r: [Math.atan2(y2 - y1, Math.hypot(xb - xa, zb - za)),
              Math.atan2(xb - xa, zb - za) + Math.PI / 2, 0]
        });
      }
    }
  }
  instanced(g, new THREE.BoxGeometry(1, 1, 1), timber, segs);

  /* 沿长边的两根主梁和几道横向次梁，压住格构的边缘 */
  for (const d of [-1, 1]) {
    const beam = [];
    for (let i = 0; i < 24; i++) {
      const xa = (i / 24 - 0.5) * W, xb = ((i + 1) / 24 - 0.5) * W;
      const z = d * (D / 2 - 0.6);
      beam.push({ xa, xb, z, y1: canopyY(xa, z), y2: canopyY(xb, z) });
    }
    const items = beam.map((b) => ({
      p: [(b.xa + b.xb) / 2, (b.y1 + b.y2) / 2, b.z],
      s: [b.xb - b.xa + 0.02, 0.42, 0.5],
      r: [0, 0, Math.atan2(b.y2 - b.y1, b.xb - b.xa)]
    }));
    instanced(g, new THREE.BoxGeometry(1, 1, 1), timberDeep, items);
  }

  for (const s of [-1, 1]) {
    box(g, W + 1.6, 0.5, 0.42, timberDeep, 0, roofY - 0.2, s * (D / 2));
    box(g, 0.42, 0.5, D + 1.6, timberDeep, s * (W / 2), roofY - 0.2, 0);
  }
  const cols = [];
  for (let i = 0; i < 5; i++) {
    const x = -W / 2 + 4 + i * ((W - 8) / 4);
    cols.push([x, D / 2 - 1.6], [x, -D / 2 + 1.6]);
  }
  for (const [x, z] of cols) {
    const c = addMesh(g, new THREE.CylinderGeometry(0.3, 0.36, roofY, 10),
      mat('#c09059', 0.78), x, roofY / 2, z);
    c.castShadow = true;
  }

  /* 门前花坛与立体字（东北角） */
  const bx = 50, bz = 0;
  addMesh(g, new THREE.CylinderGeometry(7, 7.4, 0.6, 40), mat('#b9b3a4', 0.9), bx, 0.35, bz, false, true);
  addMesh(g, new THREE.CylinderGeometry(6.6, 6.6, 0.2, 40), mat('#6e5d57', 1), bx, 0.72, bz - 1, false, true);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 2.2),
    new THREE.MeshBasicMaterial({
      map: canvasTex(1024, 168, (c) => {
        c.clearRect(0, 0, 1024, 168);
        c.fillStyle = '#ffffff';
        c.font = 'bold 108px "Microsoft YaHei", Arial';
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('欢 迎 中 心', 512, 90);
      }), transparent: true, toneMapped: false
    })
  );
  /* Place the sign directly over the circular planter and face north toward
     Teaching Building B (the negative-z direction in the campus scene). */
  sign.position.set(bx, 2.2, bz);
  sign.rotation.y = Math.atan2(45.5 - (cfg.x + bx), -110.3 - (cfg.z + bz));
  sign.name = 'welcome-planter-sign';
  g.add(sign);
  return g;
}

/* 主校门：中间一整块草坪岛 + 校名墙，车道从两侧绕进来汇到主轴 */
export function gate(cfg) {
  const g = new THREE.Group();
  g.position.set(cfg.x, 0, cfg.z);

  const asphalt = mat('#4c4f51', 0.95);
  const edge = mat('#e8e4d8', 0.9);
  const stone = mat('#cfcabd', 0.9);
  const lawnM = mat('#6f8f4e', 1);
  const whiteM = mat('#f0ece0', 0.85);

  /* 中间的草坪岛 */
  /* 弧形草坪岛（椭圆） */
  const lawnShape = new THREE.Shape();
  lawnShape.absellipse(0, 0, 16, 48, 0, Math.PI * 2, false, 0);
  const k = addMesh(g, new THREE.ShapeGeometry(lawnShape, 44), mat('#b8b3a4', 0.9), 0, 0.09, -54, false, true);
  k.rotation.x = -Math.PI / 2;
  k.scale.set(1.06, 1.04, 1);
  const lm = addMesh(g, new THREE.ShapeGeometry(lawnShape, 44), lawnM, 0, 0.15, -54, false, true);
  lm.rotation.x = -Math.PI / 2;
  /* 岛前石材广场 */

  /* 校名墙：立在草地上，朝南 */
  const nameTex = canvasTex(1400, 200, (c) => {
    c.fillStyle = '#f2efe6'; c.fillRect(0, 0, 1400, 200);
    c.fillStyle = '#2f2f2b';
    c.font = 'bold 76px "Microsoft YaHei", Arial';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('海南比勒费尔德应用科学大学', 700, 76);
    c.fillStyle = '#4d4d46';
    c.font = '30px Arial';
    c.fillText('HAINAN BIELEFELD UNIVERSITY OF APPLIED SCIENCES', 700, 146);
  });
  const nameGrp = new THREE.Group();
  nameGrp.position.set(0, 0, -10);
  nameGrp.rotation.y = 0.05;
  g.add(nameGrp);
  box(nameGrp, 27, 1.9, 0.9, mat('#f2efe6', 0.85), 0, 1.15, 0);
  for (const s of [1, -1]) {
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(26, 1.5),
      new THREE.MeshBasicMaterial({ map: nameTex, toneMapped: false }));
    plate.position.set(0, 1.2, s * 0.47);
    plate.rotation.y = s === 1 ? 0 : Math.PI;
    nameGrp.add(plate);
  }
  /* 墙背后的绿篱 */
  for (let i = 0; i < 9; i++) {
    const b = addMesh(g, new THREE.SphereGeometry(1, 8, 6), lawnM, -12 + i * 3.4, 0.5, -7);
    b.scale.set(1.5, 0.8, 1.2);
  }

  /* 门卫房（东侧车道外） */
  box(g, 7.2, 3.4, 5.2, whiteM, 42, 1.7, 2);
  box(g, 8.0, 0.35, 6.0, mat('#4a4f4d', 0.8), 42, 3.55, 2);
  box(g, 5.8, 2.0, 0.1, new THREE.MeshStandardMaterial({
    color: '#4a6b70', roughness: 0.15, metalness: 0.3, transparent: true, opacity: 0.72
  }), 42, 1.95, 4.6);

  /* 岛角上的蓝色导视牌 */
  cyl(g, 0.1, 0.12, 2.4, mat('#c9c6bc', 0.5, 0.4), 26, 1.2, 8, 8);
  const totem = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.8, 0.16),
    new THREE.MeshStandardMaterial({ color: '#2fa7b8', roughness: 0.45, emissive: '#0d4d58', emissiveIntensity: 0.3 }));
  totem.position.set(26, 2.5, 8);
  totem.castShadow = true;
  g.add(totem);

  return g;
}

/* Plain second-floor links: white deck and parapets on support columns.
   y is the walking surface, not the slab centre. No roof, arch or timberwork.
   Side openings are local-z intervals, used where another corridor joins. */
export function connectingCorridor(from, to, y = GROUND, opts = {}) {
  const g = new THREE.Group();
  const span = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const width = opts.width || 4.8;
  const white = mat('#ffffff', 0.78);
  g.position.set((from[0] + to[0]) / 2, 0, (from[1] + to[1]) / 2);
  g.rotation.y = Math.atan2(to[0] - from[0], to[1] - from[1]);
  g.userData.solidBridge = true;
  box(g, width, 0.4, span, white, 0, y - 0.2, 0).userData.walkSurface = true;
  /* freestanding supports below the deck */
  const columns = [];
  const n = Math.max(2, Math.ceil(span / 6));
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const x = from[0] + (to[0] - from[0]) * t;
    const z = from[1] + (to[1] - from[1]) * t;
    if (opts.canPlaceSupport && !opts.canPlaceSupport(x, z)) continue;
    columns.push({
      p: [0, y / 2, -span / 2 + span * t],
      s: [0.55, y, 0.55]
    });
  }
  instanced(g, new THREE.BoxGeometry(1, 1, 1), white, columns, false, false);
  for (const side of [-1, 1]) {
    const opening = (opts.openings || []).find(o => o.side === side);
    const intervals = opening
      ? [[-span / 2, opening.start], [opening.end, span / 2]]
      : [[-span / 2, span / 2]];
    for (const [start, end] of intervals) {
      if (end <= start) continue;
      const railX = side * (width / 2 - 0.09);
      for (const height of [0.55, 1.1]) {
        box(g, 0.09, 0.09, end - start, white,
          railX, y + height, (start + end) / 2);
      }
      const bays = Math.max(1, Math.ceil((end - start) / 1.8));
      for (let i = 0; i <= bays; i++) {
        box(g, 0.09, 1.1, 0.09, white,
          railX, y + 0.55, start + (end - start) * i / bays);
      }
    }
  }
  return g;
}

/* 天桥：A、B 楼之间那座白色的拱形斜拉桥。

   照片里桥面是一块薄薄的白板，栏杆很轻；桥面上方悬着一道网状的白色
   拱，一根根细索从拱背垂下来拉住桥面；两端各有一段楼梯落地。这里按
   这个关系搭：拱是两片弧形桁架夹着横杆，索是真的一根一根的斜线。 */
export function skybridge(from, to, y, opts) {
  const o = opts || {};
  const g = new THREE.Group();
  const x1 = from[0], z1 = from[1], x2 = to[0], z2 = to[1];
  const span = Math.hypot(x2 - x1, z2 - z1);
  const cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
  const ang = Math.atan2(x2 - x1, z2 - z1);

  g.position.set(cx, 0, cz);
  g.rotation.y = ang;

  const white = new THREE.MeshStandardMaterial({ color: '#eef0ec', roughness: 0.52, metalness: 0.05 });
  const steel = new THREE.MeshStandardMaterial({ color: '#f4f5f2', roughness: 0.34, metalness: 0.28 });
  const glass = new THREE.MeshStandardMaterial({
    color: '#9fb6bd', roughness: 0.12, metalness: 0.25,
    transparent: true, opacity: 0.5
  });

  const W = o.width || 7.4;      /* 桥面宽 */
  const T = 0.85;                /* 桥面板厚 */
  const rise = o.rise || (span * 0.21);

  /* 桥面板 + 底面 */
  g.userData.solidBridge = true;
  box(g, W, T, span, white, 0, y, 0).userData.walkSurface = true;
  box(g, W - 0.7, 0.16, span - 0.4, mat('#dfe3e0', 0.7), 0, y - T / 2 - 0.08, 0);

  /* 两侧栏杆：立柱 + 上沿 */
  const posts = [];
  const n = Math.max(6, Math.round(span / 2.4));
  for (let i = 0; i <= n; i++) {
    const z = -span / 2 + (span * i) / n;
    for (const s of [-1, 1]) {
      posts.push({ p: [s * (W / 2 - 0.08), y + T / 2 + 0.58, z], s: [0.07, 1.16, 0.07] });
    }
  }
  instanced(g, new THREE.BoxGeometry(1, 1, 1), steel, posts, false, false);
  for (const s of [-1, 1]) {
    box(g, 0.14, 0.1, span, steel, s * (W / 2 - 0.08), y + T / 2 + 1.16, 0, false);
    box(g, 0.1, 0.06, span, steel, s * (W / 2 - 0.08), y + T / 2 + 0.72, 0, false);
  }

  /* 拱：两片弧形桁架，跨在桥面上方 */
  const chord = (s, drop) => {
    const N = 24;
    const items = [];
    for (let i = 0; i < N; i++) {
      const t0 = i / N, t1 = (i + 1) / N;
      const a0 = archPoint(t0, span, rise, y + T / 2 + 1.0);
      const a1 = archPoint(t1, span, rise, y + T / 2 + 1.0);
      const p0 = [a0[0], a0[1] - drop];
      const p1 = [a1[0], a1[1] - drop];
      const dz = p1[0] - p0[0], dy = p1[1] - p0[1];
      const len = Math.hypot(dz, dy);
      /* the bar lies along z, then tips up by the slope of the curve */
      items.push({
        p: [s * (W / 2 - 0.35), (p0[1] + p1[1]) / 2, (p0[0] + p1[0]) / 2],
        s: [1, 1, len],
        r: [Math.atan2(dy, dz) * -1, 0, 0]
      });
    }
    return items;
  };
  /* 每片拱两根弦：上面的起拱线，下面的系杆，中间用竖杆连成桁架 */
  const web = [];
  for (const s of [-1, 1]) {
    instanced(g, new THREE.BoxGeometry(0.24, 0.24, 1), steel, chord(s, 0), false, false);
    instanced(g, new THREE.BoxGeometry(0.18, 0.18, 1), steel, chord(s, 0.86), false, false);
    for (let i = 3; i < 22; i++) {
      const t = i / 24;
      const a = archPoint(t, span, rise, y + T / 2 + 1.0);
      web.push({ p: [s * (W / 2 - 0.35), a[1] - 0.43, a[0]], s: [0.12, 0.86, 0.12] });
    }
  }
  instanced(g, new THREE.BoxGeometry(1, 1, 1), steel, web, false, false);

  /* 拱上的横杆，把两片拱连成一张网 */
  const rungs = [];
  for (let i = 1; i < 23; i++) {
    const p = archPoint(i / 24, span, rise, y + T / 2 + 1.0);
    rungs.push({ p: [0, p[1], p[0]], s: [W - 0.7, 0.07, 0.07] });
  }
  instanced(g, new THREE.BoxGeometry(1, 1, 1), steel, rungs, false, false);

  /* 斜索：从拱背垂到桥面边缘 */
  const stays = [];
  const cable = new THREE.CylinderGeometry(0.035, 0.035, 1, 5);
  for (let i = 2; i < 23; i++) {
    const t = i / 24;
    const a = archPoint(t, span, rise, y + T / 2 + 1.0);
    for (const s of [-1, 1]) {
      const top = new THREE.Vector3(s * (W / 2 - 0.35), a[1], a[0]);
      const bot = new THREE.Vector3(s * (W / 2 - 0.2), y + T / 2 + 0.1, a[0] * 0.62);
      const d = bot.clone().sub(top);
      const len = d.length();
      const mid = top.clone().addScaledVector(d, 0.5);
      stays.push({
        p: [mid.x, mid.y, mid.z],
        s: [1, len, 1],
        r: [Math.atan2(d.z, d.y), 0, -Math.atan2(d.x, Math.hypot(d.y, d.z))]
      });
    }
  }
  instanced(g, cable, steel, stays, false, false);

  /* 桥两端落在两侧楼身上：照片里就是直接接进楼里，没有外挂楼梯 */
  for (const s of [-1, 1]) {
    box(g, W + 1.2, T + 0.5, 1.4, white, 0, y + 0.1, s * (span / 2 + 0.4)).userData.walkSurface = true;
  }

  /* 玻璃栏板，照片里桥面两侧是通透的 */
  for (const s of [-1, 1]) {
    const pane = box(g, 0.05, 0.9, span - 0.6, glass, s * (W / 2 - 0.08), y + T / 2 + 0.5, 0, false);
    pane.castShadow = false;
  }

  return g;
}

/* 拱线上的一点：两端落在地面高度，中间抬到 rise；返回 [z, y] */
function archPoint(t, span, rise, base) {
  const z = -span / 2 + span * t;
  const y = base + Math.sin(Math.PI * t) * rise;
  return [z, y];
}

/* Secondary entrance: local x follows the carriageway; z is across it. */
export function sideGate(cfg) {
  const g = new THREE.Group();
  g.position.set(cfg.x, 0, cfg.z);
  g.rotation.y = cfg.rot || 0;
  const stone = mat('#d8cdbb', 0.9), trim = mat('#eee8dd', 0.85);
  const metal = mat('#656f70', 0.45, 0.4);
  const glass = mat('#46686b', 0.18, 0.25);
  const red = mat('#c54d45', 0.65);
  const bx = -7, bz = -8;
  box(g, 6.8, 0.25, 5.2, trim, bx, 0.2, bz);
  box(g, 6, 3.3, 4.4, stone, bx, 1.85, bz);
  box(g, 6.8, 0.38, 5.1, trim, bx, 3.65, bz);
  box(g, 7, 0.12, 5.3, stone, bx, 3.9, bz);
  box(g, 4.9, 1.6, 0.08, glass, bx, 2.2, bz + 2.24);
  for (let i = -2; i <= 2; i++) box(g, 0.06, 1.68, 0.12, trim, bx + i * 1.18, 2.2, bz + 2.28);
  for (const h of [1.35, 3.05]) box(g, 5.1, 0.08, 0.14, trim, bx, h, bz + 2.28);
  box(g, 0.08, 2.6, 1.25, glass, bx + 3.04, 1.6, bz + 0.7);
  for (let h = 0.6; h < 3.4; h += 0.42) box(g, 6.02, 0.025, 4.42, metal, bx, h, bz);
  // Light pedestrian canopy beside the booth, parallel to the drive.
  box(g, 9, 0.22, 4.6, trim, bx + 8, 3.45, bz);
  for (const x of [bx + 4.4, bx + 11.6]) for (const z of [bz - 1.8, bz + 1.8]) {
    box(g, 0.15, 3.3, 0.15, trim, x, 1.75, z);
  }
  // Barrier spans z, perpendicular to the east-west road. No island in a lane.
  for (const z of [-4.8, 4.8]) box(g, 0.65, 1.2, 0.65, metal, 0, 0.8, z);
  box(g, 0.13, 0.14, 9.3, trim, 0, 1.38, 0);
  for (let z = -4.2; z <= 4.2; z += 1.4) box(g, 0.15, 0.16, 0.65, red, 0, 1.38, z);
  for (const x of [-13, 12]) {
    cyl(g, 0.09, 0.13, 6, metal, x, 3.2, 6.5, 8);
    box(g, 1.4, 0.12, 0.4, trim, x, 6.2, 6.2);
  }
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 0.55), new THREE.MeshBasicMaterial({
    map: canvasTex(620,110,c=>{c.fillStyle='#176c76';c.fillRect(0,0,620,110);c.fillStyle='#fff';c.font='48px Microsoft YaHei';c.textAlign='center';c.fillText('门卫 · SECURITY',310,72);})
  }));
  sign.position.set(bx, 3.45, bz + 2.26); g.add(sign);
  return g;
}
