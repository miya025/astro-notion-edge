import { Client } from '@notionhq/client';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { NotionPostSchema, type NotionPost, type NotionBlock } from './types';

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

    const posts = response.results.map((page) => {
      return parseNotionPage(page as PageObjectResponse);
    });

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

    return parseNotionPage(response.results[0] as PageObjectResponse);
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

    return parseNotionPage(response.results[0] as PageObjectResponse);
  } catch (error) {
    console.error(`Failed to fetch preview post with slug "${slug}":`, error);
    return null;
  }
}

/**
 * ページIDからブロック（記事本文）を取得
 */
export async function getPageBlocks(pageId: string): Promise<NotionBlock[]> {
  try {
    const response = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
    });

    return response.results as NotionBlock[];
  } catch (error) {
    console.error(`Failed to fetch blocks for page ${pageId}:`, error);
    return [];
  }
}

/**
 * NotionのPageオブジェクトをパース
 */
function parseNotionPage(page: PageObjectResponse): NotionPost | null {
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
      if (file.type === 'external') {
        coverImage = file.external.url;
      } else if (file.type === 'file') {
        coverImage = file.file.url;
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
    };

    return NotionPostSchema.parse(post);
  } catch (error) {
    console.error('Failed to parse Notion page:', error);
    return null;
  }
}
