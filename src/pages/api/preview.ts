import type { APIRoute } from 'astro';

/**
 * プレビューAPI エンドポイント (Pro版機能)
 *
 * 下書き記事をリアルタイムでプレビューするためのエンドポイント。
 * クエリパラメータでslugとsecretを受け取り、認証後にプレビューページへリダイレクトする。
 *
 * Usage: /api/preview?slug=xxx&secret=yyy
 */

export const GET: APIRoute = async ({ url, redirect }) => {
  const slug = url.searchParams.get('slug');
  const secret = url.searchParams.get('secret');

  // 環境変数からシークレットを取得
  const PREVIEW_SECRET = import.meta.env.PREVIEW_SECRET;

  // シークレットが未設定の場合
  if (!PREVIEW_SECRET) {
    return new Response(
      JSON.stringify({
        error: 'Preview feature is not configured',
        message: 'PREVIEW_SECRETが設定されていません。.envファイルを確認してください。',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // slugパラメータのバリデーション
  if (!slug) {
    return new Response(
      JSON.stringify({
        error: 'Missing slug parameter',
        message: 'slugパラメータが必要です。例: /api/preview?slug=my-post&secret=xxx',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // secretパラメータのバリデーション
  if (!secret) {
    return new Response(
      JSON.stringify({
        error: 'Missing secret parameter',
        message: 'secretパラメータが必要です。',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // シークレットの検証
  if (secret !== PREVIEW_SECRET) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'シークレットキーが一致しません。',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // 認証成功: プレビューページへリダイレクト
  // プレビューページでは認証済みトークンをクエリパラメータで渡す
  return redirect(`/preview/${slug}?token=${secret}`, 302);
};
