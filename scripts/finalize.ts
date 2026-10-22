import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import content from '../src/generated/content.json';

// Void emits posts/1.html. Preserve the blog's existing /posts/1/ URLs on any
// static host, including hosts without an extensionless-HTML rewrite feature.
const output = path.resolve('dist/client');
for (const directory of ['posts', 'tags']) {
  const root = path.join(output, directory);
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
    const destination = path.join(root, entry.name.slice(0, -5));
    await mkdir(destination, { recursive: true });
    await rename(path.join(root, entry.name), path.join(destination, 'index.html'));
  }
}

// Void merges meta tags by property. Article tags are intentionally repeated,
// so preserve every tag in the static document rather than only the last one.
const attribute = (value: string) =>
  value.replace(
    /[&<>"]/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]!,
  );
for (const article of content.articles) {
  const filename = path.join(output, 'posts', article.slug, 'index.html');
  const html = await readFile(filename, 'utf8');
  const tags = article.tags
    .map((tag) => `<meta property="article:tag" content="${attribute(tag)}">`)
    .join('\n');
  const updated = html
    .replace(/<meta\b(?=[^>]*\bproperty=["']article:tag["'])[^>]*>\s*/g, '')
    .replace('</head>', `${tags}\n</head>`);
  await writeFile(filename, updated);
}
console.log('Static output: dist/client (original trailing-slash URLs preserved)');
