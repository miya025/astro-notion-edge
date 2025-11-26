import type { APIRoute } from 'astro';
import { Hono } from 'hono';

/**
 * Hono統合デモエンドポイント (キャッチオールルート)
 *
 * このエンドポイントはHonoを使用したルーティングのデモです。
 * [...path] により /api/hono-demo/* すべてをキャッチします。
 * 実際のプレビュー機能では、このパターンを拡張して実装します。
 */

// Honoアプリケーションを作成
const app = new Hono();

// ルート定義
app.get('/', (c) => {
  return c.json({
    message: 'Hono is working on Cloudflare Pages!',
    timestamp: new Date().toISOString(),
    note: 'This endpoint demonstrates Hono integration',
  });
});

// サブルートの例
app.get('/test', (c) => {
  return c.json({
    message: 'Hono subroute test',
    status: 'ok',
  });
});

// もう一つのサブルート例
app.get('/users/:id', (c) => {
  const id = c.req.param('id');
  return c.json({
    message: 'User detail endpoint',
    userId: id,
  });
});

// Astro API Routeとしてエクスポート
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);

  // /api/hono-demo/test → /test に変換
  // /api/hono-demo → / に変換
  const path = url.pathname.replace('/api/hono-demo', '') || '/';

  // Honoが期待するパスでリクエストを作成
  const honoRequest = new Request(
    new URL(path + url.search, url.origin),
    request
  );

  return app.fetch(honoRequest);
};
