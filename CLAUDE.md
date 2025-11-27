承知いたしました。
リポジトリを物理的に `Free版` と `Pro版` に分け、それぞれの役割と実装範囲を明確にした仕様書です。

開発者が実装時に迷わず、かつ販売時にLPのスペック表としても使える粒度でまとめています。

---

# Notion × Astro Media Kit (仮) プロダクト仕様書

## 1. プロジェクト基本方針

### コンセプト
**"Notionで書き、Edgeで配信する。WordPressより速く、セキュアで、収益化に強いブログ基盤"**

### 戦略的ゴール
*   **Free版:** 高性能な「撒き餌」。GitHubスターの獲得と、Astro × Notionの技術的優位性の認知拡大。
*   **Pro版:** 実用的な「商品」。アフィリエイターや法人が実際に運用・収益化するための機能セット（プレビュー、SEO、CTA）。

---

## 2. リポジトリ構成とライセンス

物理的に2つのリポジトリを運用し、機能差分を管理する。

| 項目 | Free版 (OSS Edition) | Pro版 (Commercial Edition) |
| :--- | :--- | :--- |
| **リポジトリ名** | `astro-notion-edge-starter` | `astro-notion-edge-pro` |
| **公開設定** | **Public** (GitHub) | **Private** (GitHub / Zip配布) |
| **ライセンス** | MIT License | 商用ライセンス (再販不可/1購入1サイト) |
| **目的** | 集客、技術デモ、ポートフォリオ | **収益源**、本格運用 |
| **更新方針** | バグ修正、基本機能の追従 | 新機能追加、プレミアムサポート |

---

## 3. 機能要件詳細 (Free vs Pro)

Pro版はFree版の全機能を含み、その上に「運用・収益化」機能を追加するアーキテクチャとする。

| カテゴリ | 機能 | Free版 (実装内容) | Pro版 (実装内容) |
| :--- | :--- | :--- | :--- |
| **コア機能** | 記事生成 | SSG (ビルド時生成) | SSG (ビルド時生成) |
| | Notion連携 | 公式SDK (本文ブロック変換) | 公式SDK + コールアウト拡張など |
| | デプロイ | Cloudflare Pages (静的) | Cloudflare Pages (静的 + Functions) |
| **DX (体験)** | **プレビュー** | なし (ローカルビルド必須) | **リアルタイムプレビュー (Hono SSR)**<br>下書き記事をパスワード付きで即時確認 |
| | 画像最適化 | `astro:assets` (ビルド時処理) | **Cloudflare Image Resizing**<br>動的な画像最適化・キャッシュ |
| **SEO / OGP** | Metaタグ | 基本設定 (Title, Desc) | 基本設定 + 構造化データ (JSON-LD) |
| | OGP画像 | 固定画像 or 記事内画像 | **動的OGP生成** (satori)<br>タイトル入り画像をEdgeで自動生成 |
| | サイトマップ | `sitemap.xml` 生成 | `sitemap.xml` + RSS Feed |
| **収益化** | AdSense | なし | **ウィジェット対応**<br>記事内/サイドバーに自動挿入 |
| | CTA管理 | なし | **Notion連動CTA**<br>記事ごとに末尾のボタン/リンクをDBで指定 |
| **検索** | サイト内検索 | なし | **全文検索** (Pagefind or Fuse.js)<br>モーダルUIでの高速検索 |
| **解析** | Analytics | なし (ユーザー自身で埋め込み) | GTM / GA4 コンポーネント内蔵<br>ID設定のみで完了 |

---

## 4. Notion データベース設計 (共通仕様)

Free版からPro版へのアップグレードを容易にするため、**データベースのテンプレートは共通化**する。
Free版では `Pro Only` のプロパティがあっても、コード側で単に無視（fetchしない）実装とする。

### 必須プロパティ (Database Schema)

| プロパティ名 | 種類 | 用途 | Free | Pro |
| :--- | :--- | :--- | :--- | :--- |
| **Title** | Title | 記事タイトル | ✅ | ✅ |
| **Slug** | Text | URLスラッグ (`/post/slug`) | ✅ | ✅ |
| **Status** | Select | `Draft`, `Published` | ✅ | ✅ |
| **PublishedDate** | Date | 公開日 | ✅ | ✅ |
| **Tags** | Multi-select | カテゴリ・タグ | ✅ | ✅ |
| **Excerpt** | Text | 抜粋 (Meta Description用) | ✅ | ✅ |
| **CoverImage** | Files & Media | 記事トップ画像 & OGP背景 | ✅ | ✅ |
| **Author** | Person | 執筆者情報 | ✅ | ✅ |
| **IsAdSense** | Checkbox | 記事内広告を表示するか | ❌ | ✅ |
| **RelatedCTA** | Relation | 別の「CTA管理DB」とのリレーション | ❌ | ✅ |

※ **CTA管理DB (Proのみ)**: コンバージョン用パーツ（バナーやボタン）を管理する別DBを用意し、記事DBからリレーションで選択できるようにする。

---

## 5. 技術アーキテクチャ

### Free版 (Static Architecture)
シンプルさを最優先。サーバーサイド処理を持たず、純粋な静的サイトとして振る舞う。
*   **Framework:** Astro (Static mode)
*   **Fetch:** ビルド時にNotion APIを全件取得。
*   **Image:** Astro標準の画像最適化を使用。

### Pro版 (Hybrid Architecture)
Cloudflare Pages Functions (Hono) を活用し、動的機能を提供する。
*   **Framework:** Astro (Hybrid mode / Server output)
*   **Backend:** **Hono** (on Cloudflare Workers/Pages Functions)
    *   `/api/preview`: 下書き記事をSSRでレンダリングして返す。
    *   `/og/[slug].png`: `satori` を使いOGP画像をオンデマンド生成・キャッシュ。
*   **Image:** **Cloudflare Image Resizing** によるオンデマンド画像最適化。
*   **Search:** ビルド時にインデックスを生成し、静的ファイルとして配信 (Pagefind推奨)。

### 画像最適化アーキテクチャ (Pro版)

Pro版では **Cloudflare Image Resizing** を活用し、LCPスコアを最大化する。

#### 仕組み
```
[Notion S3 URL] → [/cdn-cgi/image/...] → [Cloudflare Edge] → [最適化済み画像]
                          ↓
              width, height, format, quality を指定
```

#### コンポーネント: `PostImage.astro`

| 環境 | 挙動 |
|:---|:---|
| **本番 (PROD)** | `/cdn-cgi/image/width=1200,height=675,fit=scale-down,quality=80,format=auto/{URL}` 形式に変換 |
| **開発 (DEV)** | 元のNotion URLをそのまま使用（Cloudflare機能は動かないため） |

#### Props

| Prop | Type | Default | 説明 |
|:---|:---|:---|:---|
| `src` | `string` | 必須 | 画像URL（Notion S3 or ローカルパス） |
| `alt` | `string` | 必須 | 代替テキスト |
| `width` | `number` | `1200` | 出力幅（px） |
| `height` | `number` | `675` | 出力高さ（px） |
| `priority` | `boolean` | `false` | LCP対象の場合 `true`（`fetchpriority="high"`, `loading="eager"`） |
| `fit` | `string` | `scale-down` | `scale-down`, `contain`, `cover`, `crop`, `pad` |
| `quality` | `number` | `80` | 画質（1-100） |
| `format` | `string` | `auto` | `webp`, `avif`, `auto` |

#### LCP最適化のベストプラクティス

1. **ファーストビュー画像には `priority={true}` を指定**
   - `loading="eager"` + `fetchpriority="high"` が適用される
   - ブラウザが優先的に画像をダウンロード

2. **適切なサイズを指定**
   - 実際の表示サイズに合わせた `width`/`height` を設定
   - 不要に大きな画像を配信しない

3. **format="auto" を推奨**
   - ブラウザ対応に応じてWebP/AVIFを自動選択
   - Cloudflare Edgeでキャッシュされ、以降は高速配信

#### Cloudflare設定要件

Cloudflare Image Resizing を利用するには、以下の設定が必要：

1. **Cloudflare Pro以上のプラン**（Image Resizing機能が含まれる）
2. **DNSプロキシ有効**（オレンジ雲マーク）
3. **Image Resizing有効化**（ダッシュボード → Speed → Optimization → Image Resizing）

---

## 6. ディレクトリ構造 (Pro版ベース)

Free版はここから `functions/` や `components/Pro/` を除いた構成となる。

```text
/
├── public/
├── src/
│   ├── components/
│   │   ├── Notion/          # Notionブロック変換 (共通)
│   │   ├── SEO/             # Metaタグなど (共通)
│   │   ├── PostImage.astro  # ★Pro版: Cloudflare Image Resizing対応
│   │   └── Pro/             # ★Pro限定機能
│   │       ├── AdSense.astro
│   │       ├── CTA.astro
│   │       └── SearchModal.astro
│   ├── layouts/
│   │   ├── Layout.astro
│   │   └── BlogPost.astro
│   ├── lib/
│   │   ├── notion-client.ts # Notion API通信
│   │   └── og-generator.ts  # ★Pro限定: OGP生成ロジック
│   ├── pages/
│   │   ├── index.astro
│   │   ├── [slug].astro     # 記事ページ (SSG)
│   │   └── api/             # ★Pro限定: Edge Functions
│   │       ├── preview.ts   # Hono: プレビュー用エンドポイント
│   │       └── og.ts        # Hono: OGP画像生成
│   ├── styles/
│   └── env.d.ts
├── astro.config.mjs
├── tailwind.config.mjs
├── wrangler.toml            # Cloudflare設定 (Proは必須)
└── package.json             # バージョン固定
```

---

## 7. 実装・開発フロー

### Phase 1: Free版の実装 (Baseline)
1.  Astroプロジェクトのセットアップ (Tailwind, React無効化)。
2.  `src/lib/notion-client.ts` 実装 (公式SDK)。
3.  Notionブロック → Astroコンポーネントの変換ロジック実装。
4.  Lighthouse 100点を目指してチューニング。
5.  GitHub Public RepoへPush。

### Phase 2: Pro版への拡張 (Enhancement)
1.  Free版を複製し、`astro.config.mjs` を `output: 'server'` (Hybrid) に変更。
2.  Cloudflare Adapter, Hono を導入。
3.  **プレビュー機能:** Notion APIでDraft記事を取得し、Hono経由でHTMLを返すルートを作成。
4.  **OGP生成:** `satori` + `resvg-wasm` を導入し、APIルートを作成。
5.  **収益化パーツ:** CTAコンポーネントとNotionリレーション連携の実装。
6.  Private RepoへPush / Zip化。

---

## 8. 配布・販売パッケージ内容

### Free版
*   ソースコード一式 (GitHub URL)
*   README (セットアップ手順、環境変数設定)
*   Notionテンプレート (複製用URL)

### Pro版
*   ソースコード一式 (Zipファイル or GitHub Invitation)
*   **Pro専用マニュアル** (プレビュー機能の設定、Cloudflare連携手順)
*   Notionテンプレート (Pro用プロパティ設定済み)
*   利用規約 (1購入1プロジェクト制限など)

---

## 9. 開発者が意識すべき「売り」ポイント (Memo)

実装時は以下のポイントを「強み」として磨き上げてください。

1.  **「設定ファイルが少ない」**: ユーザーが触るべきは `.env` と `site-config.ts` (定数ファイル) だけにする。
2.  **「エラー画面さえ美しい」**: Notionの設定ミスでビルドが落ちた際、真っ赤なエラーではなく「NotionのXXプロパティが空です」と親切に表示する (Zodなどでバリデーション)。
3.  **「WordPressより速い」**: これが最大のマーケティングメッセージなので、初期状態で余計なJSを一切ロードしない。