import { load } from 'cheerio';
import { createHash } from 'node:crypto';
import matter from 'gray-matter';
import katex from 'katex';
import highlight from 'highlight.js';
import codeLanguages from '../data/code-languages.json';
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
  articles?: Record<string, LinkMetadata>;
};

export type MarkdownOptions = {
  siteUrl?: string;
  metadata?: Record<string, LinkMetadata>;
  embeds?: Record<string, string>;
  slug?: string;
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
 * Add the legacy extensions missing from @void/md before it renders the
 * Markdown. Parsing is used only for source positions: @void/md remains the
 * Markdown renderer, including tables, HTML, and footnotes.
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
      const html = katex.renderToString(node.value ?? '', {
        displayMode: display,
        throwOnError: true,
        strict: 'ignore',
        trust: false,
      });
      // Inline HTML still passes through Markdown's emphasis/attribute parser.
      // Keep TeX (especially subscripts and braces) opaque until HTML emission.
      const encoded = Buffer.from(html).toString('base64');
      replacements.push({
        start,
        end,
        value: display
          ? `<div class="math math-display" data-blog-math="${encoded}"></div>`
          : `<span class="math math-inline" data-blog-math="${encoded}"></span>`,
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
  // Match the previous renderer's quote/list boundaries instead of absorbing
  // unmarked lines as CommonMark lazy continuations.
  for (const match of body.matchAll(/^((?:>|[-+*] )[^\n]*\n)(?=[^>\s*+-])/gm)) {
    const end = match.index! + match[0].length;
    const inCode = (node: Node): boolean =>
      (node.type === 'code' &&
        (node.position?.start.offset ?? Infinity) <= end &&
        (node.position?.end.offset ?? -1) >= end) ||
      (node.children ?? []).some(inCode);
    if (!inCode(tree)) replacements.push({ start: end, end, value: '\n' });
  }
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

  $('[data-blog-math]').each((_, element) => {
    const item = $(element);
    item.html(Buffer.from(item.attr('data-blog-math')!, 'base64').toString());
    item.removeAttr('data-blog-math');
  });
  // Eager images keep their original dimensions before scrolling and avoid
  // layout jumps in articles containing screenshots.
  $('img').removeAttr('loading');

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
    wrapper.replaceWith(pre);
  });
  $('pre code').each((_, element) => {
    const code = $(element);
    const text = code.text();
    const declared = code.attr('class')?.match(/(?:^|\s)language-([^\s]+)/)?.[1];
    // Retain the old detector's guesses for existing unlabelled snippets.
    // New snippets still use automatic language detection.
    const cached = (codeLanguages as Record<string, string>)[
      createHash('sha256').update(text).digest('hex')
    ];
    const language = declared ?? cached;
    const result =
      language && highlight.getLanguage(language)
        ? highlight.highlight(language, text, true)
        : highlight.highlightAuto(text);
    code
      .html(result.value)
      .attr(
        'class',
        `hljs${(language ?? result.language) ? ` language-${language ?? result.language}` : ''}`,
      );
    code.parent('pre').removeAttr('class').removeAttr('style').removeAttr('tabindex');
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
  $('sup.footnote-ref a').each((index, element) => {
    const anchor = $(element);
    anchor.addClass('footnote-ref').text(String(index + 1));
  });
  $('a.footnote-backref').text('↩');
  $('.footnotes > ol > li').each((_, element) => {
    const item = $(element);
    item.find('a.footnote-backref').slice(1).remove();
    item.children('p').each((_, paragraph) => {
      $(paragraph)
        .find('a.footnote-backref')
        .each((_, anchor) => {
          const previous = anchor.prev;
          if (previous?.type === 'text') previous.data = previous.data.trimEnd();
        });
      $(paragraph).replaceWith($(paragraph).contents());
    });
  });
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
    const statusId =
      url.hostname === 'twitter.com' ? url.pathname.match(/\/status\/(\d+)/)?.[1] : undefined;
    const embed =
      options.embeds?.[href] ??
      options.embeds?.[url.href] ??
      (statusId
        ? Object.entries(options.embeds ?? {}).find(([key]) =>
            new URL(key).pathname.endsWith(`/status/${statusId}`),
          )?.[1]
        : undefined);
    if (embed) {
      paragraph.replaceWith(embed);
      return;
    }
    const snapshot = options.metadata?.[href] ?? options.metadata?.[url.href];
    const metadata = (options.slug && snapshot?.articles?.[options.slug]) || snapshot;
    if (!metadata?.title) return;
    const cardUrl = new URL(metadata.url ?? href, siteUrl);
    const link = $('<a></a>').attr(
      'href',
      cardUrl.origin === siteUrl.origin
        ? cardUrl.pathname + cardUrl.search + cardUrl.hash
        : cardUrl.href,
    );
    const resource = (value?: string) => {
      if (!value) return;
      const resolved = new URL(value, cardUrl);
      return /^https?:$/.test(resolved.protocol) ? resolved.href : undefined;
    };
    const details = $('<div></div>');
    details.append($('<strong></strong>').text(metadata.title));
    if (metadata.description)
      details.append($('<q></q>').attr('cite', cardUrl.href).text(metadata.description));
    details.append($('<cite></cite>').text(cardUrl.hostname));
    link.append(details);
    const image = resource(metadata.image);
    if (image) link.append($('<img>').attr({ src: image, alt: '', loading: 'lazy' }));
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
          code: transformReactModule(code, {
            ...options,
            slug: id.match(/\/pages\/posts\/([^/]+)\/index\.md(?:\?|$)/)?.[1],
            footnotes: footnotes.get(id),
          }),
          map: null,
        };
      },
    },
  ];
}
