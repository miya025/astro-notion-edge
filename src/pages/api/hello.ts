import type { APIRoute } from 'astro';

/**
 * Pro版 デモAPIエンドポイント
 * Cloudflare Pages Functions上で動作
 */
export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      message: 'Hello from Astro on Cloudflare Pages Functions!',
      timestamp: new Date().toISOString(),
      environment: 'Pro Edition',
      features: [
        'Preview API',
        'Dynamic OGP Generation',
        'Search API',
        'CTA Management',
      ],
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
};
