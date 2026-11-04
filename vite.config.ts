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
  const content = await prepareContent();
  await generateOgpImages(content.articles);
  return {
    plugins: [
      voidPlugin(),
      contentPlugin(),
      voidReact(),
      ...blogMarkdown({ metadata: content.metadata, embeds }),
      voidMarkdown({ shiki: { themes: { light: 'github-light', dark: 'github-light' } } }),
      tailwindcss(),
    ],
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
