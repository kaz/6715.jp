import type { ReactNode } from 'react';

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
  bio: 'インフラとDXが好き',
  copyright: '2016 sekai',
};

const icons = {
  github: {
    path: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
    color: '#181717',
    title: 'GitHub',
  },
  twitter: {
    path: 'M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z',
    color: '#1DA1F2',
    title: 'Twitter',
  },
  facebook: {
    path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
    color: '#1877F2',
    title: 'Facebook',
  },
  x: {
    path: 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z',
    color: '#000000',
    title: 'X',
  },
  hatenabookmark: {
    path: 'M20.47 0C22.42 0 24 1.58 24 3.53v16.94c0 1.95-1.58 3.53-3.53 3.53H3.53C1.58 24 0 22.42 0 20.47V3.53C0 1.58 1.58 0 3.53 0h16.94zm-3.705 14.47c-.78 0-1.41.63-1.41 1.41s.63 1.414 1.41 1.414 1.41-.645 1.41-1.425-.63-1.41-1.41-1.41zM8.61 17.247c1.2 0 2.056-.042 2.58-.12.526-.084.976-.222 1.32-.412.45-.232.78-.564 1.02-.99s.36-.915.36-1.48c0-.78-.21-1.403-.63-1.87-.42-.48-.99-.734-1.74-.794.66-.18 1.156-.45 1.456-.81.315-.344.465-.824.465-1.424 0-.48-.103-.885-.3-1.26-.21-.36-.493-.645-.883-.87-.345-.195-.735-.315-1.215-.405-.464-.074-1.29-.12-2.474-.12H5.654v10.486H8.61zm.736-4.185c.705 0 1.185.088 1.44.262.27.18.39.495.39.93 0 .405-.135.69-.42.855-.27.18-.765.254-1.44.254H8.31v-2.297h1.05zm8.656.706v-7.06h-2.46v7.06H18zM8.925 9.08c.71 0 1.185.08 1.432.24.245.16.367.435.367.83 0 .38-.13.646-.39.804-.265.154-.747.232-1.452.232h-.57V9.08h.615z',
    color: '#00A4DE',
    title: 'Hatena Bookmark',
  },
} as const;

type SocialIconName = keyof typeof icons;

function SocialIcon({ name, monochrome = false }: { name: SocialIconName; monochrome?: boolean }) {
  const icon = icons[name];
  return (
    <span title={icon.title}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill={monochrome ? 'currentColor' : icon.color} d={icon.path} />
      </svg>
    </span>
  );
}

function TagIcon({ size = 16 }: { size?: 16 | 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={size === 24 ? '0 0 24 24' : '0 0 16 16'}
      fill="currentColor"
      className="tag-icon"
      aria-hidden="true"
      style={{ verticalAlign: size === 24 ? 'text-top' : 'text-bottom' }}
    >
      {size === 24 ? (
        <>
          <path d="M7.75 6.5a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5z" />
          <path
            fillRule="evenodd"
            d="M2.5 1A1.5 1.5 0 001 2.5v8.44c0 .397.158.779.44 1.06l10.25 10.25a1.5 1.5 0 002.12 0l8.44-8.44a1.5 1.5 0 000-2.12L12 1.44A1.5 1.5 0 0010.94 1H2.5zm0 1.5h8.44l10.25 10.25-8.44 8.44L2.5 10.94V2.5z"
          />
        </>
      ) : (
        <path
          fillRule="evenodd"
          d="M2.5 7.775V2.75a.25.25 0 01.25-.25h5.025a.25.25 0 01.177.073l6.25 6.25a.25.25 0 010 .354l-5.025 5.025a.25.25 0 01-.354 0l-6.25-6.25a.25.25 0 01-.073-.177zm-1.5 0V2.75C1 1.784 1.784 1 2.75 1h5.025c.464 0 .91.184 1.238.513l6.25 6.25a1.75 1.75 0 010 2.474l-5.026 5.026a1.75 1.75 0 01-2.474 0l-6.25-6.25A1.75 1.75 0 011 7.775zM6 5a1 1 0 100 2 1 1 0 000-2z"
        />
      )}
    </svg>
  );
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
              href="https://github.com/kaz"
              aria-label="GitHub"
            >
              <SocialIcon name="github" />
            </a>
            <a
              rel="noopener noreferrer"
              target="_blank"
              href="https://twitter.com/sekai67"
              aria-label="Twitter"
            >
              <SocialIcon name="twitter" />
            </a>
            <a
              rel="noopener noreferrer"
              target="_blank"
              href="https://www.facebook.com/sawada.kazuki"
              aria-label="Facebook"
            >
              <SocialIcon name="facebook" />
            </a>
          </strong>
          <p>{SITE.bio}</p>
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
              <small>Published in {entry.publisher}</small>
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
          <SocialIcon name={name} monochrome />
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
