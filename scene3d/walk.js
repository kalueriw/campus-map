import * as THREE from '../vendor/three/three.module.js';
import { BUILDINGS } from './data.js';
import { createAvatar } from './avatar.js';
import { createWebSwing } from './web-swing.js';
import { createTraversal } from './traversal.js';

// Owns the camera only while walking. OrbitControls is left untouched otherwise.
export function createWalker({ scene, camera, controls, canvas, stage, beforeEnter, shoreline }) {
  const enterButton = document.getElementById('walk-enter');
  const exitButton = document.getElementById('walk-exit');
  const hud = document.getElementById('walk-hud');
  const runButton = document.getElementById('walk-run');
  const jumpButton = document.getElementById('walk-jump');
  const climbButton = document.getElementById('walk-climb');
  let climbing = null;
  const traversal = createTraversal(scene);
  const webButton = document.getElementById('walk-web');
  const webStatus = document.getElementById('web-status');
  let webMessage = 'ready';
  const webMessages = {
    ready: ['Hold E to swing · button: attach / release', '按住 E 摆荡 · 按钮：挂丝 / 松开'],
    attached: ['Web attached · steer with WASD · release to launch', '已挂丝 · 方向键控制摆荡 · 松开飞出'],
    released: ['Web released · momentum carries you forward', '已松开蛛丝 · 惯性飞行中'],
    climb: ['Climbing · W/S up/down · A/D sideways · C to release', '爬墙中 · 前后键上下 · 左右键横移 · C 松手'],
    noWall: ['Move closer to an outside wall, then press C', '请靠近建筑外墙，再按 C 爬墙'],
    missing: ['No anchor ahead · turn toward a nearby building', '前方没有合适挂点 · 请转向附近建筑']
  };
  function showWebStatus(message = webMessage) {
    webMessage = message;
    webStatus.textContent = webMessages[message][window.CampusI18n?.lang === 'zh' ? 1 : 0];
    webButton.setAttribute('aria-pressed', String(web.attached));
  }
  window.CampusI18n?.onChange(() => showWebStatus());
  const groundY = 0.36, gravity = 20, jumpSpeed = 7.5;
  let verticalSpeed = 0, airborne = false;
  function jump() {
    if (!active || entryFlight) return;
    if (climbing) stopClimb();
    else if (airborne) return;
    airborne = true;
    verticalSpeed = jumpSpeed;
  }
  function resetJump(height = groundY) {
    airborne = false;
    verticalSpeed = 0;
    avatar.position.y = height;
  }
  const keys = new Set();
  const held = new Map();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let entryFlight = null;
  let active = false, saved, yaw = 0, pitch = 0.28, distance = 7;
  let drag = null, running = false, phase = 0;
  const character = createAvatar();
  const avatar = character.root;
  avatar.visible = false;
  scene.add(avatar);

  // Buildings use footprints; water uses the very same curved shoreline as
  // the rendered lake, not its rectangular label/picking bounds.
  // The restaurant is an open pavilion, so don't block its entire footprint.
  const obstacles = BUILDINGS.filter(b => !['track', 'courts', 'gate', 'lake', 'lakeside'].includes(b.kind));
  const waterBounds = new THREE.Box2();
  shoreline.forEach(([x, z]) => waterBounds.expandByPoint(new THREE.Vector2(x, z)));
  waterBounds.expandByScalar(.3);
  function touchesWater(x, z) {
    if (x < waterBounds.min.x || x > waterBounds.max.x || z < waterBounds.min.y || z > waterBounds.max.y) return false;
    let inside = false;
    for (let i = 0, j = shoreline.length - 1; i < shoreline.length; j = i++) {
      const [ax, az] = shoreline[j], [bx, bz] = shoreline[i];
      if ((az > z) !== (bz > z) && x < (bx - ax) * (z - az) / (bz - az) + ax) inside = !inside;
      // Keep the player's feet just outside the water, without blocking the
      // stone bank, jogging ring or path beyond it.
      const dx = bx - ax, dz = bz - az;
      const lengthSq = dx * dx + dz * dz;
      const t = lengthSq ? THREE.MathUtils.clamp(((x - ax) * dx + (z - az) * dz) / lengthSq, 0, 1) : 0;
      if (Math.hypot(x - ax - t * dx, z - az - t * dz) < 0.3) return true;
    }
    return inside;
  }
  function canStand(x, z) {
    if (x < -347 || x > 308 || z < -203 || z > 25) return false;
    return !touchesWater(x, z) && !obstacles.some(b => Math.abs(x - b.x) < b.w / 2 + 0.65 && Math.abs(z - b.z) < b.d / 2 + 0.65);
  }
  const safeGround = new THREE.Vector3(-24, groundY, -68);
  function returnFromWater() {
    avatar.position.copy(safeGround);
    resetJump(safeGround.y);
    web.reset();
    climbing = null;
    verticalSpeed = 0;
  }
  const steering = new THREE.Vector3();
  // Shared height-aware movement for swings, jumps and walking off roofs.
  function moveFlight(next, velocity) {
    const p = avatar.position;
    const oldY = p.y;
    let blocked = false;
    if (traversal.clearAt(next.x, p.z, oldY)) p.x = next.x;
    else { velocity.x = 0; blocked = true; }
    if (traversal.clearAt(p.x, next.z, oldY)) p.z = next.z;
    else { velocity.z = 0; blocked = true; }
    const roof = traversal.roofAt(p.x, p.z, oldY + .45);
    const ceiling = traversal.ceilingAt(p.x, p.z, oldY);
    p.y = Math.min(next.y, ceiling);
    if (next.y > ceiling) { velocity.y = Math.min(0, velocity.y); blocked = true; }
    if (velocity.y <= 0 && p.y <= roof) {
      if (roof <= groundY && touchesWater(p.x, p.z)) returnFromWater();
      else p.y = roof;
      return { blocked, landed: true };
    }
    return { blocked, landed: false };
  }
  const web = createWebSwing({ scene, avatar, handPosition: character.handPosition,
    move: moveFlight, onLand: () => { resetJump(avatar.position.y); showWebStatus('ready'); } });
  function attachWeb() {
    if (!active || entryFlight) return;
    if (web.attach(yaw)) { stopClimb(); airborne = true; showWebStatus('attached'); }
    else showWebStatus('missing');
  }
  function releaseWeb() {
    if (!web.attached) return;
    web.release();
    showWebStatus('released');
  }
  const focus = new THREE.Vector3();
  const desired = new THREE.Vector3();
  const offset = new THREE.Vector3();
  function cameraDestination() {
    focus.copy(avatar.position).add(offset.set(0, 1.4, 0));
    offset.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
    // When looking upward, shorten the orbit arm rather than clipping below
    // the ground. Keep its direction so the full sky remains reachable.
    const groundReach = offset.y < 0 ? Math.max(0.1, (focus.y - 0.5) / -offset.y) : distance;
    const reach = traversal.cameraDistance(focus, offset, Math.min(distance, groundReach));
    desired.copy(focus).addScaledVector(offset, reach);
  }
  function updateCamera() {
    cameraDestination();
    camera.position.copy(desired);
    camera.lookAt(focus);
    // The shortened upward orbit sits inside the character: hide it there
    // rather than filling the sky with the underside of the avatar.
    avatar.visible = !(pitch < 0 && camera.position.distanceTo(focus) < 2.5);
  }
  function stopClimb() {
    if (!climbing) return;
    climbing = null;
    airborne = true;
    verticalSpeed = 0;
    climbButton.setAttribute('aria-pressed', 'false');
    showWebStatus('ready');
  }
  function toggleClimb() {
    if (!active || entryFlight) return;
    if (climbing) { stopClimb(); return; }
    const wall = traversal.wallNear(avatar.position);
    if (!wall) { showWebStatus('noWall'); return; }
    web.reset();
    climbing = wall;
    avatar.position[wall.axis] = wall.value;
    verticalSpeed = 0;
    airborne = true;
    climbButton.setAttribute('aria-pressed', 'true');
    showWebStatus('climb');
  }
  function updateClimb(dt, forward, right) {
    const wall = climbing, p = avatar.position;
    const xNormal = wall.axis === 'x' ? wall.normal : 0;
    const zNormal = wall.axis === 'z' ? wall.normal : 0;
    avatar.rotation.y = Math.atan2(-xNormal, -zNormal);
    // Facing the wall: right follows the local right-hand tangent.
    const tangent = wall.axis === 'x' ? -wall.normal : wall.normal;
    p[wall.other] = THREE.MathUtils.clamp(p[wall.other] + right * tangent * 4 * dt, wall.min, wall.max);
    p.y = Math.max(groundY, p.y + forward * 7 * dt);
    const top = p.clone();
    top[wall.axis] = wall.value - wall.normal * 1.8;
    const roof = traversal.roofAt(top.x, top.z);
    if (forward > 0 && roof > groundY && p.y >= roof + .1) {
      // Short mantle onto the slab, never teleport to another patch of ground.
      p.copy(top); p.y = roof;
      stopClimb(); resetJump(roof);
    } else if (forward < 0 && p.y <= groundY) {
      stopClimb(); resetJump();
    }
    phase += dt * (forward || right ? 8 : 0);
  }
  function clearInput() {
    keys.clear();
    held.clear();
    drag = null;
    running = false;
    runButton.setAttribute('aria-pressed', 'false');
    releaseWeb();
    stopClimb();
  }
  function enter() {
    if (active) return;
    beforeEnter();
    saved = { position: camera.position.clone(), target: controls.target.clone(), near: camera.near, fov: camera.fov,
      quaternion: camera.quaternion.clone() };
    // Flush residual orbit damping, but keep the rendered starting pose: an
    // interrupted building flight may be outside OrbitControls' distance limits.
    const damping = controls.enableDamping;
    controls.enableDamping = false;
    controls.update();
    controls.enableDamping = damping;
    camera.position.copy(saved.position);
    camera.quaternion.copy(saved.quaternion);
    controls.target.copy(saved.target);
    controls.enabled = false;
    clearInput();
    resetJump();
    avatar.position.set(-24, groundY, -68);
    safeGround.copy(avatar.position);
    web.reset();
    showWebStatus('ready');
    avatar.rotation.y = Math.PI;
    yaw = 0; pitch = 0.28; distance = 7; phase = 0;
    active = avatar.visible = true;
    camera.near = 0.1;
    cameraDestination();
    if (!reducedMotion.matches) {
      // Match the actual view direction even if an overview flight was cancelled.
      const fromTarget = camera.getWorldDirection(new THREE.Vector3())
        .multiplyScalar(Math.max(1, saved.position.distanceTo(saved.target))).add(saved.position);
      entryFlight = { elapsed: 0, duration: 1.6, fromTarget,
        position: desired.clone(), target: focus.clone() };
    } else {
      camera.fov = 60;
    }
    camera.updateProjectionMatrix();
    stage.classList.add('is-walking');
    enterButton.hidden = true;
    hud.hidden = false;
    canvas.style.cursor = 'grab';
    if (!entryFlight) updateCamera();
    canvas.focus({ preventScroll: true });
  }
  function exit() {
    if (!active) return;
    entryFlight = null;
    active = avatar.visible = false;
    clearInput();
    web.reset();
    showWebStatus('ready');
    resetJump();
    camera.position.copy(saved.position);
    camera.near = saved.near;
    camera.fov = saved.fov;
    camera.updateProjectionMatrix();
    controls.target.copy(saved.target);
    controls.enabled = true;
    controls.update();
    stage.classList.remove('is-walking');
    enterButton.hidden = false;
    hud.hidden = true;
    enterButton.focus({ preventScroll: true });
  }
  enterButton.addEventListener('click', enter);
  exitButton.addEventListener('click', exit);
  jumpButton.addEventListener('click', jump);
  climbButton.addEventListener('click', toggleClimb);
  webButton.addEventListener('click', () => web.attached ? releaseWeb() : attachWeb());
  runButton.addEventListener('click', () => {
    if (!active || entryFlight) return;
    running = !running;
    runButton.setAttribute('aria-pressed', String(running));
  });
  const movementKeys = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'];
  window.addEventListener('keydown', e => {
    if (!active) return;
    if (e.code === 'Escape') { e.preventDefault(); exit(); return; }
    if (e.target !== canvas && !hud.contains(e.target)) return;
    if (entryFlight) {
      if (movementKeys.includes(e.code) || ['KeyC', 'KeyE', 'Space'].includes(e.code)) e.preventDefault();
      return;
    }
    if (e.code === 'KeyC') {
      e.preventDefault();
      if (!e.repeat && !keys.has('KeyC')) toggleClimb();
      keys.add('KeyC');
      return;
    }
    if (e.code === 'KeyE') {
      e.preventDefault();
      if (!e.repeat && !keys.has('KeyE')) attachWeb();
      keys.add('KeyE');
      return;
    }
    if (e.code === 'Space') {
      e.preventDefault();
      if (!e.repeat && !keys.has('Space')) jump();
      keys.add('Space');
      return;
    }
    if (movementKeys.includes(e.code)) { e.preventDefault(); keys.add(e.code); }
  });
  window.addEventListener('keyup', e => {
    keys.delete(e.code);
    if (e.code === 'KeyE') releaseWeb();
  });
  window.addEventListener('blur', clearInput);
  document.addEventListener('visibilitychange', clearInput);
  document.addEventListener('focusin', e => {
    if (active && e.target !== canvas && !hud.contains(e.target)) clearInput();
  });
  hud.querySelectorAll('[data-walk-direction]').forEach(button => {
    button.addEventListener('pointerdown', e => {
      if (!active || entryFlight) return;
      e.preventDefault();
      button.setPointerCapture(e.pointerId);
      held.set(e.pointerId, button.dataset.walkDirection);
    });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      button.addEventListener(event, e => held.delete(e.pointerId));
    }
  });
  canvas.addEventListener('pointerdown', e => {
    if (!active || entryFlight || drag || e.button !== 0) return;
    canvas.focus({ preventScroll: true });
    canvas.setPointerCapture(e.pointerId);
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
  });
  canvas.addEventListener('pointermove', e => {
    if (!active || !drag || drag.id !== e.pointerId) return;
    yaw -= (e.clientX - drag.x) * 0.006;
    pitch = THREE.MathUtils.clamp(pitch + (e.clientY - drag.y) * 0.004, -Math.PI / 2 + 0.02, Math.PI / 2 - 0.02);
    drag.x = e.clientX; drag.y = e.clientY;
  });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    canvas.addEventListener(event, e => { if (drag?.id === e.pointerId) drag = null; });
  }
  canvas.addEventListener('wheel', e => {
    if (!active) return;
    e.preventDefault();
    if (entryFlight) return;
    distance = THREE.MathUtils.clamp(distance + e.deltaY * 0.008, 3, 12);
  }, { passive: false });
  function update(dt) {
    if (!active) return;
    if (entryFlight) {
      const flight = entryFlight;
      flight.elapsed += dt;
      const t = reducedMotion.matches ? 1 : Math.min(1, flight.elapsed / flight.duration);
      const eased = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      camera.position.lerpVectors(saved.position, flight.position, eased);
      focus.lerpVectors(flight.fromTarget, flight.target, eased);
      camera.lookAt(focus);
      camera.fov = THREE.MathUtils.lerp(saved.fov, 60, eased);
      camera.updateProjectionMatrix();
      // Never update OrbitControls here: its overview minDistance would push
      // the camera away from the avatar. Walking takes over at this exact pose.
      if (t === 1) {
        entryFlight = null;
        clearInput();
        updateCamera();
      }
      return;
    }
    const directions = new Set(held.values());
    const forward = Number(keys.has('KeyW') || keys.has('ArrowUp') || directions.has('forward')) - Number(keys.has('KeyS') || keys.has('ArrowDown') || directions.has('back'));
    const right = Number(keys.has('KeyD') || keys.has('ArrowRight') || directions.has('right')) - Number(keys.has('KeyA') || keys.has('ArrowLeft') || directions.has('left'));
    const moving = forward !== 0 || right !== 0;
    const sprint = running || keys.has('ShiftLeft') || keys.has('ShiftRight');
    if (climbing) {
      updateClimb(dt, forward, right);
    } else if (web.flying) {
      steering.set(-Math.sin(yaw) * forward + Math.cos(yaw) * right, 0,
        -Math.cos(yaw) * forward - Math.sin(yaw) * right).normalize();
      web.update(dt, steering);
      if (web.flying && !web.attached && webMessage === 'attached') showWebStatus('released');
      if (Math.hypot(web.velocity.x, web.velocity.z) > 1) avatar.rotation.y = Math.atan2(web.velocity.x, web.velocity.z);
    } else {
      if (moving) {
        const scale = (sprint ? 14 : 3.2) * dt / Math.hypot(forward, right);
        const dx = (-Math.sin(yaw) * forward + Math.cos(yaw) * right) * scale;
        const dz = (-Math.cos(yaw) * forward - Math.sin(yaw) * right) * scale;
        if (traversal.clearAt(avatar.position.x + dx, avatar.position.z, avatar.position.y)) avatar.position.x += dx;
        if (traversal.clearAt(avatar.position.x, avatar.position.z + dz, avatar.position.y)) avatar.position.z += dz;
        const angle = Math.atan2(dx, dz);
        avatar.rotation.y += Math.atan2(Math.sin(angle - avatar.rotation.y), Math.cos(angle - avatar.rotation.y)) * Math.min(1, dt * 14);
        phase += dt * (sprint ? 18 : 9);
      }
      if (avatar.position.y <= groundY + .5 && touchesWater(avatar.position.x, avatar.position.z)) returnFromWater();
      const floor = traversal.roofAt(avatar.position.x, avatar.position.z, avatar.position.y + .45);
      if (!airborne && avatar.position.y > floor + .45) airborne = true;
      if (airborne) {
        const ceiling = traversal.ceilingAt(avatar.position.x, avatar.position.z, avatar.position.y);
        const desiredY = avatar.position.y + verticalSpeed * dt - .5 * gravity * dt * dt;
        const nextY = Math.min(desiredY, ceiling);
        verticalSpeed -= gravity * dt;
        if (desiredY > ceiling) verticalSpeed = Math.min(0, verticalSpeed);
        if (verticalSpeed <= 0 && nextY <= floor) {
          if (floor <= groundY && touchesWater(avatar.position.x, avatar.position.z)) returnFromWater();
          else resetJump(floor);
        } else avatar.position.y = nextY;
      } else avatar.position.y = floor;
    }
    if (!airborne && canStand(avatar.position.x, avatar.position.z)) safeGround.copy(avatar.position);
    character.animate(dt, phase, moving, sprint, airborne, web.attached, !!climbing);
    web.render();
    updateCamera();
  }
  return { get active() { return active; }, get entering() { return !!entryFlight; }, enter, exit, update, avatar, webState: web.state };
}
