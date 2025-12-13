import { Client } from '@notionhq/client';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { NotionPostSchema, type NotionPost, type NotionBlock, type CTA } from './types';
import { downloadImage } from '../image-downloader';
import { SITE_CONFIG } from '@/site-config';

const notion = new Client({
  auth: import.meta.env.NOTION_TOKEN,
});

const DATABASE_ID = import.meta.env.NOTION_DATABASE_ID;

/**
 * Notionデータベースから全記事を取得
 */
export async function getPosts(): Promise<NotionPost[]> {
  if (!DATABASE_ID) {
    throw new Error('NOTION_DATABASE_IDが設定されていません。.envファイルを確認してください。');
  }

  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        property: 'Status',
        select: {
          equals: 'Published',
        },
      },
      sorts: [
        {
          property: 'Published Date',
          direction: 'descending',
        },
      ],
    });

    const postPromises = response.results.map((page) => {
      return parseNotionPage(page as PageObjectResponse);
    });

    const posts = await Promise.all(postPromises);
    return posts.filter((post): post is NotionPost => post !== null);
  } catch (error) {
    console.error('Failed to fetch posts from Notion:', error);
    throw new Error('Notionから記事の取得に失敗しました。データベースIDとトークンを確認してください。');
  }
}

/**
 * スラッグから特定の記事を取得 (Publishedのみ)
 */
export async function getPostBySlug(slug: string): Promise<NotionPost | null> {
  if (!DATABASE_ID) {
    throw new Error('NOTION_DATABASE_IDが設定されていません');
  }

  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        and: [
          {
            property: 'Slug',
            rich_text: {
              equals: slug,
            },
          },
          {
            property: 'Status',
            select: {
              equals: 'Published',
            },
          },
        ],
      },
    });

    if (response.results.length === 0) {
      return null;
    }

    return await parseNotionPage(response.results[0] as PageObjectResponse);
  } catch (error) {
    console.error(`Failed to fetch post with slug "${slug}":`, error);
    return null;
  }
}

/**
 * プレビュー用: スラッグから記事を取得 (Draft/Published問わず)
 * Pro版専用機能
 */
export async function getPostBySlugForPreview(slug: string): Promise<NotionPost | null> {
  if (!DATABASE_ID) {
    throw new Error('NOTION_DATABASE_IDが設定されていません');
  }

  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        property: 'Slug',
        rich_text: {
          equals: slug,
        },
      },
    });

    if (response.results.length === 0) {
      return null;
    }

    return await parseNotionPage(response.results[0] as PageObjectResponse);
  } catch (error) {
    console.error(`Failed to fetch preview post with slug "${slug}":`, error);
    return null;
  }
}

/**
 * ページIDからブロック（記事本文）を取得
 * 画像ブロックはビルド時にダウンロード処理を行う
 */
export async function getPageBlocks(pageId: string): Promise<NotionBlock[]> {
  try {
    const response = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
    });

    const blocks = response.results as NotionBlock[];

    // ビルド時に画像をダウンロード（Cloudflare Image Resizing無効時のみ）
    const shouldDownload = import.meta.env.PROD && !SITE_CONFIG.useCloudflareImageResizing;
    if (shouldDownload) {
      await processBlockImages(blocks);
    }

    return blocks;
  } catch (error) {
    console.error(`Failed to fetch blocks for page ${pageId}:`, error);
    return [];
  }
}

/**
 * ブロック内の画像をダウンロードしてローカルパスに置換
 */
async function processBlockImages(blocks: NotionBlock[]): Promise<void> {
  for (const block of blocks) {
    if (block.type === 'image') {
      const content = block.image;
      if (content.type === 'external' && content.external?.url) {
        const localPath = await downloadImage(content.external.url);
        content.external.url = localPath;
      } else if (content.type === 'file' && content.file?.url) {
        const localPath = await downloadImage(content.file.url);
        content.file.url = localPath;
      }
    }
  }
}

/**
 * CTA管理DBからCTAデータを取得
 * Pro版専用機能
 */
async function fetchCTAData(pageIds: string[]): Promise<CTA[]> {
  if (pageIds.length === 0) return [];

  const ctaPromises = pageIds.map(async (pageId) => {
    try {
      const page = await notion.pages.retrieve({ page_id: pageId }) as PageObjectResponse;
      const properties = page.properties;

      // Title
      const titleProp = properties.Title || properties.Name;
      const title = titleProp?.type === 'title' && titleProp.title.length > 0
        ? titleProp.title[0].plain_text
        : 'CTA';

      // Description
      const descProp = properties.Description;
      const description = descProp?.type === 'rich_text' && descProp.rich_text.length > 0
        ? descProp.rich_text[0].plain_text
        : null;

      // Button Text
      const buttonTextProp = properties['Button Text'];
      const buttonText = buttonTextProp?.type === 'rich_text' && buttonTextProp.rich_text.length > 0
        ? buttonTextProp.rich_text[0].plain_text
        : '詳しくはこちら';

      // Button URL
      const buttonUrlProp = properties['Button URL'];
      const buttonUrl = buttonUrlProp?.type === 'url' && buttonUrlProp.url
        ? buttonUrlProp.url
        : '#';

      // Background Color
      const bgColorProp = properties['Background Color'];
      const backgroundColor = bgColorProp?.type === 'select' && bgColorProp.select?.name
        ? bgColorProp.select.name
        : null;

      return {
        id: page.id,
        title,
        description,
        buttonText,
        buttonUrl,
        backgroundColor,
      } as CTA;
    } catch (error) {
      console.error(`Failed to fetch CTA page ${pageId}:`, error);
      return null;
    }
  });

  const results = await Promise.all(ctaPromises);
  return results.filter((cta): cta is CTA => cta !== null);
}

/**
 * NotionのPageオブジェクトをパース
 */
async function parseNotionPage(page: PageObjectResponse): Promise<NotionPost | null> {
  try {
    const properties = page.properties;

    // Title
    const titleProp = properties.Title;
    const title = titleProp?.type === 'title' && titleProp.title.length > 0
      ? titleProp.title[0].plain_text
      : 'Untitled';

    // Slug
    const slugProp = properties.Slug;
    const slug = slugProp?.type === 'rich_text' && slugProp.rich_text.length > 0
      ? slugProp.rich_text[0].plain_text
      : '';

    if (!slug) {
      console.warn(`Post "${title}" has no slug, skipping...`);
      return null;
    }

    // Status
    const statusProp = properties.Status;
    const status = statusProp?.type === 'select' && statusProp.select?.name
      ? statusProp.select.name as 'Draft' | 'Published'
      : 'Draft';

    // Published Date
    const dateProp = properties['Published Date'];
    const publishedDate = dateProp?.type === 'date' && dateProp.date?.start
      ? dateProp.date.start
      : null;

    // Tags
    const tagsProp = properties.Tags;
    const tags = tagsProp?.type === 'multi_select'
      ? tagsProp.multi_select.map((tag) => tag.name)
      : [];

    // Excerpt
    const excerptProp = properties.Excerpt;
    const excerpt = excerptProp?.type === 'rich_text' && excerptProp.rich_text.length > 0
      ? excerptProp.rich_text[0].plain_text
      : null;

    // Cover Image
    const coverProp = properties['Cover Image'];
    let coverImage: string | null = null;
    if (coverProp?.type === 'files' && coverProp.files.length > 0) {
      const file = coverProp.files[0];
      let originalUrl: string | null = null;
      if (file.type === 'external') {
        originalUrl = file.external.url;
      } else if (file.type === 'file') {
        originalUrl = file.file.url;
      }

      // ビルド時に画像をダウンロード（Cloudflare Image Resizing無効時のみ）
      if (originalUrl) {
        const shouldDownload = import.meta.env.PROD && !SITE_CONFIG.useCloudflareImageResizing;
        if (shouldDownload) {
          coverImage = await downloadImage(originalUrl);
        } else {
          coverImage = originalUrl;
        }
      }
    }

    // Author
    const authorProp = properties.Author;
    let author: string | null = null;
    if (authorProp?.type === 'people' && authorProp.people.length > 0) {
      const person = authorProp.people[0];
      if ('name' in person) {
        author = person.name || null;
      }
    }

    // Pro版: IsAdSense (Checkbox)
    const isAdSenseProp = properties.IsAdSense;
    const isAdSense = isAdSenseProp?.type === 'checkbox'
      ? isAdSenseProp.checkbox
      : false;

    // Pro版: RelatedCTA (Relation)
    const relatedCTAProp = properties.RelatedCTA;
    let relatedCTA: CTA[] = [];
    if (relatedCTAProp?.type === 'relation' && relatedCTAProp.relation.length > 0) {
      const ctaPageIds = relatedCTAProp.relation.map((rel) => rel.id);
      relatedCTA = await fetchCTAData(ctaPageIds);
    }

    const post = {
      id: page.id,
      title,
      slug,
      status,
      publishedDate,
      tags,
      excerpt,
      coverImage,
      author,
      isAdSense,
      relatedCTA,
    };

    return NotionPostSchema.parse(post);
  } catch (error) {
    console.error('Failed to parse Notion page:', error);
    return null;
  }
}
