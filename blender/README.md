# Estudio PBR de Mala Tinta

Escena conceptual creada con Blender 5.1.1. `studio.blend` es editable y `build_studio.py` reconstruye la geometría, asigna materiales, exporta y renderiza. La versión actual usa materiales PBR de cuero, madera y pared, iluminación cálida y neón rojo; la cámara web recorre el interior a altura humana.

La geometría es propia: sillón hidráulico con tapizado y costuras, banco con ruedas, carro metálico, tintas, cápsulas, lámpara articulada, mobiliario, láminas y dos máquinas. La máquina de bobinas tiene bastidor abierto, bobinas esmaltadas negras, contactos de latón, resortes, tornillería, grip ranurado y cable; la segunda es de tipo pen. El modelado no acredita prácticas sanitarias de un establecimiento real.

## Archivos y regeneración

- `public/models/studio.glb`: glTF 2.0 con geometría Draco y mapas WebP incrustados (`EXT_texture_webp`).
- `studio-source.glb`: respaldo del GLB anterior a la conversión de texturas a WebP.
- `public/models/studio-poster.webp`: vista estática para carga y fallback.
- `studio-poster.png`, `machine-closeup.png`, `chair-closeup.png`: renders de inspección.
- `textures/` y `texture-sources.json`: mapas de origen y registro de procedencia.
- `build_studio_v1.py`: primera versión conservada; no es el generador actual.

Desde la raíz, con las dependencias npm instaladas:

```powershell
# Solo si faltan los mapas locales; requiere conexión a Poly Haven.
node blender/download-textures.mjs
# Generar el atlas propio de etiquetas.
node blender/make-labels.mjs
# Ajustar la ruta al ejecutable de Blender instalado.
& 'C:/Program Files/Blender Foundation/Blender 5.1/blender.exe' --background --factory-startup --python blender/build_studio.py
node blender/optimize-glb.mjs

```

La reconstrucción reemplaza los archivos generados; guardar aparte cualquier edición manual de `studio.blend`. El exportador intenta usar Draco y puede producir un GLB sin compresión si el encoder falla: revisar el registro antes de publicar.

`src/studio.js` exporta `initStudio(container, { reducedMotion })` y devuelve `{ setReducedMotion, destroy }`. Usa la sección `#estudio`, sus botones `[data-scene]`, carga diferida, renderizado bajo demanda y pausa fuera de pantalla. El decoder Draco es local. La CSP debe permitir WebAssembly y workers `blob:`; revisar `public/_headers` y la respuesta del alojamiento.

## Texturas incorporadas

Todas proceden de Poly Haven y tienen [licencia CC0](https://polyhaven.com/license). Se conservan los créditos aunque CC0 no exija atribución.

| Material | Autoría registrada | Fuente |
| --- | --- | --- |
| Brown Leather | Rob Tuytel | [Activo](https://polyhaven.com/a/brown_leather) |
| Weathered Brown Planks | Dimitrios Savva, fotografía; Rico Cilliers, procesado | [Activo](https://polyhaven.com/a/weathered_brown_planks) |
| Plastered Wall 05 | Charlotte Baglioni | [Activo](https://polyhaven.com/a/plastered_wall_05) |

Se usan mapas de color, normal OpenGL y rugosidad a 1K. Las láminas derivan del flash conceptual generado para este proyecto. Draco incluye su licencia Apache-2.0 en `public/models/draco/LICENSE`.

## Modelo externo investigado, no incorporado

[Tattoo machine, de sayshong](https://sketchfab.com/3d-models/tattoo-machine-1a9ea4720b114946a8660d55d8bd1584), UID `1a9ea4720b114946a8660d55d8bd1584`, figura en el resultado oficial de Sketchfab con licencia **CC Attribution**. La consulta del 4 de noviembre de 2026 identificó el enlace y la licencia; la apertura directa respondió 403. No se descargó durante esta comprobación y no forma parte del generador ni del GLB actual. Antes de incorporarlo en otra versión, verificar la versión exacta de la licencia y conservar autor, enlace, licencia y cambios realizados.

## Iteración 2 — noviembre de 2026

`equipment.py`, ejecutado por el generador, añade el equipo torneado: botellas PET de hombro curvo y tapa estriada, etiquetas propias, máquina de bobinas con placa calada, grip moleteado, contactos, resortes y boquilla, carro negro de tres niveles con malla y ruedas con horquillas. La pared lateral incorpora cuatro hojas ligeramente curvadas, pinzas, lápices y repisa. Las UV de todas las láminas usan `UVMap` para conservar su impresión al consolidar las mallas.

El generador guarda primero el `.blend` por componentes, luego agrupa por material, exporta con Draco y renderiza cinco WebP de 1600 × 1000. La cámara editable tiene cinco marcadores en frames 1, 49, 97, 145 y 193. `optimize-glb.mjs` convierte los mapas incrustados a WebP. Resultado comprobado: 2,908,384 bytes, 21 primitivas, 112,603 triángulos, 11 imágenes. Las primitivas no equivalen a draw calls totales: las pasadas de sombras añaden trabajo.

El navegador dirige una curva de cámara de nueve puntos con cinco paradas: Taller, Máquina, Preparación, Sillón y Tu pieza. La iluminación web se recrea en Three.js; no es idéntica al render Cycles. Por debajo de 741 px, con ahorro de datos o poca memoria declarada, el estudio usa los cinco renders y conserva los controles y los textos. No descarga su GLB ni su decoder. El cuaderno sigue siendo una escena independiente de carga diferida.
