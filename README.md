# Astro × Notion Blog Starter

**"Notionで書き、Edgeで配信する。WordPressより速く、セキュアなブログ基盤"**

NotionをヘッドレスCMSとして使用し、Astroで高速な静的サイトを生成するブログスターターキットです。

## ✨ 特徴

- 🚀 **Lighthouse 100点を目指す超高速パフォーマンス**
- 📝 **Notionで記事を書くだけ** - 複雑なCMSは不要
- 🎨 **シンプルでクリーンなデザイン** - Tailwind CSS使用
- 🔒 **セキュア** - 静的サイト生成でサーバー攻撃の心配なし
- 📱 **完全レスポンシブ対応**
- 🌐 **SEO最適化済み** - Meta Tags, OGP, JSON-LD, Sitemap, RSS Feed対応
- 👀 **リアルタイムプレビュー** - 下書き記事をパスワード付きで即時確認
- 🖼️ **動的OGP画像生成** - タイトル入り画像をEdgeで自動生成
- 💰 **収益化対応** - AdSense、CTA管理機能内蔵
- 🔍 **全文検索機能** - 高速なサイト内検索

## 📋 必要なもの

- Node.js 18以上
- Notionアカウント
- Notion Integration Token

## 🚀 セットアップ手順

### 1. Notion側の準備

1. [Notion Integrations](https://www.notion.so/my-integrations)にアクセス
2. 「New integration」をクリック
3. 名前を入力し、Workspaceを選択して作成
4. **Internal Integration Token**をコピー（後で使用）

### 2. Notionデータベースの作成

1. Notionで新しいページを作成
2. `/database` と入力し「データベース - フルページ」を選択
3. 以下のプロパティを追加:

| プロパティ名 | 種類 | 必須 |
|:---|:---|:---:|
| Title | タイトル | ✅ |
| Slug | テキスト | ✅ |
| Status | セレクト (`Draft`, `Published`) | ✅ |
| PublishedDate | 日付 | ✅ |
| Tags | マルチセレクト | |
| Excerpt | テキスト | |
| CoverImage | ファイル&メディア | |
| Author | ユーザー | |
| IsAdSense | チェックボックス | |
| RelatedCTA | リレーション | |

4. データベースURLの`https://notion.so/`と`?v=`の間の文字列をコピー
   - 例: `https://notion.so/XXXXXXXXXX?v=YYYY` → `XXXXXXXXXX`がDatabase ID

5. データベースページの右上「...」→「コネクト」→ 作成したIntegrationを選択

### 3. プロジェクトのセットアップ

```bash
# リポジトリをクローン（またはZipをダウンロード）
git clone https://github.com/yourusername/astro-notion-edge.git
cd astro-notion-edge

# 依存関係をインストール
npm install

# 環境変数ファイルを作成
cp .env.example .env
```

### 4. 環境変数の設定

`.env`ファイルを開いて、以下を設定:

```env
NOTION_TOKEN=secret_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NOTION_DATABASE_ID=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 5. サイト設定

`src/site-config.ts`を開いて、サイト情報をカスタマイズ:

```typescript
export const SITE_CONFIG = {
  title: 'My Notion Blog',
  description: 'A fast, secure blog powered by Notion and Astro',
  author: 'Your Name',
  url: 'https://example.com',

  // 画像最適化設定
  // false (デフォルト): ビルド時にNotionから画像をダウンロード
  // true: Cloudflare Image Resizing使用（Proプラン以上が必要）
  useCloudflareImageResizing: false,
  // ...
};
```

### 6. 起動

```bash
# 開発サーバー起動
npm run dev

# ブラウザで http://localhost:4321 を開く
```

## 📦 ビルドとデプロイ

### ビルド

```bash
npm run build
```

### Cloudflare Pagesへのデプロイ

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)にログイン
2. 「Pages」→「Create a project」
3. GitHubリポジトリを接続
4. ビルド設定:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. 環境変数を設定:
   - `NOTION_TOKEN`
   - `NOTION_DATABASE_ID`
6. 「Save and Deploy」

## 📝 記事の書き方

1. Notionのデータベースに新しいページを作成
2. 必要なプロパティを入力:
   - **Title**: 記事タイトル
   - **Slug**: URLに使用（例: `my-first-post`）
   - **Status**: `Published` に設定
   - **PublishedDate**: 公開日を選択
3. ページ本文に記事を書く（見出し、段落、画像、リストなど）
4. サイトを再ビルドすると記事が公開されます

### サポートされているNotionブロック

- 段落
- 見出し（H1, H2, H3）
- 箇条書きリスト
- 番号付きリスト
- 引用
- コードブロック
- 画像
- 区切り線

## 🎨 カスタマイズ

### スタイルの変更

`src/styles/global.css`と`tailwind.config.mjs`でカスタマイズできます。

### レイアウトの変更

`src/layouts/Layout.astro`を編集してヘッダー・フッターをカスタマイズ。

## 🛠️ トラブルシューティング

### ビルドエラー: "NOTION_TOKEN is not defined"

→ `.env`ファイルが正しく設定されているか確認してください。

### 記事が表示されない

→ Notionデータベースで以下を確認:
- Statusが`Published`になっているか
- Slugが設定されているか
- IntegrationがデータベースにConnectされているか

### 画像が表示されない

→ NotionのCoverImageプロパティに画像がアップロードされているか確認。

### 開発環境で画像が表示されるが本番で表示されない

→ `useCloudflareImageResizing: true` の場合、Cloudflare Proプラン以上が必要です。Freeプランの場合は `false`（デフォルト）のままにしてください。

## 📄 ライセンス

MIT License

## 🙋 サポート

質問やバグ報告は[GitHub Issues](https://github.com/yourusername/astro-notion-edge/issues)へ。
