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
  let preferred = current.searchParams.get('lang');
  const explicit = preferred === 'zh' || preferred === 'en';
  if (explicit) {
    try { localStorage.setItem(key, preferred); } catch {}
  } else {
    try { preferred = localStorage.getItem(key); } catch {}
  }
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
  // An explicit URL choice wins even when storage is blocked or an older page is cached.
  const prepareLinks = () => document.querySelectorAll('.locale-switch').forEach(link => {
    const target = new URL(link.href);
    target.searchParams.set('lang', link.lang === 'en' ? 'en' : 'zh');
    link.href = target.href;
  });
  document.addEventListener('DOMContentLoaded', prepareLinks);
  document.addEventListener('click', event => {
    const link = event.target.closest?.('.locale-switch');
    if (!link) return;
    const target = new URL(link.href);
    const language = target.pathname.slice(base.pathname.length).startsWith('en/') ? 'en' : 'zh';
    try { localStorage.setItem(key, language); } catch {}
    target.search = current.search;
    target.hash = current.hash;
    target.searchParams.set('lang', language);
    link.href = target.href;
  }, true);
})();
