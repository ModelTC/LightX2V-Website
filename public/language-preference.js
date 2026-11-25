(() => {
  const key = 'lightx2v-language';
  const script = document.currentScript;
  const base = new URL('.', script.src);
  const current = new URL(location.href);
  if (!current.pathname.startsWith(base.pathname)) return;
  const route = current.pathname.slice(base.pathname.length);
  const english = route.startsWith('en/');
  const page = route.replace(/^en\//, '') || 'index.html';
  if (!['index.html', 'community.html', 'sparks.html'].includes(page)) return;
  let preferred;
  try { preferred = localStorage.getItem(key); } catch {}
  if (preferred !== 'zh' && preferred !== 'en') {
    const language = navigator.languages?.[0] || navigator.language || 'en';
    preferred = /^zh(?:-|$)/i.test(language) ? 'zh' : 'en';
  }
  if (english !== (preferred === 'en')) {
    const target = new URL((preferred === 'en' ? 'en/' : '') + page, base);
    target.search = current.search;
    target.hash = current.hash;
    location.replace(target.href);
  }
  // Capture the user's explicit choice before navigating, including when storage is unavailable.
  document.addEventListener('click', event => {
    const link = event.target.closest?.('.locale-switch');
    if (!link) return;
    const target = new URL(link.href);
    const language = target.pathname.slice(base.pathname.length).startsWith('en/') ? 'en' : 'zh';
    try { localStorage.setItem(key, language); } catch {}
    target.search = current.search;
    target.hash = current.hash;
    link.href = target.href;
  }, true);
})();
