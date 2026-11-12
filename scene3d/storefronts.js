import * as THREE from '../vendor/three/three.module.js';
import { BUILDINGS } from './data.js';
import { box, cyl, mat, canvasTex } from './lib.js';

/* Shop locations follow data.js (the 2D map), not the rough directions in
   the original photo filenames. These are facade fittings, not buildings.
   Local +z points out of the shop; the existing dorm plinth is 0.3m wider
   than the footprint on each side. Keep the fittings outside that surface. */
const SHOPS = [
  { id: 'meiyijia', building: 'dormA', px: 1756, py: 282, side: 1, w: 8,
    title: '美宜佳', sub: 'MEIYIJIA · 便利生活', bg: '#be343b', fg: '#ffffff' },
  { id: 'gmc', building: 'dormA', px: 1819, py: 228, side: -1, w: 7.6,
    title: 'GMC咖啡', sub: '湾宸 GMC · COFFEE', bg: '#e7e4da', fg: '#393630' },
  { id: 'parcel', building: 'dormA', px: 1876, py: 228, side: -1, w: 7.4,
    title: '学生公寓快递站点', sub: 'PARCEL STATION', bg: '#d2a335', fg: '#ffffff' },
  { id: 'tingning', building: 'dormB', px: 1870, py: 126, side: 1, w: 6.8,
    title: '听柠果果', sub: 'Sunny Lemon Fruits', bg: '#287343', fg: '#f1d88d' }
];

function sign(shop) {
  return canvasTex(1024, 192, c => {
    c.fillStyle = shop.bg; c.fillRect(0, 0, 1024, 192);
    c.strokeStyle = shop.fg; c.lineWidth = 3; c.strokeRect(12, 12, 1000, 168);
    c.fillStyle = shop.fg; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `bold ${shop.id === 'parcel' ? 76 : 100}px "Microsoft YaHei", Arial`;
    c.fillText(shop.title, 512, 80, 950);
    c.font = '28px "Microsoft YaHei", Arial'; c.fillText(shop.sub, 512, 151);
  });
}

function glazing(shop) {
  return canvasTex(512, 256, c => {
    const glass = c.createLinearGradient(0, 0, 0, 256);
    glass.addColorStop(0, '#9cbdc4'); glass.addColorStop(0.45, '#5b7477');
    glass.addColorStop(1, '#293d3c'); c.fillStyle = glass; c.fillRect(0, 0, 512, 256);
    c.fillStyle = '#263633'; c.fillRect(190, 15, 132, 241);
    if (shop.id === 'parcel' || shop.id === 'meiyijia') {
      for (let row = 0; row < 4; row++) {
        c.fillStyle = '#c1b9a0'; c.fillRect(16, 75 + row * 42, 150, 4);
        for (let i = 0; i < 6; i++) {
          c.fillStyle = shop.id === 'parcel' ? ['#a68154', '#c8a878'][i % 2] : ['#bc4b37', '#d8b846', '#79a382'][i % 3];
          c.fillRect(20 + i * 24, 51 + row * 42, 16, 22);
        }
      }
    } else if (shop.id === 'tingning') {
      c.fillStyle = '#2e9752'; c.fillRect(0, 172, 512, 8);
      for (let i = 0; i < 15; i++) {
        c.fillStyle = ['#9fc849', '#eccf54', '#df8e40'][i % 3];
        c.beginPath(); c.ellipse(20 + i * 35, 230, 23, 18, 0, 0, Math.PI * 2); c.fill();
      }
    } else {
      c.fillStyle = '#e4dfc9'; c.font = 'bold 27px Georgia'; c.textAlign = 'center';
      c.fillText('COFFEE', 415, 82); c.font = '18px Georgia'; c.fillText('ESPRESSO', 415, 111);
    }
    c.fillStyle = 'rgba(224,240,238,.15)';
    c.beginPath(); c.moveTo(0, 0); c.lineTo(140, 0); c.lineTo(0, 225); c.fill();
  });
}

function cafeTerrace(g, materials) {
  for (const x of [-2.5, 2.5]) {
    box(g, 1.15, .1, .85, materials.frame, x, .85, 1.65);
    for (const dx of [-.45, .45]) for (const dz of [-.3, .3]) {
      box(g, .06, .75, .06, materials.dark, x + dx, .43, 1.65 + dz);
    }
    for (const dx of [-.9, .9]) {
      box(g, .5, .1, .5, materials.dark, x + dx, .45, 1.65);
      box(g, .5, .55, .08, materials.dark, x + dx, .75, 1.85);
      for (const leg of [-.19, .19]) box(g, .06, .4, .4, materials.dark, x + dx + leg, .23, 1.65);
    }
  }
  // Closed parasol visible beside the coffee-shop doors in the supplied photo.
  cyl(g, .035, .035, 2.8, materials.dark, 3.1, 1.45, 1, 8);
  cyl(g, .09, .28, 1.5, mat('#8d847b'), 3.1, 2.1, 1, 8);
}

/** Add four clickable ground-floor facades. Raycast returned groups recursively;
 * every mesh also carries spotId/buildingId so hit handling need not ascend. */
export function buildStorefronts(scene) {
  const materials = { frame: mat('#e4e3da', .7), dark: mat('#4b514c', .7), paving: mat('#b6b4a9', .95) };
  return SHOPS.map(shop => {
    const b = BUILDINGS.find(building => building.id === shop.building);
    const mappedX = -88 + (shop.px - 788) * .3375;
    const mappedZ = -110 + (shop.py - 290) * .3375;
    const half = b.w / 2 - shop.w / 2 - .6;
    const x = THREE.MathUtils.clamp(mappedX, b.x - half, b.x + half);
    const z = b.z + shop.side * (b.d / 2 + .36);
    const g = new THREE.Group(); g.name = `storefront-${shop.id}`;
    g.position.set(x, 0, z); g.rotation.y = shop.side === -1 ? Math.PI : 0;
    g.userData = { spotId: shop.id, buildingId: b.id, mapPosition: { x: mappedX, z: mappedZ }, facade: shop.side < 0 ? 'north' : 'south' };

    // Thin facade overlay against the existing ground-floor wall, no enclosed volume.
    box(g, shop.w, 3.95, .12, materials.frame, 0, 2.05, 0);
    const window = new THREE.Mesh(new THREE.PlaneGeometry(shop.w - .45, 2.65),
      new THREE.MeshStandardMaterial({ map: glazing(shop), roughness: .3, metalness: .15 }));
    window.position.set(0, 1.63, .075); g.add(window);
    for (const x of [-shop.w / 2 + .2, -.95, 0, .95, shop.w / 2 - .2]) {
      box(g, .07, 2.7, .1, materials.frame, x, 1.64, .12);
    }
    for (const x of [-.14, .14]) box(g, .045, .48, .12, materials.dark, x, 1.5, .21);
    box(g, shop.w - .3, .1, .15, materials.frame, 0, .28, .12);
    const fascia = new THREE.Mesh(new THREE.PlaneGeometry(shop.w, 1),
      new THREE.MeshBasicMaterial({ map: sign(shop), toneMapped: false }));
    fascia.position.set(0, 3.5, .14); g.add(fascia);
    box(g, shop.w + .3, .14, 1.05, materials.frame, 0, 4.08, .4);
    box(g, shop.w + .4, .12, 2.8, materials.paving, 0, .12, 1.25);

    if (shop.id === 'gmc') cafeTerrace(g, materials);
    if (shop.id === 'meiyijia') {
      const red = mat(shop.bg, .55), glass = mat('#47615e', .25, .15);
      for (const x of [2.25, 3.15]) {
        box(g, .8, 1.8, .65, red, x, 1.05, .6);
        box(g, .64, 1.45, .03, glass, x, 1.07, .94);
        for (let y = .5; y < 1.8; y += .32) box(g, .64, .035, .04, materials.frame, x, y, .97);
      }
      box(g, .7, .65, .55, mat('#2483aa'), 1.8, .5, .6);
    }
    if (shop.id === 'parcel') {
      box(g, .48, 1.05, .42, materials.frame, -2.3, .65, .65);
    }
    if (shop.id === 'tingning') {
      for (const x of [-2.8, 2.8]) {
        cyl(g, .32, .24, .45, mat('#a39077'), x, .35, 1, 8);
        const crown = new THREE.Mesh(new THREE.SphereGeometry(.45, 8, 6), mat('#4d7741'));
        crown.position.set(x, .85, 1); g.add(crown);
      }
    }
    g.traverse(child => {
      if (child.isMesh) Object.assign(child.userData, { spotId: shop.id, buildingId: b.id });
    });
    scene.add(g);
    return g;
  });
}
