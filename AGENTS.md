# 6715.jp

Void + React で作る静的ブログです。`bunx void init` の Vite+ / React / Static Pages テンプレートを元にしています。Bun と Node.js は [aqua](https://aquaproj.github.io/) で `aqua.yaml` のバージョンを入れます（`aqua i`）。スクリプトは Bun で実行しますが、ビルド時のプリレンダーと `void deploy` には Node.js も必要です。

## コマンド

```sh
bun install --frozen-lockfile
bun run dev
bun run check       # Vite+ のフォーマット・lint
bun run typecheck
bun run test        # コンテンツ生成・Markdown のテスト
bun run build       # Vite+ + Void SSG → dist/client/
bun run preview
bun run test:e2e    # JavaScript を無効にしたブラウザーで静的サイトを確認
```

ブラウザーテストはシステムの Chromium があれば使い、なければ `bunx playwright install chromium` で用意します。`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` で指定もできます。

## 記事

- 記事は `articles/<slug>.md`、画像は `public/posts/<slug>/` に置く。外部記事は `articles/external/*.yml` に `title`・`date`・`publisher` を書く。
- `pages/posts/` の数値ディレクトリーと `src/generated/` はビルド時に生成されるので直接編集しない。
- 記事のフロントマターには `date`（公開日）を必ず書く。ない記事はビルドが失敗する。sitemap の `lastmod` は `updated` があればそれ、なければ `date` を使う。
- コードブロックには言語を書く（` ```sql `、ログや出力は ` ```plaintext `、シェルのセッションは ` ```console `）。言語名は Shiki のもの（例: アセンブリは ` ```asm `）。言語のないコードや Shiki が知らない言語は色付けしない。

## Markdown と見た目

- Markdown は `@void/md` がコンパイルする。`build/markdown.ts` がその前後で KaTeX 数式、脚注アンカー、リンクカード、Twitter 埋め込み、外部リンク属性を補い、`@void/md` が足すドキュメント用 UI（見出しアンカー・コピーボタン）を取り除く。数式は Markdown に再解釈されないよう一時的に保護し、HTML の生成後に展開する。
- コードの色付けは `@void/md` 標準の Shiki（`vite.config.ts` で github-light テーマを指定）。`build/markdown.ts` は言語ラベルとコピーボタンを外し、背景色はサイトの CSS に任せる。
- Tailwind は `src/styles.css` から使う。旧サイトのブラウザー標準の見出し・リスト・余白を保つため preflight は入れていない。
- サイト名・プロフィールは `src/components/blog.tsx`、head と計測設定は `void.config.ts` と `src/lib/head.ts`。
- サイトタイトルのフォント（Exo 2）は `@fontsource/exo-2` から読み込む。

## 外部データ

通常のビルドはネットワークに接続しない。

- リンクカードの情報は `data/link-metadata.json`、外部記事の情報は `data/external.json` に保存している。同じ URL でも記事によって内容が違うカードは `articles` フィールドで持つ。カード情報がないリンクは通常のリンクになる。
- Twitter 埋め込みは `data/embeds.json`。`bun run content:refresh-embeds` で公式 oEmbed から更新できる（ネットワークが必要）。取得に失敗したものは既存のキャッシュを残し、未取得分はリンクで表示する。

## OGP 画像

`build/ogp/` が satori + resvg で記事タイトルから `public/ogp/<slug>.png` を生成する（フロントマターに `image` があればそちらを使う）。デザインは `build/ogp/image.tsx`。フォントは npm パッケージの TTF、アイコンは `build/ogp/avatar.jpg` を使う。入力が変わらない画像は再生成しない。

## デプロイ

- Cloudflare Workers（静的アセットのみ、Worker 名は `void.config.ts` の `cloudflare.name`）に `void deploy` で配置する。
- `bun run build` は Void が出力する `posts/1.html` を `scripts/finalize.ts` で `posts/1/index.html` に移し、既存の `/posts/1/`・`/tags/CTF/` の URL を保つ。そのため Void にビルドさせず、`bun run build` の後に `bunx void deploy --platform cloudflare --skip-build` を実行する。
- GitHub Actions の `check` が push のたびにチェック・テスト・ビルドを行い、`deploy` は手動実行（workflow_dispatch）でデプロイする。リポジトリーのシークレットに `CLOUDFLARE_API_TOKEN`（必要なら `CLOUDFLARE_ACCOUNT_ID`）を設定する。

<!--injected-by-void-v1.1.12-->

## Void

- This project uses [Void](https://void.cloud), a full-stack Vite framework for Cloudflare Workers with file-based API routing, server-rendered pages, and typed backend services.
- Use Void's CLI and typed APIs. Before working with Void, read the relevant Markdown docs in `node_modules/void/docs/`; start with `guide/quickstart.md` for setup and `reference/cli.md` for commands.

<!--/injected-by-void-->
