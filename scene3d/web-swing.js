import * as THREE from '../vendor/three/three.module.js';
import { BUILDINGS } from './data.js';

// Assisted pendulum: gravity + air steering + a shortening, tension-only rope.
// The caller resolves collisions every substep; releasing preserves velocity.
export function createWebSwing({ scene, avatar, handPosition, move, onLand }) {
  const velocity = new THREE.Vector3();
  const anchor = new THREE.Vector3();
  const radial = new THREE.Vector3();
  const next = new THREE.Vector3();
  const origin = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const hand = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const ray = new THREE.Raycaster();
  const targets = scene.children.filter(o => o.isGroup && o.userData.id && BUILDINGS.some(b => b.id === o.userData.id && b.h >= 7));
  const candidates = BUILDINGS.filter(b => b.h >= 7 && !['gate', 'track', 'courts', 'lake'].includes(b.kind));
  let attached = false, flying = false, length = 0, minLength = 0;
  const thread = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 1, 6),
    new THREE.MeshBasicMaterial({ color: '#f2fbff' }));
  thread.name = 'web-thread';
  thread.visible = false;
  const marker = new THREE.Mesh(new THREE.SphereGeometry(.18, 10, 8),
    new THREE.MeshBasicMaterial({ color: '#b5efff' }));
  marker.name = 'web-anchor';
  marker.visible = false;
  scene.add(thread, marker);

  function attach(yaw) {
    if (attached) return true;
    origin.copy(avatar.position).addScaledVector(up, 1.5);
    let best = null, score = Infinity;
    scene.updateMatrixWorld(true);
    for (const b of candidates) {
      // Aim toward upper facade points; the actual mesh intersection is the
      // anchor, not the data box or an invisible picking proxy.
      for (const dx of [-.35, 0, .35]) {
        next.set(b.x + b.w * dx, b.h * .9, b.z);
        direction.subVectors(next, origin);
        const distance = direction.length();
        const horizontal = Math.hypot(direction.x, direction.z);
        const facing = horizontal ? (-Math.sin(yaw) * direction.x - Math.cos(yaw) * direction.z) / horizontal : 1;
        if (distance > 110 || distance < 8 || facing < .05 || direction.y < 4) continue;
        ray.set(origin, direction.normalize());
        ray.far = distance + 8;
        const hit = ray.intersectObjects(targets, true)[0];
        if (!hit || hit.point.y < origin.y + 4 || hit.distance < 8 || hit.distance > 110) continue;
        const rank = hit.distance + (1 - facing) * 38;
        if (rank < score) { score = rank; best = hit.point.clone(); }
      }
    }
    if (!best) return false;
    anchor.copy(best);
    attached = flying = true;
    length = avatar.position.distanceTo(anchor);
    minLength = Math.max(8, length * .55);
    // A small assisted takeoff lets a grounded visitor start swinging, even
    // with no run-up. Subsequent attachments keep the previous flight speed.
    velocity.y = Math.max(velocity.y, 12);
    if (Math.hypot(velocity.x, velocity.z) < 10) {
      velocity.x = -Math.sin(yaw) * 12;
      velocity.z = -Math.cos(yaw) * 12;
    }
    marker.position.copy(anchor);
    thread.visible = marker.visible = true;
    return true;
  }
  function release() {
    attached = false;
    thread.visible = marker.visible = false;
  }
  function reset() {
    release();
    flying = false;
    velocity.set(0, 0, 0);
  }
  function update(dt, steering) {
    if (!flying) return;
    const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
    const h = dt / steps;
    for (let i = 0; i < steps && flying; i++) {
      velocity.y -= 20 * h;
      velocity.x += steering.x * 12 * h;
      velocity.z += steering.z * 12 * h;
      velocity.multiplyScalar(Math.exp(-.08 * h));
      velocity.clampLength(0, 42);
      next.copy(avatar.position).addScaledVector(velocity, h);
      if (attached) {
        length = Math.max(minLength, length - 10 * h);
        radial.subVectors(next, anchor);
        const distance = radial.length();
        if (distance > length) {
          radial.divideScalar(distance);
          next.copy(anchor).addScaledVector(radial, length);
          const outward = velocity.dot(radial);
          if (outward > 0) velocity.addScaledVector(radial, -outward);
        }
      }
      const result = move(next, velocity);
      if (result.blocked) release();
      if (result.landed) { reset(); onLand(); }
    }
  }
  function render() {
    if (!attached) return;
    handPosition(hand);
    direction.subVectors(anchor, hand);
    thread.position.copy(hand).addScaledVector(direction, .5);
    thread.scale.y = direction.length();
    thread.quaternion.setFromUnitVectors(up, direction.normalize());
  }
  return {
    attach, release, reset, update, render, velocity,
    get attached() { return attached; },
    get flying() { return flying; },
    state: () => ({ attached, flying, anchor: attached ? anchor.toArray() : null, length, velocity: velocity.toArray() })
  };
}
