import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'serve-zip-file',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url && (req.url.startsWith('/adlintegrarte-completo.zip') || req.url.startsWith('/api/download-zip'))) {
              const zipPath = path.resolve(__dirname, 'public/adlintegrarte-completo.zip');
              if (fs.existsSync(zipPath)) {
                const stat = fs.statSync(zipPath);
                res.writeHead(200, {
                  'Content-Type': 'application/zip',
                  'Content-Length': stat.size,
                  'Content-Disposition': 'attachment; filename="adlintegrarte.zip"',
                  'Cache-Control': 'no-cache',
                });
                fs.createReadStream(zipPath).pipe(res);
                return;
              }
            }
            next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
