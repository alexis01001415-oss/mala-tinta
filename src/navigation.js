import { gsap } from "gsap";
import "./navigation.css";

const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const imageBase = `${import.meta.env.BASE_URL}images/editorial/`;
const menuPrints = {
  "#nosotros": { file: "owner", caption: "Detrás de la tinta", mounting: "top", rotation: -4 },
  "#estudio": { file: "preparation", caption: "Todo tiene su lugar", mounting: "sides", rotation: 4 },
  "#estilos": { file: "blackwork", caption: "Encuentra tu lenguaje", mounting: "corners", rotation: -3 },
  "#flash": { file: "fine-line", caption: "Ideas en papel", mounting: "double", rotation: 3 },
  "#dudas": { file: "care", caption: "Pregunta sin pena", mounting: "top", rotation: -5 },
  "#tu-idea": { file: "consultation", caption: "Ponlo sobre la mesa", mounting: "sides", rotation: 2 },
};

export function initNavigation({ getReducedMotion = () => motionPreference.matches } = {}) {
  const header = document.querySelector("[data-site-header]");
  const toggle = header?.querySelector(".mt-header__toggle");
  const menu = document.getElementById(toggle?.getAttribute("aria-controls"));
  if (!menu) return;

  const controller = new AbortController();
  const { signal } = controller;
  const links = Array.from(menu.querySelectorAll(".mt-nav__links a"));
  links.forEach((link) => {
    const art = menuPrints[link.hash];
    if (!art) return;
    link.dataset.photo = `${imageBase}${art.file}.webp`;
    link.dataset.caption = art.caption;
    link.dataset.crop = "";
    link.dataset.mounting = art.mounting;
  });
  const focusOrder = [...header.querySelectorAll("a, button"), ...links];
  const background = document.querySelectorAll("main, footer, .skip-link");
  const preview = menu.querySelector(".mt-nav__preview");
  const print = preview.querySelector("figure");
  const photo = print.querySelector("img");
  const caption = print.querySelector("figcaption");
  const widePreview = window.matchMedia("(min-width: 760px) and (min-height: 480px)");
  let opened = false;
  let activeLink;
  let destination;
  let previewVersion = 0;
  let backgroundStates = [];

  const reveal = gsap.timeline({ paused: true, onReverseComplete: finishClose });
  reveal.fromTo(menu, {
    clipPath: "polygon(0 0,100% 0,100% 0,0 0)",
  }, {
    clipPath: "polygon(0 0,100% 0,100% 54%,0 79%)", duration: .24, ease: "power3.in",
  }).to(menu, {
    clipPath: "polygon(0 0,100% 0,100% 100%,0 100%)", duration: .26, ease: "power3.out",
  }).fromTo(links.map((link) => link.firstElementChild), {
    yPercent: 120, skewY: 4,
  }, {
    yPercent: 0, skewY: 0, duration: .3, stagger: .038, ease: "power3.out",
  }, .16).fromTo(preview, {
    y: 28, rotation: -4, opacity: 0,
  }, {
    y: 0, rotation: 0, opacity: 1, duration: .34, ease: "power3.out",
  }, .21);

  async function showPreview(link, force = false) {
    if (activeLink === link && !force) return;
    activeLink?.classList.remove("is-previewed");
    activeLink = link;
    link.classList.add("is-previewed");
    const version = ++previewVersion;
    if (!widePreview.matches) return;

    // Decode offscreen so quickly passing over several links cannot show a stale picture.
    const image = new Image();
    image.src = link.dataset.photo;
    try {
      await image.decode();
    } catch {
      if (version === previewVersion) print.style.visibility = "hidden";
      return;
    }
    if (version !== previewVersion || !opened) return;
    print.style.visibility = "visible";
    photo.src = image.src;
    photo.dataset.crop = link.dataset.crop || "";
    print.dataset.mounting = link.dataset.mounting || "top";
    caption.textContent = link.dataset.caption;
    const rotation = menuPrints[link.hash]?.rotation ?? (links.indexOf(link) % 2 ? 4 : -4);
    gsap.killTweensOf(print);
    if (getReducedMotion()) {
      gsap.set(print, { x: 0, y: 0, rotation });
    } else {
      gsap.fromTo(print, { x: 8, y: 5, rotation: rotation - 5 }, {
        x: 0, y: 0, rotation, duration: .35, ease: "power3.out",
      });
    }
  }

  function openMenu() {
    opened = true;
    destination = null;
    if (menu.hidden) {
      backgroundStates = Array.from(background, (item) => [item, item.inert]);
      for (const item of background) item.inert = true;
      menu.hidden = false;
      menu.scrollTop = 0;
    }
    menu.inert = false;
    document.body.classList.add("mt-nav-open");
    header.classList.add("is-menu-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Cerrar menú");
    showPreview(links[0], true);
    links[0].focus({ preventScroll: true });
    if (getReducedMotion()) reveal.progress(1, true).pause();
    else reveal.timeScale(1).play();
  }

  function closeMenu(target = null) {
    opened = false;
    destination = target;
    ++previewVersion;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menú");
    toggle.focus({ preventScroll: true });
    menu.inert = true;
    if (getReducedMotion() || reveal.time() === 0) {
      reveal.progress(0, true).pause();
      finishClose();
    } else {
      reveal.timeScale(1.45).reverse();
    }
  }

  function finishClose() {
    if (opened || menu.hidden) return;
    menu.hidden = true;
    for (const [item, wasInert] of backgroundStates) item.inert = wasInert;
    backgroundStates = [];
    document.body.classList.remove("mt-nav-open");
    header.classList.remove("is-menu-open");
    if (destination) {
      const hash = `#${destination.id}`;
      if (location.hash !== hash) history.pushState(history.state, "", hash);
      if (!destination.hasAttribute("tabindex")) destination.tabIndex = -1;
      destination.focus({ preventScroll: true });
      destination.scrollIntoView({ block: "start", behavior: getReducedMotion() ? "instant" : "smooth" });
      destination = null;
    }
  }

  function navigate(event) {
    if (!opened || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.target.closest("a[href^='#']");
    const target = anchor && document.getElementById(anchor.hash.slice(1));
    if (!target) return;
    event.preventDefault();
    closeMenu(target);
  }

  function keyboard(event) {
    if (!opened) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
    }
    if (event.key !== "Tab") return;
    const first = focusOrder[0];
    const last = focusOrder.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  }

  function updateHeader() {
    if (window.scrollY > 16) header.classList.add("is-scrolled");
    if (window.scrollY < 6) header.classList.remove("is-scrolled");
  }

  toggle.addEventListener("click", () => opened ? closeMenu() : openMenu(), { signal });
  menu.addEventListener("click", navigate, { signal });
  header.addEventListener("click", navigate, { signal });
  document.addEventListener("keydown", keyboard, { signal });
  window.addEventListener("scroll", updateHeader, { passive: true, signal });
  window.addEventListener("hashchange", () => { if (opened) closeMenu(); }, { signal });
  for (const link of links) {
    link.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "touch" && opened) showPreview(link);
    }, { signal });
    link.addEventListener("focus", () => { if (opened) showPreview(link); }, { signal });
  }
  widePreview.addEventListener("change", () => { if (opened) showPreview(activeLink, true); }, { signal });
  motionPreference.addEventListener("change", () => {
    if (menu.hidden || !getReducedMotion()) return;
    reveal.progress(opened ? 1 : 0, true).pause();
    if (!opened) finishClose();
  }, { signal });
  updateHeader();

  return () => {
    controller.abort();
    reveal.kill();
    gsap.killTweensOf(print);
    opened = false;
    destination = null;
    ++previewVersion;
    menu.inert = true;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menú");
    finishClose();
  };
}
