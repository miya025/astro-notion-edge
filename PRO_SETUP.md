# Astro Notion Edge Pro - セットアップガイド

## Pro版の特徴

このPro版は、Free版の全機能に加えて、以下の機能を提供します:

- ✅ **Cloudflare Pages Functions** による動的機能
- ✅ **Hono** フレームワークの統合
- ✅ API エンドポイントのサポート
- ✅ プレビュー機能（今後実装予定）
- ✅ 動的OGP生成（今後実装予定）
- ✅ サイト内検索（今後実装予定）

## 技術スタック

- **Astro 5** (Server Mode with Prerendering)
- **Cloudflare Pages** (Hosting + Functions)
- **Hono** (Lightweight Web Framework)
- **Tailwind CSS** (Styling)
- **Notion API** (Content Management)

## インストール済みパッケージ

```json
{
  "dependencies": {
    "@astrojs/cloudflare": "^12.6.12",
    "@notionhq/client": "^2.2.15",
    "astro": "^5.16.1",
    "hono": "^4.10.7",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.6",
    "@astrojs/sitemap": "^3.2.1",
    "@astrojs/tailwind": "^5.1.2",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.2",
    "wrangler": "^4.51.0"
  }
}
```

## プロジェクト構成

```
/
├── src/
│   ├── pages/
│   │   ├── index.astro          # トップページ (SSG)
│   │   ├── [slug].astro         # 記事ページ (SSG)
│   │   └── api/                 # ★Pro限定: API Routes
│   │       ├── hello.ts         # デモAPI (Astro標準)
│   │       └── hono-demo.ts     # HonoデモAPI
│   ├── components/
│   ├── layouts/
│   └── lib/
├── astro.config.mjs             # Server mode設定
├── wrangler.toml                # Cloudflare設定
└── package.json
```

## 開発環境のセットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env` ファイルを作成し、Notion APIの認証情報を設定してください:

```bash
NOTION_TOKEN=secret_xxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. ビルド

```bash
npm run build
```

このコマンドは以下を実行します:
- 型チェック (`astro check`)
- 静的ページのプリレンダリング (index.astro, [slug].astro)
- API Routesのビルド
- Cloudflare Pages Functions用の最適化

### 4. ローカルプレビュー (Wrangler)

```bash
npm run preview
```

- **URL:** http://localhost:8788
- **エンジン:** Cloudflare Workers Runtime (ローカル)
- **特徴:** 本番環境と同じ動作を確認できます

### 5. 動作確認

#### 静的ページ
```bash
curl http://localhost:8788/
```

#### APIエンドポイント
```bash
# Astro標準APIルート
curl http://localhost:8788/api/hello | jq .

# Hono統合API
curl http://localhost:8788/api/hono-demo | jq .
```

**期待される出力 (Astro標準API):**
```json
{
  "message": "Hello from Astro on Cloudflare Pages Functions!",
  "timestamp": "2025-11-26T14:42:44.779Z",
  "environment": "Pro Edition",
  "features": [
    "Preview API",
    "Dynamic OGP Generation",
    "Search API",
    "CTA Management"
  ]
}
```

**期待される出力 (Hono API):**
```json
{
  "message": "Hono is working on Cloudflare Pages!",
  "timestamp": "2025-11-26T14:57:35.353Z",
  "note": "This endpoint demonstrates Hono integration"
}
```

## Astro v5 の重要な変更点

### Hybrid → Server + Prerender

Astro v5では `output: 'hybrid'` が廃止され、以下のように変更されました:

**astro.config.mjs:**
```js
export default defineConfig({
  output: 'server',  // ← 'hybrid'から変更
  adapter: cloudflare({
    imageService: 'cloudflare',
  }),
});
```

**各ページでSSGを指定:**
```astro
---
// SSGとしてビルド時に生成
export const prerender = true;

import Layout from '@/layouts/Layout.astro';
---
```

## Cloudflare Pages へのデプロイ

### 1. Cloudflare Pagesプロジェクトの作成

1. Cloudflare Dashboard にログイン
2. **Pages** → **Create a project**
3. GitHubリポジトリを接続

### 2. ビルド設定

| 項目 | 値 |
|------|-----|
| **Framework preset** | Astro |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |
| **Node version** | 18 以上 |

### 3. 環境変数の設定

**Settings** → **Environment variables** で以下を設定:

- `NOTION_TOKEN`
- `NOTION_DATABASE_ID`

### 4. 互換性フラグの設定

`wrangler.toml` に以下が含まれていることを確認:

```toml
compatibility_flags = ["nodejs_compat"]
```

本番環境では、Cloudflare Pagesの設定画面で同様に設定してください。

## トラブルシューティング

### `node:crypto` エラーが発生する

**エラー:**
```
Error: No such module "node:crypto"
```

**解決策:**
[wrangler.toml](wrangler.toml) に以下を追加:
```toml
compatibility_flags = ["nodejs_compat"]
```

### APIエンドポイントが404になる

- ビルドが完了しているか確認: `npm run build`
- `dist/_worker.js/pages/api/` にファイルが生成されているか確認
- ファイル名が正しいか確認 (`api/hello.ts` → `/api/hello`)
- Honoの場合、Requestオブジェクトのパス変換が正しいか確認

### ビルド時に型エラーが発生する

```bash
npm run astro check
```

で詳細なエラー内容を確認してください。

## 次のステップ

Pro版の追加機能を実装していきます:

1. **プレビュー機能** - 下書き記事をパスワード付きでプレビュー
2. **動的OGP生成** - satoriを使った画像生成
3. **全文検索** - Pagefindの統合
4. **CTA管理** - Notionリレーションを活用した収益化

---

## サポート

質問や不具合報告は、プロジェクトのIssueまでお願いします。

**Generated with Astro Notion Edge Pro**
