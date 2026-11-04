import type { ReactNode } from 'react';
import { useFrontmatter } from '@void/md';
import { ArticleHeader, SocialShare } from '../../src/components/blog';
import content from '../../src/lib/content';
import NativeShare from '../../src/components/NativeShare' with { island: 'idle' };

export default function PostLayout({ children }: { children: ReactNode }) {
  const frontmatter = useFrontmatter();
  const article = content.articles.find((entry) => entry.slug === frontmatter.__blogSlug);
  if (!article) throw new Error(`Unknown article: ${String(frontmatter.__blogSlug)}`);
  const title = `${article.title} | 6715.jp`;
  const url = `https://6715.jp/posts/${article.slug}/`;
  return (
    <main className="page-container">
      <ArticleHeader article={article} />
      <SocialShare title={title} url={url}>
        <NativeShare title={title} url={url} />
      </SocialShare>
      <article className="article-content">{children}</article>
      <SocialShare title={title} url={url}>
        <NativeShare title={title} url={url} />
      </SocialShare>
    </main>
  );
}
