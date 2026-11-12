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
    browser = await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    for (const width of [1280,390]) {
      await page.setViewport({width,height:844});
      await page.goto(`http://127.0.0.1:${server.address().port}/campus.html`,{waitUntil:'networkidle2'});
      await page.waitForFunction(() => window.Campus3D);
      await new Promise(r => setTimeout(r,2200));
      assert(await page.$eval('#scene-panel', el => el.hidden));
      assert.equal(await page.evaluate(() => {let n=0;Campus3D.debug().scene.traverse(o=>{if(o.isSprite)n++;});return n;}),0);
      // Project a roof point, then use a real canvas click away from the label.
      await page.evaluate(() => Campus3D.select('b'));
      await page.waitForFunction(() => !document.querySelector('#scene-panel').hidden);
      assert.match(await page.$eval('.scene-title', e=>e.textContent),/B/);
      await page.click('[data-close-photo]');
      assert(await page.$eval('#scene-panel', el=>el.hidden));
      await page.evaluate(() => Campus3D.select('gate'));
      await page.waitForFunction(()=>!document.querySelector('#scene-panel').hidden);
      assert.match(await page.$eval('.scene-title',e=>e.textContent),/正门|Gate/);
      await page.click('[data-close-photo]');
      await new Promise(r=>setTimeout(r,1300));
      await page.evaluate(()=>Campus3D.select('courts'));
      await page.waitForFunction(()=>document.querySelectorAll('#scene-panel img').length===2);
      await new Promise(r=>setTimeout(r,1600));
      const sources=await page.$$eval('#scene-panel img',els=>els.map(e=>e.getAttribute('src')));
      assert(sources.some(s=>s.includes('badminton')));
      assert(sources.some(s=>s.includes('basketball')));
      await page.screenshot({path:`shots/courts-photos-${width}.png`});
      await page.click('.scene-photo');
      assert(await page.$eval('#photo-lightbox',e=>e.open));
      await page.click('.lightbox-close');
      assert.equal(await page.$eval('#photo-lightbox',e=>e.open),false);
      await page.click('[data-close-photo]');
      assert(await page.$eval('#scene-panel', el=>el.hidden));
      await page.evaluate(()=>Campus3D.spot('east-gate'));
      assert.equal(await page.$eval('.scene-title',e=>e.textContent),'校园东门');
      assert.equal(await page.$eval('.scene-kicker',e=>e.textContent),'校园东门');
      assert((await page.$eval('.scene-photo img',e=>e.getAttribute('src'))).includes('east-gate'));
      assert((await page.$eval('.scene-photo img',e=>e.getAttribute('src'))).includes('east-gate'));
      await page.evaluate(()=>Campus3D.select('student'));
      assert.equal(await page.$$eval('#scene-panel [data-spot]',els=>els.length),6);
      for (const id of ['meiyijia','gmc','parcel','tingning']) {
        await page.evaluate(id=>Campus3D.spot(id),id);
        assert(await page.$eval('.scene-title',e=>e.textContent.length>0));
        assert((await page.$eval('.scene-photo img',e=>e.getAttribute('src'))).includes(id));
      }
      await page.evaluate(()=>Campus3D.select('student'));
      for (const [id, floor, photo] of [['gym-303','3','gym-303'],['gym-304','3','gym-304'],['gym-hall','2','gym-hall'],['study-room-2','2','study-room']]) {
        assert.match(await page.$eval(`[data-spot="${id}"]`,e=>e.closest('.scene-floor').querySelector('h4').textContent),new RegExp(floor));
        await page.click(`[data-spot="${id}"]`);
        assert.match(await page.$eval('.scene-photo img',e=>e.getAttribute('src')),new RegExp(photo));
      }
      await page.screenshot({path:`shots/rooms-${width}.png`});
      await page.click('[data-close-photo]');
      assert(await page.$eval('#scene-panel',el=>el.hidden));
      console.log(`PASS ${width}: building clicks, photo close, courts, and room photos/floors`);
    }
    assert.deepEqual(errors,[]);
  } finally {
    if(browser) await browser.close();
    server.close();
  }
})().catch(e=>{console.error(e);process.exitCode=1;});
