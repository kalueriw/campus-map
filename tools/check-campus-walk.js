const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const puppeteer = require('puppeteer-core');
const root = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end(); }
    res.setHeader('Content-Type', ({'.js':'text/javascript','.css':'text/css','.html':'text/html','.jpg':'image/jpeg'})[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  });
});
(async () => {
  let browser;
  try {
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader'] });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const pause = ms => new Promise(r => setTimeout(r, ms));
    const state = () => page.evaluate(() => Campus3D.state());
    fs.mkdirSync(path.join(root, 'shots'), { recursive: true });
    for (const width of [1280, 390]) {
      await page.setViewport({width, height: 844});
      await page.goto(`http://127.0.0.1:${server.address().port}/campus.html`, {waitUntil:'networkidle2'});
      await page.waitForFunction(() => window.Campus3D && !Campus3D.state().flying);
      const lampCheck = await page.evaluate(() => {
        const { scene, site } = Campus3D.debug();
        const lamps = scene.getObjectByName('site').userData.lampPositions;
        const routes = [...site.keep.roads, ...site.keep.walks];
        return { count: lamps.length, blocked: lamps.filter(([x, z]) => routes.some(([cx, cz, r]) => Math.hypot(x - cx, z - cz) < r + 0.65)).length };
      });
      assert(lampCheck.count > 0, 'street lamps remain present');
      assert.equal(lampCheck.blocked, 0, 'all lamps clear roads and footpaths');
      console.log(`PASS ${width}: ${lampCheck.count} lamp positions clear of routes`);
      if (width === 1280) {
        const timing = await page.evaluate(async () => {
          const THREE = await import('./vendor/three/three.module.js');
          const { createTraversal } = await import('./scene3d/traversal.js');
          const { scene } = Campus3D.debug();
          const traversal = createTraversal(scene);
          const origin = new THREE.Vector3(-24, 1.76, -68);
          const direction = new THREE.Vector3(0, .28, 1).normalize();
          const ray = new THREE.Raycaster(origin, direction, 0, 7);
          const blockers = scene.children.filter(o => o.isGroup && o.userData.id);
          const measure = fn => { const start = performance.now(); for (let i = 0; i < 200; i++) fn(); return (performance.now() - start) / 200; };
          measure(() => traversal.cameraDistance(origin, direction, 7));
          const oldMs = measure(() => ray.intersectObjects(blockers, true));
          const newMs = measure(() => traversal.cameraDistance(origin, direction, 7));
          return { oldMs, newMs };
        });
        console.log('Camera collision ms/query (local software-rendered browser):', timing);
      }
      assert(await page.$eval('#walk-enter', e => e.previousElementSibling?.dataset.view === 'dorms'));
      assert.match(await page.$eval('#walk-web', e => e.textContent), /· E/);
      if (width === 390) {
        assert(await page.$eval('#walk-enter', e => {
          const r = e.getBoundingClientRect(), dorms = e.previousElementSibling.getBoundingClientRect();
          return r.right <= innerWidth && Math.abs(r.top - dorms.top) < 10;
        }), 'mobile adventure entry sits next to Dorms');
      }
      await page.screenshot({path: path.join(root, `shots/adventure-entry-${width}.png`)});
      const bridges = await page.evaluate(async () => {
        const { createTraversal } = await import('./scene3d/traversal.js');
        const scene = Campus3D.debug().scene, traversal = createTraversal(scene);
        const result = [];
        scene.traverse(o => {
          if (!o.userData.solidBridge) return;
          const x = o.position.x, z = o.position.z;
          const y = traversal.roofAt(x, z);
          const clear = [-1.5, 0, 1.5].some(dx => [-1.5, 0, 1.5].some(dz => traversal.roofAt(x + dx, z + dz) > 4 && traversal.clearAt(x + dx, z + dz, .36)));
          result.push({ x, z, y, under: traversal.roofAt(x, z, 2), ceiling: traversal.ceilingAt(x, z, .36), clear });
        });
        return result;
      });
      assert.equal(bridges.length, 3);
      for (const bridge of bridges) {
        assert(bridge.y > 4, 'bridge has a walkable deck');
        assert.equal(bridge.under, .36, 'bridge does not lift pedestrians below');
        assert(bridge.clear, 'passage underneath is clear');
        assert(Number.isFinite(bridge.ceiling), 'bridge underside is solid');
      }
      const overview = await state();
      assert.equal(overview.walking, false);
      await page.click('#walk-enter');
      assert.equal((await state()).walking, true);
      assert.equal((await state()).enabled, false);
      const groundY = (await state()).player[1];
      for (const bridge of bridges) {
        await page.evaluate(b => Campus3D.debug().scene.getObjectByName('campus-walker').position.set(b.x, b.y + 2, b.z), bridge);
        await page.waitForFunction(y => Math.abs(Campus3D.state().player[1] - y) < .01, {}, bridge.y);
        await pause(200);
        assert(Math.abs((await state()).player[1] - bridge.y) < .01, 'lands and stays on bridge');
      }
      await page.keyboard.press('Escape');
      await page.click('#walk-enter');
      console.log(`PASS ${width}: adventure entry, shortcut label, three solid bridge decks and clear underpasses`);
      // Move to the south facade of Teaching B; use real controls to climb.
      await page.evaluate(() => Campus3D.debug().scene.getObjectByName('campus-walker').position.set(60, .36, -88.1));
      await page.keyboard.press('c');
      assert.equal(await page.$eval('#walk-climb', e => e.getAttribute('aria-pressed')), 'true');
      await page.keyboard.down('a');
      await page.waitForFunction(() => Campus3D.state().player[0] < 59.5);
      await page.keyboard.up('a');
      await page.keyboard.down('d');
      await page.waitForFunction(() => Campus3D.state().player[0] > 60);
      await page.keyboard.up('d');
      await page.keyboard.down('w');
      await page.waitForFunction(() => document.querySelector('#walk-climb').getAttribute('aria-pressed') === 'false', {timeout: 60000});
      await page.keyboard.up('w');
      let rooftop = (await state()).player;
      assert(rooftop[1] > 20 && rooftop[2] < -88, `climbed onto B roof: ${rooftop}`);
      await page.screenshot({path: path.join(root, `shots/rooftop-${width}.png`)});
      await pause(400);
      assert(Math.abs((await state()).player[1] - rooftop[1]) < .5, 'stays on roof without teleport');
      await page.keyboard.press('Space');
      await page.waitForFunction(y => Campus3D.state().player[1] > y + .2, {}, rooftop[1]);
      await page.waitForFunction(y => Math.abs(Campus3D.state().player[1] - y) < .1, {}, rooftop[1]);
      await page.keyboard.down('s');
      await page.waitForFunction(() => Campus3D.state().player[1] < 10, {timeout: 60000});
      await page.keyboard.up('s');
      await page.waitForFunction(y => Campus3D.state().player[1] === y, {timeout: 60000}, groundY);
      await page.keyboard.press('Escape');
      await page.click('#walk-enter');
      console.log(`PASS ${width}: wall climb, mantle, roof standing/jump, walk off and fall`);
      // Start actual web flight, then place above the roof to isolate landing.
      await page.keyboard.down('e');
      await page.waitForFunction(() => Campus3D.state().web.attached);
      await page.keyboard.up('e');
      await page.evaluate(() => Campus3D.debug().scene.getObjectByName('campus-walker').position.set(60, 38, -100));
      await page.waitForFunction(() => !Campus3D.state().web.flying, {timeout: 60000});
      assert((await state()).player[1] > 20, 'web flight lands on roof instead of teleporting');
      await page.keyboard.press('Escape');
      await page.click('#walk-enter');
      // Button entry, sideways motion and explicit release from the wall.
      await page.evaluate(() => Campus3D.debug().scene.getObjectByName('campus-walker').position.set(60, .36, -88.1));
      await page.click('#walk-climb');
      await page.keyboard.down('w');
      await page.waitForFunction(() => Campus3D.state().player[1] > 3);
      await page.keyboard.up('w');
      await page.click('#walk-climb');
      await page.waitForFunction(y => Campus3D.state().player[1] === y, {}, groundY);
      await page.keyboard.press('Escape');
      await page.click('#walk-enter');
      console.log(`PASS ${width}: swing-to-roof landing, climb button and release`);
      await page.keyboard.down('e');
      await page.waitForFunction(() => Campus3D.state().web.attached);
      await page.waitForFunction(y => Campus3D.state().player[1] > y + 3, {}, groundY);
      let webState = await state();
      assert(webState.web.anchor[1] > groundY + 4, 'web anchors above player');
      assert(Math.hypot(...webState.player.map((v, i) => v - webState.web.anchor[i])) <= webState.web.length + .1, 'rope constrains swing');
      assert(await page.evaluate(() => Campus3D.debug().scene.getObjectByName('web-thread').visible));
      await page.screenshot({path: path.join(root, `shots/web-swing-${width}.png`)});
      await page.keyboard.up('e');
      webState = await state();
      assert.equal(webState.web.attached, false);
      assert.equal(webState.web.flying, true);
      assert(Math.hypot(...webState.web.velocity) > 1, 'release preserves momentum');
      await page.waitForFunction(p => Math.hypot(...Campus3D.state().player.map((v, i) => v - p[i])) > .3, {}, webState.player);
      await page.waitForFunction(() => !Campus3D.state().web.flying, {timeout: 60000});
      assert.equal((await state()).player[1], groundY, 'released flight lands safely');
      await page.keyboard.down('e');
      await page.keyboard.press('Escape');
      await page.keyboard.up('e');
      assert.equal((await state()).web.flying, false);
      assert.equal(await page.evaluate(() => Campus3D.debug().scene.getObjectByName('web-thread').visible), false);
      await page.click('#walk-enter');
      await page.click('#walk-web');
      assert.equal((await state()).web.attached, true);
      await page.click('#walk-web');
      assert.equal((await state()).web.attached, false);
      await page.keyboard.press('Escape');
      await page.click('#walk-enter');
      await page.keyboard.down('e');
      assert.equal((await state()).web.attached, true);
      await page.evaluate(() => window.dispatchEvent(new Event('blur')));
      assert.equal((await state()).web.attached, false, 'focus loss releases web');
      await page.keyboard.up('e');
      await page.keyboard.press('Escape');
      await page.click('#walk-enter');
      await page.evaluate(() => Campus3D.debug().scene.getObjectByName('campus-walker').position.set(-330, .36, 0));
      await page.click('#walk-web');
      assert.equal((await state()).web.attached, false, 'no floating anchors in open field');
      assert.match(await page.$eval('#web-status', e => e.textContent), /没有合适挂点|No anchor/);
      await page.keyboard.press('Escape');
      await page.click('#walk-enter');
      console.log(`PASS ${width}: web attach, rope constraint, release momentum, button toggle, missing anchor, exit cleanup`);
      await page.keyboard.down('Space');
      await page.waitForFunction(y => Campus3D.state().player[1] > y + 0.1, {}, groundY);
      // Repeated keydown must not restart the jump or auto-hop on landing.
      await page.keyboard.down('Space');
      await page.waitForFunction(y => Campus3D.state().player[1] === y, {}, groundY);
      await page.keyboard.down('Space');
      await pause(300);
      assert.equal((await state()).player[1], groundY, 'holding Space does not auto-hop');
      await page.keyboard.up('Space');
      await page.click('#walk-jump');
      await page.waitForFunction(y => Campus3D.state().player[1] > y + 0.1, {}, groundY);
      await page.waitForFunction(y => Campus3D.state().player[1] === y, {}, groundY);
      // Jump while running; exit in midair and re-enter with grounded state.
      await page.focus('#world');
      const beforeJump = (await state()).player;
      await page.keyboard.down('w');
      await page.keyboard.down('Shift');
      await page.keyboard.press('Space');
      await page.waitForFunction(y => Campus3D.state().player[1] > y + 0.1, {}, groundY);
      assert((await state()).player[2] < beforeJump[2], 'can run while jumping');
      await page.keyboard.press('Escape');
      await page.keyboard.up('w');
      await page.keyboard.up('Shift');
      await page.click('#walk-enter');
      assert.equal((await state()).player[1], groundY, 're-entry clears airborne state');
      console.log(`PASS ${width}: Space/button jump, landing, no auto-hop, running jump, airborne exit`);
      // Dry ground inside the old lake rectangle must now be walkable.
      await page.evaluate(() => Campus3D.debug().scene.getObjectByName('campus-walker').position.set(130, .36, -90));
      await page.keyboard.down('d');
      await page.waitForFunction(() => Campus3D.state().player[0] > 131);
      await page.keyboard.up('d');
      // The actual west shoreline at z=-60 still stops entry into water.
      await page.evaluate(() => Campus3D.debug().scene.getObjectByName('campus-walker').position.set(125, .36, -60));
      await page.keyboard.down('d');
      await pause(2500);
      await page.keyboard.up('d');
      const shoreX = (await state()).player[0];
      assert(shoreX >= 125 && shoreX < 128, `water blocks movement at its shore: ${shoreX}`);
      await page.keyboard.press('Escape');
      await page.click('#walk-enter');
      console.log(`PASS ${width}: lake-side dry ground accessible, water remains blocked`);
      const start = (await state()).player;
      await page.keyboard.down('w');
      await pause(2000);
      await page.keyboard.up('w');
      const walked = (await state()).player;
      assert(walked[2] < start[2] - 0.2, `W moves forward: ${start} -> ${walked}; focus=${await page.evaluate(() => document.activeElement.id)}`);
      await page.keyboard.down('Shift');
      await page.keyboard.down('w');
      await pause(2000);
      await page.keyboard.up('w');
      await page.keyboard.up('Shift');
      const ran = (await state()).player;
      assert(walked[2] - ran[2] > start[2] - walked[2], 'Shift increases speed');
      await pause(200);
      const stopped = (await state()).player;
      assert.deepEqual(stopped, ran, 'key release stops movement');
      // Real pointer controls, also available on narrow touch layouts.
      const button = await page.$('[data-walk-direction="right"]');
      const rect = await button.boundingBox();
      await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
      await page.mouse.down();
      await pause(450);
      await page.mouse.up();
      assert((await state()).player[0] > ran[0], 'direction pad moves');
      await page.click('#walk-run');
      assert.equal(await page.$eval('#walk-run', el => el.getAttribute('aria-pressed')), 'true');
      await page.screenshot({path: path.join(root, `shots/walk-${width}.png`)});
      await page.click('#walk-exit');
      const restored = await state();
      assert.equal(restored.walking, false);
      assert.equal(restored.enabled, true);
      await page.waitForFunction(() => {
        const sun = Campus3D.debug().scene.children.find(o => o.isDirectionalLight && o.castShadow);
        return sun.shadow.autoUpdate === false;
      });
      assert.equal(await page.$eval('#scene-labels', e => getComputedStyle(e).display !== 'none'), true);
      assert(await page.evaluate(() => {
        const { site } = Campus3D.debug();
        return site.fountain.matrixAutoUpdate && site.ripples.every(o => o.matrixAutoUpdate);
      }), 'fountain animation stays dynamic');
      assert.deepEqual(restored.cam, overview.cam);
      assert.deepEqual(restored.target, overview.target);
      await page.click('#walk-enter');
      await page.keyboard.press('Escape');
      assert.equal((await state()).walking, false);
      await page.click('[data-view="teaching"]');
      await page.waitForFunction(() => !Campus3D.state().flying);
      assert.equal((await state()).enabled, true);
      console.log(`PASS ${width}: default overview, walk/run, stop, pad, exit/Esc, camera restore, view navigation`);
    }
    assert.deepEqual(errors, []);
  } finally {
    if (browser) await browser.close();
    server.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
