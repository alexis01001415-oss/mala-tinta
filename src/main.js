import "./dark.css";
import { initNavigation } from "./navigation.js";
import { startPressIntro } from "./press-intro.js";
import "./edition.css";
import { initEditorialSections } from "./editorial-sections.js";
import "./wall-edition.css";
// Reserve the full book stage before ScrollTrigger measures later scenes.
import "./sketchbook.css";

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
let editorialCleanup;
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
  editorialCleanup?.();
  editorialCleanup = null;
  if (value) {
    editorialCleanup = initEditorialSections({ reducedMotion:true, onChooseStyle:goToIdea });
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
// Import animation only after the first render; document content does not depend on it.
let motionModules;
let motionSetupVersion = 0;
const entryHash = location.hash;
let entryAligned = false;
let entryInterrupted = false;
for (const event of ['wheel', 'touchstart', 'pointerdown', 'keydown']) {
  window.addEventListener(event, () => { entryInterrupted = true; }, { once: true, passive: true });
}
const pageLoaded = document.readyState === 'complete' ? Promise.resolve()
  : new Promise((resolve) => window.addEventListener('load', resolve, { once: true }));
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
    const manifestoTimeline = gsap.timeline({
      scrollTrigger: { trigger: '#nosotros', start: 'top top', end: 'bottom bottom', scrub: .6 },
    });
    manifestoTimeline.fromTo('.manifesto-word', { opacity: .2, scale: .87, y: 6 }, {
      opacity: 1, scale: 1, y: 0, stagger: .13, duration: .32, ease: 'power2.out',
    }, .2).fromTo('.manifesto-note--first', { y: 25, rotation: -12 }, { y: 0, rotation: -6, duration: 1 }, .3)
      .fromTo('.manifesto-note--last', { y: 25, rotation: 10, opacity: 0 }, { y: 0, rotation: 5, opacity: 1, duration: .6 }, 3.8)
      .to({}, { duration: .5 });
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
  });
  editorialCleanup?.();
  editorialCleanup = initEditorialSections({ gsap, ScrollTrigger, reducedMotion, onChooseStyle: goToIdea });
  Promise.all([document.fonts.ready, pageLoaded]).then(() => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  })).then(() => {
    if (reducedMotion || version !== motionSetupVersion) return;
    ScrollTrigger.refresh();
    // Align after native restoration and pin measurement, unless the visitor has moved.
    if (!entryAligned) {
      entryAligned = true;
      if (!entryInterrupted && entryHash && entryHash !== '#inicio' && location.hash === entryHash) {
        document.getElementById(entryHash.slice(1))?.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    }
  });
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
  ["Un lugar para crear.", "Luz para ver cada detalle. Espacio para pensar. Una mesa ordenada y una conversación tranquila: así debería empezar tu próxima pieza."],
  ["Cada trazo, su herramienta.", "La agrupación cambia el resultado: 3RL para líneas finas, 7RL para un trazo más firme y 13RM para sombrear. La elección depende del diseño, la piel y la mano del artista."],
  ["La confianza se prepara.", "Antes de empezar, pide ver agujas estériles de un solo uso, barreras limpias y tintas identificadas. Preguntar cómo se prepara tu sesión también es cuidar tu piel."],
  ["Aquí puedes decir pausa.", "Un apoyo cómodo, luz bien dirigida y tiempo para acomodarte. Si necesitas parar, cambiar de postura o hacer una pregunta, dilo. Tu tranquilidad importa."],
  ["Referencias, no copias.", "Mira los contrastes, las líneas y cómo una pieza vive sobre el cuerpo. Guarda lo que te mueve. Lo usaremos para dibujar algo con identidad propia."],
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

      });
      sketchbook?.setReducedMotion(reducedMotion);
      if (motionModules) {
        const [, { ScrollTrigger }] = await motionModules;
        requestAnimationFrame(() => ScrollTrigger.refresh());
      }
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
  destroyNavigation?.(); destroyIntro?.(); scrollMotion?.revert(); editorialCleanup?.();
  studio?.destroy?.(); sketchbook?.destroy?.(); atmosphereObserver.disconnect();
});
