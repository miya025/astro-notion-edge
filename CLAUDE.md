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
| | 画像最適化 | `astro:assets` (ビルド時処理) | **Cloudflare Image Resizing + LCP最適化**<br>• レスポンシブ画像（srcset）自動生成<br>• WebP/AVIF自動変換<br>• カバー画像の優先読み込み（fetchpriority: high）<br>• CDNエッジキャッシュによる高速配信 |
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
*   **Search:** ビルド時にインデックスを生成し、静的ファイルとして配信 (Pagefind推奨)。
*   **Image Optimization (Pro版の核心機能):**
    *   **Cloudflare Image Resizing** を全面活用し、LighthouseのLCPスコアを最大化。
    *   **OptimizedImageコンポーネント** (`/components/Pro/OptimizedImage.astro`) を使用。
    *   **LCP最適化戦略:**
        *   カバー画像: `priority={true}`, `fetchpriority="high"`, `loading="eager"`で最優先読み込み
        *   ファーストビューのサムネイル: 最初の2枚は`priority={true}`
        *   記事内画像: `loading="lazy"`で遅延読み込み
    *   **自動最適化機能:**
        *   レスポンシブ画像（srcset）: 640px〜1920pxまで自動生成
        *   フォーマット自動選択: WebP/AVIF対応ブラウザへ自動配信
        *   画質最適化: カバー画像90%、その他85%
        *   CDNエッジキャッシュ: 全世界で高速配信

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
│   │   └── Pro/             # ★Pro限定機能
│   │       ├── OptimizedImage.astro  # Cloudflare Image Resizing
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

---

## 10. Pro版 画像最適化の実装詳細

Pro版の最大の技術的優位性は、**Cloudflare Image Resizingを活用したLCP（Largest Contentful Paint）スコアの最大化**です。

### 10.1 OptimizedImageコンポーネントの仕様

**ファイル:** `src/components/Pro/OptimizedImage.astro`

このコンポーネントは、Cloudflare Image Resizing APIを使用して画像を最適化します。

#### 主要機能

1.  **Cloudflare Image Resizing URL生成**
    *   URL形式: `/cdn-cgi/image/width=800,quality=85,format=auto/[original-url]`
    *   パラメータ:
        *   `width`: 画像幅（レスポンシブ対応）
        *   `quality`: 画質（カバー画像: 90、その他: 85）
        *   `format=auto`: ブラウザに応じてWebP/AVIF/JPEGを自動選択
        *   `fit=scale-down`: アスペクト比を維持しながら縮小

2.  **レスポンシブ画像（srcset）自動生成**
    *   生成サイズ: 640px, 768px, 1024px, 1280px, 1536px, 1920px
    *   ブラウザが最適なサイズを自動選択
    *   モバイル・タブレット・デスクトップで最適化

3.  **LCP最適化のための優先読み込み**
    *   `priority={true}` の場合:
        *   `loading="eager"`: 即座に読み込み
        *   `fetchpriority="high"`: ブラウザに最優先を指示
        *   `decoding="sync"`: 同期デコードで即時表示
    *   `priority={false}` の場合:
        *   `loading="lazy"`: 遅延読み込み
        *   `decoding="async"`: 非同期デコード

### 10.2 使用箇所と最適化戦略

| 画像の種類 | 優先度 | width | quality | 理由 |
| :--- | :--- | :--- | :--- | :--- |
| **記事カバー画像** | `priority={true}` | 1920px | 90% | LCPの最有力候補。最高品質で最速表示 |
| **一覧ページのサムネイル（上位2件）** | `priority={true}` | 800px | 85% | ファーストビューのため優先読み込み |
| **一覧ページのサムネイル（3件目以降）** | `priority={false}` | 800px | 85% | 遅延読み込みでパフォーマンス維持 |
| **記事内の画像** | `priority={false}` | 1200px | 85% | スクロール時に読み込み |

### 10.3 Cloudflare設定（astro.config.mjs）

```javascript
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    imageService: 'cloudflare', // ★重要: Cloudflare Image Resizingを有効化
  }),
});
```

### 10.4 パフォーマンス目標

この実装により、以下のLighthouseスコアを目指す：

*   **LCP (Largest Contentful Paint):** < 1.2秒 (Good)
*   **FID (First Input Delay):** < 100ms (Good)
*   **CLS (Cumulative Layout Shift):** < 0.1 (Good)
*   **Performance Score:** 95点以上

### 10.5 開発者向けメモ

*   **画像URL要件:** Cloudflare Image Resizingは、同じゾーン内の画像、またはCloudflareを経由する画像にのみ適用されます。外部URLの場合は、Cloudflare Workersで画像をプロキシする必要があります。
*   **キャッシュ戦略:** Cloudflare CDNは自動的に最適化された画像をエッジキャッシュに保存し、2回目以降のアクセスは超高速で配信されます。
*   **コスト:** Cloudflare Pages Proプランでは、Image Resizingは無制限に利用可能です（Freeプランでは制限あり）。