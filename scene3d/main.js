/* ==========================================================================
   BiUH Campus Map — the 3D campus
   The scene: renderer, sky, sun, the site with its buildings, the trees,
   the photo cards, the camera flights. The geometry lives in
   buildings_model.js / site.js / props.js, the place data in data.js.
   ========================================================================== */

import * as THREE from '../vendor/three/three.module.js';
import { OrbitControls } from '../vendor/three/OrbitControls.js';
import { createWalker } from './walk.js';
import { BUILDINGS, CAMPUS, PAGE_ID } from './data.js';
import { SPOTS } from './spots.js';
import { buildStorefronts } from './storefronts.js';
import { buildSite } from './site.js';
import { plantTrees, streetFurniture } from './props.js';
import {
  teachBuilding, labBuilding, dormBuilding, aptBuilding,
  studentCenter, welcomeCenter, lakesidePavilion, lakePavilion, gate,
  skybridge, sideGate
} from './buildings.js';

var stage = document.getElementById('stage');

/* An ES module cannot `return` at the top level. The page always has a
   #stage, so a missing one only means this script was loaded elsewhere:
   do nothing in that case. */
if (stage) {
  boot();
}

function boot() {
var i18n = window.CampusI18n;
var lang = function () { return i18n ? i18n.lang : 'en'; };
var pick = function (en, zh) { return lang() === 'zh' && zh ? zh : en; };

var reduceMotion = window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- renderer ----------------------------------------------------------- */

/* A browser without WebGL gets a note and the flat map instead. */
function hasWebGL() {
  try {
    var probe = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (probe.getContext('webgl2') || probe.getContext('webgl')));
  } catch (error) {
    return false;
  }
}

if (!hasWebGL()) {
  document.documentElement.classList.add('no-webgl');
  return;
}

var canvas = document.createElement('canvas');
canvas.id = 'world';
canvas.tabIndex = 0;
stage.insertBefore(canvas, stage.firstChild);

var renderer = new THREE.WebGLRenderer({
  canvas: canvas, antialias: true, alpha: false,
  powerPreference: 'high-performance', logarithmicDepthBuffer: true
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;
renderer.outputColorSpace = THREE.SRGBColorSpace;

var scene = new THREE.Scene();
scene.fog = new THREE.FogExp2('#e3ebe6', 0.00042);

var camera = new THREE.PerspectiveCamera(38, 1, 2, 2600);
/* The opening view is computed from the site's own bounds, so the whole
   plate is in frame whether it is a wide window or a phone. */
var SITE_BOUNDS = { cx: -22, cz: -90, hw: 348, hd: 128, h: 26 };
var HOME_DIR = new THREE.Vector3(0, 0.88, 0.70).normalize();
var HOME_FOV = 38;

function homeFor(aspect) {
  /* On a phone the whole strip would shrink to a sliver, so portrait opens
     on the teaching quarter — the middle of campus — and the visitor pulls
     back from there. */
  if (aspect < 0.95) {
    return {
      p: new THREE.Vector3(-24, 265, 205),
      t: new THREE.Vector3(-14, 2, -116)
    };
  }
  var vFov = THREE.MathUtils.degToRad(HOME_FOV);
  var hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
  /* distance that fits the width, and the one that fits the depth, tilted */
  var dW = SITE_BOUNDS.hw / Math.tan(hFov / 2);
  var dD = (SITE_BOUNDS.hd * Math.sin(Math.asin(HOME_DIR.y)) + SITE_BOUNDS.h) / Math.tan(vFov / 2);
  var d = Math.max(dW, dD) * 0.94;
  var t = new THREE.Vector3(SITE_BOUNDS.cx, 0, SITE_BOUNDS.cz);
  return { p: t.clone().add(HOME_DIR.clone().multiplyScalar(d)), t: t };
}

var HOME = homeFor(window.innerWidth / Math.max(1, window.innerHeight));
camera.position.copy(HOME.p);

var controls = new OrbitControls(camera, canvas);
controls.target.copy(HOME.t);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 60;
controls.maxDistance = 900;
controls.maxPolarAngle = 1.45;
controls.minPolarAngle = 0.12;
controls.panSpeed = 0.8;
controls.update();

/* ?view=top looks straight down with north up, so a render can be laid
   beside the drawing and checked for alignment. */
var debugParams = new URLSearchParams(window.location.search);
function isTopView() { return debugParams.get('view') === 'top'; }
if (isTopView()) {
  camera.position.set(Number(debugParams.get('x') || 0),
                      Number(debugParams.get('y') || 760),
                      Number(debugParams.get('z') || 0.01));
  controls.target.set(Number(debugParams.get('tx') || 0), 0,
                      Number(debugParams.get('tz') || 0));
  camera.fov = 30;
  camera.updateProjectionMatrix();
  controls.update();
  Array.prototype.forEach.call(document.querySelectorAll('.scene-label'), function (el) {
    el.style.display = 'none';
  });
}

/* ---- sky and environment ------------------------------------------------ */

function skyCanvas() {
  var c = document.createElement('canvas');
  c.width = 8;
  c.height = 512;
  var g = c.getContext('2d');
  var gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0.00, '#5b93bf');
  gr.addColorStop(0.34, '#93bcd3');
  gr.addColorStop(0.58, '#c8dbe0');
  gr.addColorStop(0.76, '#e8ece0');
  gr.addColorStop(1.00, '#f4efe0');
  g.fillStyle = gr;
  g.fillRect(0, 0, 8, 512);
  return c;
}

var skyTex = new THREE.CanvasTexture(skyCanvas());
skyTex.colorSpace = THREE.SRGBColorSpace;
skyTex.mapping = THREE.EquirectangularReflectionMapping;
scene.background = skyTex;

var pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromEquirectangular(skyTex).texture;
scene.environmentIntensity = 0.45;

/* ---- light -------------------------------------------------------------- */

var hemi = new THREE.HemisphereLight('#e7f0fa', '#6f7d55', 1.15);
scene.add(hemi);

var sun = new THREE.DirectionalLight('#fff2dc', 2.05);
sun.position.set(-260, 340, 220);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
var sc = sun.shadow.camera;
sc.left = -380;
sc.right = 380;
sc.top = 380;
sc.bottom = -380;
sc.near = 1;
sc.far = 1100;
sc.updateProjectionMatrix();
sun.shadow.bias = -0.0006;
sun.shadow.normalBias = 0.6;
/* The sun and scenery are fixed. Walking needs live avatar shadows, but the
   orbit view can reuse its map: the animated fountain does not cast shadows. */
sun.shadow.autoUpdate = false;
sun.shadow.needsUpdate = true;
canvas.addEventListener('webglcontextrestored', function () {
  sun.shadow.needsUpdate = true;
});
scene.add(sun);
sun.target.position.set(0, 0, -150);
scene.add(sun.target);
var fill = new THREE.DirectionalLight('#cfe0ff', 0.28);
fill.position.set(200, 120, -200);
scene.add(fill);

/* ---- the site ----------------------------------------------------------- */

var site = buildSite(scene);
var pickables = [];
var buildingById = {};
BUILDINGS.forEach(function (b) { buildingById[b.id] = b; });

function addBuilding(cfg) {
  var model = null;
  switch (cfg.kind) {
    case 'welcome': model = welcomeCenter(cfg); break;
    case 'student': model = studentCenter(cfg); break;
    case 'teach': model = teachBuilding(cfg); break;
    case 'lab': model = labBuilding(cfg); break;
    case 'dorm': model = dormBuilding(cfg); break;
    case 'apt': model = aptBuilding(cfg); break;
    case 'lakeside': model = lakesidePavilion(cfg); break;
    case 'gate': model = gate(cfg); break;
    default: model = null;
  }
  if (model) {
    model.userData.id = cfg.id;
    scene.add(model);
  }
  /* A box the size of the footprint picks the building, so even a flat
     ground drawing (the track, the courts, the lake) can be clicked. */
  var flat = (cfg.kind === 'track' || cfg.kind === 'courts' || cfg.kind === 'lake');
  var gateIsland = cfg.kind === 'gate';
  var h = flat ? 8 : (gateIsland ? 2 : (cfg.h || 20));
  var proxy = new THREE.Mesh(
    new THREE.BoxGeometry(gateIsland ? 34 : cfg.w, gateIsland ? 3 : Math.max(h, 12), gateIsland ? 96 : cfg.d),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  proxy.position.set(cfg.x, gateIsland ? 1.5 : Math.max(h, 12) / 2, gateIsland ? cfg.z - 54 : cfg.z);
  proxy.userData.id = cfg.id;
  scene.add(proxy);
  pickables.push(proxy);
}

BUILDINGS.forEach(addBuilding);
var storefronts = buildStorefronts(scene);

/* ── the bridge between A and B ──────────────────────────────────────────
   Photographed from the south lawn: a slim white deck on a shallow
   downstand, a lattice arch carrying it, and a flight of steps at each
   end. On the plan it spans the 64 m gap between the two teaching blocks,
   just north of the covered link, and lands on their inner corners. */
var A = buildingById.a;
var B = buildingById.b;
{
  var deckY = 12.4;
  var gapX1 = A.x + A.w / 2;
  var gapX2 = B.x - B.w / 2;
  var bridgeZ = -110 + (245 - 290) * 0.3375;   /* the plan's band, north edge */
  var bridge = skybridge([gapX1 - 1.6, bridgeZ], [gapX2 + 1.6, bridgeZ], deckY, {
    width: 6.4, rise: 5.6
  });
  bridge.userData.id = 'bridge';
  scene.add(bridge);
}

/* The secondary entrance is north of the dormitories. Its position is
   shared with the road network rather than independently guessed. */
var sg = sideGate(site.northGate);
sg.name = 'side-gate';
sg.userData.id = 'east-gate';
scene.add(sg);
sg.traverse(function (child) { if (child.isMesh) child.userData.id = 'east-gate'; });
pickables.push(sg);

plantTrees(scene, [site.keep.roads, site.keep.walks]);
streetFurniture(scene);

/* Bake local transforms only for the scenery already constructed. Keep world
   matrices updating normally; the fountain subtree stays animated, and the
   walker/web are added later so their transforms remain fully dynamic. */
function freezeSceneryTransforms(object) {
  if (object === site.fountain || object === site.bubbles ||
      (site.ripples && site.ripples.indexOf(object) !== -1)) return;
  object.updateMatrix();
  object.matrixAutoUpdate = false;
  object.children.forEach(freezeSceneryTransforms);
}
scene.children.forEach(freezeSceneryTransforms);

/* ---- labels ------------------------------------------------------------- */

var labelLayer = document.getElementById('scene-labels');
var labels = [];
var eastGateButton = document.createElement('button');
eastGateButton.type = 'button';
eastGateButton.className = 'scene-label';
eastGateButton.addEventListener('click', function (event) {
  event.stopPropagation();
  openSpot('east-gate');
});
labelLayer.appendChild(eastGateButton);
labels.push({ el: eastGateButton, data: { id: 'east-gate', en: 'East Gate', zh: '校园东门' }, spot: SPOTS.find(function (spot) { return spot.id === 'east-gate'; }) });
BUILDINGS.forEach(function (b) {
  if (!b.en) {
    return;
  }
  var el = document.createElement('button');
  el.type = 'button';
  el.className = 'scene-label';
  el.addEventListener('click', function (event) {
    event.stopPropagation();
    focusBuilding(b.id, true);
  });
  labelLayer.appendChild(el);
  labels.push({ el: el, data: b });
});
var placeDock = document.createElement('div');
placeDock.className = 'scene-place-dock';
placeDock.setAttribute('role', 'group');
placeDock.setAttribute('aria-label', pick('Campus rooms, services and shops', '校园房间、服务与店铺'));
BUILDINGS.forEach(function (building) {
  var buildingSpots = SPOTS.filter(function (spot) { return spot.parentId === building.id && spot.id !== 'east-gate'; });
  if (!buildingSpots.length) return;
  var group = document.createElement('section');
  group.className = 'scene-place-group';
  group.setAttribute('data-dock-parent', building.id);
  var heading = document.createElement('h3');
  var roomCount = buildingSpots.filter(function (spot) { return !spot.exterior; }).length;
  var shopCount = buildingSpots.length - roomCount;
  var countLabel = [roomCount ? roomCount + pick(' rooms', ' 个房间') : '', shopCount ? shopCount + pick(' shops', ' 家店') : ''].filter(Boolean).join(' · ');
  heading.textContent = pick(building.en, building.zh) + (countLabel ? ' · ' + countLabel : '');
  heading.setAttribute('data-en-name', building.en);
  heading.setAttribute('data-zh-name', building.zh);
  heading.setAttribute('data-room-count', String(roomCount));
  heading.setAttribute('data-shop-count', String(shopCount));
  group.appendChild(heading);
  buildingSpots.forEach(function (spot) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'scene-place-chip';
    button.setAttribute('data-dock-spot', spot.id);
    button.addEventListener('click', function () { openSpot(spot.id); });
    group.appendChild(button);
    labels.push({ el: button, data: building, spot: spot, dock: true });
  });
  placeDock.appendChild(group);
});
stage.appendChild(placeDock);

function refreshLabels() {
  labels.forEach(function (l) {
    if (l.spot) {
      l.el.textContent = pick(l.spot.en, l.spot.zh);
      l.el.textContent = pick(l.spot.en, l.spot.zh);
      l.el.setAttribute('aria-label', pick(l.spot.en + ' in ' + l.data.en, l.data.zh + '内的' + l.spot.zh));
      l.el.setAttribute('aria-pressed', l.spot.id === selectedSpotId ? 'true' : 'false');
    } else {
      l.el.textContent = pick(l.data.en, l.data.zh);
    }
  });
}
refreshLabels();
if (i18n && i18n.onChange) {
  i18n.onChange(function () {
    welcomePlanterLabel.textContent = pick('Welcome Center', '欢迎中心');
    refreshLabels();
    placeDock.querySelectorAll('.scene-place-group h3').forEach(function (heading) {
      var rooms = Number(heading.getAttribute('data-room-count'));
      var shops = Number(heading.getAttribute('data-shop-count'));
      var counts = [rooms ? rooms + pick(' rooms', ' 个房间') : '', shops ? shops + pick(' shops', ' 家店') : ''].filter(Boolean).join(' · ');
      heading.textContent = pick(heading.getAttribute('data-en-name'), heading.getAttribute('data-zh-name')) + (counts ? ' · ' + counts : '');
    });
    /* The panel is not marked up with data-zh (its text is built here), so
       it has to be redrawn whenever the language changes — hint or card. */
    renderPanel();
  });
}

function anchorOf(b, spot) {
  if (spot) {
    if (spot.id === 'east-gate') return new THREE.Vector3(site.northGate.x, 7, site.northGate.z);
    if (spot.exterior) {
      var storefront = storefronts.find(function (g) { return g.userData.spotId === spot.id; });
      if (storefront) return storefront.position.clone().add(new THREE.Vector3(0, 5, 0));
    }
    var px = Number(spot.x), py = Number(spot.y);
    if (Number.isFinite(px) && Number.isFinite(py)) {
      return new THREE.Vector3(-88 + (px - 788) * 0.3375, 4.4 + ((spot.floor || 1) - 1) * 4.2, -110 + (py - 290) * 0.3375);
    }
  }
  if (b.id === 'welcome') return new THREE.Vector3(b.x, 18, b.z + 18);
  var h = (b.kind === 'track' || b.kind === 'courts' || b.kind === 'lake')
    ? 4 : Math.max(b.h || 20, 14) + 6;
  return new THREE.Vector3(b.x, h, b.z);
}

/* Label anchors are fixed scenery, not per-frame Vector3 allocations. Dock
   chips have no world position and do not belong in the projection loop. */
var sceneLabels = labels.filter(function (l) { return !l.dock; });
sceneLabels.forEach(function (l) {
  l.anchor = anchorOf(l.data, l.spot);
  if (l.spot) l.parentAnchor = anchorOf(l.data);
});
var tmpVec = new THREE.Vector3();
var tmpBuildingVec = new THREE.Vector3();
var labelViewMatrix = new THREE.Matrix4();
var labelProjectionMatrix = new THREE.Matrix4();
var labelWidth = 0, labelHeight = 0;
var labelsDirty = true;
function positionLabels() {
  /* CSS hides these in walking mode. Avoid even layout reads while hidden,
     and force a fresh placement on the first orbit frame after exiting. */
  if (walker && walker.active) { labelsDirty = true; return; }
  var w = stage.clientWidth;
  var h = stage.clientHeight;
  if (!labelsDirty && w === labelWidth && h === labelHeight &&
      labelViewMatrix.equals(camera.matrixWorldInverse) &&
      labelProjectionMatrix.equals(camera.projectionMatrix)) return;
  labelsDirty = false;
  labelWidth = w;
  labelHeight = h;
  labelViewMatrix.copy(camera.matrixWorldInverse);
  labelProjectionMatrix.copy(camera.projectionMatrix);
  sceneLabels.forEach(function (l) {
    tmpVec.copy(l.anchor).project(camera);
    var x = (tmpVec.x * 0.5 + 0.5) * w;
    var y = (-tmpVec.y * 0.5 + 0.5) * h;
    var visible = tmpVec.z < 1 && x > -80 && x < w + 80 && y > -40 && y < h + 40;
    if (l.more) {
      x = Math.max(92, Math.min(w - 92, x));
      y += 30;
    } else if (l.spot) {
      tmpBuildingVec.copy(l.parentAnchor).project(camera);
      var vx = tmpVec.x - tmpBuildingVec.x;
      var vy = tmpVec.y - tmpBuildingVec.y;
      if (Math.hypot(vx, vy) < 0.045) { vx = (l.labelsInParent || 0) % 2 ? 0.045 : -0.045; vy = 0.025; }
      var len = Math.hypot(vx, vy) || 1;
      var offset = l.spot.id === 'east-gate' ? 78 : (l.spot.exterior ? 54 : 46);
      x += vx / len * offset;
      y -= vy / len * offset;
      if (l.spot.exterior && l.spot.id !== 'east-gate') y += 20;
      if (l.spot.id === 'east-gate') { x += 56; y += 18; }
    }
    l.el.style.transform = 'translate(-50%,-100%) translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)';
    l.el.classList.toggle('is-hidden', !visible);
  });
}

/* ---- picking ------------------------------------------------------------ */

var raycaster = new THREE.Raycaster();
var pointer = new THREE.Vector2();
var downAt = null;

function hitTest(clientX, clientY) {
  var rect = canvas.getBoundingClientRect();
  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  var shopHit = raycaster.intersectObjects(storefronts, true)[0];
  if (shopHit && shopHit.object.userData.spotId) return shopHit.object.userData.spotId;
  var hit = raycaster.intersectObjects(pickables, true)[0];
  return hit ? (hit.object.userData.spotId || hit.object.userData.id || hit.object.parent.userData.id) : null;
}

canvas.addEventListener('pointerdown', function (e) {
  if (walker && walker.active) return;
  downAt = { x: e.clientX, y: e.clientY };
});
canvas.addEventListener('pointercancel', function () { downAt = null; });
canvas.addEventListener('pointerup', function (e) {
  if ((walker && walker.active) || !downAt) { return; }
  var moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
  downAt = null;
  if (moved > 6) { return; }
  var id = hitTest(e.clientX, e.clientY);
  if (id) {
    if (SPOTS.some(function (spot) { return spot.id === id; })) openSpot(id);
    else focusBuilding(id, true);
  } else {
    clearSelection();
  }
});
canvas.addEventListener('pointermove', function (e) {
  if (walker && walker.active) return;
  canvas.style.cursor = hitTest(e.clientX, e.clientY) ? 'pointer' : 'grab';
});

/* ---- the camera --------------------------------------------------------- */

var flight = null;

function flyTo(pos, target, duration) {
  if (walker && walker.active) walker.exit();
  flight = {
    from: { pos: camera.position.clone(), target: controls.target.clone() },
    to: { pos: pos.clone(), target: target.clone() },
    start: performance.now(),
    duration: duration || (reduceMotion ? 0.01 : 1.1)
  };
  controls.enabled = false;
}

function focusBuilding(id, openPanel) {
  var b = buildingById[id];
  if (!b) { return; }
  var dir = new THREE.Vector3(0.46, 0.42, 0.78).normalize();
  var dist = Math.max(70, Math.min(260, Math.max(b.w, b.d) * 2.6));
  var target = new THREE.Vector3(b.x, Math.min((b.h || 18) * 0.45, 16), b.z);
  var origin = target.clone().add(dir.multiplyScalar(dist));
  if (id === 'b' || id === 'c') origin.y = Math.max(origin.y, 48);
  if (id === 'welcome') origin.y = Math.max(origin.y, 42);
  flyTo(origin, target);
  if (openPanel) {
    select(id);
  }
}

function boardView(name) {
  var v = viewPoints(name, stage.clientWidth / Math.max(1, stage.clientHeight));
  if (!v) { return; }
  flyTo(new THREE.Vector3(v.p[0], v.p[1], v.p[2]),
        new THREE.Vector3(v.t[0], v.t[1], v.t[2]));
}

var VIEWS = {
  teaching: { p: [-30, 130, 90], t: [-24, 8, -96] },
  lake: { p: [236, 96, 16], t: [186, 2, -60] },
  sport: { p: [-150, 140, 90], t: [-250, 2, -64] },
  dorms: { p: [330, 140, 10], t: [250, 22, -140] }
};

function resetView() {
  select(null);
  var win = homeFor(stage.clientWidth / Math.max(1, stage.clientHeight));
  flyTo(win.p, win.t);
}

/* ---- the panel ---------------------------------------------------------- */

var panel = document.getElementById('scene-panel');
var selectedId = null;
var selectedSpotId = null;
var returnedBuildingPhoto = false;

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

function renderPanel() {
  if (!panel) { return; }
  panel.hidden = !selectedId;
  var activeBuilding = selectedId === 'east-gate'
    ? { id: 'east-gate', en: 'Campus East Gate', zh: '校园东门' }
    : (selectedId && buildingById[selectedId]);
  var placeOwnerId = selectedId === 'east-gate' ? 'dormB' : selectedId;
  if (placeDock) {
    placeDock.querySelectorAll('[data-dock-parent]').forEach(function (group) { group.hidden = !!placeOwnerId && group.getAttribute('data-dock-parent') !== placeOwnerId; });
    var dockSpots = SPOTS.filter(function (spot) { return spot.id !== 'east-gate'; });
    placeDock.classList.toggle('is-empty', !dockSpots.length);
    Array.prototype.forEach.call(placeDock.querySelectorAll('[data-dock-spot]'), function (button) {
      button.setAttribute('aria-pressed', button.getAttribute('data-dock-spot') === selectedSpotId ? 'true' : 'false');
    });
    placeDock.setAttribute('aria-label', activeBuilding
      ? pick('Rooms in ' + activeBuilding.en, activeBuilding.zh + '的房间')
      : pick('Rooms and shops', '房间与店铺'));
  }
  stage.classList.toggle('has-selection', !!selectedId);
  if (!selectedId) {
    panel.innerHTML = '';
    return;
  }
  var b = selectedId === 'east-gate' ? {
    id: 'east-gate', en: 'Campus East Gate', zh: '校园东门',
    photo: 'photos/east-gate.jpg',
    desc: 'The north entrance and security checkpoint.',
    descZh: '校园北侧入口与保安检查点。',
    where: 'North of Student Dormitory 2.', whereZh: '学生宿舍 2 号楼以北。'
  } : buildingById[selectedId];
  if (!b) { return; }
  var html = '<div class="scene-panel-toolbar">' +
    (selectedSpotId && selectedSpotId !== 'east-gate' && !returnedBuildingPhoto ? '<button type="button" class="scene-room-back" data-back-building>' + pick('Back to building photo', '返回建筑图片') + '</button>' : '') +
    '<button type="button" class="scene-close" data-close-photo aria-label="' +
    pick('Close photos', '关闭图片') + '">' + pick('Close', '关闭') + ' ×</button></div>';
  var rooms = b.id === 'east-gate' ? [] : SPOTS.filter(function (spot) { return spot.parentId === b.id && spot.id !== 'east-gate'; });
  var activeSpot = selectedSpotId === 'east-gate'
    ? SPOTS.find(function (spot) { return spot.id === 'east-gate'; })
    : rooms.find(function (spot) { return spot.id === selectedSpotId; });
  if (activeSpot && activeSpot.id !== 'east-gate') html += '<p class="scene-owner">' + escapeHtml(pick(b.en, b.zh)) + '</p>';
  var renderedRooms = rooms;
  if (renderedRooms.length) {
    html += '<section class="scene-rooms"><h3>' + pick('Rooms & shops', '房间与店铺') + '</h3>';
    [1, 2, 3].forEach(function (floor) {
      var onFloor = renderedRooms.filter(function (spot) { return spot.floor === floor; });
      if (!onFloor.length) return;
      html += '<div class="scene-floor"><h4>' + floor + pick('F', ' 楼') + '</h4><div class="scene-room-buttons">';
      onFloor.forEach(function (spot) {
        html += '<button type="button" data-spot="' + spot.id + '" aria-pressed="' + (spot.id === selectedSpotId) + '">' + escapeHtml(pick(spot.en, spot.zh)) + '</button>';
      });
      html += '</div></div>';
    });
    html += '</section>';
  }
  var showBuildingPhoto = !activeSpot || returnedBuildingPhoto;
  var photos = showBuildingPhoto
    ? (b.photos || (b.photo ? [{ src: b.photo, en: b.en, zh: b.zh }] : []))
    : (activeSpot.photo ? [{ src: activeSpot.photo, en: activeSpot.en, zh: activeSpot.zh }] : []);
  photos.forEach(function (photo) {
    var title = escapeHtml(pick(photo.en, photo.zh));
    html += '<figure class="scene-photo-item"><a class="scene-photo" href="' + escapeHtml(photo.src) + '" data-lightbox' +
      ' aria-label="' + title + '"><img src="' + escapeHtml(photo.preview || photo.src) + '" alt="' + title + '" loading="lazy"></a>' +
      (photos.length > 1 ? '<figcaption>' + title + '</figcaption>' : '') + '</figure>';
  });
  if (activeSpot && !returnedBuildingPhoto) {
    html += '<p class="scene-kicker">' + escapeHtml(pick(b.en, b.zh)) + '</p>';
    html += '<h2 class="scene-title">' + escapeHtml(pick(activeSpot.en, activeSpot.zh)) + '</h2>';
    html += '<p>' + escapeHtml(pick(activeSpot.desc, activeSpot.descZh)) + '</p>';
    html += '<p class="scene-where">' + (activeSpot.floor ? activeSpot.floor + pick('F · ', ' 楼 · ') : '') + escapeHtml(pick(activeSpot.where, activeSpot.whereZh)) + '</p>';
  } else {
    html += '<p class="scene-kicker">' + escapeHtml(lang() === 'zh' ? b.en : b.zh) + '</p>';
    html += '<h2 class="scene-title">' + escapeHtml(pick(b.en, b.zh)) + '</h2>';
    if (activeSpot && returnedBuildingPhoto) {
      html += '<p class="scene-room-parent">' + escapeHtml(pick(activeSpot.en, activeSpot.zh)) + '</p>';
    }
    html += '<p>' + escapeHtml(pick(b.desc, b.descZh)) + '</p>';
    html += '<p class="scene-where">' + escapeHtml(pick(b.where, b.whereZh)) + '</p>';
  }
  panel.innerHTML = html;
}

function select(id) {
  selectedId = id;
  selectedSpotId = null;
  returnedBuildingPhoto = false;
  labels.forEach(function (l) {
    l.el.classList.toggle('is-active', l.data.id === id);
  });
  renderPanel();
}

function openSpot(id) {
  var spot = SPOTS.find(function (item) { return item.id === id; });
  if (!spot) return;
  select(spot.parentId);
  selectedSpotId = id;
  returnedBuildingPhoto = false;
  if (spot.id === 'east-gate') selectedId = 'east-gate';
  renderPanel();
  if (spot.id === 'east-gate') {
    var gate = scene.getObjectByName('side-gate');
    if (gate) {
      var gateTarget = gate.position.clone().add(new THREE.Vector3(0, 2, 0));
      var gateCamera = gateTarget.clone().add(new THREE.Vector3(-52, 30, -4));
      flyTo(gateCamera, gateTarget);
    }
  } else if (spot.exterior) {
    var facade = storefronts.find(function (group) { return group.userData.spotId === id; });
    if (facade) {
      var outward = new THREE.Vector3(0, 0, 1).applyQuaternion(facade.quaternion);
      var target = facade.position.clone().add(new THREE.Vector3(0, 2.2, 0));
      /* Fly toward the shop facade from outside the building envelope; the
         south side faces +z, the north side -z. */
      var shopOwner = buildingById[spot.parentId];
      var facadeSide = facade.userData.facade;
      var shopCameraTarget = target.clone();
      var desired = target.clone().add(outward.clone().multiplyScalar(14)).add(new THREE.Vector3(0, 6, 0));
      if (shopOwner) {
        // For north-facing shops, rise over Dorm 1 and descend on the road side;
        // this avoids the tight inter-building gap trapping the camera in a wall.
        desired.x = facadeSide === 'north'
          ? shopOwner.x + shopOwner.w / 2 + 42
          : shopOwner.x + shopOwner.w / 2 + 18;
        desired.z = facadeSide === 'north'
          ? shopOwner.z - shopOwner.d / 2 - 12
          : target.z + 18;
        desired.y = 34;
      }
      controls.minDistance = 8;
      flyTo(desired, shopCameraTarget);
    }
  } else if (spot.id !== 'east-gate') {
    var owner = buildingById[spot.parentId];
    if (owner) {
      var roomTarget = new THREE.Vector3(owner.x, 8, owner.z);
      var roomDirection = new THREE.Vector3(0.46, 0.55, 0.78).normalize();
      var roomDistance = Math.max(80, Math.min(170, Math.max(owner.w, owner.d) * 1.65));
      flyTo(roomTarget.clone().add(roomDirection.multiplyScalar(roomDistance)), roomTarget);
    }
  }
  var selectedContent = panel.querySelector('.scene-photo-item') || panel.querySelector('.scene-title');
  panel.scrollTop = 0;
}

function clearSelection() {
  select(null);
}

if (panel) {
  panel.addEventListener('click', function (e) {
    if (e.target.closest('[data-close-photo]')) {
      clearSelection();
      canvas.focus({ preventScroll: true });
      return;
    }
    var room = e.target.closest('[data-spot]');
    if (room) {
      openSpot(room.getAttribute('data-spot'));
      return;
    }
    if (e.target.closest('[data-back-building]')) {
      if (selectedSpotId === 'east-gate') {
        clearSelection();
      } else {
        returnedBuildingPhoto = true;
        renderPanel();
        panel.scrollTop = 0;
      }
      return;
    }
    var btn = e.target.closest('[data-focus]');
    if (btn && selectedId) {
      focusBuilding(selectedId, false);
    }
  });
}

Array.prototype.forEach.call(document.querySelectorAll('[data-view]'), function (btn) {
  btn.addEventListener('click', function () {
    boardView(btn.getAttribute('data-view'));
    Array.prototype.forEach.call(document.querySelectorAll('[data-view]'), function (b2) {
      b2.setAttribute('aria-pressed', b2 === btn ? 'true' : 'false');
    });
  });
});
/* East Gate is a scene label above; it uses the same footprint-button style as buildings. */

window.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && selectedId) {
    clearSelection();
  }
});

/* ---- resize and the frame loop ------------------------------------------ */

function resize() {
  var header = document.querySelector('.site-header');
  if (header) stage.style.setProperty('--campus-header-height', header.offsetHeight + 'px');
  var w = stage.clientWidth;
  var h = stage.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = walker && walker.active ? 60 : (w / h < 1 ? 54 : 38);
  /* keep the orbit's far limit beyond whatever framing needs */
  controls.maxDistance = Math.max(900, 2600 * (h / Math.max(1, w)) / 2);
  camera.updateProjectionMatrix();
}

if (window.ResizeObserver) {
  new ResizeObserver(resize).observe(stage);
} else {
  window.addEventListener('resize', resize);
}
resize();

var walker = createWalker({
  scene: scene, camera: camera, controls: controls, canvas: canvas, stage: stage, shoreline: site.shoreline,
  beforeEnter: function () { flight = null; downAt = null; clearSelection(); }
});

var clock = new THREE.Clock();
var elapsed = 0;
// Ease fill-rate pressure on slower devices without reducing model detail.
// Only sustained slow frames lower resolution; mode changes reset the sample.
var resolutionFrames = 0, resolutionTime = 0, resolutionMode = false;
var resolutionWarmup = 120;
document.addEventListener('visibilitychange', function () {
  resolutionFrames = 0; resolutionTime = 0; resolutionWarmup = 120;
});
function adaptResolution(frameTime) {
  if (document.hidden || frameTime > .25 || resolutionMode !== walker.active) {
    resolutionMode = walker.active;
    resolutionFrames = 0; resolutionTime = 0;
    return;
  }
  if (resolutionWarmup > 0) { resolutionWarmup--; return; }
  resolutionFrames++;
  resolutionTime += frameTime;
  if (resolutionFrames < 90) return;
  if (resolutionTime / resolutionFrames > 1 / 35 && renderer.getPixelRatio() > .85) {
    renderer.setPixelRatio(Math.max(.85, renderer.getPixelRatio() - .15));
    // Shadow maps depend on the light, not the main canvas resolution.
  }
  resolutionFrames = 0; resolutionTime = 0;
}

function frame() {
  var frameTime = clock.getDelta();
  adaptResolution(frameTime);
  var dt = Math.min(frameTime, 0.05);
  elapsed += dt;

  if (walker.active) {
    walker.update(dt);
  } else if (flight) {
    var k = Math.min(1, (performance.now() - flight.start) / (flight.duration * 1000));
    var e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    if (flight.safeShop) {
      var aboveFrom = flight.from.pos.clone().setY(flight.cruiseY);
      var aboveTo = flight.to.pos.clone().setY(flight.cruiseY);
      if (k < 0.25) camera.position.lerpVectors(flight.from.pos, aboveFrom, k * 4);
      else if (k < 0.75) camera.position.lerpVectors(aboveFrom, aboveTo, (k - 0.25) * 2);
      else camera.position.lerpVectors(aboveTo, flight.to.pos, (k - 0.75) * 4);
    } else {
      camera.position.lerpVectors(flight.from.pos, flight.to.pos, e);
    }
    controls.target.lerpVectors(flight.from.target, flight.to.target, e);
    camera.lookAt(controls.target);
    if (k >= 1) {
      flight = null;
      controls.enabled = true;
      controls.update();
    }
  } else {
    controls.update();
  }

  if (site.fountain.userData.update) site.fountain.userData.update(reduceMotion ? 0 : elapsed);
  /* the lake fountain: the spray breathes, the ripples breathe out */
  if (site.bubbles) {
    var puff = 0.92 + Math.sin(elapsed * 2.4) * 0.10;
    site.bubbles.scale.set(puff, 0.55 + Math.sin(elapsed * 3.1) * 0.08, puff);
  }
  if (site.ripples) {
    site.ripples.forEach(function (ring, i) {
      var t = (elapsed * 0.42 + i / 3) % 1;
      var s = 0.45 + t * 1.25;
      ring.scale.set(s, s, 1);
      ring.material.opacity = 0.34 * (1 - t) * (1 - t);
    });
  }

  /* Rebuild on both mode transitions, especially on exit so the cached map
     cannot retain the avatar's last shadow. Never freeze shadows mid-walk. */
  if (sun.shadow.autoUpdate !== walker.active) {
    sun.shadow.autoUpdate = walker.active;
    sun.shadow.needsUpdate = true;
  }
  renderer.render(scene, camera);
  positionLabels();
  requestAnimationFrame(frame);
}

renderPanel();
frame();

/* The visitor arrives from the south-west and the camera settles in. */
if (!reduceMotion && !isTopView()) {
  camera.position.set(150, 500, 540);
  flyTo(HOME.p, HOME.t, 1.8);
}

/* On a phone, "Overview" means the near view: the whole strip would be a
   grey sliver. */
function viewPoints(name, aspect) {
  if (name === 'overview') {
    var h = homeFor(aspect);
    return { p: h.p.toArray(), t: h.t.toArray() };
  }
  return VIEWS[name];
}

window.Campus3D = {
  select: function (id) { focusBuilding(id, true); },
  spot: openSpot,
  state: function () {
    return {
      cam: camera.position.toArray().map(function (n) { return Math.round(n); }),
      target: controls.target.toArray().map(function (n) { return Math.round(n); }),
      flying: !!flight, enabled: controls.enabled,
      walking: walker.active, player: walker.avatar.position.toArray(), web: walker.webState()
    };
  },
  view: boardView,
  reset: resetView,
  debug: function () { return { scene: scene, camera: camera, site: site, controls: controls }; }
};
}
