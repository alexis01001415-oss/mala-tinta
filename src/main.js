import "./dark.css";
import { artRects } from "./flash-art.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
let savedMotion = null;
try {
  savedMotion = localStorage.getItem("mala-tinta-motion");
} catch {
  /* Private browsing still works. */
}
let reducedMotion =
  savedMotion === null ? motionQuery.matches : savedMotion === "reduced";
let studio;
let sketchbook;
let scrollMotion;
let activeFlash = 0;
let brief = "";
let toastTimeout;
const motionButton = $("#motion-toggle");

function setMotion(value, save = false) {
  reducedMotion = value;
  document.body.classList.toggle("reduced-motion", value);
  motionButton.checked = value;
  if (save) {
    savedMotion = value ? "reduced" : "full";
    try {
      localStorage.setItem("mala-tinta-motion", savedMotion);
    } catch {
      /* Optional preference. */
    }
  }
  studio?.setReducedMotion(value);
  sketchbook?.setReducedMotion(value);
  scrollMotion?.revert();
  scrollMotion = null;
  if (value) {
    $$(".iris").forEach((el) => {
      el.style.transform = "";
    });
  } else setupScrollMotion();
}
motionButton.addEventListener("change", () =>
  setMotion(motionButton.checked, true),
);
motionQuery.addEventListener("change", (event) => {
  if (savedMotion === null) setMotion(event.matches);
});

// Plain anchor navigation is always available; the mobile panel adds keyboard support.
const menuButton = $(".menu-toggle");
const menu = $("#mobile-menu");
function closeMenu(restoreFocus = false) {
  menu.classList.remove("open");
  menu.inert = true;
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Abrir menú");
  document.body.classList.remove("menu-open");
  if (restoreFocus) menuButton.focus();
}
menuButton.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") !== "true";
  menu.classList.toggle("open", open);
  menu.inert = !open;
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  document.body.classList.toggle("menu-open", open);
  if (open) menu.querySelector("a").focus();
});
menu
  .querySelectorAll("a")
  .forEach((link) => link.addEventListener("click", () => closeMenu()));
document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    menuButton.getAttribute("aria-expanded") === "true"
  )
    closeMenu(true);
});
document.addEventListener("click", (event) => {
  if (!menu.contains(event.target) && !menuButton.contains(event.target))
    closeMenu();
});

// The artwork supplies the eyelids; two irises travel inside those original eyes.
const character = $(".character");
const eyes = $$(".eye");
eyes.forEach((eye) => {
  eye.style.visibility = "visible";
});
let pointerFrame = 0;
let pointer = { x: innerWidth / 2, y: innerHeight / 2 };
let heroVisible = true;
new IntersectionObserver((entries) => {
  heroVisible = entries[0].isIntersecting;
}).observe($(".character-section"));
window.addEventListener(
  "pointermove",
  (event) => {
    if (reducedMotion || !heroVisible || event.pointerType === "touch") return;
    pointer = { x: event.clientX, y: event.clientY };
    if (!pointerFrame)
      pointerFrame = requestAnimationFrame(() => {
        pointerFrame = 0;
        const scale = character.getBoundingClientRect().width / 1024;
        eyes.forEach((eye) => {
          const rect = eye.getBoundingClientRect();
          const dx = pointer.x - (rect.left + rect.width / 2);
          const dy = pointer.y - (rect.top + rect.height / 2);
          const angle = Math.atan2(dy, dx);
          const strength = Math.min(Math.hypot(dx, dy) / 250, 1);
          eye.firstElementChild.style.transform = `translate(${Math.cos(angle) * 25 * scale * strength}px, ${Math.sin(angle) * 17 * scale * strength}px)`;
        });
      });
  },
  { passive: true },
);
document.documentElement.addEventListener("pointerleave", () => {
  eyes.forEach((eye) => {
    eye.firstElementChild.style.transform = "";
  });
});

const styles = {
  blackwork: {
    name: "Blackwork",
    title: "El negro\nno pide permiso.",
    description:
      "Contraste brutal, sombras profundas y trazos que tienen algo que decir. Para quienes llevan el carácter a flor de piel.",
    tags: "NEGRO SÓLIDO / CONTRASTE / PRESENCIA",
    crop: 0,
    alt: "Estudio conceptual de una serpiente en tinta negra",
  },
  tradicional: {
    name: "Tradicional",
    title: "Lo clásico\nno se domestica.",
    description:
      "Líneas contundentes y símbolos que sobreviven a las modas. Una dirección para quienes quieren una pieza con toda la actitud.",
    tags: "LÍNEA FIRME / SÍMBOLOS / ACTITUD",
    crop: 2,
    alt: "Diseño conceptual de una daga ornamental en tinta negra",
  },
  "fine-line": {
    name: "Fine line",
    title: "No hace falta\ngritar.",
    description:
      "Detalles sutiles, aire y una intención clara. Una pieza delicada también puede decir muchísimo sobre ti.",
    tags: "DELICADEZA / DETALLE / AIRE",
    crop: 3,
    alt: "Boceto conceptual botánico de una rosa",
  },
  personalizado: {
    name: "Personalizado",
    title: "Eso que solo\ntú entiendes.",
    description:
      "Mezcla referencias, cuenta tu historia o empieza desde cero. El punto de partida puede ser cualquier cosa. El resultado debe sentirse tuyo.",
    tags: "TU HISTORIA / TU IDEA / TU PIEL",
    crop: 1,
    alt: "Diseño conceptual de polilla con detalles ornamentales",
  },
};
let activeStyle = "blackwork";
function cropImage(img, index) {
  const [x, y, w, h] = artRects[index];
  img.style.width = `min(${(100 * 1024) / w}cqw, ${(100 * 1024) / h}cqh)`;
  img.style.height = "auto";
  img.style.left = img.style.top = "50%";
  img.style.transform = `translate(${(-100 * (x + w / 2)) / 1024}%, ${(-100 * (y + h / 2)) / 1536}%)`;
  img.style.clipPath = `inset(${(100 * y) / 1536}% ${(100 * (1024 - x - w)) / 1024}% ${(100 * (1536 - y - h)) / 1536}% ${(100 * x) / 1024}%)`;
}
cropImage($("#style-image"), 0);
function selectStyle(key, focus = false) {
  activeStyle = key;
  const data = styles[key];
  const tabs = $$("[role=tab]");
  tabs.forEach((tab) => {
    const active = tab.dataset.style === key;
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
    if (active && focus) {
      tab.focus();
      tab.scrollIntoView({
        block: "nearest",
        inline: "nearest",
        behavior: reducedMotion ? "instant" : "smooth",
      });
    }
  });
  $("#style-panel").setAttribute("aria-labelledby", `tab-${key}`);
  $("#style-title").textContent = data.title;
  $("#style-description").textContent = data.description;
  $("#style-tags").textContent = data.tags;
  $("#style-number").textContent = `0${Object.keys(styles).indexOf(key) + 1}`;
  $("#style-image").alt = data.alt;
  cropImage($("#style-image"), data.crop);
}
$$("[role=tab]").forEach((tab, index, tabs) => {
  tab.addEventListener("click", () => selectStyle(tab.dataset.style));
  tab.addEventListener("keydown", (event) => {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft")
      next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    selectStyle(tabs[next].dataset.style, true);
  });
});
function toast(text) {
  const el = $("#toast");
  el.textContent = text;
  el.classList.add("visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.classList.remove("visible"), 3500);
}
function goToIdea(style, story) {
  $("#idea-style").value = style;
  if (story) {
    $("#idea-story").value = story;
    updateCount();
  }
  $("#tu-idea").scrollIntoView({
    behavior: reducedMotion ? "instant" : "smooth",
  });
  toast(`${style}: añadido a tu idea.`);
}
$("#style-select").addEventListener("click", () =>
  goToIdea(styles[activeStyle].name),
);

const flashes = [
  {
    title: "Muda de piel.",
    subtitle: "SERPIENTE / BLACKWORK",
    alt: "Boceto de serpiente enrollada",
    style: "Blackwork",
  },
  {
    title: "Busca tu luz.",
    subtitle: "POLILLA / BLACKWORK",
    alt: "Polilla ornamental con calavera",
    style: "Blackwork",
  },
  {
    title: "Con filo propio.",
    subtitle: "DAGA / TRADICIONAL",
    alt: "Daga con filigrana y cinta",
    style: "Tradicional",
  },
  {
    title: "También floreces.",
    subtitle: "BOTÁNICA / FINE LINE",
    alt: "Rosa de trazo botánico",
    style: "Fine line",
  },
];
function updateFlash(index) {
  activeFlash = index;
  const data = flashes[index];
  $("#flash-counter").textContent = `0${index + 1} / 04`;
  $("#flash-name").textContent = data.title;
  $("#flash-subtitle").textContent = data.subtitle;
  $("#flash-prev").disabled = index === 0;
  $("#flash-next").disabled = index === flashes.length - 1;
}
function showFlash(index) {
  const next = Math.min(Math.max(index, 0), flashes.length - 1);
  if (sketchbook) sketchbook.setPage(next);
  else updateFlash(next);
}
$("#flash-prev").disabled = true;
$("#flash-prev").addEventListener("click", () => showFlash(activeFlash - 1));
$("#flash-next").addEventListener("click", () => showFlash(activeFlash + 1));
$("#flash-select").addEventListener("click", () => {
  const flash = flashes[activeFlash];
  goToIdea(
    flash.style,
    `Me inspira el flash «${flash.title}» (${flash.subtitle.toLowerCase()}). Me gustaría explorar una pieza con esta dirección.`,
  );
});

// Import animation only after the first render; document content does not depend on it.
let motionModules;
let motionSetupVersion = 0;
async function setupScrollMotion() {
  const version = ++motionSetupVersion;
  if (reducedMotion) return;
  motionModules ??= Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
  const [{ gsap }, { ScrollTrigger }] = await motionModules;
  if (reducedMotion || version !== motionSetupVersion) return;
  gsap.registerPlugin(ScrollTrigger);
  scrollMotion?.revert();
  scrollMotion = gsap.context(() => {
    $$(".reveal").forEach((el) =>
      gsap.from(el, {
        y: 24,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 94%", once: true },
      }),
    );
    gsap.to(".hero-poster", {
      y: -45,
      opacity: 0.3,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: 0.8,
      },
    });
    gsap.to(".hero-redlight", {
      yPercent: 20,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: 1,
      },
    });
    const characterTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: ".character-section",
        start: "top top",
        end: "bottom bottom",
        scrub: 0.7,
      },
    });
    characterTimeline.fromTo(
      ".character-stage",
      { scale: 0.82, y: 80 },
      { scale: 1.06, y: 0, ease: "none" },
      0,
    );
    characterTimeline.fromTo(
      ".character-note",
      { rotation: 15, y: 50, opacity: 0.2 },
      { rotation: 7, y: 0, opacity: 1, ease: "none" },
      0,
    );
    gsap.to(".studio-progress span", {
      scaleX: 1,
      ease: "none",
      scrollTrigger: {
        trigger: "#estudio",
        start: "top top",
        end: "bottom bottom",
        scrub: true,
      },
    });
    gsap.from(".care-photo", {
      rotation: 2,
      y: 40,
      ease: "none",
      scrollTrigger: {
        trigger: ".care-grid",
        start: "top bottom",
        end: "center center",
        scrub: 1,
      },
    });
    gsap.from(".footer-wordmark", {
      yPercent: 20,
      ease: "none",
      scrollTrigger: {
        trigger: ".footer",
        start: "top bottom",
        end: "bottom bottom",
        scrub: 0.6,
      },
    });
  });
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}
// Import WebGL near its section; render-on-demand inside studio.js saves battery.
const studioObserver = new IntersectionObserver(
  async (entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    studioObserver.disconnect();
    try {
      const { initStudio } = await import("./studio.js");
      studio = await initStudio($("#studio-canvas"), { reducedMotion });
    } catch {
      $("#studio-canvas").classList.add("is-fallback");
      $$(".studio-chapters button").forEach((button) => {
        button.disabled = true;
      });
    }
  },
  { rootMargin: "600px" },
);
studioObserver.observe($("#estudio"));
const studioCopy = [
  ["Aquí empieza\nlo permanente.", "Acércate. Cada detalle tiene una razón."],
  ["El pulso.\nLa precisión.", "Del primer trazo al último detalle."],
  ["El ritual\nantes de la tinta.", "Preparar también es parte del arte."],
  [
    "Tu lugar.\nTu decisión.",
    "Aquí no se trata de encajar. Se trata de ser tú.",
  ],
];
$("#studio-canvas").addEventListener("studiochapter", (event) => {
  const copy = studioCopy[event.detail.chapter];
  if (!copy) return;
  $("#studio-title").textContent = copy[0];
  $(".studio-heading p").textContent = copy[1];
});

const bookObserver = new IntersectionObserver(
  async (entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    bookObserver.disconnect();
    try {
      const { initSketchbook } = await import("./sketchbook.js");
      sketchbook = await initSketchbook($("#book-canvas"), {
        reducedMotion,
        onPageChange: updateFlash,
      });
    } catch {
      $("#book-canvas").classList.add("book-is-fallback");
    }
  },
  { rootMargin: "600px" },
);
bookObserver.observe($("#flash"));

// The demo builds a local brief. It never pretends to submit a real booking.
const form = $("#idea-form");
function updateCount() {
  $("#character-count").textContent = `${$("#idea-story").value.length} / 1000`;
}
$("#idea-story").addEventListener("input", updateCount);
form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  brief = `MI PRÓXIMA PIEZA · MALA TINTA\n\nEstilo: ${data.get("style")}\nZona: ${String(data.get("place")).trim()}\nTamaño: ${data.get("size")}\n\nMi idea:\n${String(data.get("story")).trim()}\n\nResumen personal. No confirma una cita ni una cotización.`;
  $("#brief-content").textContent = brief;
  $("#brief-status").textContent = "";
  $("#brief-dialog").showModal();
});
$("#copy-brief").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(brief);
    $("#brief-status").textContent =
      "Copiado. Tu próxima historia ya tiene un comienzo.";
  } catch {
    $("#brief-status").textContent =
      "No se pudo copiar automáticamente. Puedes seleccionar el texto o guardarlo como archivo.";
  }
});
$("#download-brief").addEventListener("click", () => {
  const url = URL.createObjectURL(
    new Blob([brief], { type: "text/plain;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "mi-idea-mala-tinta.txt";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $("#brief-status").textContent = "Tu archivo está listo para guardar.";
});
$$("[data-dialog]").forEach((button) =>
  button.addEventListener("click", () =>
    document.getElementById(button.dataset.dialog).showModal(),
  ),
);
$$("[data-close]").forEach((button) =>
  button.addEventListener("click", () => button.closest("dialog").close()),
);
$$("dialog").forEach((dialog) =>
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (
        event.clientX < r.left ||
        event.clientX > r.right ||
        event.clientY < r.top ||
        event.clientY > r.bottom
      )
        dialog.close();
    }
  }),
);
$("#year").textContent = new Date().getFullYear();
setMotion(reducedMotion);

// The preloader tracks font readiness and exits even if an asset fails.
const preloader = $("#preloader");
const progress = $("#loader-progress");
let loaderDone = false;
function finishLoader() {
  if (loaderDone) return;
  loaderDone = true;
  progress.style.transform = "scaleX(1)";
  preloader.classList.add("done");
  preloader.setAttribute("aria-hidden", "true");
  preloader.inert = true;
}
$("#skip-loader").addEventListener("click", finishLoader);
if (reducedMotion) finishLoader();
else {
  progress.style.transform = "scaleX(.15)";
  Promise.allSettled([
    document.fonts.load("600 40px Lora"),
    document.fonts.load("400 16px Raleway"),
    document.fonts.load("400 32px Marker"),
  ]).then(finishLoader);
  setTimeout(finishLoader, 1800);
}
// Keep the menu focus within its visible links, while allowing Escape to close.
menu.addEventListener("keydown", (event) => {
  if (event.key !== "Tab" || !menu.classList.contains("open")) return;
  const links = [...menu.querySelectorAll("a")];
  if (event.shiftKey && document.activeElement === links[0]) {
    event.preventDefault();
    menuButton.focus();
  } else if (!event.shiftKey && document.activeElement === links.at(-1)) {
    event.preventDefault();
    menuButton.focus();
  }
});
menuButton.addEventListener("keydown", (event) => {
  if (event.key === "Tab" && menu.classList.contains("open")) {
    event.preventDefault();
    const links = [...menu.querySelectorAll("a")];
    (event.shiftKey ? links.at(-1) : links[0]).focus();
  }
});
