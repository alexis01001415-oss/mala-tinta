# Physical sketchbook integration

```js
const { initSketchbook } = await import('./sketchbook.js');
const sketchbook = await initSketchbook(document.querySelector('#book-canvas'), {
  reducedMotion,
  onPageChange(index) { /* Update title, counter, disabled buttons, selection. */ },
});
sketchbook.setPage(2); // 0–3, smooth curved paper turn; does not move the document.
sketchbook.setReducedMotion(true); // Immediate page changes; no animated turn.
sketchbook.destroy();
```

Expected markup: `#book-canvas` inside the sticky viewport of `#flash`, containing an ordinary fallback image. The module imports its own scoped CSS. Root stylesheet owns `#flash`'s approximately 300vh scroll length and the sticky viewport. Remove the previous GSAP trigger that discretely changes flash pages: this module owns the continuous book scroll state.

The scene maps scroll from the section's top reaching the viewport top to the section's bottom reaching viewport bottom into three continuous page turns (four selected flash designs). Every turn is reversible. `onPageChange` emits 0–3 only when the nearest page changes, including the initial page. `setPage()` temporarily overrides scroll to allow button/keyboard navigation; the next real document scroll returns to section progress. Do not call `setPage()` from `onPageChange`.

The book uses 64 × 20 segment meshes, arc-length-preserving curved deformation, independently textured fronts and backs, rough paper grain, individual page edges, rounded leather covers, spine, bookmark, warm key and cool fill lighting, and cast shadows. Images and font assets stay local. Texture art is rendered from the existing flash sheet; no additional download/CDN is used. Rendering stops when settled, offscreen, or the browser tab is hidden. Pixel ratio is capped at 1.75. WebGL or texture failures restore the ordinary fallback; reduced-motion selection snaps pages to their resting positions.

The canvas is decorative (`aria-hidden`); retain the accessible DOM title, description, controls and selection action outside it. Keep the fallback image meaningful. For reduced-motion or no-JavaScript presentation, root can shorten the scroll section and retain ordinary buttons.


## Edition 2

The cover uses the local original collage `sketchbook-collage.webp`. Page fronts present taped flash prints; backs contain close crop studies, ink swatches and handwritten notes. Real alpha paper/tape resources are shared with the hero, character and menu. Display lettering uses Bowlby One SC loaded before canvas text generation. The generated page textures are 720 × 1020. Optional material failures keep the original flash pages usable.
