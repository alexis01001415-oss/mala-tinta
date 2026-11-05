import { defineConfig } from 'vite';
export default defineConfig({
  build: { target: 'es2022', cssCodeSplit: true, rollupOptions: { output: { manualChunks(id) { if (id.includes('node_modules/three')) return 'three'; if (id.includes('node_modules/gsap')) return 'motion'; } } } },
  server: { port: 5173, strictPort: true },
});
