import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts } from '@/lib/notion/client';
import { SITE_CONFIG } from '@/site-config';

// SSGとしてビルド時に静的生成
export const prerender = true;

export async function GET(context: APIContext) {
  const posts = await getPosts();

  return rss({
    // チャンネル情報
    title: SITE_CONFIG.title,
    description: SITE_CONFIG.description,
    site: context.site!,

    // 記事アイテム
    items: posts.map((post) => ({
      title: post.title,
      pubDate: post.publishedDate ? new Date(post.publishedDate) : new Date(),
      description: post.excerpt || '',
      link: `/${post.slug}/`,
      // カスタムデータ
      customData: post.tags.length > 0
        ? `<category>${post.tags.join('</category><category>')}</category>`
        : undefined,
    })),

    // オプション設定
    customData: `<language>${SITE_CONFIG.lang}</language>`,

    // スタイルシート（オプション: ブラウザで見やすく表示）
    stylesheet: '/rss-styles.xsl',
  });
}
