import * as THREE from "three";
import "./sketchbook.css";
import { artRects } from "./flash-art.js";

const clamp = THREE.MathUtils.clamp;
const PAGE_W = 2.08;
const PAGE_H = 2.94;
const SEG_X = 64;
const SEG_Z = 20;
const TITLES = [
  "Muda de piel.",
  "Busca tu luz.",
  "Con filo propio.",
  "También floreces.",
];
const CATEGORIES = [
  "SERPIENTE / BLACKWORK",
  "POLILLA / BLACKWORK",
  "DAGA / TRADICIONAL",
  "BOTÁNICA / FINE LINE",
];
function drawArt(ctx, image, index, x, y, width, height) {
  const [sx, sy, sw, sh] = artRects[index];
  const scale = Math.min(width / sw, height / sh);
  const dw = sw * scale,
    dh = sh * scale;
  ctx.drawImage(
    image,
    sx,
    sy,
    sw,
    sh,
    x + (width - dw) / 2,
    y + (height - dh) / 2,
    dw,
    dh,
  );
}
const STUDIES = [
  { heading: "Escamas", notes: ["Alternar línea fina y sombra.", "Dejar aire entre las vueltas."] },
  { heading: "Alas", notes: ["Una mitad responde a la otra.", "El borde conserva su trazo."] },
  { heading: "Filigrana", notes: ["Filo limpio al centro.", "Reservar el detalle para la empuñadura."] },
];

function seededRandom(seed) {
  let n = seed;
  return () => {
    n = (n * 1664525 + 1013904223) >>> 0;
    return n / 4294967296;
  };
}

const PAGE_PIXELS = { width: 720, height: 1020 };

function pageCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = PAGE_PIXELS.width;
  canvas.height = PAGE_PIXELS.height;
  return { canvas, ctx: canvas.getContext("2d") };
}

// Sample actual paper fibers once. All eight sides share this inexpensive base.
function makePaperSurface(paper) {
  const { canvas, ctx } = pageCanvas();
  const random = seededRandom(53);
  ctx.fillStyle = "#e8e1d3";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (paper) {
    ctx.globalCompositeOperation = "multiply";
    ctx.globalAlpha = 0.43;
    for (let y = 0; y < canvas.height; y += 104) {
      for (let x = 0; x < canvas.width; x += 104) {
        const sx = 80 + random() * (paper.width - 260);
        const sy = 42 + random() * Math.max(1, paper.height - 166);
        ctx.drawImage(paper, sx, sy, 104, 104, x, y, 104, 104);
      }
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }
  const edge = ctx.createLinearGradient(0, 0, canvas.width, 0);
  edge.addColorStop(0, "rgba(83,65,44,.13)");
  edge.addColorStop(0.065, "rgba(83,65,44,0)");
  edge.addColorStop(0.965, "rgba(83,65,44,0)");
  edge.addColorStop(1, "rgba(83,65,44,.07)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
}

function printHeading(ctx, text, size, x, baseline, maxWidth) {
  ctx.save();
  ctx.letterSpacing = "1.5px";
  ctx.font = `400 ${size}px "Bowlby One SC", Impact, sans-serif`;
  while (size > 16 && ctx.measureText(text).width > maxWidth) {
    size -= 1;
    ctx.font = `400 ${size}px "Bowlby One SC", Impact, sans-serif`;
  }
  ctx.fillText(text, x, baseline);
  ctx.restore();
}

function mountPaper(ctx, width, height, paint) {
  ctx.save();
  ctx.shadowColor = "rgba(38,24,13,.28)";
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 4;
  ctx.shadowBlur = 7;
  ctx.fillStyle = "#f1ebde";
  ctx.fillRect(-width / 2, -height / 2, width, height);
  ctx.restore();
  ctx.save();
  ctx.translate(-width / 2, -height / 2);
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.clip();
  paint();
  ctx.restore();
}

function placeTape(ctx, image, x, y, width, angle) {
  if (!image) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha = 0.86;
  const height = width * image.height / image.width;
  ctx.drawImage(image, -width / 2, -height / 2, width, height);
  ctx.restore();
}

function pageFooter(ctx, index) {
  const y = PAGE_PIXELS.height - 48;
  ctx.strokeStyle = "rgba(56,48,38,.3)";
  ctx.beginPath();
  ctx.moveTo(48, y - 24);
  ctx.lineTo(PAGE_PIXELS.width - 48, y - 24);
  ctx.stroke();
  ctx.fillStyle = "#4d453b";
  ctx.font = "700 15px Raleway, sans-serif";
  ctx.letterSpacing = "1.5px";
  ctx.fillText(CATEGORIES[index], 48, y);
  ctx.textAlign = "right";
  ctx.fillText(`0${index + 1} / 04`, PAGE_PIXELS.width - 48, y);
  ctx.textAlign = "left";
  ctx.letterSpacing = "0px";
}

function drawFront(ctx, image, index, materials) {
  const { width: w } = PAGE_PIXELS;
  const width = index === 1 ? 610 : 520;
  const height = index === 1 ? 516 : 666;
  const angle = [-0.035, 0.025, -0.022, 0.036][index];
  ctx.save();
  ctx.translate(w / 2, 481);
  ctx.rotate(angle);
  mountPaper(ctx, width, height, () => {
    // The untrimmed border reads as a real mounted proof. The drawing keeps its aspect.
    ctx.globalCompositeOperation = "multiply";
    drawArt(ctx, image, index, 24, 28, width - 48, height - 60);
  });
  placeTape(ctx, materials.masking, -width * 0.32, -height / 2 + 8, 155, -0.17);
  placeTape(ctx, index % 2 ? materials.masking : materials.black, width * 0.32, height / 2 - 12, 121, -0.21);
  ctx.restore();

  ctx.save();
  ctx.translate(55, 823);
  ctx.rotate(-0.022);
  if (materials.paper) ctx.drawImage(materials.paper, -12, -4, 575, 99);
  ctx.fillStyle = "#211e19";
  printHeading(ctx, TITLES[index], 38, 17, 58, 516);
  ctx.restore();
  pageFooter(ctx, index);
}

function drawStudy(ctx, image, index, materials) {
  const study = STUDIES[index];
  ctx.fillStyle = "#25211c";
  printHeading(ctx, study.heading, 53, 53, 143, 612);

  const [sx, sy, sw, sh] = artRects[index];
  ctx.save();
  ctx.translate(357, 437);
  ctx.rotate([0.032, -0.047, 0.024][index]);
  mountPaper(ctx, 555, 410, () => {
    // Closely cropped print beside the full flash on the opposite page.
    const cropWidth = sw * 0.68;
    const cropHeight = Math.min(sh * 0.5, cropWidth * 0.68);
    ctx.drawImage(image, sx + sw * 0.16, sy + sh * 0.23, cropWidth, cropHeight, 21, 21, 513, 347);
    ctx.fillStyle = "#484137";
    ctx.font = "600 13px Raleway, sans-serif";
    ctx.fillText("DETALLE DEL TRAZO", 23, 389);
  });
  placeTape(ctx, materials.black, 135, -204, 128, 0.17);
  ctx.restore();

  ctx.save();
  ctx.translate(66, 730);
  ctx.rotate(-0.026);
  ctx.fillStyle = "#50463a";
  ctx.font = "400 22px Marker, cursive";
  study.notes.forEach((line, i) => ctx.fillText(line, 0, i * 35));
  ctx.restore();
  // A real notebook's tonal tests, drawn from the same deterministic sequence.
  const random = seededRandom(index + 133);
  for (let swatch = 0; swatch < 4; swatch++) {
    ctx.strokeStyle = `rgba(39,35,31,${0.1 + swatch * 0.15})`;
    ctx.lineWidth = 2.2;
    for (let stroke = 0; stroke < 29; stroke++) {
      const x = 67 + swatch * 66 + stroke * 1.6;
      const y = 849 + random() * 6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 5 - random() * 3, y + 22 + random() * 8);
      ctx.stroke();
    }
  }
  pageFooter(ctx, index);
}

function canvasTexture(canvas, mirrored = false) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  if (mirrored) {
    texture.repeat.x = -1;
    texture.offset.x = 1;
  }
  return texture;
}

function makePageTexture(image, index, materials, back = false) {
  const { canvas, ctx } = pageCanvas();
  ctx.drawImage(materials.surface, 0, 0);
  ctx.fillStyle = "#3a342c";
  ctx.font = "700 14px Raleway, sans-serif";
  ctx.letterSpacing = "1.5px";
  ctx.fillText(back ? "APUNTES DE TALLER" : "MALA TINTA / CUADERNO DE FLASH", 48, 59);
  ctx.letterSpacing = "0px";
  if (back) drawStudy(ctx, image, index, materials);
  else drawFront(ctx, image, index, materials);
  return canvasTexture(canvas, back);
}

function makeIntroTexture(collage) {
  const { canvas, ctx } = pageCanvas();
  ctx.fillStyle = "#24221e";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (collage) ctx.drawImage(collage, 0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#e6ddca";
  ctx.font = "700 15px Raleway, sans-serif";
  ctx.letterSpacing = "1.5px";
  ctx.fillText("MALA TINTA", 49, 53);
  ctx.letterSpacing = "0px";
  ctx.save();
  ctx.translate(45, 83);
  ctx.rotate(-0.018);
  printHeading(ctx, "Cuaderno", 83, 0, 80, 630);
  printHeading(ctx, "de flash", 83, 0, 172, 624);
  ctx.restore();
  // Keep the grain in the light printed letters, too.
  if (collage) {
    ctx.globalAlpha = 0.12;
    ctx.drawImage(collage, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
  }
  return canvasTexture(canvas, true);
}

function grainTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d"),
    image = ctx.createImageData(256, 256),
    random = seededRandom(29);
  for (let i = 0; i < image.data.length; i += 4) {
    const value = 122 + Math.floor(random() * 24);
    image.data[i] = image.data[i + 1] = image.data[i + 2] = value;
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 6);
  return texture;
}

function leatherTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d"),
    random = seededRandom(89);
  ctx.fillStyle = "#201c1a";
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 19000; i++) {
    const n = random();
    ctx.fillStyle = n > 0.5 ? "rgba(117,100,83,.11)" : "rgba(0,0,0,.13)";
    ctx.fillRect(
      random() * 512,
      random() * 512,
      0.8 + random() * 2.5,
      0.6 + random() * 1.4,
    );
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function pageGeometry() {
  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array((SEG_X + 1) * (SEG_Z + 1) * 3);
  const uvs = new Float32Array((SEG_X + 1) * (SEG_Z + 1) * 2);
  const indices = [];
  for (let j = 0; j <= SEG_Z; j++)
    for (let i = 0; i <= SEG_X; i++) {
      const k = j * (SEG_X + 1) + i;
      vertices[k * 3] = (i / SEG_X) * PAGE_W;
      vertices[k * 3 + 2] = (j / SEG_Z - 0.5) * PAGE_H;
      uvs[k * 2] = i / SEG_X;
      uvs[k * 2 + 1] = 1 - j / SEG_Z;
      if (i < SEG_X && j < SEG_Z) {
        const a = k,
          b = k + 1,
          c = k + SEG_X + 1,
          d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(vertices, 3).setUsage(THREE.DynamicDrawUsage),
  );
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Arc-length-preserving curved sheet, with a small diagonal flex at the corners. */
function bendSheet(geometry, turn, index = 0) {
  const positions = geometry.attributes.position;
  const theta = Math.PI * turn;
  const lift = Math.sin(theta);
  const base = THREE.MathUtils.lerp(
    0.128 + (3 - index) * 0.008,
    0.13 + index * 0.008,
    turn,
  );
  const step = PAGE_W / SEG_X;
  for (let j = 0; j <= SEG_Z; j++) {
    const v = j / SEG_Z,
      vCentered = v - 0.5;
    let x = 0,
      y = base;
    for (let i = 0; i <= SEG_X; i++) {
      const u = i / SEG_X;
      if (i) {
        const mid = (i - 0.5) / SEG_X;
        const angle =
          theta +
          lift *
            (0.69 * Math.sin(Math.PI * mid) +
              0.13 * vCentered * Math.sin(Math.PI * mid * 0.5));
        x += Math.cos(angle) * step;
        y += Math.sin(angle) * step;
      }
      const gutter = 0.024 * Math.exp(-u * 11);
      const corner = lift * 0.045 * Math.sin(Math.PI * u) * vCentered;
      positions.setXYZ(
        j * (SEG_X + 1) + i,
        x,
        y + gutter + corner,
        vCentered * PAGE_H +
          lift * 0.03 * Math.sin(Math.PI * u) * Math.sin(v * Math.PI),
      );
    }
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
}

function roundedBoard(width, height, depth) {
  const r = 0.055,
    x = -width / 2,
    y = -height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + height - r);
  shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  shape.lineTo(x + r, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize: 0.012,
    bevelThickness: 0.012,
    bevelSegments: 2,
    steps: 1,
    curveSegments: 5,
  });
  geometry.translate(0, 0, -depth / 2);
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

/** A real curved-page book. Rendering stops when settled, offscreen, or in a hidden tab. */
export async function initSketchbook(
  container,
  { reducedMotion = false, onPageChange = () => {} } = {},
) {
  const noop = { setPage() {}, setReducedMotion() {}, destroy() {} };
  if (!container) return noop;
  const section = container.closest("#flash") || container.parentElement;
  const fallbackImage = container.querySelector("img");
  let fallbackPage = 0;
  function showFallback(index = 0) {
    fallbackPage = clamp(Math.round(index), 0, 3);
    container.classList.add("book-is-fallback");
    container.classList.remove("book-is-ready");
    container.dataset.bookPage = String(fallbackPage);
    if (fallbackImage) {
      if (
        !fallbackImage.parentElement.classList.contains(
          "sketchbook-fallback-viewport",
        )
      ) {
        const viewport = document.createElement("div");
        viewport.className = "sketchbook-fallback-viewport";
        fallbackImage.before(viewport);
        viewport.append(fallbackImage);
      }
      fallbackImage.alt = `Boceto de tatuaje: ${TITLES[fallbackPage]}`;
      fallbackImage.style.left = `${-(fallbackPage % 2) * 100}%`;
      fallbackImage.style.top = `${-Math.floor(fallbackPage / 2) * 100}%`;
    }
    onPageChange(fallbackPage);
  }
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: window.devicePixelRatio < 2,
      alpha: true,
      powerPreference: "low-power",
    });
  } catch {
    showFallback();
    return { ...noop, setPage: showFallback };
  }
  let disposed = false,
    visible = false,
    ready = false,
    frame = 0,
    lastTime = 0;
  let reduced = reducedMotion,
    target = 0,
    current = 0,
    selected = -1,
    manual = false,
    lastScrollY = window.scrollY;
  let contextLost = false;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-3, 3, 2.3, -2.3, 0.1, 30);
  camera.position.set(0.12, 8.2, 4.2);
  camera.lookAt(0, 0.35, 0);
  const book = new THREE.Group();
  book.rotation.y = -0.055;
  scene.add(book);
  const textures = [],
    geometries = [],
    materials = [];
  const trackTexture = (texture) => {
    textures.push(texture);
    return texture;
  };
  const trackGeometry = (geometry) => {
    geometries.push(geometry);
    return geometry;
  };
  const trackMaterial = (material) => {
    materials.push(material);
    return material;
  };
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  const canvas = renderer.domElement;
  canvas.className = "sketchbook-webgl";
  canvas.setAttribute("aria-hidden", "true");
  container.append(canvas);
  scene.add(new THREE.HemisphereLight(0xfff0d6, 0x29252b, 1.85));
  const key = new THREE.DirectionalLight(0xffe7c4, 3.1);
  key.position.set(-3.4, 7, 3.7);
  key.castShadow = true;
  key.shadow.mapSize.set(1536, 1536);
  Object.assign(key.shadow.camera, {
    left: -4,
    right: 4,
    top: 4,
    bottom: -4,
    near: 1,
    far: 16,
  });
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = 0.015;
  key.shadow.radius = 3;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xc4d2e5, 0.85);
  fill.position.set(4, 3, -2);
  scene.add(fill);
  const shadowPlane = new THREE.Mesh(
    trackGeometry(new THREE.PlaneGeometry(30, 30)),
    trackMaterial(new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.33 })),
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -0.18;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  const grain = trackTexture(grainTexture());
  const leather = trackTexture(leatherTexture());
  const coverMaterial = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: 0x958578,
      map: leather,
      roughness: 0.92,
      bumpMap: grain,
      bumpScale: 0.014,
    }),
  );
  const edgeMaterial = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: 0xd5cbb5,
      roughness: 0.96,
      bumpMap: grain,
      bumpScale: 0.004,
    }),
  );
  const boardGeometry = trackGeometry(
    roundedBoard(PAGE_W + 0.18, PAGE_H + 0.2, 0.075),
  );
  const stackGeometry = trackGeometry(
    new THREE.BoxGeometry(PAGE_W - 0.018, 0.115, PAGE_H - 0.018),
  );
  for (const side of [-1, 1]) {
    const board = new THREE.Mesh(boardGeometry, coverMaterial);
    board.position.set(side * (PAGE_W / 2 + 0.015), -0.088, 0);
    board.castShadow = true;
    board.receiveShadow = true;
    book.add(board);
    const stack = new THREE.Mesh(stackGeometry, edgeMaterial);
    stack.position.set((side * PAGE_W) / 2, 0.02, 0);
    stack.castShadow = true;
    stack.receiveShadow = true;
    book.add(stack);
    // Individual uneven fore-edges remain visible below the moving sheet.
    const edgeLines = [],
      random = seededRandom(side + 8);
    for (let i = 0; i < 24; i++) {
      const y = -0.033 + i * 0.0046,
        reach = PAGE_W - 0.014 - random() * 0.009;
      edgeLines.push(
        0,
        y,
        PAGE_H / 2 - 0.004,
        side * reach,
        y,
        PAGE_H / 2 - 0.004,
        side * reach,
        y,
        PAGE_H / 2 - 0.004,
        side * reach,
        y,
        -PAGE_H / 2 + 0.004,
      );
    }
    const linesGeometry = trackGeometry(new THREE.BufferGeometry());
    linesGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(edgeLines, 3),
    );
    const linesMaterial = trackMaterial(
      new THREE.LineBasicMaterial({
        color: 0x73634b,
        transparent: true,
        opacity: 0.27,
      }),
    );
    book.add(new THREE.LineSegments(linesGeometry, linesMaterial));
  }
  const spine = new THREE.Mesh(
    trackGeometry(new THREE.CylinderGeometry(0.087, 0.087, PAGE_H + 0.2, 20)),
    coverMaterial,
  );
  spine.rotation.x = Math.PI / 2;
  spine.position.y = -0.041;
  spine.castShadow = true;
  book.add(spine);
  const ribbon = new THREE.Mesh(
    trackGeometry(new THREE.PlaneGeometry(0.095, 0.74, 1, 8)),
    trackMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x972920,
        roughness: 0.9,
        side: THREE.DoubleSide,
      }),
    ),
  );
  ribbon.rotation.x = -Math.PI / 2;
  ribbon.rotation.z = -0.08;
  ribbon.position.set(-0.19, -0.045, PAGE_H / 2 + 0.18);
  ribbon.castShadow = true;
  book.add(ribbon);

  const sheets = [];
  let introMesh;
  function paperMaterial(map, side = THREE.FrontSide) {
    return trackMaterial(
      new THREE.MeshStandardMaterial({
        map,
        side,
        color: 0xffffff,
        roughness: 0.93,
        metalness: 0,
        bumpMap: grain,
        bumpScale: 0.004,
      }),
    );
  }
  function makeSheet(frontTexture, backTexture, index, fixedTurn = null) {
    const geometry = trackGeometry(pageGeometry());
    const front = new THREE.Mesh(geometry, paperMaterial(frontTexture));
    front.castShadow = true;
    front.receiveShadow = true;
    front.frustumCulled = false;
    book.add(front);
    let back;
    if (backTexture) {
      back = new THREE.Mesh(
        geometry,
        paperMaterial(backTexture, THREE.BackSide),
      );
      back.receiveShadow = true;
      back.castShadow = false;
      back.frustumCulled = false;
      book.add(back);
    }
    if (fixedTurn === null) {
      const outlineIndices = [];
      for (let i = 0; i < SEG_X; i++) {
        outlineIndices.push(
          i,
          i + 1,
          SEG_Z * (SEG_X + 1) + i,
          SEG_Z * (SEG_X + 1) + i + 1,
        );
      }
      for (let j = 0; j < SEG_Z; j++)
        outlineIndices.push(
          j * (SEG_X + 1) + SEG_X,
          (j + 1) * (SEG_X + 1) + SEG_X,
        );
      const outlineGeometry = trackGeometry(new THREE.BufferGeometry());
      outlineGeometry.setAttribute("position", geometry.attributes.position);
      outlineGeometry.setIndex(outlineIndices);
      const outline = new THREE.LineSegments(
        outlineGeometry,
        trackMaterial(
          new THREE.LineBasicMaterial({
            color: 0xc3bba9,
            transparent: true,
            opacity: 0.36,
          }),
        ),
      );
      outline.frustumCulled = false;
      book.add(outline);
    }
    const sheet = { geometry, front, back, index, lastTurn: -1 };
    if (fixedTurn !== null) bendSheet(geometry, fixedTurn, index);
    else sheets.push(sheet);
    return front;
  }

  function resize() {
    if (disposed) return;
    const rect = container.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const aspect = rect.width / rect.height;
    const viewHeight = Math.max(3.25, 4.9 / aspect);
    camera.left = (-viewHeight * aspect) / 2;
    camera.right = (viewHeight * aspect) / 2;
    camera.top = viewHeight / 2;
    camera.bottom = -viewHeight / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(rect.width, rect.height, false);
    requestRender();
  }
  function scrollProgress() {
    const rect = section.getBoundingClientRect();
    return (
      clamp(
        -rect.top / Math.max(1, section.offsetHeight - window.innerHeight),
        0,
        1,
      ) * 3
    );
  }
  function emitPage() {
    const index = clamp(Math.round(current), 0, 3);
    if (index !== selected) {
      selected = index;
      container.dataset.bookPage = String(index);
      onPageChange(index);
    }
  }
  function draw(time = performance.now()) {
    frame = 0;
    if (disposed || !ready || contextLost || !visible || document.hidden)
      return;
    const delta = Math.min((time - (lastTime || time)) / 1000, 0.05);
    lastTime = time;
    const difference = target - current;
    current = reduced
      ? Math.round(target)
      : Math.abs(difference) < 0.0005
        ? target
        : current + difference * (1 - Math.exp(-delta * 9.5));
    for (const sheet of sheets) {
      const turn = clamp(current - sheet.index, 0, 1);
      if (Math.abs(turn - sheet.lastTurn) > 0.00001) {
        bendSheet(sheet.geometry, turn, sheet.index);
        sheet.lastTurn = turn;
      }
    }
    book.rotation.y = reduced ? -0.055 : -0.055 + (current / 3) * 0.11;
    renderer.shadowMap.needsUpdate = true;
    renderer.render(scene, camera);
    container.classList.add("book-is-ready");
    container.classList.remove("book-is-fallback");
    emitPage();
    if (Math.abs(target - current) > 0.0005 && !reduced) requestRender();
  }
  function requestRender() {
    if (
      !frame &&
      ready &&
      visible &&
      !disposed &&
      !contextLost &&
      !document.hidden
    )
      frame = requestAnimationFrame(draw);
  }
  function onScroll() {
    if (Math.abs(window.scrollY - lastScrollY) > 2) manual = false;
    lastScrollY = window.scrollY;
    if (!manual) target = scrollProgress();
    requestRender();
  }
  function onVisibility() {
    lastTime = 0;
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else requestRender();
  }
  function onContextLost(event) {
    event.preventDefault();
    contextLost = true;
    cancelAnimationFrame(frame);
    frame = 0;
    showFallback(selected < 0 ? 0 : selected);
  }
  function onContextRestored() {
    contextLost = false;
    lastTime = 0;
    requestRender();
  }
  canvas.addEventListener("webglcontextlost", onContextLost);
  canvas.addEventListener("webglcontextrestored", onContextRestored);
  const intersection = new IntersectionObserver(
    (entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      lastTime = 0;
      if (visible) {
        if (!manual) target = scrollProgress();
        requestRender();
      } else {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    },
    { rootMargin: "120px" },
  );
  intersection.observe(container);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);
  resize();

  function destroy() {
    disposed = true;
    cancelAnimationFrame(frame);
    intersection.disconnect();
    resizeObserver.disconnect();
    window.removeEventListener("scroll", onScroll);
    document.removeEventListener("visibilitychange", onVisibility);
    canvas.removeEventListener("webglcontextlost", onContextLost);
    canvas.removeEventListener("webglcontextrestored", onContextRestored);
    textures.forEach((texture) => texture.dispose());
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    key.shadow.map?.dispose();
    renderer.dispose();
    canvas.remove();
    container.classList.remove("book-is-ready");
  }

  try {
    const loadImage = async (path) => {
      const image = new Image();
      image.decoding = "async";
      image.src = path;
      await image.decode();
      return image;
    };
    // Decorative media and fonts are optional. The four original flashes remain usable.
    const material = (name) => loadImage(`/images/materials/${name}.webp`).catch(() => null);
    const [image, collage, paper, masking, black] = await Promise.all([
      loadImage("/images/flash-sheet.webp"),
      material("sketchbook-collage"),
      material("torn-paper"),
      material("masking-tape"),
      material("black-tape"),
      Promise.allSettled([
        document.fonts.load('400 48px "Bowlby One SC"'),
        document.fonts.load("700 16px Raleway"),
        document.fonts.load("400 27px Marker"),
      ]),
    ]);
    if (disposed) return noop;
    const printMaterials = { paper, masking, black, surface: makePaperSurface(paper) };
    const fronts = TITLES.map((_, index) =>
      trackTexture(makePageTexture(image, index, printMaterials)),
    );
    const backs = STUDIES.map((_, index) =>
      trackTexture(makePageTexture(image, index, printMaterials, true)),
    );
    const intro = trackTexture(makeIntroTexture(collage));
    introMesh = makeSheet(fronts[0], intro, 0, 1);
    introMesh.position.y = -0.046;
    // The exposed underside of the intro belongs to the same geometry.
    book.children[book.children.length - 1].position.y = -0.046;
    makeSheet(fronts[3], null, 3, 0).position.y = -0.018;
    for (let i = 2; i >= 0; i--) makeSheet(fronts[i], backs[i], i);
    ready = true;
    target = scrollProgress();
    current = reduced ? Math.round(target) : target;
    requestRender();
  } catch {
    destroy();
    showFallback();
    return { ...noop, setPage: showFallback };
  }

  return {
    setPage(index) {
      const next = clamp(Math.round(Number(index) || 0), 0, 3);
      if (contextLost) {
        showFallback(next);
        return;
      }
      manual = true;
      target = next;
      lastScrollY = window.scrollY;
      lastTime = 0;
      requestRender();
    },
    setReducedMotion(value) {
      reduced = Boolean(value);
      lastTime = 0;
      requestRender();
    },
    destroy,
  };
}
