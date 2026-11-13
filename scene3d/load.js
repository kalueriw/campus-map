// Progress reports actual construction milestones; CSS smooths the bar between them.
const stage = document.getElementById('stage');
const overlay = document.getElementById('scene-loading');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let current = 5;
function updateProgress(value = current) {
  current = value;
  const steps = value < 10 ? ['Preparing the campus', '正在准备校园']
    : value < 38 ? ['Creating sky and landscape', '正在铺设天空与地景']
    : value < 76 ? ['Building campus architecture', '正在搭建校园建筑']
    : value < 90 ? ['Lighting the campus', '正在布置校园灯光']
    : value < 100 ? ['Preparing your first view', '正在准备初始视角']
    : ['Ready to explore', '准备就绪，即刻出发'];
  document.getElementById('scene-loading-step').textContent = steps[window.CampusI18n?.lang === 'zh' ? 1 : 0];
  document.getElementById('scene-progress').value = value;
  document.getElementById('scene-progress-text').textContent = value + '%';
  document.getElementById('scene-progress-fill').style.width = value + '%';
}
updateProgress();
window.CampusI18n?.onChange(() => updateProgress());
try {
  const { boot } = await import('./main.js');
  await boot(updateProgress);
  if (!reducedMotion.matches && !document.documentElement.classList.contains('no-webgl')) {
    // Let the bar reach 100% before revealing the already-rendered scene.
    await new Promise(resolve => setTimeout(resolve, 400));
    stage.classList.remove('is-loading');
    overlay.classList.add('is-leaving');
    await new Promise(resolve => setTimeout(resolve, 450));
  }
} catch (error) {
  console.error('Unable to load the 3D campus:', error);
  document.documentElement.classList.add('no-webgl');
} finally {
  stage.classList.remove('is-loading');
  stage.setAttribute('aria-busy', 'false');
  overlay.hidden = true;
}
