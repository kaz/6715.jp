import { readFile, readdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { load } from 'cheerio';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';

type Node = { type: string; url?: string; children?: Node[] };
type EmbedCache = Record<string, string>;

function tweetId(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      !['twitter.com', 'www.twitter.com', 'x.com', 'www.x.com'].includes(url.hostname)
    )
      return;
    return url.pathname.match(/^\/[^/]+\/status\/(\d+)\/?$/)?.[1];
  } catch {
    return;
  }
}

function standaloneTweets(markdown: string): string[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as Node;
  const urls: string[] = [];
  const visit = (node: Node) => {
    if (node.type === 'paragraph' && node.children?.length === 1) {
      const [child] = node.children;
      if (child.type === 'link' && child.url && tweetId(child.url)) urls.push(child.url);
    }
    node.children?.forEach(visit);
  };
  visit(tree);
  return urls;
}

function verifiedTweetHtml(html: unknown, id: string): html is string {
  if (typeof html !== 'string' || !html.trim()) return false;
  const $ = load(html, {}, false);
  if (!$('blockquote.twitter-tweet').length) return false;
  if (
    !$('blockquote.twitter-tweet a[href]')
      .toArray()
      .some((element) => tweetId($(element).attr('href')!) === id)
  )
    return false;
  // Official oEmbed responses contain only the Twitter widget loader, never inline code.
  return $('script')
    .toArray()
    .every(
      (element) =>
        $(element).attr('src') === 'https://platform.twitter.com/widgets.js' &&
        !$(element).text().trim(),
    );
}

const root = process.cwd();
const cacheFile = path.join(root, 'data/embeds.json');
let cache: EmbedCache = {};
try {
  cache = JSON.parse(await readFile(cacheFile, 'utf8')) as EmbedCache;
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
}

const sources = await Promise.all(
  (await readdir(path.join(root, 'articles')))
    .filter((file) => file.endsWith('.md'))
    .map(async (file) => matter(await readFile(path.join(root, 'articles', file), 'utf8')).content),
);
const urls = [...new Set(sources.flatMap(standaloneTweets))];
const proxy =
  process.env.HTTPS_PROXY ??
  process.env.https_proxy ??
  process.env.HTTP_PROXY ??
  process.env.http_proxy;
let cursor = 0;
let refreshed = 0;
let failed = 0;

await Promise.all(
  Array.from({ length: Math.min(3, urls.length) }, async () => {
    while (cursor < urls.length) {
      const url = urls[cursor++];
      const id = tweetId(url)!;
      const endpoint = new URL('https://publish.twitter.com/oembed');
      endpoint.searchParams.set('url', url);
      endpoint.searchParams.set('omit_script', 'false');
      const request: RequestInit & { proxy?: string } = {
        signal: AbortSignal.timeout(10_000),
        ...(proxy ? { proxy } : {}),
      };
      try {
        // Bun supports the explicit proxy option; TLS verification stays enabled.
        const response = await fetch(endpoint, request);
        if (!response.ok) {
          failed++;
          console.log(
            `publish.twitter.com tweet ${id}: HTTP ${response.status}; existing cache preserved`,
          );
          await response.body?.cancel();
          continue;
        }
        const payload = (await response.json()) as { html?: unknown };
        if (!verifiedTweetHtml(payload.html, id)) {
          failed++;
          console.log(
            `publish.twitter.com tweet ${id}: HTTP ${response.status}, invalid embed; existing cache preserved`,
          );
          continue;
        }
        cache[url] = payload.html;
        refreshed++;
        console.log(`publish.twitter.com tweet ${id}: HTTP ${response.status}, cached`);
      } catch (error) {
        failed++;
        const name = error instanceof Error ? error.name : 'RequestError';
        const code = (error as { code?: unknown })?.code;
        const reason =
          typeof code === 'string' && /^[A-Z0-9_]+$/.test(code) ? `${name} (${code})` : name;
        console.log(`publish.twitter.com tweet ${id}: ${reason}; existing cache preserved`);
      }
    }
  }),
);

const serialized = `${JSON.stringify(Object.fromEntries(Object.entries(cache).sort(([a], [b]) => a.localeCompare(b))), null, 2)}\n`;
const temporary = `${cacheFile}.tmp`;
await writeFile(temporary, serialized);
await rename(temporary, cacheFile);
console.log(
  `Twitter embeds: ${urls.length} standalone tweets, ${refreshed} refreshed, ${failed} failed, ${Object.keys(cache).length} cached. Ordinary builds remain offline.`,
);
if (failed) process.exitCode = 1;
