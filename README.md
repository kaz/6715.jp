# 6715.jp

Void + React による静的ブログです。`bunx void init` の **Vite+ / React / Static Pages** テンプレートから構成しています（Void 1.1.12 に `unit` コマンドはありません）。他のメタフレームワークは使用していません。

## 開発

Node.js 24.21.0 以上と Bun 1.4.3 を使用します。

```sh
bun install --frozen-lockfile
bun run dev
```

記事は従来どおり `articles/<slug>.md`、画像は `public/posts/<slug>/` に置きます。記事・外部記事データの変更時は開発サーバーが再起動し、一覧・タグ・記事メタ情報も更新されます。生成される `pages/posts/` の数値ディレクトリーと `src/generated/` は直接編集しません。

## ビルドと確認

```sh
bun run check       # Vite+ のフォーマット・lint
bun run typecheck
bun run test        # Vite+ のコンテンツ生成・Markdown互換テスト
bun run build       # Vite+ + Void SSG → dist/client/
bun run preview
bun run test:e2e    # JavaScript無効のブラウザーで静的サイトを確認
```

ブラウザーテストはシステムの Chromium があれば使用し、それ以外は `bunx playwright install chromium` で用意します。`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` で指定も可能です。

`dist/client/` だけを静的ホストへ配置できます。Node サーバーや Worker は配信に不要です。全30記事・76タグのページ、`404.html`、`sitemap.xml`、画像を出力します。Void が生成する `posts/1.html` を `posts/1/index.html` に整え、既存の `/posts/1/` や `/tags/CTF/` を保ちます。GitHub Actions はこの出力を従来どおり `gh-pages` に配置します。

## Markdown と見た目

Markdown の実際のコンパイルは `@void/md` が担当します。`build/markdown.ts` はその前後で、KaTeX 数式、従来の脚注アンカー・リンクカード・外部リンク属性を補い、ドキュメント用のコピーボタン等を除去します。GFM の表・打ち消し、脚注、生 HTML、Shiki の構文強調を使用できます。数式の補完処理はコードフェンス・インラインコードを対象にしません。

Tailwind v4 は `src/styles.css` から使用しています。旧サイトが依存していたブラウザー標準の見出し・リスト・余白を維持するため preflight を導入せず、800px の本文幅、768px の切替幅、文字・余白・共有ボタンを従来に合わせています。

通常のビルドは外部サイトに接続しません。15件の外部記事情報と、以前に取得できていたリンクカードの情報は `data/external.json` と `data/link-metadata.json` に保存しています。外部記事を追加する際は YAML に `title`、`date`、`publisher` を指定するかスナップショットを追加してください。カード情報がないリンクは通常のリンクとして表示します。Twitter 埋め込みは `bun run content:refresh-embeds` で公式 oEmbed から `data/embeds.json` を更新できます（ネットワークが必要）。取得失敗時は既存の成功済みキャッシュを保持し、未取得分は従来どおりリンクで表示します。サイト名・プロフィールは `src/components/blog.tsx`、head と計測設定は `void.config.ts` / `src/lib/head.ts` にあります。

記事の更新日時は Git の最終変更日時を使用します。CI 等では履歴を含むチェックアウト（`fetch-depth: 0`）を使用してください。
