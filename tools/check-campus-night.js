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
    res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html' })[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  });
});
(async () => {
  let browser;
  try {
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
      args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'] });
    const page = await browser.newPage();
    page.setDefaultTimeout(120000);
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.setViewport({ width: 1280, height: 844 });
    const initScript = await page.evaluateOnNewDocument(() => {
      localStorage.setItem('campus-map-theme', 'light');
      window.loadingValues = [];
      new MutationObserver(() => {
        const bar = document.getElementById('scene-progress');
        if (bar) window.loadingValues.push(bar.value);
      }).observe(document, { subtree: true, attributes: true, attributeFilter: ['value'] });
    });
    const url = `http://127.0.0.1:${server.address().port}/campus.html`;
    await page.setRequestInterception(true);
    const loadingPreview = async req => {
      if (req.url().endsWith('/scene3d/main.js')) await new Promise(resolve => setTimeout(resolve, 1200));
      await req.continue();
    };
    page.on('request', loadingPreview);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.screenshot({ path: 'shots/loading-redesign.png' });
    await page.waitForFunction(() => window.Campus3D && document.getElementById('scene-loading').hidden);
    assert.equal(await page.$eval('#scene-progress', e => e.value), 100);
    assert(await page.evaluate(() => new Set(window.loadingValues).size > 4));
    await page.waitForFunction(() => !Campus3D.state().flying);
    const lights = () => page.evaluate(() => {
      const result = { windows: [], sport: [], street: [], dining: [] };
      Campus3D.debug().scene.traverse(o => {
        if (o.name === 'sports-floodlight') result.sport.push(o.intensity);
        if (o.name === 'street-light') result.street.push(o.intensity);
        if (o.name === 'lakeside-dining-light') result.dining.push(o.intensity);
        (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => {
          if (m?.userData.nightWindow) result.windows.push(m.emissiveIntensity);
        });
      });
      return result;
    });
    let state = await lights();
    assert.equal(state.sport.length, 1);
    assert.equal(state.dining.length, 4);
    assert(state.dining.every(v => v === 0));
    assert(state.windows.length > 0 && state.windows.every(v => v === 0));
    assert(state.sport.every(v => v === 0));
    await page.click('[data-theme-toggle]');
    await page.waitForFunction(() => Campus3D.debug().scene.getObjectByName('street-light').intensity > 0);
    state = await lights();
    assert(state.sport.every(v => v > 0) && state.windows.every(v => v > 0));
    assert(state.dining.every(v => v > 0));
    assert.equal(await page.evaluate(() => Campus3D.debug().scene.background.image.width), 4096);
    await page.screenshot({ path: 'shots/night-overview.png' });
    await page.evaluate(() => {
      const { camera, controls } = Campus3D.debug();
      camera.position.set(130, 36, -5); controls.target.set(188, 2, -63); controls.update();
    });
    await page.screenshot({ path: 'shots/night-restaurant.png' });
    await page.evaluate(() => {
      const { camera, controls } = Campus3D.debug();
      camera.position.set(-24, 20, 0); controls.target.set(-24, 120, -300); controls.update();
    });
    await page.screenshot({ path: 'shots/night-sky.png' });
    await page.click('[data-view="sport"]');
    await page.waitForFunction(() => !Campus3D.state().flying);
    await page.screenshot({ path: 'shots/night-sports.png' });
    await page.click('[data-view="dorms"]');
    await page.waitForFunction(() => !Campus3D.state().flying);
    await page.screenshot({ path: 'shots/night-dorms.png' });
    await page.click('[data-theme-toggle]');
    await page.waitForFunction(() => Campus3D.debug().scene.getObjectByName('street-light').intensity === 0);
    state = await lights();
    assert(state.sport.every(v => v === 0) && state.windows.every(v => v === 0));
    await page.click('#walk-enter');
    assert(await page.evaluate(() => Campus3D.state().entering));
    await page.waitForFunction(() => Campus3D.state().walking && !Campus3D.state().entering);
    assert.equal(await page.evaluate(() => Campus3D.debug().camera.fov), 60);
    await page.mouse.move(900, 740);
    await page.mouse.down();
    await page.mouse.move(900, 100, { steps: 15 });
    await page.mouse.up();
    await page.waitForFunction(() => {
      const { camera } = Campus3D.debug();
      const direction = camera.position.clone(); camera.getWorldDirection(direction);
      return direction.y > .98 && camera.position.y >= .49;
    });
    await page.click('[data-theme-toggle]');
    await page.waitForFunction(() => Campus3D.debug().scene.getObjectByName('street-light').intensity > 0);
    await page.screenshot({ path: 'shots/walk-stargazing.png' });
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => Campus3D.state().walking), false);
    await page.click('#walk-enter');
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => Campus3D.state().entering), false);
    // Saved dark mode is applied before the first visible scene.
    await page.evaluate(() => localStorage.setItem('campus-map-theme', 'dark'));
    await page.removeScriptToEvaluateOnNewDocument(initScript.identifier);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.Campus3D && document.getElementById('scene-loading').hidden);
    state = await lights();
    assert(state.sport.every(v => v > 0) && state.windows.every(v => v > 0));
    // Simulate module fetch failure and confirm the map fallback replaces loading.
    page.off('request', loadingPreview);
    page.on('request', req => req.url().endsWith('/scene3d/main.js') ? req.abort() : req.continue());
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.documentElement.classList.contains('no-webgl') && document.getElementById('scene-loading').hidden);
    assert.equal(await page.$eval('#stage', e => e.getAttribute('aria-busy')), 'false');
    assert.deepEqual(errors, []);
    console.log('PASS: staged loading, day/night road lights, one south-west sports light, dorm windows, adventure entry/cancel, saved dark theme, failed-module fallback');
  } finally {
    if (browser) await browser.close();
    server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
