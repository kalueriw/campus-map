// Painted once into the sky texture: no extra lights, draw calls or per-frame work.
export function paintNightSky(canvas) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  let seed = 71237;
  const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
  // Layered galactic clouds with an irregular dark dust lane. Wrap every
  // cloud across the panorama seam so looking around never reveals an edge.
  const band = x => h * (.23 + .15 * Math.sin(x / w * Math.PI * 2));
  function cloud(x, y, radius, color, alpha) {
    for (const shift of [-w, 0, w]) {
      const cx = x + shift;
      if (cx + radius < 0 || cx - radius > w) continue;
      const gradient = ctx.createRadialGradient(cx, y, 0, cx, y, radius);
      gradient.addColorStop(0, `rgba(${color},${alpha})`);
      gradient.addColorStop(1, `rgba(${color},0)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(cx - radius, y - radius, radius * 2, radius * 2);
    }
  }
  for (let i = 0; i < 1500; i++) {
    const x = random() * w;
    const spread = (random() + random() + random() - 1.5) * h * .065;
    cloud(x, band(x) + spread, 12 + random() * 65,
      i % 4 ? '116,139,193' : '177,147,179', .025 + random() * .045);
  }
  for (let i = 0; i < 650; i++) {
    const x = random() * w;
    const drift = Math.sin(x * .019) * 8 + Math.sin(x * .043) * 4;
    cloud(x, band(x) + drift + (random() - .5) * 18, 8 + random() * 24, '3,6,17', .08 + random() * .14);
  }
  // Tiny unresolved stars give the galactic band depth instead of a smooth stripe.
  for (let i = 0; i < 16000; i++) {
    const x = random() * w;
    const y = band(x) + (random() + random() + random() - 1.5) * h * .095;
    ctx.fillStyle = `rgba(199,215,249,${.08 + random() * .32})`;
    ctx.fillRect(x, y, .35 + random() * .6, .35 + random() * .6);
  }
  for (let i = 0; i < 6500; i++) {
    const x = random() * w, y = Math.acos(random()) / Math.PI * h;
    const horizonFade = Math.min(1, (.48 * h - y) / (h * .12));
    const radius = .35 + Math.pow(random(), 5) * 1.5;
    const alpha = (.25 + random() * .65) * horizonFade;
    ctx.fillStyle = `rgba(${random() > .18 ? '212,229,255' : '255,232,197'},${alpha})`;
    // Equirectangular longitude narrows toward the zenith; compensate so
    // stars stay round when the visitor looks directly overhead.
    const longitudeScale = 1 / Math.max(.04, Math.sin(y / h * Math.PI));
    ctx.beginPath(); ctx.ellipse(x, y, radius * longitudeScale, radius, 0, 0, Math.PI * 2); ctx.fill();
    if (radius > 1.6) {
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 7);
      glow.addColorStop(0, `rgba(185,216,255,${alpha * .3})`);
      glow.addColorStop(1, 'rgba(185,216,255,0)');
      ctx.fillStyle = glow; ctx.fillRect(x - 7, y - 7, 14, 14);
      ctx.strokeStyle = `rgba(220,234,255,${alpha * .25})`;
      ctx.lineWidth = .6;
      ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y);
      ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4); ctx.stroke();
    }
  }
  // A single moon above the northern horizon, with a soft halo and subtle maria.
  const mx = w * .72, my = h * .32, r = h * .012;
  const halo = ctx.createRadialGradient(mx, my, r * .7, mx, my, r * 6);
  halo.addColorStop(0, 'rgba(206,222,255,.22)');
  halo.addColorStop(.35, 'rgba(160,188,240,.07)');
  halo.addColorStop(1, 'rgba(160,188,240,0)');
  ctx.fillStyle = halo; ctx.fillRect(mx - r * 6, my - r * 6, r * 12, r * 12);
  ctx.save();
  ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI * 2); ctx.clip();
  const moon = ctx.createLinearGradient(mx - r, my - r, mx + r, my + r);
  moon.addColorStop(0, '#fff8dd'); moon.addColorStop(.6, '#e0e6ef'); moon.addColorStop(1, '#9aaac7');
  ctx.fillStyle = moon; ctx.fillRect(mx - r, my - r, r * 2, r * 2);
  for (let i = 0; i < 35; i++) {
    ctx.fillStyle = `rgba(87,108,137,${.025 + random() * .09})`;
    ctx.beginPath(); ctx.arc(mx + (random() * 2 - 1) * r, my + (random() * 2 - 1) * r, 1 + random() * r * .23, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
