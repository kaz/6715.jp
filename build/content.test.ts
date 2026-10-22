import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import {
  buildSiteContent,
  isContentSourceFile,
  markdownDescription,
  prepareContent,
  sitemap,
} from './content';

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), '6715-content-'));
  roots.push(root);
  await mkdir(path.join(root, 'articles/external'), { recursive: true });
  await writeFile(
    path.join(root, 'articles/1.md'),
    '---\ntitle: Example\ndate: 2024-01-02\ntags: ["C++ & Web"]\nimage: preview.png\n---\n\nHello **world**.\n',
  );
  return root;
}

describe('source content generation', () => {
  it('preserves the full existing article and external-entry inventory offline', async () => {
    const content = await buildSiteContent();
    expect(content.articles).toHaveLength(30);
    expect(content.externals).toHaveLength(15);
    expect(content.entries).toHaveLength(45);
    expect(content.tags).toHaveLength(76);
    expect(content.entries[0].title).toBe('ISUCON11予選に参加した');
    expect(content.metadata['https://trap.jp/author/kaz/'].title).toContain('kaz');
    expect(content.metadata['https://github.com/kaz/kiritan-server'].url).toBe(
      'https://github.com/kaz/kiritan-voice',
    );
    expect(content.metadata['https://github.com/GUI/lua-resty-auto-ssl'].url).toBe(
      'https://github.com/auto-ssl/lua-resty-auto-ssl',
    );
    expect(content.metadata['http://qiita.com/advent-calendar/2016/conoha'].url).toBe(
      'https://qiita.com/advent-calendar/2016/conoha',
    );
  });

  it('copies source Markdown unchanged, updates owned mirrors, and removes deleted sources', async () => {
    const root = await fixture();
    await prepareContent(root);
    const source = path.join(root, 'articles/1.md');
    const generated = path.join(root, 'pages/posts/1/index.md');
    expect(await readFile(generated, 'utf8')).toBe(await readFile(source, 'utf8'));
    expect(await readFile(path.join(root, 'pages/posts/1/index.server.ts'), 'utf8')).toContain(
      'article.slug === "1"',
    );
    await writeFile(source, (await readFile(source, 'utf8')).replace('world', 'everyone'));
    await prepareContent(root);
    expect(await readFile(generated, 'utf8')).toContain('everyone');
    await rm(source);
    await prepareContent(root);
    await expect(readFile(generated)).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(readFile(path.join(root, 'pages/posts/1/index.server.ts'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });

  it('protects a generated file edited by hand', async () => {
    const root = await fixture();
    await prepareContent(root);
    await writeFile(path.join(root, 'pages/posts/1/index.md'), 'Local edit');
    await expect(prepareContent(root)).rejects.toThrow('hand-edited');
  });

  it('generates escaped canonical URLs and uses source dates without Git history', async () => {
    const content = await buildSiteContent(await fixture());
    expect(content.articles[0].updated).toBe('2024-01-02T00:00:00.000Z');
    expect(content.articles[0].image).toBe('https://6715.jp/posts/1/preview.png');
    expect(sitemap(content)).toContain('https://6715.jp/tags/C%2B%2B%20%26%20Web/');
    expect(sitemap(content)).toContain('<lastmod>2024-01-02T00:00:00.000Z</lastmod>');
  });

  it('reports missing external metadata instead of silently dropping entries', async () => {
    const root = await fixture();
    await writeFile(path.join(root, 'articles/external/new.yml'), 'url: https://example.com/new\n');
    await expect(buildSiteContent(root)).rejects.toThrow('Missing external metadata');
  });

  it('creates text descriptions with Markdown and math syntax removed and length bounded', async () => {
    expect(await markdownDescription('Hello **world** and [a link](https://example.com).')).toBe(
      'Hello world and a link.',
    );
    expect(await markdownDescription('The value is $x^2$.')).toBe('The value is x^2.');
    const text = await markdownDescription('a'.repeat(120));
    expect(text).toHaveLength(100);
    expect(text.endsWith('…')).toBe(true);
  });

  it('watches original articles and metadata without looping over generated files', () => {
    expect(isContentSourceFile('/blog/articles/1.md', '/blog')).toBe(true);
    expect(isContentSourceFile('/blog/data/external.json', '/blog')).toBe(true);
    expect(isContentSourceFile('/blog/pages/posts/1/index.md', '/blog')).toBe(false);
    expect(isContentSourceFile('/blog/src/generated/content.json', '/blog')).toBe(false);
    expect(isContentSourceFile('/elsewhere/articles/1.md', '/blog')).toBe(false);
  });
});
