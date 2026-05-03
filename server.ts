import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import compression from 'compression';
import express, { json } from 'express';
import helmet from 'helmet';
import { workspacesRouter } from './api/workspaces';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createApp({ distDir = join(__dirname, 'dist') } = {}) {
  const app = express();
  app.set('trust proxy', 1);
  app.use(compression());
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'"],
          'style-src': ["'self'", "'unsafe-inline'"],
          'img-src': ["'self'", 'data:', 'https:'],
          'frame-src': ['https://www.youtube.com', 'https://www.youtube-nocookie.com'],
          'connect-src': ["'self'", 'https://*.supabase.co', 'wss://*.supabase.co'],
          'frame-ancestors': ["'none'"],
          'base-uri': ["'self'"],
          'form-action': ["'self'"],
          'object-src': ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(json());
  app.use('/api/workspaces', workspacesRouter);

  app.use((req, res, next) => {
    if (req.path.endsWith('.map')) return res.status(404).end();
    next();
  });

  app.use(
    express.static(distDir, {
      setHeaders(res, filePath) {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        } else if (/\.(?:js|css|map|png|svg|woff2?|ico)$/.test(filePath)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    })
  );

  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (/\.[a-z0-9]+$/i.test(req.path)) return next();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile('index.html', { root: distDir }, (err) => err && next(err));
  });

  app.use((_req, res) => res.status(404).send('Not found'));
  return app;
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const app = createApp();
  const port = process.env.PORT || 2000;
  const server = app.listen(port, () => {
    console.log(`listening on ${port}`);
  });

  for (const sig of ['SIGINT', 'SIGTERM']) {
    process.on(sig, () => {
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(1), 10_000).unref();
    });
  }
}
