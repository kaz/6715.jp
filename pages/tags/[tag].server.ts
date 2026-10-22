import { defineHandler, defineHead, type InferProps } from 'void';
import content from '../../src/lib/content';
import { pageHead } from '../../src/lib/head';

export function getPrerenderPaths() {
  return content.tags.map((tag) => ({ tag }));
}

export const loader = defineHandler((context) => {
  const tag = context.req.param('tag');
  if (!tag || !content.tags.includes(tag)) throw new Error('Unknown tag');
  return { tag, entries: content.entries.filter((entry) => entry.tags.includes(tag)) };
});
export type Props = InferProps<typeof loader>;
export const head = defineHead<Props>((_context, props) =>
  pageHead(`Tag:${props.tag} | 6715.jp`, `/tags/${encodeURIComponent(props.tag)}/`),
);
