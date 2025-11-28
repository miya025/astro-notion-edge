import type { APIRoute } from 'astro';
import satori from 'satori';
import { Resvg } from '@cf-wasm/resvg';
import { getPostBySlug, getPostBySlugForPreview } from '@/lib/notion/client';
import { SITE_CONFIG } from '@/site-config';

// SSR mode for dynamic OGP generation
export const prerender = false;

// フォントキャッシュ（同一Worker内で再利用）
let fontCache: ArrayBuffer | null = null;

// Google Fonts から日本語フォントを取得（キャッシュ付き）
async function loadFont(): Promise<ArrayBuffer> {
  // キャッシュがあれば再利用
  if (fontCache) {
    return fontCache;
  }

  const fontUrl = 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&display=swap';

  try {
    // CSSを取得してフォントURLを抽出
    const cssResponse = await fetch(fontUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    const css = await cssResponse.text();

    // CSSからWOFF2フォントURLを抽出
    const fontUrlMatch = css.match(/src:\s*url\(([^)]+\.woff2)\)/);
    if (!fontUrlMatch) {
      throw new Error('Font URL not found in CSS');
    }

    // フォントファイルを取得してキャッシュ
    const fontResponse = await fetch(fontUrlMatch[1]);
    fontCache = await fontResponse.arrayBuffer();
    return fontCache;
  } catch (error) {
    console.error('Failed to load font:', error);
    // フォールバック: Inter font (英語のみ対応)
    const fallbackFontUrl = 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiJ-Ek-_EeA.woff2';
    const fallbackResponse = await fetch(fallbackFontUrl);
    fontCache = await fallbackResponse.arrayBuffer();
    return fontCache;
  }
}

export const GET: APIRoute = async ({ params }) => {
  const { slug } = params;

  if (!slug) {
    return new Response('Slug is required', { status: 400 });
  }

  try {
    // 記事を取得（Published優先、なければPreview用でも取得）
    let post = await getPostBySlug(slug);
    if (!post) {
      post = await getPostBySlugForPreview(slug);
    }

    if (!post) {
      return new Response('Post not found', { status: 404 });
    }

    // フォントを読み込み
    const fontData = await loadFont();

    // OGP画像のサイズ (1200x630 が標準)
    const width = 1200;
    const height = 630;

    // Satoriでsvgを生成
    const svg = await satori(
      {
        type: 'div',
        props: {
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: '#1a1a2e',
            backgroundImage: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            padding: '60px 80px',
            fontFamily: 'Noto Sans JP, Inter, sans-serif',
          },
          children: [
            // タイトル
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  fontSize: post.title.length > 40 ? '48px' : post.title.length > 25 ? '56px' : '64px',
                  fontWeight: 700,
                  color: '#ffffff',
                  lineHeight: 1.4,
                  maxWidth: '1040px',
                  wordBreak: 'break-word',
                },
                children: post.title,
              },
            },
            // サイト名
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  marginTop: '40px',
                  fontSize: '28px',
                  color: '#94a3b8',
                  fontWeight: 500,
                },
                children: SITE_CONFIG.title,
              },
            },
          ],
        },
      },
      {
        width,
        height,
        fonts: [
          {
            name: 'Noto Sans JP',
            data: fontData,
            weight: 700,
            style: 'normal',
          },
        ],
      }
    );

    // ResvgでPNGに変換（@cf-wasm/resvgはCloudflare Workers対応）
    const resvg = new Resvg(svg, {
      fitTo: {
        mode: 'width',
        value: width,
      },
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    // キャッシュヘッダー付きでレスポンス
    return new Response(pngBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('OGP generation error:', error);
    return new Response(`Failed to generate OGP image: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      status: 500,
    });
  }
};
