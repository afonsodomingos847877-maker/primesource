import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: {
    port: 3000,
    open: false,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5050',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        sobre: resolve(import.meta.dirname, 'sobre.html'),
        servicos: resolve(import.meta.dirname, 'servicos.html'),
        sectores: resolve(import.meta.dirname, 'sectores.html'),
        contactos: resolve(import.meta.dirname, 'contactos.html'),
        admin: resolve(import.meta.dirname, 'admin.html'),
        politica: resolve(import.meta.dirname, 'politica-privacidade.html'),
        notfound: resolve(import.meta.dirname, '404.html')
      }
    }
  }
});
