# Preparación para un estudio real

La versión actual es una demo conceptual sin reservas ni transmisión de formularios. Se conserva `noindex` para no presentar un negocio inventado en buscadores. Este documento registra trabajo pendiente de lanzamiento; no afirma que ya esté implementado ni medido.

## Identidad y conversión

- Confirmar nombre comercial, dominio, ciudad, dirección, teléfono, horario, artistas y enlaces oficiales. Publicar datos coherentes en la web y en el perfil real del negocio.
- Sustituir arte conceptual por portafolio autorizado, con estilo, artista y contexto. No inventar reseñas, experiencia, certificaciones, precios o disponibilidad.
- Elegir un canal real de contacto y definir qué confirma una cita. Si se conecta el formulario, añadir aviso de privacidad aplicable, validación en servidor, límites de solicitudes y gestión de errores. Actualizar la promesa actual de que no se envían datos.
- Validar con el estudio los textos de preparación, higiene, consentimiento, cuidados y condiciones de reserva antes de publicarlos como servicios propios.

## SEO, AEO y GEO

- Cuando exista contenido real y se autorice un lanzamiento público: retirar `noindex`, actualizar `robots.txt`, añadir URL canónica, sitemap y metadatos sociales del dominio definitivo. Revisar Search Console.
- La demo mantiene `Allow: /` en `robots.txt` y `noindex` en HTML: permite el rastreo para que Google lea la exclusión cuando la página sea accesible. No cambiar a `Disallow: /` para intentar reforzarla, pues impediría esa lectura. `robots.txt` no protege información privada: para privacidad se requiere control de acceso. [Guía de Google sobre noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing).
- Mantener información importante en HTML legible: servicios, ubicación, contacto, artistas y respuestas concretas. Añadir datos estructurados `LocalBusiness` solo con hechos visibles y verificables; validarlos tras el despliegue. [Documentación de Google](https://developers.google.com/search/docs/appearance/structured-data/local-business).
- AEO/GEO: respuestas claras, información original y fuentes verificables favorecen la comprensión. Google no exige un marcado especial para AI Overviews o AI Mode; los fundamentos SEO siguen aplicando. No garantizar indexación, posición ni citas por motores de IA. [Funciones de IA de Google Search](https://developers.google.com/search/docs/appearance/ai-features).

## Calidad, seguridad y rendimiento

- Probar móvil, escritorio, zoom, teclado, lector de pantalla, contraste y reducción de movimiento. Confirmar que estudio, libreta, menú y formularios siguen siendo comprensibles sin WebGL.
- Ejecutar `npm ci` y `npm run build`. Revisar dependencias antes de lanzamiento y confirmar HTTPS, CSP y otras cabeceras con las respuestas reales del alojamiento; la existencia de `_headers` por sí sola no demuestra su aplicación.
- Mantener fuentes, decoder y recursos locales. Los iconos actuales son un subset de Google Material Symbols (19 iconos, 3,612 bytes), con procedencia y licencia Apache-2.0 en `public/fonts/`. Si se agregan iconos, regenerar ese subset; si se agregan servicios externos, actualizar CSP solo con los orígenes necesarios y conservar secretos en el servidor.
- Medir PageSpeed/Lighthouse sobre el dominio final y un móvil representativo; registrar fecha y condiciones. Revisar carga del hero, tamaño del GLB, mapas, ejecución durante scroll y estabilidad del layout. No asignar puntuaciones estimadas.
- Confirmar derechos del portafolio, licencias de fuentes/librerías y el registro de texturas en `blender/texture-sources.json` antes de entregar el proyecto a un cliente.
