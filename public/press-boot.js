/* A bounded, same-origin boot gate. Content remains available if the app fails. */
(() => {
  const root = document.documentElement;
  let repeat = false, reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  try {
    repeat = sessionStorage.getItem('mala-tinta-press-seen') === '1';
    const preference = localStorage.getItem('mala-tinta-motion');
    if (preference) reduced = preference === 'reduced';
  } catch { /* Storage is optional. */ }
  if (repeat || reduced || (location.hash && location.hash !== '#inicio')) return;
  root.dataset.pressIntro = 'ready';
  window.setTimeout(() => {
    if (!root.dataset.pressIntro) return;
    delete root.dataset.pressIntro;
    window.dispatchEvent(new Event('mt:release-intro'));
  }, 2600);
})();
