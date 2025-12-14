import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://example.com', // ユーザーが変更する
  output: 'server', // Pro版: SSR + API Routes (Edge Functions)
  adapter: cloudflare({
    imageService: 'cloudflare', // Cloudflare Image Resizing を利用
  }),
  integrations: [
    tailwind({
      applyBaseStyles: false, // カスタムスタイルを優先
    }),
    sitemap(),
  ],
  vite: {
    optimizeDeps: {
      exclude: ['@notionhq/client'],
    },
  },
});
