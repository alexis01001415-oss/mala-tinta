import { gsap } from 'gsap';

export function startPressIntro({ getReducedMotion }) {
  const root = document.documentElement;
  const intro = document.getElementById('preloader');
  const skip = document.getElementById('skip-loader');
  const content = [...document.querySelectorAll('main, header, nav, footer, .skip-link')];
  const previous = content.map(el => el.inert);
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
    if (intro.contains(document.activeElement)) {
      const heading = document.getElementById('hero-title');
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
    if (animate && !getReducedMotion() && scrollY < 100) {
      heroTimeline = gsap.timeline();
      heroTimeline.fromTo('.type-print', { yPercent: 110, rotation: 2 }, {
        yPercent: 0, rotation: 0, duration: .5, stagger: .1, ease: 'power4.out', clearProps:'transform',
      }).fromTo('.press-hero__note,.press-hero__aside', { scale: 1.15, opacity: 0 }, {
        scale: 1, opacity: 1, duration: .3, stagger: .12, ease: 'back.out(1.5)', clearProps:'transform,opacity',
      }, .38);
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
  const strokes = [...intro.querySelectorAll('[data-logo-stroke]')];
  strokes.forEach(path => {
    const length = path.getTotalLength();
    gsap.set(path, { strokeDasharray:length, strokeDashoffset:length });
  });
  timeline = gsap.timeline({ onComplete: () => release() });
  timeline.to(strokes, { strokeDashoffset:0, duration:.5, stagger:.18, ease:'power2.inOut' })
    .fromTo('.press-intro__logo', { scale:.88, rotation:-7 }, { scale:1, rotation:-3, duration:.85, ease:'power3.out' },0)
    .to('.press-intro__logo', { scale:1.07, y:-12, opacity:0, duration:.3, ease:'power2.in' },1.4)
    .to('#intro-wipe', { attr:{d:'M0 0H100V0Q50 -25 0 0Z'}, duration:.65, ease:'power3.inOut' },1.48);
  return () => { controller.abort(); timeline?.kill(); heroTimeline?.kill(); release(false); };
}
