import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { appEnv } from './lib/env';
import { systemRoutes } from './routes/system';
import { walletRoutes } from './routes/wallet';
import { identityRoutes } from './routes/identity';
import { launchRoutes } from './routes/launch';

const app = new Hono();

app.use('/api/*', cors());
app.use('/api/*', async (c, next) => {
  const startedAt = Date.now();
  await next();
  console.info(`[api] ${c.req.method} ${c.req.path} -> ${c.res.status} (${Date.now() - startedAt}ms)`);
});

app.route('/api', systemRoutes);
app.route('/api/wallet', walletRoutes);
app.route('/api/identity', identityRoutes);
app.route('/api/launch', launchRoutes);

app.notFound((c) => {
  if (c.req.path.startsWith('/api')) {
    return c.json({ success: false, error: '接口不存在' }, 404);
  }

  const frontendResponse = serveFrontend(c.req.path);
  if (frontendResponse) {
    return frontendResponse;
  }

  return c.text('Frontend build not found. Please run bun run build first.', 404);
});

app.onError((error, c) => {
  console.error(error);
  return c.json(
    {
      success: false,
      error: error instanceof Error ? error.message : '服务内部错误',
    },
    500,
  );
});

export default {
  port: appEnv.port,
  fetch: app.fetch,
};

console.log(`API server listening on http://127.0.0.1:${appEnv.port}`);

function serveFrontend(pathname: string) {
  const frontendDistDir = resolveFrontendDistDir();
  if (!frontendDistDir) return null;

  const cleanPath = pathname === '/' ? '/index.html' : pathname;
  const assetPath = resolve(frontendDistDir, `.${cleanPath}`);

  if (assetPath.startsWith(frontendDistDir) && existsSync(assetPath)) {
    return new Response(Bun.file(assetPath));
  }

  if (!extname(pathname)) {
    const indexPath = join(frontendDistDir, 'index.html');
    if (existsSync(indexPath)) {
      return new Response(Bun.file(indexPath), {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }
  }

  return null;
}

function resolveFrontendDistDir() {
  if (process.env.FRONTEND_DIST_DIR) {
    const fromEnv = resolve(process.env.FRONTEND_DIST_DIR);
    if (existsSync(fromEnv)) return fromEnv;
  }

  const fallback = resolve(import.meta.dir, '../../frontend/dist');
  if (existsSync(fallback)) return fallback;

  return null;
}
