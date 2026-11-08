/* Short brand ident on every document visit, with an independent escape hatch. */
(() => {
  let reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  try { const saved = localStorage.getItem('mala-tinta-motion'); if (saved) reduced = saved === 'reduced'; } catch {}
  if (reduced || (location.hash && location.hash !== '#inicio')) return;
  document.documentElement.dataset.pressIntro = 'ready';
  window.setTimeout(() => {
    if (!document.documentElement.dataset.pressIntro) return;
    delete document.documentElement.dataset.pressIntro;
    window.dispatchEvent(new Event('mt:release-intro'));
  }, 4000);
})();
