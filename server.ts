import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './src/server/routes.ts';
import { ensureSequencesSynced } from './src/db/index.ts';
import { ensureDemoEcosystemSeeded } from './src/server/seed-ecosystem.ts';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  // Sync database sequence counters to prevent pkey collisions
  await ensureSequencesSynced().catch((e) => console.warn('Sequence sync warning:', e));
  await ensureDemoEcosystemSeeded().catch((e) => console.warn('Seed warning:', e));

  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Routes First
  app.use('/api', apiRouter);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'UMKM Business & Mentoring Management System',
      database: 'Cloud SQL PostgreSQL',
      timestamp: new Date().toISOString(),
    });
  });

  // Catch-all 404 for unhandled /api routes to prevent Vite HTML fallback
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `Endpoint API tidak ditemukan: ${req.method} ${req.originalUrl}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 UMKM & Mentoring Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
