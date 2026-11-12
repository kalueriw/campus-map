import * as THREE from '../vendor/three/three.module.js';
import { BUILDINGS } from './data.js';

// Bake upward-facing roof triangles once. Runtime height queries only inspect
// one spatial cell, not the entire campus mesh hierarchy on every frame.
export function createTraversal(scene) {
  const cellSize = 4;
  const cells = new Map();
  const buildings = BUILDINGS.filter(b => b.h > 0 && !['gate', 'lake', 'track', 'courts'].includes(b.kind));
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const ab = new THREE.Vector3(), ac = new THREE.Vector3(), normal = new THREE.Vector3();
  const instance = new THREE.Matrix4(), matrix = new THREE.Matrix4();
  const key = (x, z) => `${Math.floor(x / cellSize)},${Math.floor(z / cellSize)}`;
  scene.updateMatrixWorld(true);
  const sources = buildings.map(cfg => ({ model: scene.children.find(o => o.isGroup && o.userData.id === cfg.id), minY: cfg.h * .55 }));
  const bridgeSolids = [];
  scene.traverse(model => {
    if (model.userData.solidBridge) sources.push({ model, minY: 0, bridge: true });
  });
  for (const { model, minY, bridge } of sources) {
    if (!model) continue;
    model.traverse(mesh => {
      if (!mesh.isMesh || !mesh.visible) return;
      const positions = mesh.geometry.attributes.position;
      if (!positions) return;
      const index = mesh.geometry.index;
      const count = index ? index.count : positions.count;
      for (let n = 0; n < (mesh.isInstancedMesh ? mesh.count : 1); n++) {
        matrix.copy(mesh.matrixWorld);
        if (mesh.isInstancedMesh) { mesh.getMatrixAt(n, instance); matrix.multiply(instance); }
        if (bridge) {
          // World AABBs for slabs, rails, columns and arch members are baked
          // once. Vertical overlap keeps the ground underneath walkable.
          if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
          bridgeSolids.push(mesh.geometry.boundingBox.clone().applyMatrix4(matrix));
          if (!mesh.userData.walkSurface) continue;
        }
        for (let i = 0; i < count; i += 3) {
          a.fromBufferAttribute(positions, index ? index.getX(i) : i).applyMatrix4(matrix);
          b.fromBufferAttribute(positions, index ? index.getX(i + 1) : i + 1).applyMatrix4(matrix);
          c.fromBufferAttribute(positions, index ? index.getX(i + 2) : i + 2).applyMatrix4(matrix);
          normal.crossVectors(ab.subVectors(b, a), ac.subVectors(c, a));
          if (normal.y <= 0 || normal.y / normal.length() < .65 || Math.min(a.y, b.y, c.y) < minY) continue;
          const denominator = (b.z - c.z) * (a.x - c.x) + (c.x - b.x) * (a.z - c.z);
          if (Math.abs(denominator) < 1e-8) continue;
          const triangle = { ax: a.x, az: a.z, ay: a.y, bx: b.x, bz: b.z, by: b.y,
            cx: c.x, cz: c.z, cy: c.y, denominator };
          for (let x = Math.floor(Math.min(a.x, b.x, c.x) / cellSize); x <= Math.floor(Math.max(a.x, b.x, c.x) / cellSize); x++) {
            for (let z = Math.floor(Math.min(a.z, b.z, c.z) / cellSize); z <= Math.floor(Math.max(a.z, b.z, c.z) / cellSize); z++) {
              const k = `${x},${z}`;
              if (!cells.has(k)) cells.set(k, []);
              cells.get(k).push(triangle);
            }
          }
        }
      }
    });
  }
  const solidCells = new Map();
  for (const box of bridgeSolids) {
    for (let x = Math.floor((box.min.x - .25) / cellSize); x <= Math.floor((box.max.x + .25) / cellSize); x++) {
      for (let z = Math.floor((box.min.z - .25) / cellSize); z <= Math.floor((box.max.z + .25) / cellSize); z++) {
        const k = `${x},${z}`;
        if (!solidCells.has(k)) solidCells.set(k, []);
        solidCells.get(k).push(box);
      }
    }
  }
  function overlapsXZ(box, x, z) {
    return x > box.min.x - .22 && x < box.max.x + .22 && z > box.min.z - .22 && z < box.max.z + .22;
  }
  function ceilingAt(x, z, feetY) {
    let height = Infinity;
    for (const box of solidCells.get(key(x, z)) || []) {
      if (overlapsXZ(box, x, z) && box.min.y >= feetY + 1.9 - .02) height = Math.min(height, box.min.y - 1.9);
    }
    return height;
  }
  function roofAt(x, z, ceiling = Infinity) {
    let height = .36;
    for (const t of cells.get(key(x, z)) || []) {
      const u = ((t.bz - t.cz) * (x - t.cx) + (t.cx - t.bx) * (z - t.cz)) / t.denominator;
      const v = ((t.cz - t.az) * (x - t.cx) + (t.ax - t.cx) * (z - t.cz)) / t.denominator;
      if (u < -1e-5 || v < -1e-5 || u + v > 1.00001) continue;
      const y = u * t.ay + v * t.by + (1 - u - v) * t.cy + .04;
      if (y <= ceiling && y > height) height = y;
    }
    return height;
  }
  function contains(cfg, x, z, margin = .4) {
    return Math.abs(x - cfg.x) < cfg.w / 2 + margin && Math.abs(z - cfg.z) < cfg.d / 2 + margin;
  }
  function clearAt(x, z, y) {
    if (x < -347 || x > 308 || z < -203 || z > 25) return false;
    for (const box of solidCells.get(key(x, z)) || []) {
      if (overlapsXZ(box, x, z) && y < box.max.y - .02 && y + 1.9 > box.min.y + .02) return false;
    }
    for (const cfg of buildings) {
      if (!contains(cfg, x, z)) continue;
      // Sample just inside the facade, including its real roof slab height.
      const rx = THREE.MathUtils.clamp(x, cfg.x - cfg.w / 2 + .8, cfg.x + cfg.w / 2 - .8);
      const rz = THREE.MathUtils.clamp(z, cfg.z - cfg.d / 2 + .8, cfg.z + cfg.d / 2 - .8);
      const roof = roofAt(rx, rz);
      if (y < (roof > 1 ? roof : cfg.h) - .42) return false;
    }
    return true;
  }
  function wallNear(position) {
    let closest = null, best = 2.2;
    for (const cfg of buildings) {
      const left = cfg.x - cfg.w / 2, right = cfg.x + cfg.w / 2;
      const back = cfg.z - cfg.d / 2, front = cfg.z + cfg.d / 2;
      const faces = [
        { axis: 'x', value: left - .7, normal: -1, min: back + 1, max: front - 1 },
        { axis: 'x', value: right + .7, normal: 1, min: back + 1, max: front - 1 },
        { axis: 'z', value: back - .7, normal: -1, min: left + 1, max: right - 1 },
        { axis: 'z', value: front + .7, normal: 1, min: left + 1, max: right - 1 }
      ];
      for (const face of faces) {
        const other = face.axis === 'x' ? 'z' : 'x';
        const d = Math.abs(position[face.axis] - face.value);
        if (position[other] < face.min || position[other] > face.max || d >= best || position.y > cfg.h + 6) continue;
        best = d; closest = { ...face, other, cfg };
      }
    }
    return closest;
  }
  // Camera collisions use a dozen analytic boxes, not thousands of meshes.
  const boxes = buildings.map(cfg => new THREE.Box3(
    new THREE.Vector3(cfg.x - cfg.w / 2 - .3, 0, cfg.z - cfg.d / 2 - .3),
    new THREE.Vector3(cfg.x + cfg.w / 2 + .3, cfg.h + 1, cfg.z + cfg.d / 2 + .3)));
  const cameraRay = new THREE.Ray(), hit = new THREE.Vector3();
  function cameraDistance(origin, direction, distance) {
    cameraRay.set(origin, direction);
    for (const box of boxes) {
      if (box.containsPoint(origin)) continue;
      if (cameraRay.intersectBox(box, hit)) distance = Math.min(distance, Math.max(.4, origin.distanceTo(hit) - .35));
    }
    return distance;
  }
  return { roofAt, clearAt, ceilingAt, wallNear, cameraDistance };
}
