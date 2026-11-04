import type { ReactNode } from 'react';
import { LuExternalLink, LuMail, LuTag } from 'react-icons/lu';
import { SiGithub, SiHatenabookmark, SiX } from 'react-icons/si';

export type Entry = {
  type: 'article' | 'external';
  title: string;
  date: string;
  tags: string[];
  slug?: string;
  url?: string;
  publisher?: string;
};

export type Article = Entry & {
  type: 'article';
  slug: string;
  image?: string;
  description?: string;
};

export const SITE = {
  title: '6715.jp',
  url: 'https://6715.jp',
  author: 'sekai',
  avatar: 'https://res.cloudinary.com/narusejun/image/twitter_name/h_128/sekai67.jpg',
  copyright: '2016 sekai',
};

const icons = {
  github: { Icon: SiGithub, title: 'GitHub' },
  x: { Icon: SiX, title: 'X' },
  email: { Icon: LuMail, title: 'Email' },
  hatenabookmark: { Icon: SiHatenabookmark, title: 'Hatena Bookmark' },
} as const;

type SocialIconName = keyof typeof icons;

function SocialIcon({ name }: { name: SocialIconName }) {
  const { Icon, title } = icons[name];
  return (
    <span title={title}>
      <Icon aria-hidden="true" />
    </span>
  );
}

function TagIcon({ size = 16 }: { size?: 16 | 24 }) {
  return (
    <LuTag
      size={size}
      className="tag-icon"
      aria-hidden="true"
      style={{ verticalAlign: size === 24 ? 'text-top' : 'text-bottom' }}
    />
  );
}

function ExternalLinkIcon() {
  return <LuExternalLink className="external-link-icon" aria-hidden="true" />;
}

export function Header() {
  return (
    <header className="site-header page-container">
      <h1>
        <a href="/">{SITE.title}</a>
      </h1>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer page-container">
      <div id="profile" className="author-profile">
        <img src={SITE.avatar} alt={SITE.author} width="64" height="64" />
        <div>
          <small>Author</small>
          <strong>
            {SITE.author}
            <a
              rel="noopener noreferrer"
              target="_blank"
              href="https://x.com/sekai67"
              aria-label="X"
            >
              <SocialIcon name="x" />
            </a>
            <a
              rel="noopener noreferrer"
              target="_blank"
              href="https://github.com/kaz"
              aria-label="GitHub"
            >
              <SocialIcon name="github" />
            </a>
            <a href="mailto:kazuki@6715.jp" aria-label="Email">
              <SocialIcon name="email" />
            </a>
          </strong>
        </div>
      </div>
      <div className="copyright">&copy; {SITE.copyright}</div>
    </footer>
  );
}

export function Entries({ entries }: { entries: Entry[] }) {
  return (
    <ul className="entry-list">
      {entries.map((entry) => (
        <li key={entry.type === 'article' ? entry.slug : entry.url}>
          <div>{entry.date.slice(0, 10)}</div>
          {entry.type === 'article' ? (
            <a href={`/posts/${entry.slug}/`}>{entry.title}</a>
          ) : (
            <a rel="noopener noreferrer" target="_blank" href={entry.url}>
              {entry.title}
              <small>
                {entry.publisher}
                <ExternalLinkIcon />
              </small>
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

export function ArticleHeader({ article }: { article: Article }) {
  const tags = [...article.tags].sort((a, b) => a.localeCompare(b));
  return (
    <section className="article-meta">
      <small>{article.date.slice(0, 10)}</small>
      <h1>{article.title}</h1>
      <div>
        <div>
          <img src={SITE.avatar} alt={SITE.author} width="24" height="24" />
          <a href="#profile">{SITE.author}</a>
        </div>
        {tags.length > 0 && (
          <div>
            <TagIcon />
            {tags.map((tag) => (
              <a key={tag} href={`/tags/${encodeURIComponent(tag)}/`}>
                {tag}
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function SocialShare({
  title,
  url,
  children,
}: {
  title: string;
  url: string;
  children?: ReactNode;
}) {
  const encodedUrl = encodeURIComponent(url);
  const text = encodeURIComponent(title);
  const links = [
    ['x', `https://x.com/intent/post?url=${encodedUrl}&text=${text}`, 'Xでシェア'],
    [
      'hatenabookmark',
      `https://b.hatena.ne.jp/add?mode=confirm&url=${encodedUrl}`,
      'はてなブックマークに追加',
    ],
  ] as const;
  return (
    <div className="social-share">
      {children}
      {links.map(([name, href, label]) => (
        <a key={name} rel="noopener noreferrer" target="_blank" href={href} aria-label={label}>
          <SocialIcon name={name} />
        </a>
      ))}
    </div>
  );
}

export function TagHeading({ tag }: { tag: string }) {
  return (
    <h2>
      <TagIcon size={24} /> {tag}
    </h2>
  );
}

export function NotFound() {
  return (
    <main className="not-found page-container">
      <h2>404</h2>
      <h3>Not Found</h3>
    </main>
  );
}
