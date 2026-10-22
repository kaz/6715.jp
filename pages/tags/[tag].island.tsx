import { Entries, TagHeading } from '../../src/components/blog';
import type { Props } from './[tag].server';

export default function TagPage({ tag, entries }: Props) {
  return (
    <main className="page-container">
      <TagHeading tag={tag} />
      <Entries entries={entries} />
    </main>
  );
}
