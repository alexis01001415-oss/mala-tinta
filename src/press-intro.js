import { gsap } from 'gsap';

export function startPressIntro({ getReducedMotion }) {
  const root = document.documentElement;
  const intro = document.getElementById('preloader');
  const skip = document.getElementById('skip-loader');
  const content = [...document.querySelectorAll('main, header, nav, footer, .skip-link')];
  const previous = content.map(el => el.inert);
  const heroWords = document.querySelectorAll('.type-print');
  const controller = new AbortController();
  let closed = false, timeline, heroTimeline;
  function release(animate = true) {
    if (closed) return;
    closed = true;
    timeline?.kill();
    delete root.dataset.pressIntro;
    intro.hidden = true;
    intro.inert = true;
    content.forEach((el, i) => { el.inert = previous[i]; });
    try { sessionStorage.setItem('mala-tinta-press-seen', '1'); } catch { /* Optional. */ }
    if (intro.contains(document.activeElement)) {
      const heading = document.getElementById('hero-title');
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
    if (animate && !getReducedMotion() && scrollY < 100) {
      heroTimeline = gsap.timeline();
      heroTimeline.fromTo(heroWords, { yPercent: 115, rotation: 3, scaleX: 1.07 }, {
        yPercent: 0, rotation: 0, scaleX: 1, duration: .34, stagger: .105, ease: 'power4.out', clearProps: 'transform',
      }).fromTo('.press-hero__note', { rotation: -12, scale: 1.2, opacity: 0 }, {
        rotation: -5, scale: 1, opacity: 1, duration: .18, ease: 'power3.out', clearProps: 'transform,opacity',
      }, .28);
    }
  }
  window.addEventListener('mt:release-intro', () => release(), { signal: controller.signal });
  skip.addEventListener('click', () => release(false), { signal: controller.signal });
  document.addEventListener('keydown', event => {
    if (!closed && event.key === 'Escape') { event.preventDefault(); release(false); }
    if (!closed && event.key === 'Tab') { event.preventDefault(); skip.focus(); }
  }, { signal: controller.signal });
  if (!root.dataset.pressIntro || getReducedMotion()) {
    release(false);
    return () => controller.abort();
  }
  intro.hidden = false;
  content.forEach(el => { el.inert = true; });
  // This is a brief brand ident, not a simulated load meter. The boot gate wins on failure.
  timeline = gsap.timeline({ onComplete: () => release() });
  timeline.fromTo('.press-intro__word', { yPercent: 115, skewX: -9 }, {
    yPercent: 0, skewX: 0, duration: .3, stagger: .1, ease: 'power4.out',
  }).to('.press-intro__title', { scale: 1.08, rotation: 2, duration: .2, ease: 'steps(2)' }, .45)
    .to('.press-intro__shutter', { x: '105%', skewX: 0, duration: .25, ease: 'power3.inOut' }, .6)
    .to(intro, { clipPath: 'polygon(0 0,100% 0,100% 0,0 0)', duration: .3, ease: 'power4.in' }, .85);
  if (innerWidth < 700) timeline.timeScale(1.3);
  return () => {
    controller.abort(); timeline?.kill(); heroTimeline?.kill(); release(false);
  };
}
