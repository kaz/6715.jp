import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vite-plus/test';
import { loadFonts, renderOgpImage } from './index';
import { phrases } from './image';

const split = (title: string) =>
  phrases(title).map((phrase) => phrase.text + (phrase.space ? ' ' : ''));

describe('phrases', () => {
  it('keeps okurigana and particles with the preceding word', () => {
    expect(split('ISUCON11予選に参加した')).toEqual(['ISUCON11', '予選に', '参加した']);
    expect(split('mariadbが起動できない')).toEqual(['mariadbが', '起動できない']);
  });

  it('does not split hyphenated names or loanwords', () => {
    expect(split('mysql-serverをmariadb-serverで')).toEqual(['mysql-serverを', 'mariadb-serverで']);
    expect(split('クラウド東北きりたん')).toEqual(['クラウド', '東北きりたん']);
  });

  it('attaches punctuation to the side it belongs to and records spaces', () => {
    expect(split('その2 ～Azureの動かす～')).toEqual(['その2 ', '～Azureの', '動かす～']);
  });
});

describe('renderOgpImage', () => {
  it('renders a 1200x630 PNG', async () => {
    const avatar = `data:image/jpeg;base64,${(await readFile('build/ogp/avatar.jpg')).toString('base64')}`;
    const png = await renderOgpImage(
      { title: 'ISUCON11予選に参加した', date: '2021-08-23', tags: ['ISUCON'], avatar },
      await loadFonts(),
    );
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
  });
});
