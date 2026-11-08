import "./editorial-sections.css";

/** The document remains readable without GSAP; desktop scenes are progressive enhancements. */
export function initEditorialSections({ gsap, ScrollTrigger, reducedMotion = false, onChooseStyle } = {}) {
  const controller = new AbortController();
  const cleanups = [];
  document.querySelectorAll("[data-choose-style]").forEach((button) => {
    button.addEventListener("click", () => onChooseStyle?.(button.dataset.chooseStyle), { signal: controller.signal });
  });
  if (!gsap || !ScrollTrigger || reducedMotion) return () => controller.abort();
  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia();
  media.add("(min-width: 900px) and (min-height: 680px)", () => {
    const styles = document.querySelector(".styles-film");
    const stage = styles?.querySelector(".styles-film__stage");
    const frame = styles?.querySelector(".styles-film__window");
    const track = styles?.querySelector(".styles-film__track");
    let horizontal;
    if (stage && frame && track) {
      styles.classList.add("is-pinned");
      const distance = () => Math.max(0, track.scrollWidth - frame.clientWidth);
      horizontal = gsap.to(track, {
        x: () => -distance(), ease: "none",
        scrollTrigger: {
          trigger: styles, pin: stage, start: "top top", end: () => `+=${distance() + innerHeight * .35}`,
          scrub: .55, invalidateOnRefresh: true, anticipatePin: 1,
        },
      });
      const showFocusedPanel = (event) => {
        const card = event.target.closest(".style-print");
        if (!card || !horizontal?.scrollTrigger) return;
        const rect = card.getBoundingClientRect();
        if (rect.left >= 0 && rect.right <= innerWidth + 4) return;
        const st = horizontal.scrollTrigger;
        const fraction = Math.min(1, Math.max(0, card.offsetLeft / Math.max(1, distance())));
        window.scrollTo({ top: st.start + (st.end - st.start) * fraction, behavior: "instant" });
      };
      track.addEventListener("focusin", showFocusedPanel);
      cleanups.push(() => track.removeEventListener("focusin", showFocusedPanel));
    }

    const process = document.querySelector(".process-reel");
    const processStage = process?.querySelector(".process-reel__stage");
    const steps = process ? [...process.querySelectorAll(".process-reel__step")] : [];
    if (processStage && steps.length) {
      process.classList.add("is-pinned");
      const photos = steps.map((step) => step.querySelector(".process-reel__photo"));
      const copies = steps.map((step) => step.querySelector(".process-reel__copy"));
      gsap.set(steps, { zIndex: (index) => steps.length - index });
      // Opacity preserves every step for screen readers while the visual deck changes.
      gsap.set(copies.slice(1), { opacity: 0, y: 24 });
      gsap.set(photos, { rotation: (index) => [-5, 4, -3, 2][index] });
      const timeline = gsap.timeline({ scrollTrigger: {
        trigger: process, pin: processStage, start: "top top", end: "+=280%", scrub: .6, anticipatePin: 1,
      } });
      for (let i = 0; i < steps.length - 1; i++) {
        timeline.to(photos[i], { xPercent: 90, yPercent: -12, rotation: 19, autoAlpha: 0, duration: .8, ease: "power2.in" }, i)
          .to(copies[i], { opacity: 0, y: -24, duration: .25 }, i + .18)
          .fromTo(photos[i + 1], { scale: .94 }, { scale: 1, duration: .65, ease: "power2.out" }, i + .2)
          .to(copies[i + 1], { opacity: 1, y: 0, duration: .4 }, i + .4);
      }
      timeline.to({}, { duration: .35 });
    }

    const care = document.querySelector(".care-stack");
    const careStage = care?.querySelector(".care-stack__stage");
    const cards = care ? [...care.querySelectorAll(".care-stack__card")] : [];
    if (careStage && cards.length) {
      care.classList.add("is-pinned");
      const photos = cards.map((card) => card.querySelector(".care-stack__photo"));
      const copies = cards.map((card) => card.querySelector(".care-stack__copy"));
      gsap.set(cards, { zIndex: (index) => cards.length - index });
      gsap.set(copies.slice(1), { opacity: 0, y: 32 });
      gsap.set(photos, { rotation: (index) => [-4, 4, -2, 2][index] });
      const timeline = gsap.timeline({ scrollTrigger: {
        trigger: care, pin: careStage, start: "top top", end: "+=280%", scrub: .7, anticipatePin: 1,
      } });
      timeline.fromTo(careStage.querySelector(".care-stack__deck"), { scale: .91 }, { scale: 1, duration: .4, ease: "power2.out" });
      for (let i = 0; i < cards.length - 1; i++) {
        const t = .4 + i;
        timeline.to(photos[i], { xPercent: -135, yPercent: -20, rotation: -25, autoAlpha: 0, duration: .85, ease: "power2.in" }, t)
          .to(copies[i], { opacity: 0, y: -20, duration: .25 }, t + .18)
          .fromTo(photos[i + 1], { scale: .96 }, { scale: 1, duration: .6, ease: "power1.out" }, t + .25)
          .to(copies[i + 1], { opacity: 1, y: 0, duration: .4 }, t + .4);
      }
      timeline.to({}, { duration: .35 });
    }

    return () => {
      [styles, process, care].forEach((section) => section?.classList.remove("is-pinned"));
      cleanups.splice(0).forEach((cleanup) => cleanup());
    };
  });

  const floating = gsap.context(() => {
    document.querySelectorAll(".faq-wall__sticker").forEach((sticker, index) => {
      gsap.to(sticker, { y: index % 2 ? -28 : 20, rotation: index % 2 ? -7 : 8, ease: "none",
        scrollTrigger: { trigger: ".faq-wall", start: "top bottom", end: "bottom top", scrub: .8 },
      });
    });
    gsap.from(".closing-wall__ticket", { y: 60, rotation: -7, ease: "none",
      scrollTrigger: { trigger: ".closing-wall", start: "top bottom", end: "center center", scrub: .7 },
    });
  });
  return () => {
    controller.abort();
    media.revert();
    floating.revert();
    cleanups.splice(0).forEach((cleanup) => cleanup());
  };
}
