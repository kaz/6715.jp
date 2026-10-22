import { Entries } from '../src/components/blog';
import content from '../src/lib/content';

export default function Index() {
  return (
    <main className="page-container">
      <Entries entries={content.entries} />
    </main>
  );
}
