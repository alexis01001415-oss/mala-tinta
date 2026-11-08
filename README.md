# Mala Tinta

Prototipo de un estudio de tatuajes: dirección oscura, rojo intenso, papel y texturas, titulares Bowlby One SC, texto Raleway y anotaciones Permanent Marker. Incluye recorrido interior en Three.js, estudio PBR creado en Blender, personaje con mirada reactiva, sketchbook 3D, estilos en desplazamiento horizontal, secuencias de fotografías con GSAP, preguntas frecuentes y un resumen descargable de la idea del visitante.

**Es una marca conceptual.** No representa un establecimiento real, no agenda citas, no cobra anticipos y no envía el formulario a un servidor. El texto se procesa en el navegador; la preferencia de movimiento puede guardarse localmente. Las imágenes son ilustrativas.

## Desarrollo

Requiere Node.js 20.19+ o 22.12+ compatible con Vite 7 y npm. Desde esta carpeta:

```powershell
npm ci
npm run dev
```

Abrir la URL local impresa por Vite. Para compilar y revisar el resultado:

```powershell
npm run build
npm run preview
```

`dist/` contiene la salida estática; no publicar el servidor de desarrollo. `.openai/hosting.json` conserva la identidad del Site existente. `public/_headers` declara CSP y otras cabeceras: hay que comprobar que el alojamiento las aplique en sus respuestas HTTP.

## Publicación en GitHub Pages

El workflow [.github/workflows/pages.yml](.github/workflows/pages.yml) instala el lockfile, construye con la ruta real de Pages, valida los recursos y despliega el artefacto `dist/`. El repositorio debe tener GitHub Actions seleccionado como origen de Pages. La presencia del workflow por sí sola no confirma un despliegue: revisar su resultado y la URL devuelta por GitHub.

La base se configura con `VITE_BASE_PATH`; por ejemplo `/mala-tinta/` para un sitio de proyecto. [docs/github-pages.md](docs/github-pages.md) explica la configuración, las comprobaciones locales y los límites. GitHub Pages no aplica `public/_headers`: las políticas compatibles se declaran también mediante meta HTML, pero esto no reemplaza todas las cabeceras del servidor.

El formulario sigue siendo local y el prototipo conserva `noindex`. Una publicación pública permite revisar la demo; no la convierte en un sistema de reservas, no acredita prácticas sanitarias reales y no garantiza posicionamiento ni puntuaciones Lighthouse. Antes de utilizarlo para un negocio deben incorporarse datos reales, políticas apropiadas y el servicio de reservas elegido.

## Archivos principales

| Ruta | Contenido |
| --- | --- |
| `index.html` | Contenido semántico, navegación, formulario y diálogos |
| `src/dark.css` + `src/edition.css` | Base visual y nueva dirección editorial responsive |
| `src/navigation.js` + `src/navigation.css` | Header fijo, menú GSAP y fotos |
| `src/editorial-sections.js` + `src/editorial-sections.css` | Estilos horizontales, proceso, cuidados, FAQs y footer |
| `public/press-boot.*` + `src/press-intro.js` | Preloader acotado, salida segura y entrada del hero |
| `src/main.js` | Interacciones, accesibilidad, carga diferida y formulario local |
| `src/studio.js` | Cámara interior, iluminación PBR y carga Draco |
| `src/sketchbook.js` | Sketchbook con hojas curvas y narrativa por scroll |
| `blender/` | Escena editable, generación reproducible y texturas |
| `docs/references.md` | Investigación y capturas de las seis referencias |
| `docs/asset-prompts.md` | Procedencia y prompts de las imágenes generadas |
| `docs/launch-checklist.md` | Preparación para un estudio real y su dominio |
| `scripts/check-dist.mjs` | Validación de recursos, base de despliegue y enlaces internos |

`src/style.css` y `blender/build_studio_v1.py` conservan la primera propuesta; la entrada actual importa `dark.css`. El sitio ofrece reducción de movimiento, controles de teclado y póster alternativo cuando el recorrido 3D no está disponible. Esto no equivale a una certificación de accesibilidad ni a una puntuación de rendimiento.

## Procedencia y licencias

- Geometría del estudio y máquinas: modelado propio del proyecto en Blender. La máquina de bobinas tiene bastidor, bobinas, resortes, tornillería y grip; no es un modelo descargado de Sketchfab.
- Cuero, madera y pared: texturas de Poly Haven, CC0; autores y enlaces en [blender/README.md](blender/README.md) y `blender/texture-sources.json`.
- Personaje, bocetos, fotografías editoriales y retrato del artista ficticio: generados con la herramienta integrada ImageGen; no son testimonios ni trabajos de clientes reales. Las fotografías adjuntas por el usuario sirven como referencias visuales.
- Bowlby One SC y Raleway: OFL-1.1; Permanent Marker: Apache-2.0. Se sirven localmente mediante Fontsource. Conservar sus avisos de licencia al redistribuir.
- Material Symbols Outlined: subset local de 19 iconos, 3,612 bytes, obtenido de la API oficial de Google Fonts. Usa Apache-2.0 según la [documentación de Google](https://developers.google.com/fonts/docs/material_symbols). Procedencia en `public/fonts/material-symbols-source.txt`; licencia en `public/fonts/LICENSE-Apache-2.0.txt`. El paquete antiguo de Fontsource permanece instalado, pero la hoja de estilo actual usa el subset local.
- Three.js y Vite: MIT; Draco: Apache-2.0, licencia incluida en `public/models/draco/LICENSE`. GSAP utiliza su [licencia estándar propia](https://gsap.com/standard-license/), no MIT. Las versiones reproducibles están fijadas en `package-lock.json`.

La demo conserva `noindex` hasta contar con identidad, ubicación y contenidos reales. `robots.txt` permite el rastreo (`Allow: /`) para que los buscadores puedan leer esa instrucción cuando la página sea accesible. No se prometen primeros puestos en Google, presencia en respuestas de IA ni métricas Lighthouse sin medir el despliegue final.

Las fotografías WebP necesarias ya están en `public/images/editorial/`. El script opcional `scripts/prepare-editorial.mjs` acepta una carpeta de originales como argumento o mediante `MALA_TINTA_GENERATED_DIR`; no depende de una ruta personal y no se ejecuta durante la compilación. Puede usar originales nombrados `owner.png`, `blackwork.png`, etc., o los nombres originales de exportación registrados en el script.

La última iteración está documentada en [docs/iteration-3.md](docs/iteration-3.md), con cambios de composición, scroll, Blender y comprobaciones. La escala tipográfica y el espaciado se ajustan por sección y tamaño de pantalla.
