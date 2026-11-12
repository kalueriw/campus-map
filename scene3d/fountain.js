import * as THREE from '../vendor/three/three.module.js';

// Low aerating fountain: radial ballistic jets, spray droplets and surface foam.
// There is no masonry basin in the lake photograph.
export function lakeFountain(x, z, waterY) {
  const group = new THREE.Group();
  group.name = 'lake-fountain';
  group.position.set(x, waterY, z);
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.35, 0.18, 12),
    new THREE.MeshStandardMaterial({ color: '#374b49', roughness: 0.5 }));
  nozzle.position.y = 0.08;
  group.add(nozzle);
  const jetMat = new THREE.MeshBasicMaterial({ color: '#f2ffff', transparent: true, opacity: 0.65, depthWrite: false });
  for (let i = 0; i < 32; i++) {
    const angle = i * Math.PI * 2 / 32;
    const radius = 2.7 + (i % 3) * 0.3;
    const points = [];
    for (let j = 0; j <= 24; j++) {
      const t = j / 24;
      points.push(new THREE.Vector3(Math.cos(angle) * radius * t,
        0.16 * (1 - t) + 1.65 * 4 * t * (1 - t), Math.sin(angle) * radius * t));
    }
    group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 24, 0.025, 5, false), jetMat));
  }
  const positions = new Float32Array(480 * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const drops = new THREE.Points(geo, new THREE.PointsMaterial({
    color: '#f5ffff', size: 0.12, transparent: true, opacity: 0.8, depthWrite: false
  }));
  group.add(drops);
  const foam = new THREE.Mesh(new THREE.RingGeometry(2.7, 3.7, 64),
    new THREE.MeshBasicMaterial({color:'#e2f4ed', transparent:true, opacity:0.22, side:THREE.DoubleSide, depthWrite:false}));
  foam.rotation.x = -Math.PI / 2;
  foam.position.y = 0.025;
  group.add(foam);
  const ripples = [];
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(3.6, 3.66, 64),
      new THREE.MeshBasicMaterial({color:'#dceee6', transparent:true, opacity:0.25, side:THREE.DoubleSide, depthWrite:false}));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.018 + i * 0.002;
    group.add(ring);
    ripples.push(ring);
  }
  group.userData.update = (seconds) => {
    for (let i = 0; i < 480; i++) {
      const t = (i * 0.61803398875 + seconds * 0.7) % 1;
      const a = i * 2.39996323;
      const r = (2.6 + (i % 7) * 0.13) * t;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = 0.16 * (1 - t) + (1.4 + (i % 5) * 0.08) * 4 * t * (1 - t);
      positions[i * 3 + 2] = Math.sin(a) * r;
    }
    geo.attributes.position.needsUpdate = true;
  };
  group.userData.update(0);
  return { fountain: group, ripples };
}
