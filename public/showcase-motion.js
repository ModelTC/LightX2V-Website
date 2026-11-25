// Hold to compare two takes at the same relative position in the shot.
const original = document.querySelector('#study');
const stage = original.parentElement;
const switches = [...document.querySelectorAll('[data-take]')];
const preview = document.createElement('video');
preview.className = 'comparison-frame';
preview.muted = true;
preview.playsInline = true;
preview.preload = 'auto';
preview.setAttribute('aria-hidden', 'true');

const compare = document.createElement('button');
compare.className = 'comparison-control';
compare.type = 'button';
compare.textContent = '按住对照';
stage.append(preview, compare);

let held = false;
let resume = false;
let fraction = 0;
let take;
function prepare() {
  const next = switches.find(item => item.getAttribute('aria-pressed') !== 'true');
  if (next !== take) {
    take = next;
    preview.src = 'h3-' + take.dataset.take + '.mp4';
  }
}
function showFrame() {
  if (!held || preview.seeking || preview.readyState < 2) return;
  stage.classList.add('comparing-frame');
  compare.textContent = take.textContent;
}
function seekFrame() {
  if (!held || !Number.isFinite(preview.duration)) return;
  const target = Math.max(0, Math.min(preview.duration - .04, fraction * preview.duration));
  if (Math.abs(preview.currentTime - target) > .016) preview.currentTime = target;
  else showFrame();
}
preview.addEventListener('loadedmetadata', seekFrame);
preview.addEventListener('loadeddata', seekFrame);
preview.addEventListener('seeked', showFrame);
function start() {
  if (held) return;
  held = true;
  resume = !original.paused;
  fraction = original.duration > 0 ? original.currentTime / original.duration : 0;
  original.pause();
  prepare();
  compare.textContent = '载入对照…';
  seekFrame();
}
function stop() {
  if (!held) return;
  held = false;
  stage.classList.remove('comparing-frame');
  compare.textContent = '按住对照';
  if (resume) original.play().catch(() => {});
  resume = false;
}
compare.addEventListener('pointerenter', prepare);
compare.addEventListener('focus', prepare);
compare.addEventListener('pointerdown', event => {
  if (event.button !== 0 || !event.isPrimary) return;
  compare.setPointerCapture(event.pointerId);
  start();
});
for (const name of ['pointerup', 'pointercancel', 'lostpointercapture', 'blur']) {
  compare.addEventListener(name, stop);
}
compare.addEventListener('keydown', event => {
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault();
    start();
  }
});
compare.addEventListener('keyup', event => {
  if (event.key === ' ' || event.key === 'Enter') stop();
});
window.addEventListener('blur', stop);
preview.addEventListener('error', () => {
  if (held) compare.textContent = '对照暂不可用';
  take = undefined;
});
