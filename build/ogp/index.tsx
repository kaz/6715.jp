import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import satori, { type Font } from 'satori';
import type { Article } from '../content';
import { fonts, OgpImage, type OgpProps } from './image';

const WIDTH = 1200;
const HEIGHT = 630;

export async function loadFonts(root = process.cwd()): Promise<Font[]> {
  const require = createRequire(path.join(root, 'package.json'));
  return Promise.all(
    Object.values(fonts).map(async ({ file, ...font }) => ({
      ...font,
      data: await readFile(require.resolve(file)),
    })),
  );
}

export async function renderOgpImage(props: OgpProps, loadedFonts: Font[]): Promise<Buffer> {
  const svg = await satori(<OgpImage {...props} />, {
    width: WIDTH,
    height: HEIGHT,
    fonts: loadedFonts,
  });
  return new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng();
}

/**
 * Render public/ogp/<slug>.png for every article. Like the rest of the build this stays offline,
 * and images whose inputs are unchanged are kept, since the dev server reruns this on every edit.
 */
export async function generateOgpImages(articles: Article[], root = process.cwd()): Promise<void> {
  const outDir = path.join(root, 'public/ogp');
  const cachePath = path.join(root, 'node_modules/.cache/ogp.json');
  let previous: Record<string, string> = {};
  try {
    previous = JSON.parse(await readFile(cachePath, 'utf8'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  let existing: string[] = [];
  try {
    existing = await readdir(outDir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }

  const source = await readFile(path.join(root, 'build/ogp/image.tsx'), 'utf8');
  const avatar = await readFile(path.join(root, 'build/ogp/avatar.jpg'));
  let loadedFonts: Font[] | undefined;
  const cache: Record<string, string> = {};
  await mkdir(outDir, { recursive: true });
  for (const article of articles) {
    const filename = `${article.slug}.png`;
    const props: Omit<OgpProps, 'avatar'> = {
      title: article.title,
      date: article.date.slice(0, 10),
      tags: [...article.tags].sort((a, b) => a.localeCompare(b)),
    };
    const key = createHash('sha256')
      .update(JSON.stringify({ props, source }))
      .update(avatar)
      .digest('hex');
    cache[article.slug] = key;
    if (previous[article.slug] === key && existing.includes(filename)) continue;

    loadedFonts ??= await loadFonts(root);
    const png = await renderOgpImage(
      { ...props, avatar: `data:image/jpeg;base64,${avatar.toString('base64')}` },
      loadedFonts,
    );
    await writeFile(path.join(outDir, filename), png);
  }

  const expected = new Set(articles.map((article) => `${article.slug}.png`));
  await Promise.all(
    existing
      .filter((filename) => !expected.has(filename))
      .map((filename) => rm(path.join(outDir, filename), { force: true })),
  );
  await mkdir(path.dirname(cachePath), { recursive: true });
  await writeFile(cachePath, `${JSON.stringify(cache, null, 2)}\n`);
}
