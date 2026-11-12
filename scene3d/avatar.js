import * as THREE from '../vendor/three/three.module.js';

// A compact voxel-style student, with no external model or texture downloads.
export function createAvatar() {
  const root = new THREE.Group();
  root.name = 'campus-walker';
  const body = new THREE.Group();
  root.add(body);
  const material = color => new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
  const skin = material('#d9a47c'), teal = material('#23988e');
  const navy = material('#35465e'), hair = material('#352b26');
  const white = material('#e9ebe3'), sole = material('#bec7c6');
  const eye = material('#293b42');
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  function block(parent, mat, position, scale) {
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(...position);
    mesh.scale.set(...scale);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }
  block(body, teal, [0, 1.15, 0], [.5, .64, .27]);
  // A small collar, short sleeves, straight trousers and plain trainers.
  block(body, skin, [0, 1.46, .14], [.13, .05, .015]);
  const head = new THREE.Group();
  head.position.set(0, 1.72, 0);
  body.add(head);
  block(head, skin, [0, 0, 0], [.43, .46, .4]);
  block(head, hair, [0, .18, -.005], [.45, .12, .42]);
  block(head, hair, [0, .025, -.196], [.44, .3, .025]);
  block(head, hair, [-.16, .09, .204], [.1, .1, .016]);
  for (const side of [-1, 1]) {
    block(head, white, [side * .105, .015, .204], [.085, .045, .012]);
    block(head, eye, [side * .09, .015, .212], [.033, .045, .01]);
  }
  block(head, material('#b87a5e'), [0, -.115, .204], [.085, .022, .012]);
  const arms = [], legs = [];
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * .35, 1.43, 0);
    body.add(arm);
    block(arm, teal, [0, -.11, 0], [.19, .24, .26]);
    block(arm, skin, [0, -.41, 0], [.18, .36, .24]);
    arms.push(arm);
    const leg = new THREE.Group();
    leg.position.set(side * .13, .84, 0);
    body.add(leg);
    block(leg, navy, [0, -.35, 0], [.23, .7, .26]);
    block(leg, white, [0, -.74, .035], [.24, .12, .34]);
    block(leg, sole, [0, -.81, .035], [.245, .025, .35]);
    legs.push(leg);
  }
  let blend = 0;
  function animate(dt, phase, moving, sprint, airborne = false, swinging = false, climbing = false) {
    blend = THREE.MathUtils.damp(blend, moving ? 1 : 0, 12, dt);
    const swing = Math.sin(phase) * (sprint ? .85 : .45) * blend;
    legs[0].rotation.x = arms[1].rotation.x = swing;
    legs[1].rotation.x = arms[0].rotation.x = -swing;
    arms[0].rotation.z = .035 * blend;
    arms[1].rotation.z = -.035 * blend;
    body.rotation.x = (sprint ? .07 : 0) * blend;
    body.rotation.y = Math.sin(phase) * .025 * blend;
    body.position.y = airborne ? 0 : Math.abs(Math.sin(phase)) * (sprint ? .06 : .025) * blend;
    if (airborne) {
      arms[0].rotation.x = arms[1].rotation.x = -.5;
      arms[0].rotation.z = .18;
      arms[1].rotation.z = -.18;
      legs[0].rotation.x = .25;
      legs[1].rotation.x = -.25;
    }
    if (swinging) {
      arms[1].rotation.x = -2.7;
      arms[1].rotation.z = -.12;
      arms[0].rotation.x = -.7;
      body.rotation.x = -.12;
      legs[0].rotation.x = .5;
      legs[1].rotation.x = .2;
    }
    if (climbing) {
      arms[0].rotation.x = -2.4 + Math.sin(phase) * .35;
      arms[1].rotation.x = -2.4 - Math.sin(phase) * .35;
      legs[0].rotation.x = -.35 - Math.sin(phase) * .3;
      legs[1].rotation.x = -.35 + Math.sin(phase) * .3;
      body.rotation.x = .08;
    }
  }
  function handPosition(target) {
    root.updateMatrixWorld(true);
    return arms[1].localToWorld(target.set(0, -.59, 0));
  }
  return { root, animate, handPosition };
}
