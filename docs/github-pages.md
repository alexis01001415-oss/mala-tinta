# GitHub Pages

El workflow `.github/workflows/pages.yml` construye la web y publica solamente `dist/`. Se ejecuta al actualizar `main` o manualmente desde Actions. Las versiones de las acciones oficiales están fijadas a un SHA; no usa secretos personalizados ni necesita un token personal en el repositorio.

## Configuración del sitio

En Settings → Pages, seleccionar **GitHub Actions** como origen. `actions/configure-pages` devuelve `base_path`; el workflow pasa ese valor con una barra final a `VITE_BASE_PATH`. `vite.config.js` debe usar esta variable para `base`, con `/` como valor predeterminado.

Para un proyecto publicado en `https://usuario.github.io/mala-tinta/`, la base es `/mala-tinta/`. Los dominios propios y sitios de usuario usan `/`.

Una comprobación local en PowerShell:

```powershell
$env:VITE_BASE_PATH = '/mala-tinta/'
npm run build
node scripts/check-dist.mjs
Remove-Item Env:VITE_BASE_PATH
```

El verificador revisa los recursos de HTML y CSS —incluido CSS de `public/`, que Vite copia sin transformar—, imports de chunks, rutas de recursos absolutas en JavaScript, destinos `#fragmento`, enlaces simbólicos y tamaño de la carpeta publicada. No sustituye la revisión visual ni ejecuta las rutas calculadas en tiempo de ejecución.

## Convenciones de rutas

- HTML: usar atributos de recursos procesados por Vite o `%BASE_URL%`. Los atributos personalizados, como `data-photo`, requieren atención explícita.
- JavaScript: construir recursos públicos con `import.meta.env.BASE_URL`; no usar `'/models/...'` o `'/images/...'` directamente.
- CSS importado desde `src/`: Vite ajusta las URL de recursos de acuerdo con `base`.
- CSS en `public/`: usar rutas relativas al propio CSS. Por ejemplo, `./fonts/bowlby-one-sc-latin.woff2` desde `press-boot.css`.

## Seguridad y alcance

`public/_headers` corresponde a alojamientos que interpretan este formato. GitHub Pages no lo usa para configurar cabeceras; no debe darse por aplicada allí la CSP o la protección contra iframes del alojamiento anterior. La política CSP mediante meta HTML cubre directivas compatibles, pero no reemplaza cabeceras como `X-Frame-Options` ni `frame-ancestors`. La política de referencia puede declararse mediante `<meta name="referrer">`.

La demo no recibe reservas, credenciales ni pagos: el formulario genera un resumen local. Mantener esa distinción en el contenido. Un negocio con transacciones reales requiere un alojamiento y backend adecuados a su operación; GitHub Pages está destinado a sitios estáticos y tiene restricciones de uso comercial.

## Tamaño auditado antes de la última generación 3D

El árbol versionado ocupa aproximadamente 29.1 MB y el contenido de `public/` 9.4 MB. El mayor blob histórico es una escena Blender de 8,337,478 bytes. Ningún archivo observado requiere Git LFS por exceder 100 MiB. Estas cifras son una fotografía de la auditoría; el verificador informa el tamaño del `dist/` final en cada publicación.

## Fuentes oficiales

- [Vite: despliegue estático y GitHub Pages](https://vite.dev/guide/static-deploy#github-pages).
- [configure-pages: metadatos base_path](https://github.com/actions/configure-pages/blob/main/action.yml).
- [deploy-pages: publicación del artefacto](https://github.com/actions/deploy-pages).
- [Límites de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).
- [Archivos grandes en GitHub](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github).
- [Solicitud de soporte para cabeceras personalizadas en la comunidad oficial de GitHub](https://github.com/orgs/community/discussions/54257).
