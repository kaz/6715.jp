import { defineConfig } from 'vite-plus';
import { voidPlugin } from 'void';
import { voidReact } from '@void/react/plugin';
import { voidMarkdown } from '@void/md/plugin';
import tailwindcss from '@tailwindcss/vite';
import { contentPlugin, prepareContent } from './build/content';
import { blogMarkdown } from './build/markdown';
import { generateOgpImages } from './build/ogp';
import embeds from './data/embeds.json';

export default defineConfig(async () => {
  // Unit tests import build/ directly. Void's Cloudflare plugin would run them
  // inside workerd, so they get no app plugins.
  const content = process.env.VITEST ? undefined : await prepareContent();
  if (content) await generateOgpImages(content.articles);
  return {
    plugins: content
      ? [
          voidPlugin(),
          contentPlugin(),
          voidReact(),
          ...blogMarkdown({ metadata: content.metadata, embeds }),
          voidMarkdown({ shiki: { themes: { light: 'github-light', dark: 'github-light' } } }),
          tailwindcss(),
        ]
      : [],
    test: { include: ['build/**/*.test.ts'] },
    fmt: {
      singleQuote: true,
      ignorePatterns: ['articles/**', 'data/**', 'public/**'],
    },
    lint: {
      ignorePatterns: ['articles/**', 'data/**', 'public/**'],
    },
  };
});
