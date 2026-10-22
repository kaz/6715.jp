import type { HeadDescriptor } from 'void';

const origin = 'https://6715.jp';
const avatar = 'https://res.cloudinary.com/narusejun/image/twitter_name/h_128/sekai67.jpg';

export function pageHead(
  title: string,
  path = '/',
  description = 'sekaiのブログです',
): HeadDescriptor {
  return {
    title,
    meta: [
      { name: 'description', content: description },
      { name: 'twitter:card', content: 'summary' },
      { property: 'og:title', content: title },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: avatar },
      { property: 'og:description', content: description },
      { property: 'og:url', content: new URL(path, origin).href },
    ],
    link: [{ rel: 'canonical', href: new URL(path, origin).href }],
  };
}

export function articleHead(article: {
  title: string;
  slug: string;
  date: string;
  tags: string[];
  description: string;
  image?: string;
}): HeadDescriptor {
  const path = `/posts/${article.slug}/`;
  const descriptor = pageHead(`${article.title} | 6715.jp`, path, article.description);
  const image = article.image ? new URL(article.image, new URL(path, origin)).href : avatar;
  descriptor.meta = descriptor.meta?.filter(
    (meta) =>
      !('property' in meta && ['og:type', 'og:image'].includes(meta.property ?? '')) &&
      !('name' in meta && meta.name === 'twitter:card'),
  );
  descriptor.meta?.push(
    { name: 'twitter:card', content: article.image ? 'summary_large_image' : 'summary' },
    { property: 'og:type', content: 'article' },
    { property: 'og:image', content: image },
    { property: 'article:published_time', content: article.date },
    { property: 'article:author', content: 'sekai' },
    ...article.tags.map((tag) => ({ property: 'article:tag', content: tag })),
  );
  return descriptor;
}
