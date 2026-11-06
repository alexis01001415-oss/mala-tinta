# Mala Tinta

Prototipo de un estudio de tatuajes: dirección oscura, rojo intenso, papel y texturas, titulares Bowlby One SC, texto Raleway y anotaciones Permanent Marker. Incluye recorrido interior en Three.js, estudio PBR creado en Blender, personaje con mirada reactiva, libreta 3D de flash, animación de scroll con GSAP, preguntas frecuentes y un resumen descargable de la idea del visitante.

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

## Archivos principales

| Ruta | Contenido |
| --- | --- |
| `index.html` | Contenido semántico, navegación, formulario y diálogos |
| `src/dark.css` + `src/edition.css` | Base visual y nueva dirección editorial responsive |
| `src/navigation.js` + `src/navigation.css` | Header fijo, menú GSAP y fotos |
| `public/press-boot.*` + `src/press-intro.js` | Preloader acotado, salida segura y entrada del hero |
| `src/main.js` | Interacciones, accesibilidad, carga diferida y formulario local |
| `src/studio.js` | Cámara interior, iluminación PBR y carga Draco |
| `src/sketchbook.js` | Libreta con hojas curvas y control por scroll/botones |
| `blender/` | Escena editable, generación reproducible y texturas |
| `docs/references.md` | Investigación y capturas de las seis referencias |
| `docs/asset-prompts.md` | Procedencia y prompts de las imágenes generadas |
| `docs/launch-checklist.md` | Preparación para un estudio real y su dominio |

`src/style.css` y `blender/build_studio_v1.py` conservan la primera propuesta; la entrada actual importa `dark.css`. El sitio ofrece reducción de movimiento, controles de teclado y póster alternativo cuando el recorrido 3D no está disponible. Esto no equivale a una certificación de accesibilidad ni a una puntuación de rendimiento.

## Procedencia y licencias

- Geometría del estudio y máquinas: modelado propio del proyecto en Blender. La máquina de bobinas tiene bastidor, bobinas, resortes, tornillería y grip; no es un modelo descargado de Sketchfab.
- Cuero, madera y pared: texturas de Poly Haven, CC0; autores y enlaces en [blender/README.md](blender/README.md) y `blender/texture-sources.json`.
- Personaje, flash e imagen de trabajo: generados con la herramienta integrada ImageGen; no son testimonios ni trabajos de clientes reales. La fotografía adjunta por el usuario sirve como referencia visual.
- Bowlby One SC y Raleway: OFL-1.1; Permanent Marker: Apache-2.0. Se sirven localmente mediante Fontsource. Conservar sus avisos de licencia al redistribuir.
- Material Symbols Outlined: subset local de 19 iconos, 3,612 bytes, obtenido de la API oficial de Google Fonts. Usa Apache-2.0 según la [documentación de Google](https://developers.google.com/fonts/docs/material_symbols). Procedencia en `public/fonts/material-symbols-source.txt`; licencia en `public/fonts/LICENSE-Apache-2.0.txt`. El paquete antiguo de Fontsource permanece instalado, pero la hoja de estilo actual usa el subset local.
- Three.js y Vite: MIT; Draco: Apache-2.0, licencia incluida en `public/models/draco/LICENSE`. GSAP utiliza su [licencia estándar propia](https://gsap.com/standard-license/), no MIT. Las versiones reproducibles están fijadas en `package-lock.json`.

La demo conserva `noindex` hasta contar con identidad, ubicación y contenidos reales. `robots.txt` permite el rastreo (`Allow: /`) para que los buscadores puedan leer esa instrucción cuando la página sea accesible. No se prometen primeros puestos en Google, presencia en respuestas de IA ni métricas Lighthouse sin medir el despliegue final.

La iteración de noviembre de 2026 está documentada en [docs/iteration-2.md](docs/iteration-2.md). Las reglas activas de titulares son interletraje de 1.5 px e interlineado 1.2; el cuerpo mantiene Raleway, interletraje de 1.5 px e interlineado 1.4.
