import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import yaml from 'js-yaml';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import type { Plugin } from 'vite-plus';

export const SITE_URL = 'https://6715.jp';
const AVATAR = 'https://res.cloudinary.com/narusejun/image/twitter_name/h_128/sekai67.jpg';

export interface Article {
  type: 'article';
  slug: string;
  title: string;
  date: string;
  updated: string;
  tags: string[];
  image?: string;
  description: string;
  body: string;
}

export interface External {
  type: 'external';
  title: string;
  date: string;
  tags: string[];
  url: string;
  publisher: string;
}

export type Entry = Article | External;

export interface Metadata {
  local?: boolean;
  title?: string;
  description?: string;
  image?: string;
  logo?: string;
  publisher?: string;
  date?: string;
  url: string;
}

export interface SiteContent {
  articles: Article[];
  externals: External[];
  entries: Entry[];
  tags: string[];
  metadata: Record<string, Metadata>;
}

export function articleUrl(slug: string): string {
  return `${SITE_URL}/posts/${encodeURIComponent(slug)}/`;
}

export function tagUrl(tag: string): string {
  return `${SITE_URL}/tags/${encodeURIComponent(tag)}/`;
}

function isoDate(value: unknown, label: string): string {
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid ${label}: ${String(value)}`);
  return date.toISOString();
}

function tags(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.some((tag) => typeof tag !== 'string')) {
    throw new Error('Article tags must be an array of strings');
  }
  return value;
}

/** Match the old metadata description: textual HTML nodes, collapsed whitespace, 100 characters. */
export async function markdownDescription(source: string): Promise<string> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true });
  const tree = await processor.run(processor.parse(source));
  const texts: string[] = [];
  const visit = (node: unknown): void => {
    const item = node as { type?: string; value?: string; children?: unknown[] };
    if (item.type === 'text' && typeof item.value === 'string') texts.push(item.value);
    item.children?.forEach(visit);
  };
  visit(tree);
  const text = texts.join('').replace(/\s+/g, ' ');
  return text.length <= 100 ? text : `${text.slice(0, 99)}…`;
}

async function readJson<T>(filename: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(filename, 'utf8')) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return fallback;
    throw error;
  }
}

/** Read the source content and checked-in metadata snapshots. Ordinary builds never fetch the network. */
export async function buildSiteContent(root = process.cwd()): Promise<SiteContent> {
  const articleDir = path.join(root, 'articles');
  const files = (await readdir(articleDir)).filter((file) => file.endsWith('.md')).sort();
  const articles = await Promise.all(
    files.map(async (filename): Promise<Article> => {
      const slug = path.basename(filename, '.md');
      const raw = await readFile(path.join(articleDir, filename), 'utf8');
      const { data, content: body } = matter(raw);
      if (!data.date) throw new Error(`Missing publication date in articles/${filename}`);
      const date = isoDate(data.date, `${filename} date`);
      const updated = data.updated ? isoDate(data.updated, `${filename} updated`) : date;
      return {
        type: 'article',
        slug,
        title: typeof data.title === 'string' && data.title ? data.title : slug,
        date,
        updated,
        tags: tags(data.tags),
        ...(data.image ? { image: new URL(String(data.image), articleUrl(slug)).toString() } : {}),
        description: await markdownDescription(body),
        body,
      };
    }),
  );

  const externalCache = await readJson<Record<string, External>>(
    path.join(root, 'data/external.json'),
    {},
  );
  const externalDir = path.join(articleDir, 'external');
  let externalFiles: string[];
  try {
    externalFiles = (await readdir(externalDir)).filter((file) => /\.ya?ml$/.test(file)).sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    externalFiles = [];
  }
  const externals = await Promise.all(
    externalFiles.map(async (filename): Promise<External> => {
      const value = yaml.load(await readFile(path.join(externalDir, filename), 'utf8'));
      if (!value || typeof value !== 'object')
        throw new Error(`Invalid external article ${filename}`);
      const attrs = value as Record<string, unknown>;
      if (typeof attrs.url !== 'string') throw new Error(`Missing URL in ${filename}`);
      const cached = externalCache[attrs.url];
      const title = attrs.title ?? cached?.title;
      const date = attrs.date ?? cached?.date;
      const publisher = attrs.publisher ?? cached?.publisher;
      if (!title || !date || !publisher) {
        throw new Error(
          `Missing external metadata for ${attrs.url}. Set title, date and publisher in ${filename}, or refresh data/external.json.`,
        );
      }
      return {
        type: 'external',
        url: cached?.url ?? attrs.url,
        title: String(title),
        date: isoDate(date, `${filename} date`),
        publisher: String(publisher),
        tags: tags(attrs.tags),
      };
    }),
  );
  const entries: Entry[] = [...articles, ...externals].sort((a, b) => b.date.localeCompare(a.date));
  const allTags = [...new Set(entries.flatMap((entry) => entry.tags))];
  const metadata = await readJson<Record<string, Metadata>>(
    path.join(root, 'data/link-metadata.json'),
    {},
  );
  for (const article of articles) {
    const url = articleUrl(article.slug);
    metadata[url] = {
      local: true,
      url,
      title: article.title,
      date: article.date,
      description: article.description,
      image: article.image ?? AVATAR,
      logo: AVATAR,
    };
  }
  return { articles, externals, entries, tags: allTags, metadata };
}

function xml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]!,
  );
}

export function sitemap(content: SiteContent): string {
  const latest = (entries: Entry[]) =>
    entries
      .map((entry) => (entry.type === 'article' ? entry.updated : entry.date))
      .sort()
      .at(-1) ?? new Date(0).toISOString();
  const urls = [
    { loc: `${SITE_URL}/`, lastmod: latest(content.entries) },
    ...content.articles.map((article) => ({
      loc: articleUrl(article.slug),
      lastmod: article.updated,
    })),
    ...content.tags.map((tag) => ({
      loc: tagUrl(tag),
      lastmod: latest(content.entries.filter((entry) => entry.tags.includes(tag))),
    })),
  ];
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls
      .map(
        ({ loc, lastmod }) =>
          `  <url><loc>${xml(loc)}</loc><lastmod>${xml(lastmod)}</lastmod></url>`,
      )
      .join('\n') +
    '\n</urlset>\n'
  );
}

async function writeChanged(filename: string, value: string): Promise<void> {
  let existing: string | undefined;
  try {
    existing = await readFile(filename, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  if (existing !== value) {
    await mkdir(path.dirname(filename), { recursive: true });
    await writeFile(filename, value);
  }
}

/** Mirror sources so @void/md owns compilation, without moving or rewriting the original articles. */
export async function prepareContent(root = process.cwd()): Promise<SiteContent> {
  const content = await buildSiteContent(root);
  const pagesRoot = path.join(root, 'pages/posts');
  const manifestPath = path.join(pagesRoot, '.generated.json');
  const previous = await readJson<Record<string, string>>(manifestPath, {});
  const manifest: Record<string, string> = {};
  const writeOwned = async (relative: string, source: string) => {
    const destination = path.join(pagesRoot, relative);
    try {
      const existing = await readFile(destination, 'utf8');
      const hash = createHash('sha256').update(existing).digest('hex');
      if (existing !== source && previous[relative] !== hash) {
        throw new Error(`Refusing to overwrite a hand-edited generated page: ${destination}`);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    await writeChanged(destination, source);
    manifest[relative] = createHash('sha256').update(source).digest('hex');
  };
  for (const article of content.articles) {
    const source = await readFile(path.join(root, 'articles', `${article.slug}.md`), 'utf8');
    await writeOwned(`${article.slug}/index.md`, source);
    await writeOwned(
      `${article.slug}/index.server.ts`,
      `import { defineHead } from 'void';\n` +
        `import { articleHead } from '../../../src/lib/head';\n` +
        `import content from '../../../src/generated/content.json';\n` +
        `export const head = defineHead(() => articleHead(content.articles.find(article => article.slug === ${JSON.stringify(article.slug)})!));\n`,
    );
  }
  for (const [relative, expected] of Object.entries(previous)) {
    if (relative in manifest) continue;
    const filename = path.join(pagesRoot, relative);
    try {
      const existing = await readFile(filename, 'utf8');
      if (createHash('sha256').update(existing).digest('hex') !== expected) {
        throw new Error(`Refusing to remove a hand-edited generated page: ${filename}`);
      }
      await rm(filename);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
  await writeChanged(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await writeChanged(
    path.join(root, 'src/generated/content.json'),
    `${JSON.stringify(content, null, 2)}\n`,
  );
  await writeChanged(path.join(root, 'public/sitemap.xml'), sitemap(content));
  return content;
}

/** Restrict reloads to the authored source; generated pages must not cause restart loops. */
export function isContentSourceFile(filename: string, root = process.cwd()): boolean {
  const relative = path.relative(root, filename).split(path.sep).join('/');
  return relative.startsWith('articles/') || relative.startsWith('data/');
}

/** Restart the page graph on authored content changes, including newly added/deleted routes. */
export function contentPlugin(): Plugin {
  return {
    name: 'blog:content-source',
    configureServer(server) {
      const root = server.config.root;
      server.watcher.add([path.join(root, 'articles'), path.join(root, 'data')]);
      let pending: ReturnType<typeof setTimeout> | undefined;
      const changed = (_event: string, filename: string) => {
        if (!isContentSourceFile(filename, root)) return;
        clearTimeout(pending);
        pending = setTimeout(() => {
          // Re-evaluating vite.config.ts regenerates Markdown companions/data and
          // refreshes @void/md metadata plus Void's file-based route manifest.
          void server.restart().catch((error: unknown) => {
            server.config.logger.error(`Failed to refresh blog content: ${String(error)}`);
          });
        }, 100);
      };
      server.watcher.on('all', changed);
      server.httpServer?.once('close', () => {
        clearTimeout(pending);
        server.watcher.off('all', changed);
      });
    },
  };
}
