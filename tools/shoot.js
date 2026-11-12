/* Screenshot the 3D campus page, so a render can be looked at rather than
   imagined. Serves the site over HTTP (module scripts need it), loads the
   page in Chrome, and writes a PNG.

     node tools/shoot.js [out.png] [width] [height] [url-hash] [wait-ms] [eval]
     SHOOT_PAGE=map.html node tools/shoot.js ... to shoot another page
*/
const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const ROOT = path.resolve(__dirname, '..');
const OUT = process.argv[2] || 'shots/campus.png';
const WIDTH = Number(process.argv[3] || 1440);
const HEIGHT = Number(process.argv[4] || 900);
const HASH = process.argv[5] || '';
const WAIT = Number(process.argv[6] || 2500);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json'
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  let file = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);
  if (!file.startsWith(ROOT)) {
    res.writeHead(403);
    res.end();
    return;
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
});

(async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--enable-unsafe-swiftshader',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--hide-scrollbars'
    ]
  });
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });
  page.on('console', (m) => console.log('console:', m.type(), m.text()));
  page.on('pageerror', (e) => console.log('pageerror:', e.message, (e.stack || '').split(String.fromCharCode(10)).slice(0, 6).join(' | ')));

  page.on('response', (r) => { if (r.status() >= 400) console.log('http', r.status(), r.url()); });
  page.on('requestfailed', (r) => console.log('failed:', r.url(), r.failure() && r.failure().errorText));

  const PAGE = process.env.SHOOT_PAGE || 'campus.html';
  const url = `http://127.0.0.1:${port}/${PAGE}${HASH}`;
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, WAIT));

  const script = process.argv[7];
  if (script) {
    const result = await page.evaluate(script);
    if (result !== undefined) console.log('eval:', JSON.stringify(result));
    await new Promise((r) => setTimeout(r, 2200));
  }

  fs.mkdirSync(path.dirname(path.join(ROOT, OUT)), { recursive: true });
  await page.screenshot({ path: path.join(ROOT, OUT) });
  console.log('wrote', OUT);

  await browser.close();
  server.close();
})().catch((error) => {
  console.error(error);
  server.close();
  process.exit(1);
});
