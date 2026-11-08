import * as THREE from "three";
import "./sketchbook.css";
import { artRects } from "./flash-art.js";

const clamp = THREE.MathUtils.clamp;
const smooth = (a, b, value) => THREE.MathUtils.smoothstep(value, a, b);
const asset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
const W = 2.08, H = 2.94, NX = 64, NZ = 20;
const PW = 720, PH = 1020;
const LEAVES = 4;

function randomSequence(seed) {
  let n = seed;
  return () => ((n = (n * 1664525 + 1013904223) >>> 0) / 4294967296);
}
function sheetCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = PW; canvas.height = PH;
  return { canvas, ctx: canvas.getContext("2d") };
}
function texture(canvas, back = false) {
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  if (back) { map.repeat.x = -1; map.offset.x = 1; }
  return map;
}
function fillPaper(ctx, dark = false, seed = 89) {
  const random = randomSequence(seed);
  ctx.fillStyle = dark ? "#191919" : "#e9e3d7";
  ctx.fillRect(0, 0, PW, PH);
  for (let i = 0; i < 24000; i++) {
    ctx.fillStyle = dark ? `rgba(215,207,184,${random() * .065})` : `rgba(63,47,33,${random() * .07})`;
    ctx.fillRect(random() * PW, random() * PH, .4 + random() * 1.5, .5 + random() * 2);
  }
  const shade = ctx.createLinearGradient(0, 0, PW, 0);
  shade.addColorStop(0, dark ? "#0009" : "#44311b24");
  shade.addColorStop(.08, "#0000");
  shade.addColorStop(.94, "#0000");
  shade.addColorStop(1, dark ? "#0005" : "#44311b15");
  ctx.fillStyle = shade; ctx.fillRect(0, 0, PW, PH);
}
function tape(ctx, image, x, y, width = 150, angle = -.2) {
  if (!image) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  const height = image.height / image.width * width;
  ctx.drawImage(image, -width / 2, -height / 2, width, height);
  ctx.restore();
}
function scribble(ctx, text, x, y, size = 26, angle = -.04, color = "#302b26") {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  ctx.fillStyle = color; ctx.font = `${size}px Marker, "Permanent Marker", cursive`;
  ctx.fillText(text, 0, 0); ctx.restore();
}
function mounted(ctx, x, y, w, h, angle, draw, border = 15) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  ctx.shadowColor = "#0006"; ctx.shadowBlur = 10; ctx.shadowOffsetY = 6;
  ctx.fillStyle = "#f3eee3"; ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.shadowColor = "transparent";
  ctx.save(); ctx.translate(-w / 2 + border, -h / 2 + border);
  ctx.beginPath(); ctx.rect(0, 0, w - border * 2, h - border * 2); ctx.clip();
  draw(w - border * 2, h - border * 2); ctx.restore(); ctx.restore();
}
function drawImageCover(ctx, image, w, h) {
  const scale = Math.max(w / image.width, h / image.height);
  ctx.drawImage(image, (w - image.width * scale) / 2, (h - image.height * scale) / 2, image.width * scale, image.height * scale);
}
function drawFlash(ctx, image, index, w, h) {
  const [sx, sy, sw, sh] = artRects[index % 4];
  const scale = Math.min(w / sw, h / sh);
  ctx.drawImage(image, sx, sy, sw, sh, (w - sw * scale) / 2, (h - sh * scale) / 2, sw * scale, sh * scale);
}
function sticker(ctx, text, x, y, angle, red = false) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  ctx.font = '36px "Bowlby One SC", sans-serif';
  const width = ctx.measureText(text).width + 35;
  ctx.shadowColor = "#0004"; ctx.shadowBlur = 5; ctx.shadowOffsetY = 4;
  ctx.fillStyle = "#eee8db"; ctx.fillRect(-width / 2 - 5, -36, width + 10, 61);
  ctx.shadowColor = "transparent";
  ctx.fillStyle = red ? "#bd1c20" : "#171717"; ctx.fillRect(-width / 2, -31, width, 51);
  ctx.fillStyle = "#eee8db"; ctx.textAlign = "center"; ctx.fillText(text, 0, 9);
  ctx.restore();
}
function pencilMarks(ctx, x, y, seed) {
  const random = randomSequence(seed);
  for (let row = 0; row < 4; row++) {
    ctx.strokeStyle = `rgba(36,29,21,${.12 + row * .1})`;
    ctx.lineWidth = 1.2;
    for (let col = 0; col < 30; col++) {
      ctx.beginPath(); ctx.moveTo(x + col * 3.2, y + row * 36 + random() * 4);
      ctx.lineTo(x + col * 3.2 - 8, y + row * 36 + 20 + random() * 5); ctx.stroke();
    }
  }
}
function makeCover(media, back = false) {
  const { canvas, ctx } = sheetCanvas();
  fillPaper(ctx, true, back ? 90 : 43);
  ctx.strokeStyle = "#706960"; ctx.lineWidth = 2;
  ctx.strokeRect(17, 14, PW - 34, PH - 28);
  if (!back) {
    ctx.save(); ctx.translate(48, 68); ctx.rotate(-.025);
    ctx.fillStyle = "#be191e"; ctx.fillRect(-10, -20, 638, 246);
    ctx.fillStyle = "#eee8db"; ctx.font = '68px "Bowlby One SC", sans-serif';
    ctx.fillText("IDEAS", 18, 82); ctx.fillText("EN PAPEL", 18, 177); ctx.restore();
    mounted(ctx, 238, 511, 355, 430, -.14, (w, h) => drawFlash(ctx, media.flash, 0, w, h));
    mounted(ctx, 524, 683, 285, 383, .12, (w, h) => drawFlash(ctx, media.flash, 3, w, h));
    tape(ctx, media.black, 167, 295, 185, -.22);
    tape(ctx, media.masking, 577, 499, 168, .25);
    mounted(ctx, 222, 829, 300, 180, .08, (w, h) => {
      ctx.fillStyle = "#d9d0b9"; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#201e19"; ctx.font = '52px "Bowlby One SC", sans-serif';
      ctx.fillText("MALA", 8, 68); ctx.fillText("TINTA", 8, 126);
    });
    sticker(ctx, "SIN COPIA", 483, 392, -.08, true);
    scribble(ctx, "todo empieza aquí", 305, 962, 26, -.06, "#d9d1c4");
    tape(ctx, media.masking, 137, 848, 125, -.68);
  } else {
    mounted(ctx, 371, 408, 462, 557, .08, (w, h) => {
      if (media.owner) drawImageCover(ctx, media.owner, w, h);
      else drawFlash(ctx, media.flash, 1, w, h);
    }, 22);
    tape(ctx, media.masking, 188, 126, 172, -.29);
    tape(ctx, media.black, 558, 674, 166, -.33);
    mounted(ctx, 154, 797, 230, 303, -.15, (w, h) => drawFlash(ctx, media.flash, 2, w, h));
    sticker(ctx, "HECHO A MANO", 442, 813, .08, true);
    scribble(ctx, "Nos vemos del otro lado.", 192, 921, 26, -.03, "#ddd4c3");
    scribble(ctx, "Mala Tinta", 403, 972, 32, -.05, "#ddd4c3");
  }
  return canvas;
}
function makeCollage(media, index) {
  const { canvas, ctx } = sheetCanvas();
  fillPaper(ctx, false, index + 100);
  const notes = ["dejar respirar la piel", "primero la intención", "probar. borrar. volver.", "las líneas encuentran su sitio", "menos ruido, más carácter", "esto sí se queda", "hecho para una sola piel", "la siguiente idea es tuya"];
  const artIndex = Math.floor(index / 2) % 4;
  const photo = media.photos[artIndex];
  scribble(ctx, notes[index], 55, 72, 26, -.025);
  if (index % 2 === 0) {
    mounted(ctx, 369, 421, 558, 581, -.045, (w, h) => drawFlash(ctx, media.flash, artIndex, w, h));
    tape(ctx, media.masking, 152, 145, 160, -.21);
    tape(ctx, media.black, 582, 675, 142, -.27);
    if (photo) mounted(ctx, 243, 802, 314, 252, .09, (w, h) => drawImageCover(ctx, photo, w, h));
    else pencilMarks(ctx, 85, 758, index + 2);
    tape(ctx, media.masking, 121, 692, 116, -.14);
    scribble(ctx, "una idea", 446, 817, 31, -.08);
    scribble(ctx, "mil caminos", 417, 862, 28, -.06);
    pencilMarks(ctx, 493, 900, 201 + index);
  } else {
    if (photo) {
      mounted(ctx, 352, 323, 566, 409, .055, (w, h) => drawImageCover(ctx, photo, w, h));
      tape(ctx, media.black, 218, 126, 166, -.07);
      tape(ctx, media.masking, 538, 504, 159, -.23);
    }
    mounted(ctx, 359, 728, 467, 373, -.06, (w, h) => drawFlash(ctx, media.flash, artIndex, w, h));
    tape(ctx, media.masking, 192, 552, 145, -.16);
    pencilMarks(ctx, 565, 677, 34 + index);
    sticker(ctx, index > 3 ? "PROCESO" : "EN PRUEBA", 452, 916, -.04, index === 5);
  }
  // Imperfect graphite strokes and handwritten notes make these working pages, not numbered cards.
  ctx.save(); ctx.strokeStyle = "#30271d55"; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(57, 958); ctx.bezierCurveTo(212, 950, 264, 967, 347, 954); ctx.stroke(); ctx.restore();
  return canvas;
}
function makeEndpaper(media, side) {
  const { canvas, ctx } = sheetCanvas(); fillPaper(ctx, true, 190 + side);
  scribble(ctx, side ? "No termina aquí." : "No hay ideas pequeñas.", 77, 127, 37, -.035, "#d8d0c1");
  mounted(ctx, 361, 523, 519, 593, side ? .045 : -.045, (w, h) => drawFlash(ctx, media.flash, side ? 3 : 1, w, h));
  tape(ctx, media.masking, 186, 226, 185, -.25);
  scribble(ctx, "Mala Tinta / ideas en papel", 87, 934, 26, .015, "#d8d0c1");
  return canvas;
}
function pageGeometry() {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array((NX + 1) * (NZ + 1) * 3);
  const uvs = new Float32Array((NX + 1) * (NZ + 1) * 2), indices = [];
  for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) {
    const k = j * (NX + 1) + i;
    positions[k * 3] = i / NX * W; positions[k * 3 + 2] = (j / NZ - .5) * H;
    uvs[k * 2] = i / NX; uvs[k * 2 + 1] = 1 - j / NZ;
    if (i < NX && j < NZ) { const b = k + 1, c = k + NX + 1; indices.push(k, c, b, b, c, c + 1); }
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2)); geometry.setIndex(indices);
  geometry.computeVertexNormals(); return geometry;
}
function bendSheet(geometry, turn, index) {
  const pos = geometry.attributes.position, theta = Math.PI * turn, lift = Math.sin(theta), step = W / NX;
  const base = THREE.MathUtils.lerp(.12 + (LEAVES - index) * .009, .12 + index * .009, turn);
  for (let j = 0; j <= NZ; j++) {
    const v = j / NZ - .5; let x = 0, y = base;
    for (let i = 0; i <= NX; i++) {
      const u = i / NX;
      if (i) { const m = (i - .5) / NX, a = theta + lift * (.64 * Math.sin(Math.PI * m) + .1 * v * Math.sin(Math.PI * m)); x += Math.cos(a) * step; y += Math.sin(a) * step; }
      pos.setXYZ(j * (NX + 1) + i, x, y + .018 * Math.exp(-u * 13) + lift * .04 * Math.sin(Math.PI * u) * v, v * H + lift * .025 * Math.sin(Math.PI * u) * Math.cos(v * Math.PI));
    }
  }
  pos.needsUpdate = true; geometry.computeVertexNormals(); geometry.computeBoundingSphere();
}
function roundedBoard(w, h, depth) {
  const r = .055, x = 0, y = -h / 2, shape = new THREE.Shape();
  shape.moveTo(x + r, y); shape.lineTo(x + w - r, y); shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r); shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h); shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r); shape.quadraticCurveTo(x, y, x + r, y);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: .012, bevelThickness: .012, bevelSegments: 2, curveSegments: 5 });
  geometry.translate(0, 0, -depth / 2); geometry.rotateX(-Math.PI / 2); return geometry;
}

/** Bound hardcover, flexible leaves, and a closing back cover. Scroll always stays native. */
export async function initSketchbook(container, { reducedMotion = false, onPageChange = () => {} } = {}) {
  const noop = { setPage() {}, setReducedMotion() {}, destroy() {} };
  if (!container) return noop;
  const section = container.closest("#flash"), owner = section.querySelector(".book-owner");
  const fallback = container.querySelector("img");
  let disposed = false, ready = false, visible = false, contextLost = false, renderer;
  let current = 0, target = 0, lastTime = 0, frame = 0, reduced = reducedMotion, lastStage = "", activePage = -1;
  const objects = { geometries: [], materials: [], textures: [] };
  const keep = (type, value) => (objects[type].push(value), value);
  const geo = (value) => keep("geometries", value), mat = (value) => keep("materials", value), tex = (value) => keep("textures", value);
  const loadImage = async (path, optional = false) => {
    const image = new Image(); image.decoding = "async"; image.src = asset(path);
    try { await image.decode(); return image; } catch (error) { if (optional) return null; throw error; }
  };
  let media;
  try {
    const [flash, paper, masking, black, ownerImage, photos] = await Promise.all([
      loadImage("images/flash-sheet.webp"), loadImage("images/materials/torn-paper.webp", true),
      loadImage("images/materials/masking-tape.webp", true), loadImage("images/materials/black-tape.webp", true),
      loadImage("images/editorial/owner.webp", true),
      Promise.all(["blackwork", "tradicional", "fine-line", "realismo"].map((name) => loadImage(`images/editorial/${name}.webp`, true))),
      Promise.allSettled([document.fonts.load('400 48px "Bowlby One SC"'), document.fonts.load("400 27px Marker")]),
    ]);
    media = { flash, paper, masking, black, owner: ownerImage, photos };
  } catch {
    section.classList.add("book-static");
    if (owner) { owner.inert = false; owner.setAttribute("aria-hidden", "false"); owner.style.visibility = "visible"; }
    return noop;
  }
  if (disposed) return noop;
  const covers = [makeCover(media), makeCover(media, true)], collages = Array.from({ length: 8 }, (_, i) => makeCollage(media, i));
  const endpapers = [makeEndpaper(media, 0), makeEndpaper(media, 1)];
  // These snapshots are also the complete accessible fallback when WebGL or motion is unavailable.
  const staticGallery = document.createElement("div"); staticGallery.className = "book-static-gallery";
  staticGallery.setAttribute("aria-label", "Selección de páginas del cuaderno de ideas");
  [covers[0], collages[0], collages[3], collages[4], collages[7], covers[1]].forEach((page, i) => {
    const image = new Image(); image.src = page.toDataURL("image/webp", .82); image.width = PW; image.height = PH;
    image.alt = i === 0 ? "Portada negra de Ideas en papel, con dibujos y recortes sujetos con cinta" : i === 5 ? "Contraportada con retrato ilustrativo del tatuador y collage" : "Página de trabajo con dibujo, fotografía de referencia, apuntes y cinta";
    image.loading = "lazy"; staticGallery.append(image);
  });
  container.after(staticGallery);
  if (fallback) { fallback.src = covers[0].toDataURL("image/webp", .86); fallback.alt = "Portada del cuaderno Ideas en papel"; }
  function staticMode(value) {
    section.classList.toggle("book-static", value);
    staticGallery.hidden = !value;
    if (owner) {
      owner.inert = !value;
      owner.setAttribute("aria-hidden", String(!value));
      owner.style.visibility = value ? "visible" : "hidden";
    }
  }
  staticMode(reduced);
  try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: devicePixelRatio < 2, powerPreference: "low-power" }); }
  catch { staticMode(true); return { ...noop, destroy() { staticGallery.remove(); } }; }
  const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(-3, 3, 2, -2, .1, 30);
  camera.position.set(0, 8.8, 3.1); camera.lookAt(0, .3, 0);
  const book = new THREE.Group(); scene.add(book);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6)); renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.06;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false;
  const canvas = renderer.domElement; canvas.className = "sketchbook-webgl"; canvas.setAttribute("aria-hidden", "true"); container.append(canvas);
  scene.add(new THREE.HemisphereLight(0xfff3de, 0x292a30, 2));
  const key = new THREE.DirectionalLight(0xffedd5, 2.8); key.position.set(-3.2, 8, 3); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -5, right: 5, top: 4, bottom: -4, near: 1, far: 16 });
  key.shadow.bias = -.00025; key.shadow.normalBias = .012; scene.add(key);
  const fill = new THREE.DirectionalLight(0xd9e4f2, .75); fill.position.set(4, 3, -2); scene.add(fill);
  const shadow = new THREE.Mesh(geo(new THREE.PlaneGeometry(22, 22)), mat(new THREE.ShadowMaterial({ color: 0, opacity: .33 })));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -.22; shadow.receiveShadow = true; scene.add(shadow);
  const coverMaterial = mat(new THREE.MeshStandardMaterial({ color: 0x26221d, roughness: .87 }));
  const edgeMaterial = mat(new THREE.MeshStandardMaterial({ color: 0xbeb8aa, roughness: .98 }));
  const coverGeometry = geo(roundedBoard(W + .1, H + .15, .07));
  function paperMaterial(image, side = THREE.FrontSide, back = false) {
    return mat(new THREE.MeshStandardMaterial({ map: tex(texture(image, back)), side, roughness: .96, metalness: 0, color: 0xffffff }));
  }
  function rigidSurface(parent, image, underside) {
    const geometry = geo(new THREE.PlaneGeometry(W + .07, H + .11));
    geometry.rotateX(-Math.PI / 2); geometry.translate(W / 2, underside ? -.049 : .049, 0);
    const mesh = new THREE.Mesh(geometry, paperMaterial(image, underside ? THREE.BackSide : THREE.FrontSide, underside));
    mesh.receiveShadow = true; parent.add(mesh);
  }
  const frontCover = new THREE.Group(), backCover = new THREE.Group(); book.add(frontCover, backCover);
  for (const hinge of [frontCover, backCover]) {
    const board = new THREE.Mesh(coverGeometry, coverMaterial); board.position.x = -.035;
    board.castShadow = board.receiveShadow = true; hinge.add(board);
  }
  rigidSurface(frontCover, covers[0], false); rigidSurface(frontCover, endpapers[0], true);
  rigidSurface(backCover, endpapers[1], false); rigidSurface(backCover, covers[1], true);
  const rightStack = new THREE.Mesh(geo(new THREE.BoxGeometry(W - .025, .11, H - .02)), edgeMaterial);
  rightStack.position.set(W / 2, .015, 0); rightStack.castShadow = rightStack.receiveShadow = true; book.add(rightStack);
  const leftStack = rightStack.clone(); leftStack.position.x = -W / 2; book.add(leftStack);
  // Horizontal, slightly uneven fore-edges read as individual sheets when the book is closed.
  for (const side of [1, -1]) {
    const positions = [];
    for (let i = 0; i < 20; i++) { const y = -.035 + i * .005; positions.push(0, y, H / 2, side * W, y, H / 2, side * W, y, H / 2, side * W, y, -H / 2); }
    const lines = new THREE.LineSegments(geo(new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))), mat(new THREE.LineBasicMaterial({ color: 0x766d5f, transparent: true, opacity: .32 })));
    lines.userData.stackSide = side; book.add(lines);
  }
  const spine = new THREE.Mesh(geo(new THREE.CylinderGeometry(.07, .07, H + .1, 16)), coverMaterial);
  spine.rotation.x = Math.PI / 2; spine.position.y = -.02; book.add(spine);
  const sheets = [];
  for (let i = LEAVES - 1; i >= 0; i--) {
    const geometry = geo(pageGeometry());
    const front = new THREE.Mesh(geometry, paperMaterial(collages[i * 2]));
    const back = new THREE.Mesh(geometry, paperMaterial(collages[i * 2 + 1], THREE.BackSide, true));
    front.castShadow = front.receiveShadow = back.receiveShadow = true;
    front.frustumCulled = back.frustumCulled = false; book.add(front, back);
    sheets.push({ geometry, index: i, last: -1 });
  }
  let halfViewWidth = 4;
  function resize() {
    if (disposed) return;
    const rect = container.getBoundingClientRect(); if (!rect.width || !rect.height) return;
    const aspect = rect.width / rect.height, viewHeight = Math.max(3.65, 4.75 / aspect);
    halfViewWidth = viewHeight * aspect / 2;
    Object.assign(camera, { left: -halfViewWidth, right: halfViewWidth, top: viewHeight / 2, bottom: -viewHeight / 2 });
    camera.updateProjectionMatrix(); renderer.setSize(rect.width, rect.height, false); requestRender();
  }
  function progress() {
    const rect = section.getBoundingClientRect();
    return clamp(-rect.top / Math.max(1, section.offsetHeight - innerHeight), 0, 1);
  }
  function stageUpdate(p) {
    const reveal = smooth(.86, .96, p), stage = p < .2 ? "cover" : p < .86 ? "pages" : "owner";
    section.style.setProperty("--owner-reveal", reveal.toFixed(4));
    section.classList.toggle("book-owner-visible", reveal > .88);
    if (owner && !reduced) {
      owner.inert = reveal < .88;
      owner.setAttribute("aria-hidden", String(reveal < .88));
      owner.style.visibility = reveal < .01 ? "hidden" : "visible";
    }
    const page = clamp(Math.floor((p - .22) / .135), 0, 3);
    container.dataset.bookStage = stage;
    if (page !== activePage) { activePage = page; onPageChange(page); }
    if (stage !== lastStage) { lastStage = stage; section.dispatchEvent(new CustomEvent("bookstage", { detail: { stage, progress: p } })); }
  }
  function draw(time = performance.now()) {
    frame = 0;
    if (disposed || !ready || !visible || contextLost || document.hidden || reduced) return;
    const dt = Math.min((time - (lastTime || time)) / 1000, .05); lastTime = time;
    current = Math.abs(target - current) < .0001 ? target : current + (target - current) * (1 - Math.exp(-dt * 10));
    const open = smooth(.065, .215, current), closing = smooth(.79, .91, current), settle = smooth(.90, .99, current);
    frontCover.rotation.z = Math.PI * open; frontCover.position.y = THREE.MathUtils.lerp(.21, -.07, open);
    backCover.rotation.z = Math.PI * closing; backCover.position.y = THREE.MathUtils.lerp(-.09, .21, closing);
    let turns = 0;
    for (const sheet of sheets) {
      const start = .225 + sheet.index * .135;
      const turn = smooth(start, start + .095, current); turns += turn;
      if (Math.abs(turn - sheet.last) > .00001) { bendSheet(sheet.geometry, turn, sheet.index); sheet.last = turn; }
    }
    rightStack.scale.y = Math.max(.02, 1 - turns / LEAVES); leftStack.scale.y = Math.max(.02, turns / LEAVES);
    rightStack.visible = turns < LEAVES - .005; leftStack.visible = turns > .005;
    book.children.forEach((object) => { if (object.userData.stackSide) object.visible = object.userData.stackSide > 0 ? turns < LEAVES - .005 : turns > .005; });
    // Centre a closed cover, then a two-page spread; finish with the closed back cover at the left.
    const desktop = innerWidth > 800;
    const finishX = desktop ? W / 2 - halfViewWidth * .47 : W / 2;
    book.position.x = THREE.MathUtils.lerp(-W / 2 * (1 - open), finishX, settle);
    book.rotation.y = THREE.MathUtils.lerp(-.055, .04, open) - settle * .08;
    book.rotation.z = -.025 + settle * .045;
    renderer.shadowMap.needsUpdate = true; renderer.render(scene, camera);
    container.classList.add("book-is-ready"); stageUpdate(current);
    if (Math.abs(target - current) > .0001) requestRender();
  }
  function requestRender() { if (!frame && ready && visible && !disposed && !contextLost && !document.hidden && !reduced) frame = requestAnimationFrame(draw); }
  function onScroll() { target = progress(); requestRender(); }
  function onVisibility() { lastTime = 0; if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else requestRender(); }
  function onLost(event) { event.preventDefault(); contextLost = true; cancelAnimationFrame(frame); frame = 0; staticMode(true); }
  function onRestored() { contextLost = false; staticMode(reduced); requestRender(); }
  canvas.addEventListener("webglcontextlost", onLost); canvas.addEventListener("webglcontextrestored", onRestored);
  const intersection = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting); lastTime = 0;
    if (visible) { target = progress(); requestRender(); } else { cancelAnimationFrame(frame); frame = 0; }
  }, { rootMargin: "120px" }); intersection.observe(container);
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(container);
  window.addEventListener("scroll", onScroll, { passive: true }); document.addEventListener("visibilitychange", onVisibility);
  ready = true; target = progress(); current = target; resize(); requestRender();
  return {
    setPage(index) { target = .225 + clamp(Math.round(Number(index) || 0), 0, 3) * .135; requestRender(); },
    setReducedMotion(value) {
      reduced = Boolean(value); cancelAnimationFrame(frame); frame = 0; lastTime = 0;
      staticMode(reduced || contextLost); target = progress(); current = target; resize(); requestRender();
    },
    destroy() {
      disposed = true; cancelAnimationFrame(frame); intersection.disconnect(); resizeObserver.disconnect();
      window.removeEventListener("scroll", onScroll); document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onLost); canvas.removeEventListener("webglcontextrestored", onRestored);
      Object.values(objects).forEach((items) => items.forEach((item) => item.dispose()));
      key.shadow.map?.dispose(); renderer.dispose(); canvas.remove(); staticGallery.remove();
      section.classList.remove("book-static", "book-owner-visible"); section.style.removeProperty("--owner-reveal");
      container.classList.remove("book-is-ready");
      if (owner) { owner.inert = false; owner.setAttribute("aria-hidden", "false"); owner.style.removeProperty("visibility"); }
    },
  };
}
