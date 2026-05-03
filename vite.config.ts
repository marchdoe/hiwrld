import { TanStackRouterVite } from '@tanstack/router-vite-plugin';
import react from '@vitejs/plugin-react';
import express, { json } from 'express';
import { defineConfig } from 'vite';
import { documentsRouter } from './api/documents';
import { foldersRouter } from './api/folders';
import { workspacesRouter } from './api/workspaces';

export default defineConfig({
  plugins: [
    react(),
    TanStackRouterVite({
      routesDirectory: 'src/routes',
      generatedRouteTree: 'src/routeTree.gen.ts',
    }),
    {
      name: 'api-routes',
      configureServer(server) {
        const api = express();
        api.use(json());
        api.use('/api/workspaces', workspacesRouter);
        api.use('/api/workspaces/:key/folders', foldersRouter);
        api.use('/api/workspaces/:key/documents', documentsRouter);
        server.middlewares.use(api);
      },
      transformIndexHtml() {
        // Auto-provision the dev workspace on first load so the app starts in a working state.
        return [
          {
            tag: 'script',
            attrs: { type: 'text/javascript' },
            injectTo: 'head-prepend' as const,
            children: `(function(){var k='hiwrld.workspace';if(!localStorage.getItem(k)){localStorage.setItem(k,JSON.stringify({id:'dev-ws-001',name:'My Workspace',secret_key:'devworkspace01'}));}})();`,
          },
        ];
      },
    },
  ],
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    sourcemap: 'hidden',
  },
  server: {
    port: 5173,
    open: true,
  },
});
