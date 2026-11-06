# Mala Tinta · Iteración 2

Implementación sobre la versión publicada, siguiendo `prompt_iteracion_estudio_tatuajes.md` y las referencias visuales suministradas. Noviembre de 2026.

## Cambios y dirección artística

- **Hero:** Bowlby One SC en gran formato, máscaras de entrada GSAP por líneas y golpe final de la nota. La imagen editorial existente se recompone con zonas de sombra, grano y bruma sutil; la atmósfera se pausa fuera de vista. La nota usa papel rasgado y cintas con transparencia real.
- **Header y menú:** solo marca, CTA solicitado y botón de menú. Posición fija, variante inicial transparente y variante con blur y grano tras scroll. Menú GSAP con máscara diagonal, secuencia tipográfica y salida inversa; fotografías impresas con cinta al enfocar o pasar por los enlaces. En móvil se suprime la previsualización fotográfica. Escape, recorrido de Tab y foco devuelto al destino.
- **Botones:** CTA claro en hero y rojo oscuro en header; dos manchas de tinta invaden la superficie al hover/foco. El rojo `#c80912` permite texto marfil `#efeee8` con contraste calculado de **5.16:1**, también usado para la selección global.
- **Manifiesto:** título centrado, párrafo editorial con revelado de palabras por scroll, dos etiquetas integradas y firma al margen. El texto permanece legible antes de su énfasis y las etiquetas no se desvanecen. Se eliminó el CTA de la sección.
- **Personaje:** texto a la izquierda y cabeza a la derecha en escritorio, dos notas físicas, mirada al cursor y acercamiento moderado por scroll. Composición vertical en móvil; se eliminó el CTA.
- **Preloader:** pequeña secuencia tipográfica GSAP, obturador rojo y salida hacia el H1. Sin porcentajes. Se omite en visitas repetidas de la sesión, enlaces profundos y movimiento reducido. Botón para omitir, Escape y una salida independiente tras 2.6 segundos si el módulo no responde.
- **Tipografía:** Bowlby One SC con espaciado 1.5 px e interlineado 1.2; Raleway con espaciado 1.5 px e interlineado 1.4. Fuentes locales, preload de la fuente del titular y escala adaptada a la anchura.
- **Cuaderno:** cubierta de collage original, impresos sujetos con cinta, reversos con estudios ampliados y notas de taller; se conserva la deformación continua de las hojas y los controles anterior/siguiente.

## Blender y recorrido

Se remodelaron la máquina de bobinas, los perfiles de las botellas, tapas, boquillas y etiquetas, y el carro negro de tres niveles. Se añadieron pinzas, láminas curvas, material de preparación y detalles de instrumental. Se reutilizan los materiales PBR de cuero, pared y madera con mapas de normal/rugosidad, las herramientas útiles y la arquitectura del taller.

Cinco capítulos relacionan los objetos con la visita: identidad del taller, precisión, preparación, trato humano y diseño propio. No se inventan certificaciones sanitarias ni experiencia de un negocio real. Nueve puntos de cámara enlazan los cinco encuadres. El archivo editable, el generador y cinco renders de Cycles se conservan en el proyecto.

Durante QA se corrigió un fallo de las UV de la nueva galería: la consolidación por materiales dejaba las hojas sin su imagen. Se normalizó el nombre de UV y se regeneraron modelo y renders; la escena web final muestra las cuatro ilustraciones.

## Optimización

- GLB: **2,908,384 bytes**, antes 3,835,072 bytes; reducción aproximada del **24%** pese al nuevo equipo.
- 21 primitivas, 112,603 triángulos, 11 mapas incrustados WebP. Compresión Draco; decoder local.
- Render del estudio bajo demanda, pausa fuera de vista o pestaña oculta, sombras estáticas y ratio de píxeles limitado.
- Estudio móvil ≤740 px: cinco renders interactivos en lugar del GLB. También se aplica con ahorro de datos y baja memoria declarada. El cuaderno carga su propio motor cuando se aproxima a su sección.
- Papeles y cintas: 81,796 bytes en tres WebP con alpha; cubierta: 264,972 bytes.
- En ventanas horizontales de altura ≤600 px se desactiva el anclaje de las escenas para que los controles sigan alcanzándose con scroll normal.

## Validación realizada

- Compilación de Vite, comprobación de sintaxis de los cinco módulos y `git diff --check`.
- Inspección visual en navegador a 1440×960, 1280×720, 768×1024, 390×844, 320×740 y 844×390. No se detectaron desbordamientos horizontales ni titulares recortados por su ancho en esas medidas.
- Apertura/cierre de menú, fotos, navegación a secciones, Tab, Escape y restauración del foco.
- Primera visita del preloader, botón de salida, desaparición automática y omisión tras recarga. Comprobación aislada del script de inicio para visita inicial, repetida, movimiento reducido, enlace profundo y salida de seguridad.
- Cinco capítulos del estudio, GLB final con texturas, recorrido ligero móvil y selección de su último render.
- Cuaderno: cubierta, páginas, controles y correspondencia de título/contador/selección.
- Preferencia de movimiento reducido: textos completamente visibles, escenas sin anclaje y menú inmediato. Preferencia persistida localmente.
- FAQ y formulario local: se abre el resumen con los valores introducidos y se conserva la indicación de que no es una reserva.
- No se observaron errores ni advertencias de JavaScript en las vistas comprobadas. Capturas locales en `docs/qa/` (excluidas de Git).

## Límites concretos

Es un concepto sin dirección, contacto o redes de un establecimiento real; por eso no se añaden enlaces sociales ficticios y el formulario genera un resumen local. No se ha medido Lighthouse ni Web Vitals de campo y no se afirma un ranking de Google. Las medidas responsive son pruebas de viewport en Chromium, no certificación en todos los dispositivos. Los renders de Cycles y la iluminación WebGL difieren deliberadamente para equilibrar detalle y coste. Se mantiene el acceso privado existente y `noindex` hasta preparar la identidad y el lanzamiento del negocio.
