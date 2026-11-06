import "./dark.css";
import { initNavigation } from "./navigation.js";
import { startPressIntro } from "./press-intro.js";
import "./edition.css";
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

const destroyNavigation = initNavigation({ getReducedMotion: () => reducedMotion });

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
    gsap.to(".press-hero__scene", {
      yPercent: 12, ease: "none",
      scrollTrigger: { trigger: ".press-hero", start: "top top", end: "bottom top", scrub: true },
    });
    gsap.fromTo(".manifesto-story > .manifesto-word", { opacity: .58, y: 10 }, {
      opacity: 1, y: 0, stagger: .1, ease: "none",
      scrollTrigger: { trigger: ".manifesto-composition", start: "top 82%", end: "bottom 58%", scrub: .25 },
    });
    gsap.fromTo(".editorial-tag", { rotation: -6, scale: .95 }, {
      rotation: 1, scale: 1, stagger: .2, ease: "none",
      scrollTrigger: { trigger: ".manifesto-composition", start: "top 85%", end: "bottom 60%", scrub: .4 },
    });
    const characterTimeline = gsap.timeline({
      scrollTrigger: { trigger: ".character-section", start: "top top", end: "bottom bottom", scrub: .45 },
    });
    characterTimeline.fromTo(".character-stage", { scale: .9, y: 50 }, { scale: 1.03, y: 0, ease: "none" }, 0);
    characterTimeline.fromTo(".character-note", { rotation: 12, y: 35 }, { rotation: 6, y: -8, ease: "none" }, 0);
    characterTimeline.fromTo(".character-aside", { rotation: -5, y: 12 }, { rotation: -2, y: -6, ease: "none" }, 0);
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
      studio?.setReducedMotion(reducedMotion);
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
  ["Pasa al taller.", "Mira las paredes. Si un dibujo te detiene, ya tenemos de qué hablar."],
  ["Aquí nace el trazo.", "Bobinas, aguja y mano. Acércate a la máquina que convierte una línea en piel."],
  ["Antes de la tinta.", "Pide ver el material y pregunta cómo se prepara tu sesión. Mereces una respuesta clara."],
  ["A tu ritmo.", "¿Nervios? Dilo. Una pausa o un minuto más también son parte de tu pieza."],
  ["Que se sienta tuyo.", "De la pared al papel. Señala lo que te atrae y dale tu propia vuelta."],
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
      sketchbook?.setReducedMotion(reducedMotion);
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
// Preserve the semantic paragraph; only individual text nodes receive visual wrappers.
const manifesto = $(".manifesto-story");
const walker = document.createTreeWalker(manifesto, NodeFilter.SHOW_TEXT);
const textNodes = [];
while (walker.nextNode()) textNodes.push(walker.currentNode);
for (const node of textNodes) {
  const fragment = document.createDocumentFragment();
  for (const token of node.textContent.split(/(\s+)/)) {
    if (/^\s*$/.test(token)) fragment.append(document.createTextNode(token));
    else { const word = document.createElement("span"); word.className = "manifesto-word"; word.textContent = token; fragment.append(word); }
  }
  node.replaceWith(fragment);
}
const atmosphereObserver = new IntersectionObserver(([entry]) => {
  $(".press-hero").classList.toggle("is-in-view", entry.isIntersecting);
});
atmosphereObserver.observe($(".press-hero"));
setMotion(reducedMotion);
const destroyIntro = startPressIntro({ getReducedMotion: () => reducedMotion });
if (import.meta.hot) import.meta.hot.dispose(() => {
  destroyNavigation?.(); destroyIntro?.(); scrollMotion?.revert();
  studio?.destroy?.(); sketchbook?.destroy?.(); atmosphereObserver.disconnect();
});
