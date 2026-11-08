const asset = (path) => `${import.meta.env.BASE_URL}${path}`;
const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const chapters = [0, .25, .5, .75, 1];
const chapterPhotos = [
  [
    "studio-poster.webp",
    "Interior del estudio con el sillón, la lámpara articulada y la pared de bocetos.",
  ],
  [
    "studio-maquina.webp",
    "Máquina de bobinas con bastidor negro calado, grip de acero moleteado y boquilla abierta sobre el carro de instrumental.",
  ],
  [
    "studio-ritual.webp",
    "Mesa de preparación con pinzas, cartuchos en sus envoltorios, algodón y dispensadores.",
  ],
  [
    "studio-sillon.webp",
    "Sillón de tatuaje con reposabrazos regulables, cuero cosido y base hidráulica.",
  ],
  [
    "studio-pieza.webp",
    "Fotografías conceptuales de tatuajes impresas y sujetas con pinzas sobre la repisa de dibujo.",
  ],
];

function chapterAt(progress) {
  return Math.min(chapters.length - 1, Math.round(progress * (chapters.length - 1)));
}

function announceChapter(container, section, buttons, chapter) {
  section.dataset.studioChapter = String(chapter);
  buttons.forEach((button, index) => {
    button.classList.toggle("active", index === chapter);
    button.setAttribute("aria-pressed", String(index === chapter));
  });
  container.dispatchEvent(
    new CustomEvent("studiochapter", { detail: { chapter }, bubbles: true }),
  );
}

function initPhotoTour(
  container,
  section,
  buttons,
  reducedMotion,
  initialChapter = 0,
) {
  const photo = container.querySelector(".studio-fallback");
  let reduced = Boolean(reducedMotion);
  let chapter = -1;
  let frame = 0;
  container.classList.remove("is-ready");
  container.classList.add("is-fallback");
  container.setAttribute("aria-busy", "false");

  function show(index) {
    if (index === chapter) return;
    chapter = index;
    if (photo) {
      const [file, description] = chapterPhotos[index];
      photo.src = asset(`models/${file}`);
      photo.alt = description;
    }
    announceChapter(container, section, buttons, index);
  }

  function syncScroll() {
    frame = 0;
    const travel = section.offsetHeight - innerHeight;
    // With reduced motion the section can collapse to one viewport. Its five
    // buttons continue to work without forcing visitors to scroll the page.
    if (travel > 100)
      show(
        chapterAt(clamp(-section.getBoundingClientRect().top / travel, 0, 1)),
      );
  }

  function queueScroll() {
    if (!frame) frame = requestAnimationFrame(syncScroll);
  }

  const handlers = buttons.map((button, index) => {
    const select = () => {
      show(index);
      const travel = section.offsetHeight - innerHeight;
      if (travel > 100) {
        const top =
          section.getBoundingClientRect().top +
          scrollY +
          chapters[index] * travel;
        window.scrollTo({ top, behavior: reduced ? "instant" : "smooth" });
      }
    };
    button.addEventListener("click", select);
    return select;
  });
  show(initialChapter);
  syncScroll();
  window.addEventListener("scroll", queueScroll, { passive: true });
  window.addEventListener("resize", queueScroll);
  return {
    get chapter() {
      return chapter;
    },
    setReducedMotion(value) {
      reduced = Boolean(value);
      queueScroll();
    },
    destroy() {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", queueScroll);
      window.removeEventListener("resize", queueScroll);
      buttons.forEach((button, index) =>
        button.removeEventListener("click", handlers[index]),
      );
    },
  };
}
// Human-height interior route; intermediate points clear the chair and lamp.
const positions = [
  [2.55, 1.76, 3.90],
  [.75, 1.82, 1.97],
  [-1.46, 1.439, .14],
  [-.15, 2.20, .91],
  [2.28, 1.59, -.44],
  [2.06, 1.75, 1.10],
  [1.92, 1.57, 2.68],
  [.03, 1.80, 1.83],
  [-.82, 1.65, .65],
];
const targets = [
  [-.32, 1.30, -.46],
  [-1.37, 1.22, -.34],
  [-1.62, 1.246, -.36],
  [.17, 1.18, -.36],
  [1.62, 1.21, -1.43],
  [.93, 1.17, -.18],
  [.34, 1.20, .04],
  [-.83, 1.51, -.18],
  [-2.40, 1.68, .06],
];
const fieldsOfView = [38, 43, 27, 43, 36, 42, 40, 44, 35];

/** Load once, render on demand, and leave the editorial poster as a real fallback. */
export async function initStudio(container, { reducedMotion = false } = {}) {
  if (!container) return { setReducedMotion() {}, destroy() {} };
  const section = container.closest("#estudio") || container.parentElement;
  container.setAttribute("aria-busy", "true");
  const buttons = [...section.querySelectorAll("[data-scene]")];
  const smallTouchScreen = window.matchMedia?.("(max-width: 740px)").matches;
  if (smallTouchScreen || navigator.connection?.saveData || navigator.deviceMemory <= 3) {
    return initPhotoTour(container, section, buttons, reducedMotion);
  }
  // Avoid downloading the engine and its decoder on the lightweight path.
  let THREE, GLTFLoader, DRACOLoader, RoomEnvironment;
  let renderer;
  try {
    [THREE, {GLTFLoader}, {DRACOLoader}, {RoomEnvironment}] = await Promise.all([
      import("three"),
      import("three/addons/loaders/GLTFLoader.js"),
      import("three/addons/loaders/DRACOLoader.js"),
      import("three/addons/environments/RoomEnvironment.js"),
    ]);
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: devicePixelRatio < 2,
      powerPreference: "low-power",
    });
  } catch {
    return initPhotoTour(container, section, buttons, reducedMotion);
  }

  let disposed = false;
  let ready = false;
  let visible = false;
  let frame = 0;
  let targetProgress = 0;
  let currentProgress = 0;
  let lastTime = 0;
  let reduced = reducedMotion;
  let activeChapter = -1;
  let pointerX = 0;
  let pointerY = 0;
  let currentX = 0;
  let currentY = 0;
  let manualProgress = null;
  let photoTour = null;
  const modelScene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 1, 0.025, 35);
  const positionCurve = new THREE.CatmullRomCurve3(
    positions.map((p) => new THREE.Vector3(...p)),
    false,
    "centripetal",
    0.35,
  );
  const targetCurve = new THREE.CatmullRomCurve3(
    targets.map((p) => new THREE.Vector3(...p)),
    false,
    "centripetal",
    0.35,
  );
  const draco = new DRACOLoader();
  draco.setDecoderPath(asset("models/draco/"));
  draco.setDecoderConfig({ type: "wasm" });
  draco.setWorkerLimit(1);
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);

  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .98;
  renderer.shadowMap.enabled = true;
  // Room geometry and lights stay still. Camera motion needs no shadow redraw.
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;";
  container.append(canvas);

  const environment = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envTarget = environment.fromScene(room, 0.035);
  modelScene.environment = envTarget.texture;
  modelScene.environmentIntensity = .34;
  room.dispose();
  environment.dispose();
  modelScene.add(new THREE.HemisphereLight(0xcddafa, 0x18120d, .43));
  const key = new THREE.DirectionalLight(0xffd7b0, 1.8);
  key.position.set(-1.65, 4.85, 3.2);
  key.castShadow = true;
  key.shadow.mapSize.set(
    innerWidth > 900 ? 2048 : 1024,
    innerWidth > 900 ? 2048 : 1024,
  );
  Object.assign(key.shadow.camera, {
    left: -4,
    right: 4,
    top: 4,
    bottom: -4,
    near: 0.5,
    far: 18,
  });
  key.shadow.normalBias = .008;
  key.shadow.bias = -.00012;
  modelScene.add(key);
  const fill = new THREE.DirectionalLight(0xacc6ee, .76);
  fill.position.set(3.6, 2.5, 2.6);
  modelScene.add(fill);
  const neon = new THREE.PointLight(0xff1708, 5.2, 4, 2);
  neon.position.set(0.1, 2.5, -1.35);
  modelScene.add(neon);
  const task = new THREE.PointLight(0xffdd99, 2.5, 3, 2);
  task.position.set(0.58, 1.95, -0.02);
  modelScene.add(task);
  const overhead = new THREE.PointLight(0xffc58c, 5.8, 5, 2);
  overhead.position.set(0, 2.56, -0.6);
  modelScene.add(overhead);
  const detail = new THREE.PointLight(0xd5e4fc, 2.35, 2, 2);
  detail.position.set(-1.30, 1.95, -.55);
  modelScene.add(detail);
  const archive = new THREE.PointLight(0xffd09c, 2.9, 2.5, 2);
  archive.position.set(-1.55, 2.32, .32);
  modelScene.add(archive);

  const position = new THREE.Vector3();
  const target = new THREE.Vector3();

  function setCamera(progress) {
    positionCurve.getPoint(clamp(progress, 0, 1), position);
    targetCurve.getPoint(clamp(progress, 0, 1), target);
    const segments = positions.length - 1;
    const segment = Math.min(Math.floor(progress * segments), segments - 1);
    const t = clamp(progress * segments - segment, 0, 1);
    const smooth = t * t * (3 - 2 * t);
    const fov = THREE.MathUtils.lerp(
      fieldsOfView[segment],
      fieldsOfView[segment + 1],
      smooth,
    );
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    const fit = Math.max(1, 0.9 / camera.aspect);
    position.sub(target).multiplyScalar(fit).add(target);
    position.x += currentX * 0.035;
    position.y += currentY * 0.025;
    camera.position.copy(position);
    camera.lookAt(target);
    const chapter = chapterAt(progress);
    if (chapter !== activeChapter) {
      activeChapter = chapter;
      announceChapter(container, section, buttons, chapter);
    }
  }

  function requestRender() {
    if (
      !disposed &&
      !photoTour &&
      ready &&
      visible &&
      !document.hidden &&
      !frame
    )
      frame = requestAnimationFrame(render);
  }

  function render(time) {
    frame = 0;
    if (disposed || photoTour || !visible || document.hidden || !ready) return;
    const dt = Math.min((time - (lastTime || time - 16)) / 1000, 0.05);
    lastTime = time;
    const smoothing = reduced ? 1 : 1 - Math.exp(-dt * 7);
    currentProgress += (targetProgress - currentProgress) * smoothing;
    currentX += (pointerX - currentX) * smoothing;
    currentY += (pointerY - currentY) * smoothing;
    setCamera(currentProgress);
    renderer.render(modelScene, camera);
    if (!container.classList.contains("is-ready"))
      container.classList.add("is-ready");
    const moving =
      Math.abs(targetProgress - currentProgress) > 0.0001 ||
      Math.abs(pointerX - currentX) > 0.001 ||
      Math.abs(pointerY - currentY) > 0.001;
    if (moving && !reduced) requestRender();
  }

  function updateProgress() {
    if (reduced) targetProgress = manualProgress ?? 0;
    else {
      const rect = section.getBoundingClientRect();
      const travel = section.offsetHeight - innerHeight;
      targetProgress =
        travel > 100 ? clamp(-rect.top / travel, 0, 1) : (manualProgress ?? 0);
    }
    requestRender();
  }

  function resize() {
    if (disposed) return;
    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    updateProgress();
  }

  function pointerMove(event) {
    if (reduced || event.pointerType === "touch") return;
    const rect = container.getBoundingClientRect();
    pointerX = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
    pointerY = clamp(
      -(((event.clientY - rect.top) / rect.height) * 2 - 1),
      -1,
      1,
    );
    requestRender();
  }

  function pointerLeave() {
    pointerX = pointerY = 0;
    requestRender();
  }
  function visibilityChange() {
    if (!document.hidden) {
      lastTime = 0;
      requestRender();
    }
  }
  function contextLost(event) {
    event.preventDefault();
    if (disposed || photoTour) return;
    if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    canvas.style.visibility = "hidden";
    photoTour = initPhotoTour(
      container,
      section,
      buttons,
      reduced,
      Math.max(0, activeChapter),
    );
  }
  function contextRestored() {
    if (!photoTour || disposed) return;
    manualProgress = chapters[photoTour.chapter];
    currentProgress = manualProgress;
    activeChapter = -1;
    photoTour.destroy();
    photoTour = null;
    container.classList.remove("is-fallback");
    canvas.style.visibility = "";
    renderer.shadowMap.needsUpdate = true;
    lastTime = 0;
    updateProgress();
  }

  const buttonHandlers = buttons.map((button, index) => {
    const handler = () => {
      if (photoTour) return;
      manualProgress = chapters[index] ?? 0;
      targetProgress = manualProgress;
      const travel = section.offsetHeight - innerHeight;
      if (!reduced && travel > 100) {
        const top =
          section.getBoundingClientRect().top +
          scrollY +
          manualProgress * travel;
        window.scrollTo({ top, behavior: "smooth" });
      }
      requestRender();
    };
    button.addEventListener("click", handler);
    return handler;
  });

  const observer = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      if (visible) {
        lastTime = 0;
        updateProgress();
      } else if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    },
    { rootMargin: "80px" },
  );
  observer.observe(container);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  window.addEventListener("scroll", updateProgress, { passive: true });
  container.addEventListener("pointermove", pointerMove, { passive: true });
  container.addEventListener("pointerleave", pointerLeave);
  document.addEventListener("visibilitychange", visibilityChange);
  canvas.addEventListener("webglcontextlost", contextLost);
  canvas.addEventListener("webglcontextrestored", contextRestored);
  resize();

  const api = {
    setReducedMotion(value) {
      reduced = Boolean(value);
      photoTour?.setReducedMotion(reduced);
      pointerX = pointerY = 0;
      manualProgress = null;
      updateProgress();
    },
    destroy() {
      disposed = true;
      photoTour?.destroy();
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("scroll", updateProgress);
      container.removeEventListener("pointermove", pointerMove);
      container.removeEventListener("pointerleave", pointerLeave);
      document.removeEventListener("visibilitychange", visibilityChange);
      canvas.removeEventListener("webglcontextlost", contextLost);
      canvas.removeEventListener("webglcontextrestored", contextRestored);
      buttons.forEach((button, index) =>
        button.removeEventListener("click", buttonHandlers[index]),
      );
      const textures = new Set();
      const ownedMaterials = new Set();
      modelScene.traverse((object) => {
        object.geometry?.dispose();
        const materials = object.material
          ? Array.isArray(object.material)
            ? object.material
            : [object.material]
          : [];
        for (const material of materials) {
          ownedMaterials.add(material);
          for (const item of Object.values(material)) if (item?.isTexture) textures.add(item);
        }
      });
      textures.forEach(texture => { texture.source?.data?.close?.(); texture.dispose(); });
      ownedMaterials.forEach(material => material.dispose());
      envTarget.dispose();
      key.shadow.dispose();
      draco.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };

  try {
    const gltf = await loader.loadAsync(asset("models/studio.glb"), (event) => {
      if (event.total)
        container.dataset.loadProgress = String(
          Math.round((event.loaded / event.total) * 100),
        );
    });
    if (disposed) return api;
    gltf.scene.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
        if (object.material?.name?.includes("neon")) object.castShadow = false;
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        materials.forEach((material) => {
          for (const name of [
            "map",
            "normalMap",
            "roughnessMap",
            "metalnessMap",
          ]) {
            if (material?.[name])
              material[name].anisotropy = Math.min(
                4,
                renderer.capabilities.getMaxAnisotropy(),
              );
          }
        });
      }
    });
    modelScene.add(gltf.scene);
    ready = true;
    container.setAttribute("aria-busy", "false");
    resize();
    requestRender();
  } catch (error) {
    console.warn("Se ha activado el recorrido fotográfico del estudio.", error);
    api.destroy();
    return initPhotoTour(
      container,
      section,
      buttons,
      reduced,
      Math.max(0, activeChapter),
    );
  }
  return api;
}
