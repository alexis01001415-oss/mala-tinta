# Iteración 3 · Mala Tinta

## Cambios entregados

Hero centrado sobre un degradado oscuro con ruido fino animado. Dos anotaciones de papel en posición absoluta. Manifiesto fijo con palabras grandes que se iluminan progresivamente; las anotaciones no interrumpen la lectura. Se conserva el personaje y su mirada al cursor.

Preloader de marca con máscaras SVG, trazos y salida GSAP, sin porcentaje ni barra. Aparece en cada entrada al inicio y dispone de salida manual, Escape y límite independiente de cuatro segundos. Los enlaces profundos y el modo de movimiento reducido lo omiten.

Galería de cuatro estilos con fotografías generadas y cuatro variantes de cinta. En escritorio amplio, el scroll vertical recorre la galería horizontal; en móvil se desliza directamente. Botones con el mismo efecto de tinta del hero. El botón del formulario permanece recto.

El sketchbook abre desde una sola portada, pasa hojas deformables con referencias, dibujos y notas, y cierra mostrando la contraportada con el retrato del artista ficticio Nico Cruz. El libro termina a la izquierda y la presentación aparece a la derecha. No hay contadores ni controles de página. En móvil se apilan; en movimiento reducido se muestra una galería estática.

Proceso y cuidados usan secuencias de fotografías que se retiran al hacer scroll. Hay dieciséis preguntas frecuentes y un footer nuevo con tarjeta pegada y enlaces útiles. El menú incorpora imágenes editoriales y montajes de cinta distintos.

## Estudio 3D

Se utilizó Blender MCP para construir e inspeccionar la escena y Blender en segundo plano para exportar y renderizar. El sillón tiene almohadillas modeladas, bordes cosidos, apoyos regulables, cilindro hidráulico, soportes y tornillería. La lámpara tiene pivotes, brazos, resortes, reflector interior y pantalla exterior separada. Se detallaron máquina de bobinas, grip moleteado, contacto roscado, resortes, botellas y agrupaciones de agujas. Fotografías conceptuales sustituyen los dibujos de los cuadros.

La escena editable y sus marcadores de cámara están en `blender/studio.blend`. Generación principal: `blender/build_studio.py`; mobiliario: `blender/furniture.py`; herramientas: `blender/equipment.py`. `blender/refine_export.py` contiene la corrección puntual del reflector sobre la escena guardada.

El GLB final ocupa **3,280,920 bytes** y contiene geometría Draco y catorce mapas WebP. Three.js se carga al aproximarse a las escenas; el estudio usa renders alternativos en pantallas pequeñas y condiciones de ahorro de recursos. La cámara sigue nueve puntos y cinco capítulos. El aspecto WebGL se adapta a tiempo real; no es idéntico a los renders Cycles.

## Verificación

- Compilación Vite y validación de referencias para `/` y `/mala-tinta/`.
- Revisión de hero, manifiesto, galería horizontal, apertura/cierre del libro y presentación del artista en navegador a 1280 × 720.
- Revisión del hero y formulario a 390 × 844, sin desbordamiento horizontal observado.
- Formulario: selección, validación y apertura del resumen local con los valores de prueba. No transmite datos.
- Preloader observado con logo SVG y salida al hero.
- Modo de movimiento reducido: contenido continuo y galería del libro accesible.
- Se corrigieron estructura HTML truncada, medición anticipada del espacio del libro y permiso CSP para las texturas blob locales del GLB.

No se ha obtenido una puntuación Lighthouse ni una certificación de accesibilidad. El prototipo conserva `noindex`, imágenes ilustrativas y perfil ficticio; los datos reales del estudio y un canal de reservas siguen siendo necesarios para uso comercial.

## Referencias

La revisión editorial está en `docs/v3-references.md`. Para el mobiliario se consultó el [catálogo de sillas Kwadron](https://www.kwadron.pl/en/chairs) y las proporciones del [modelo KW400](https://www.kwadron.pl/pt/8898-professional-hydraulic-tattoo-chair-v2.html). Se produjo geometría original, sin atribuir afiliación al fabricante. Las referencias visuales aportadas por el usuario guiaron equipo, papel y montaje.
