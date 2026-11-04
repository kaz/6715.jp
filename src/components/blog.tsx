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
  copyright: '2016 sekai',
};

const icons = {
  github: {
    path: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
    title: 'GitHub',
  },
  x: {
    path: 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z',
    title: 'X',
  },
  email: {
    path: 'M1.75 3h20.5c.966 0 1.75.784 1.75 1.75v14.5A1.75 1.75 0 0 1 22.25 21H1.75A1.75 1.75 0 0 1 0 19.25V4.75C0 3.784.784 3 1.75 3ZM1.5 7.412V19.25c0 .138.112.25.25.25h20.5a.25.25 0 0 0 .25-.25V7.412l-9.52 6.433c-.592.4-1.368.4-1.96 0Zm0-2.662v.852l10.36 7a.25.25 0 0 0 .28 0l10.36-7V4.75a.25.25 0 0 0-.25-.25H1.75a.25.25 0 0 0-.25.25Z',
    title: 'Email',
  },
  hatenabookmark: {
    path: 'M20.47 0C22.42 0 24 1.58 24 3.53v16.94c0 1.95-1.58 3.53-3.53 3.53H3.53C1.58 24 0 22.42 0 20.47V3.53C0 1.58 1.58 0 3.53 0h16.94zm-3.705 14.47c-.78 0-1.41.63-1.41 1.41s.63 1.414 1.41 1.414 1.41-.645 1.41-1.425-.63-1.41-1.41-1.41zM8.61 17.247c1.2 0 2.056-.042 2.58-.12.526-.084.976-.222 1.32-.412.45-.232.78-.564 1.02-.99s.36-.915.36-1.48c0-.78-.21-1.403-.63-1.87-.42-.48-.99-.734-1.74-.794.66-.18 1.156-.45 1.456-.81.315-.344.465-.824.465-1.424 0-.48-.103-.885-.3-1.26-.21-.36-.493-.645-.883-.87-.345-.195-.735-.315-1.215-.405-.464-.074-1.29-.12-2.474-.12H5.654v10.486H8.61zm.736-4.185c.705 0 1.185.088 1.44.262.27.18.39.495.39.93 0 .405-.135.69-.42.855-.27.18-.765.254-1.44.254H8.31v-2.297h1.05zm8.656.706v-7.06h-2.46v7.06H18zM8.925 9.08c.71 0 1.185.08 1.432.24.245.16.367.435.367.83 0 .38-.13.646-.39.804-.265.154-.747.232-1.452.232h-.57V9.08h.615z',
    title: 'Hatena Bookmark',
  },
} as const;

type SocialIconName = keyof typeof icons;

function SocialIcon({ name }: { name: SocialIconName }) {
  const icon = icons[name];
  return (
    <span title={icon.title}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d={icon.path} />
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

function ExternalLinkIcon() {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="external-link-icon"
      aria-hidden="true"
    >
      <path d="M3.75 2h3.5a.75.75 0 010 1.5h-3.5a.25.25 0 00-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 00.25-.25v-3.5a.75.75 0 011.5 0v3.5A1.75 1.75 0 0112.25 14h-8.5A1.75 1.75 0 012 12.25v-8.5C2 2.784 2.784 2 3.75 2zm6.854-1h4.146a.25.25 0 01.25.25v4.146a.25.25 0 01-.427.177L13.03 4.03 9.28 7.78a.751.751 0 01-1.042-.018.751.751 0 01-.018-1.042l3.75-3.75-1.543-1.543A.25.25 0 0110.604 1z" />
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
