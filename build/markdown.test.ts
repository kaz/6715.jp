import { describe, expect, it } from 'vite-plus/test';
import { load } from 'cheerio';
import matter from 'gray-matter';
import { transformHtml, transformMarkdown, transformReactModule } from './markdown';

describe('Markdown compatibility around @void/md', () => {
  it('identifies duplicate or untitled articles by source slug without rewriting their source', () => {
    const source = '---\ntitle: Same title\ndate: 2024-01-02\n---\n\nOriginal **body**.\n';
    const first = matter(transformMarkdown(source, '31').markdown);
    const second = matter(transformMarkdown(source, '32').markdown);
    expect(first.data.title).toBe(second.data.title);
    expect(first.data.__blogSlug).toBe('31');
    expect(second.data.__blogSlug).toBe('32');
    expect(first.content).toBe(matter(source).content);
    expect(source).not.toContain('__blogSlug');
    expect(matter(transformMarkdown('No frontmatter.', '33').markdown).data.__blogSlug).toBe('33');
    expect(transformMarkdown(source).markdown).toBe(source);
  });

  it('renders inline and display math while preserving code and frontmatter', () => {
    const source =
      '---\ntitle: "$untouched$"\n---\n\nMath $x^2$ and `$code$`.\n\n$$\n\\begin{pmatrix}1 & 0 \\\\ 0 & 1\\end{pmatrix}\n$$\n\n```C\nprintf("$notmath$");\n```\n';
    const { markdown } = transformMarkdown(source);
    expect(markdown).toContain('title: "$untouched$"');
    expect(markdown).toContain('class="math math-inline"');
    expect(markdown).toContain('class="math math-display"');
    expect(markdown).toContain('`$code$`');
    expect(markdown).toContain('```c\nprintf("$notmath$");');
    expect(markdown).not.toContain('Math $x^2$');
  });

  it('preserves symbolic footnote anchors and distinguishes repeated references', () => {
    const { footnotes } = transformMarkdown(
      'A[^team] B[^goaway] C[^goaway].\n\n[^team]: Team.\n[^goaway]: Protocol.',
    );
    expect(footnotes).toEqual(['team', 'goaway']);
    const html = transformHtml(
      '<p><sup class="footnote-ref"><a href="#fn2" id="fnref2">[2]</a></sup><sup class="footnote-ref"><a href="#fn2" id="fnref2:1">[2]</a></sup></p><hr class="footnotes-sep"><section class="footnotes"><ol><li id="fn2"><p>Protocol <a href="#fnref2" class="footnote-backref">↩︎</a> <a href="#fnref2:1" class="footnote-backref">↩︎</a></p></li></ol></section>',
      { footnotes },
    );
    expect(html).toContain('href="#fn-goaway"');
    expect(html).toContain('id="fnref-goaway-2"');
    expect(html).not.toContain('href="#fnref-goaway-2"');
    expect(html).toContain('<div class="footnotes"><hr><ol>');
    expect(html).not.toContain('[2]');
  });

  it('keeps raw HTML and escaped code, and strips documentation controls', () => {
    const html = transformHtml(
      '<h2 id="title"><a class="header-anchor" aria-hidden="true" href="#title">#</a> Title</h2><p><span style="font-size:1.5em"><strong>†単純†</strong></span><s>outdated</s></p><div class="language-html"><button class="copy"></button><span class="lang">html</span><pre style="background-color:#fff;color:#123"><code><span>&lt;script&gt;alert(1)&lt;/script&gt;</span></code></pre></div><script>window.__voidMdCopy=1</script>',
    );
    expect(html).toContain('<span style="font-size:1.5em"><strong>†単純†</strong></span>');
    expect(load(html)('pre code').text()).toBe('<script>alert(1)</script>');
    expect(load(html)('pre code').hasClass('language-html')).toBe(true);
    expect(html).not.toContain('header-anchor');
    expect(html).not.toContain('button');
    expect(html).not.toContain('__voidMdCopy');
    expect(html).not.toContain('style="background-color');
    expect(html).toContain('<h2 id="title">Title</h2>');
    expect(html).toContain('<del>outdated</del>');
  });

  it('keeps TeX subscripts and braces opaque until HTML emission', () => {
    const { markdown } = transformMarkdown('$\\mathbf{x}_{k+1}$ and $\\mathbf{x}_k$.');
    const html = transformHtml(markdown);
    const $ = load(html);
    expect(
      $('annotation')
        .map((_, e) => $(e).text())
        .toArray(),
    ).toEqual(['\\mathbf{x}_{k+1}', '\\mathbf{x}_k']);
    expect($('.math-inline em, .math-inline strong')).toHaveLength(0);
    expect(html).not.toContain('data-blog-math');
  });

  it('ends unmarked quote and list continuations without changing code', () => {
    const source = '>PASS\nREJECTED\n\n- first\n- last\nOutside\n\n```\n>literal\ncode\n```\n';
    const { markdown } = transformMarkdown(source);
    expect(markdown).toContain('>PASS\n\nREJECTED');
    expect(markdown).toContain('- last\n\nOutside');
    expect(markdown).toContain('```\n>literal\ncode\n```');
  });

  it('restores legacy syntax colors, including auto-detected SQL', () => {
    const html = transformHtml(
      '<pre class="shiki" style="color:#123"><code><span>select * from `isu_condition` where `jia_isu_uuid` = ? order by `timestamp`\n</span></code></pre>',
    );
    const $ = load(html);
    expect($('pre').attr('class')).toBeUndefined();
    expect($('code').hasClass('hljs')).toBe(true);
    expect($('.hljs-keyword').first().text()).toBe('select');
    expect($('code').text()).toContain('where `jia_isu_uuid` = ?');
  });

  it('makes cards only from standalone links with known metadata', () => {
    const html = transformHtml(
      '<p><a href="/posts/1/">First</a></p><p>Inline <a href="https://example.com/">link</a></p><p><a href="https://missing.example/">Missing</a></p>',
      {
        metadata: {
          'https://6715.jp/posts/1/': {
            title: 'First <post>',
            description: 'A & B',
            image: '1.png',
          },
        },
      },
    );
    expect(html).toContain('<aside><a href="/posts/1/"');
    expect(html).toContain('<strong>First &lt;post&gt;</strong>');
    expect(html).toContain('<q cite="https://6715.jp/posts/1/">A &amp; B</q>');
    expect(html).toContain(
      '<p>Inline <a href="https://example.com/" target="_blank" rel="noopener noreferrer">',
    );
    expect(html).toContain('<p><a href="https://missing.example/"');
  });

  it('uses saved embed HTML before cards and keeps unavailable or inline embeds as links', () => {
    const href = 'https://twitter.com/example/status/123';
    const missing = 'https://twitter.com/example/status/456';
    const snapshot = `<blockquote class="twitter-tweet"><p>Saved tweet</p><a href="${href}">Date</a></blockquote><script async src="https://platform.twitter.com/widgets.js"></script>`;
    const html = transformHtml(
      `<p><a href="${href}">${href}</a></p><p>Inline <a href="${href}">tweet</a></p><p><a href="${missing}">${missing}</a></p>`,
      {
        embeds: { [href]: snapshot },
        metadata: { [href]: { title: 'A card that must not replace the embed' } },
      },
    );
    expect(html).toContain('<blockquote class="twitter-tweet"><p>Saved tweet</p>');
    expect(load(html)('script').attr('src')).toBe('https://platform.twitter.com/widgets.js');
    expect(html).not.toContain('<aside>');
    expect(html).toContain(
      `<p>Inline <a href="${href}" target="_blank" rel="noopener noreferrer">tweet</a></p>`,
    );
    expect(html).toContain(`<p><a href="${missing}" target="_blank" rel="noopener noreferrer">`);
  });

  it('rewrites only HTML JSON literals without interpreting JavaScript escapes', () => {
    const code =
      'const untouched = "__html in prose"; React.createElement("div", { dangerouslySetInnerHTML: { __html: "<p>A \\\"quoted\\\" value <a href=\\\"https://example.com\\\">link</a></p>" } });';
    const transformed = transformReactModule(code);
    expect(transformed).toContain('const untouched = "__html in prose";');
    const literal = transformed.match(/__html: ("(?:\\.|[^"\\])*")/)?.[1];
    expect(JSON.parse(literal!)).toContain('A "quoted" value');
    expect(JSON.parse(literal!)).toContain('rel="noopener noreferrer"');
  });
});
