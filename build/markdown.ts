import { load } from 'cheerio';
import matter from 'gray-matter';
import katex from 'katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import type { Plugin } from 'vite-plus';

export type LinkMetadata = {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
};

export type MarkdownOptions = {
  siteUrl?: string;
  metadata?: Record<string, LinkMetadata>;
  embeds?: Record<string, string>;
};

type Node = {
  type: string;
  value?: string;
  lang?: string | null;
  identifier?: string;
  children?: Node[];
  position?: { start: { offset?: number }; end: { offset?: number } };
};

type Replacement = { start: number; end: number; value: string };

/**
 * Add the two legacy extensions missing from @void/md before it renders the
 * Markdown. Parsing is used only for source positions: @void/md remains the
 * Markdown renderer, including tables, HTML, footnotes, and highlighting.
 */
export function transformMarkdown(
  source: string,
  slug?: string,
): {
  markdown: string;
  footnotes: string[];
} {
  const frontmatter = source.match(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/)?.[0] ?? '';
  const body = source.slice(frontmatter.length);
  const tree = unified().use(remarkParse).use(remarkGfm).use(remarkMath).parse(body) as Node;
  const replacements: Replacement[] = [];
  const footnotes: string[] = [];

  function visit(node: Node) {
    const start = node.position?.start.offset;
    const end = node.position?.end.offset;
    if ((node.type === 'math' || node.type === 'inlineMath') && start != null && end != null) {
      const display = node.type === 'math';
      const html = katex
        .renderToString(node.value ?? '', {
          displayMode: display,
          throwOnError: true,
          strict: 'ignore',
          trust: false,
        })
        .replace(/\r?\n/g, '&#10;');
      replacements.push({
        start,
        end,
        value: display
          ? `<div class="math math-display">${html}</div>`
          : `<span class="math math-inline">${html}</span>`,
      });
      return;
    }
    if (node.type === 'code' && node.lang === 'C' && start != null && end != null) {
      const original = body.slice(start, end);
      replacements.push({
        start,
        end,
        value: original.replace(/^(`{3,}|~{3,})C(?=\s|$)/, '$1c'),
      });
      return;
    }
    if (
      node.type === 'footnoteReference' &&
      node.identifier &&
      !footnotes.includes(node.identifier)
    ) {
      footnotes.push(node.identifier);
    }
    for (const child of node.children ?? []) visit(child);
  }

  visit(tree);
  let markdown = body;
  for (const replacement of replacements.sort((a, b) => b.start - a.start)) {
    markdown =
      markdown.slice(0, replacement.start) + replacement.value + markdown.slice(replacement.end);
  }
  return {
    markdown:
      slug === undefined
        ? frontmatter + markdown
        : matter.stringify(markdown, { ...matter(source).data, __blogSlug: slug }),
    footnotes,
  };
}

/** Restore the blog's HTML conventions after @void/md's React emitter. */
export function transformHtml(
  html: string,
  options: MarkdownOptions & { footnotes?: string[] } = {},
): string {
  const $ = load(html, { xml: false }, false);
  const siteUrl = new URL(options.siteUrl ?? 'https://6715.jp/');

  // These are documentation UI added by @void/md, absent from the old blog.
  $('a.header-anchor').each((_, element) => {
    const following = element.next;
    if (following?.type === 'text') following.data = following.data.trimStart();
    $(element).remove();
  });
  $('s').each((_, element) => {
    element.name = 'del';
  });
  $('script').each((_, element) => {
    if ($(element).text().includes('window.__voidMdCopy')) $(element).remove();
  });
  $('div[class*="language-"]').each((_, element) => {
    const wrapper = $(element);
    const pre = wrapper.children('pre');
    if (!pre.length) return;
    const language = wrapper.attr('class')?.match(/(?:^|\s)language-([^\s]*)/)?.[1];
    if (language) pre.children('code').addClass(`language-${language}`);
    // Preserve Shiki token colors while letting the blog supply the background.
    const style = pre.attr('style')?.replace(/(?:^|;)\s*background-color\s*:[^;]*/g, '');
    if (style) pre.attr('style', style);
    else pre.removeAttr('style');
    wrapper.replaceWith(pre);
  });

  const footnotes = options.footnotes ?? [];
  const footnoteAnchor = (value: string): string =>
    value.replace(/^(#?)(fnref|fn)(\d+)(?::(\d+))?$/, (original, hash, kind, number, repeat) => {
      const label = footnotes[Number(number) - 1];
      return label ? `${hash}${kind}-${label}${repeat ? `-${Number(repeat) + 1}` : ''}` : original;
    });
  $('[id], a[href^="#"]').each((_, element) => {
    const item = $(element);
    const id = item.attr('id');
    const href = item.attr('href');
    if (id) item.attr('id', footnoteAnchor(id));
    if (href) item.attr('href', footnoteAnchor(href));
  });
  $('sup.footnote-ref a').each((_, element) => {
    const anchor = $(element);
    anchor.addClass('footnote-ref').text(anchor.text().replace(/^\[(\d+)\]$/, '$1'));
  });
  $('a.footnote-backref').text('↩');
  $('section.footnotes').each((_, element) => {
    const section = $(element);
    const separator = section.prev('hr.footnotes-sep');
    const replacement = $('<div class="footnotes"></div>');
    if (separator.length) {
      separator.removeClass('footnotes-sep');
      if (!separator.attr('class')) separator.removeAttr('class');
    }
    replacement.append(separator.length ? separator : $('<hr>'));
    replacement.append(section.contents());
    section.replaceWith(replacement);
  });

  $('p').each((_, element) => {
    const paragraph = $(element);
    if (paragraph.closest('.footnotes').length) return;
    const content = paragraph
      .contents()
      .filter((_, node) => node.type !== 'text' || !!node.data.trim());
    if (content.length !== 1 || content[0]?.type !== 'tag' || content[0].name !== 'a') return;
    const anchor = $(content[0]);
    const href = anchor.attr('href');
    if (!href) return;
    let url: URL;
    try {
      url = new URL(href, siteUrl);
    } catch {
      return;
    }
    // Snapshot the same oEmbed-first behavior as the old renderer, without
    // introducing a network dependency into ordinary static builds.
    const embed = options.embeds?.[href] ?? options.embeds?.[url.href];
    if (embed) {
      paragraph.replaceWith(embed);
      return;
    }
    const metadata = options.metadata?.[href] ?? options.metadata?.[url.href];
    if (!metadata?.title) return;
    const cardUrl = new URL(metadata.url ?? href, siteUrl);
    const link = $('<a></a>').attr(
      'href',
      cardUrl.origin === siteUrl.origin
        ? cardUrl.pathname + cardUrl.search + cardUrl.hash
        : cardUrl.href,
    );
    if (metadata.image) {
      const image = new URL(metadata.image, cardUrl);
      if (/^https?:$/.test(image.protocol))
        link.attr('style', `background-image:url(${JSON.stringify(image.href)})`);
    }
    const details = $('<div></div>');
    details.append($('<strong></strong>').text(metadata.title));
    details.append($('<cite></cite>').text(cardUrl.hostname));
    details.append(
      $('<q></q>')
        .attr('cite', cardUrl.href)
        .text(metadata.description ?? ''),
    );
    link.append(details);
    paragraph.replaceWith($('<aside></aside>').append(link));
  });

  $('a[href]').each((_, element) => {
    const anchor = $(element);
    const href = anchor.attr('href')!;
    if (!/^(?:https?:)?\/\//.test(href)) return;
    const url = new URL(href, siteUrl);
    if (url.origin !== siteUrl.origin) {
      anchor.attr('target', '_blank').attr('rel', 'noopener noreferrer');
    } else {
      anchor.removeAttr('target').removeAttr('rel');
    }
  });
  return $.root().html() ?? '';
}

export function transformReactModule(
  code: string,
  options: MarkdownOptions & { footnotes?: string[] } = {},
): string {
  return code.replace(/\b__html:\s*("(?:\\.|[^"\\])*")/g, (_match, literal: string) => {
    const html = JSON.parse(literal) as string;
    return `__html: ${JSON.stringify(transformHtml(html, options))}`;
  });
}

/** Include before voidMarkdown() in the Vite plugin array. */
export function blogMarkdown(options: MarkdownOptions = {}): Plugin[] {
  const footnotes = new Map<string, string[]>();
  return [
    {
      name: 'blog-markdown-extensions',
      enforce: 'pre',
      transform(code, id) {
        if (!/\.md(?:\?|$)/.test(id)) return;
        const slug = id.match(/\/pages\/posts\/([^/]+)\/index\.md(?:\?|$)/)?.[1];
        const result = transformMarkdown(code, slug);
        footnotes.set(id, result.footnotes);
        return { code: result.markdown, map: null };
      },
    },
    {
      name: 'blog-markdown-html',
      enforce: 'post',
      transform(code, id) {
        if (!/\.md(?:\?|$)/.test(id) || !code.includes('__html:')) return;
        return {
          code: transformReactModule(code, { ...options, footnotes: footnotes.get(id) }),
          map: null,
        };
      },
    },
  ];
}
