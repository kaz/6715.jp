export interface OgpProps {
  title: string;
  date: string;
  tags: string[];
  avatar: string;
}

/** TrueType files from npm, since satori cannot read the site's WOFF2 and builds stay offline. */
export const fonts = {
  sans: {
    name: 'Noto Sans JP',
    weight: 700,
    style: 'normal',
    file: '@expo-google-fonts/noto-sans-jp/700Bold/NotoSansJP_700Bold.ttf',
  },
  logo: {
    name: 'Exo 2',
    weight: 300,
    style: 'italic',
    file: '@expo-google-fonts/exo-2/300Light_Italic/Exo2_300Light_Italic.ttf',
  },
} as const;

const SITE_NAME = '6715.jp';
const AUTHOR = 'sekai';

const segmenter = new Intl.Segmenter('ja', { granularity: 'word' });
const isHiragana = (text: string) => /^[぀-ゟー]+$/.test(text);
const isKatakana = (text: string) => /^[゠-ヿ]+$/.test(text);

export interface Phrase {
  text: string;
  /** Followed by a space in the source title. */
  space: boolean;
}

/**
 * Split a title into phrases that must not be broken across lines, e.g. "起動|でき|ない" into
 * "起動できない". Satori breaks CJK text between any two characters, so each phrase is rendered
 * as its own flex item instead.
 */
export function phrases(title: string): Phrase[] {
  const result: Phrase[] = [];
  let opening = '';
  let previous: Intl.SegmentData | undefined;
  for (const segment of segmenter.segment(title)) {
    const text = segment.segment;
    const last = result.at(-1);
    if (/^\s+$/.test(text)) {
      if (last) last.space = true;
    } else if (
      last &&
      previous &&
      !/\s/.test(previous.segment) &&
      (!segment.isWordLike ||
        isHiragana(text) ||
        /^[0-9]+$/.test(text) ||
        (isKatakana(text) && isKatakana(previous.segment)) ||
        (/^[0-9A-Za-z]/.test(text) && /[0-9A-Za-z-]$/.test(previous.segment)))
    ) {
      // Particles, okurigana, closing punctuation and split loanwords stay with the previous word.
      last.text += text;
    } else if (!segment.isWordLike) {
      // Opening punctuation such as "～" in "その2 ～副題～" stays with the next word.
      opening += text;
    } else {
      result.push({ text: opening + text, space: false });
      opening = '';
    }
    previous = segment;
  }
  if (opening) result.push({ text: opening, space: false });
  return result;
}

// Halfwidth characters take roughly half the width of fullwidth ones.
function titleSize(title: string): number {
  const length = [...title].reduce((sum, char) => sum + (char.charCodeAt(0) < 0x100 ? 0.55 : 1), 0);
  if (length <= 16) return 72;
  if (length <= 28) return 64;
  if (length <= 42) return 56;
  return 48;
}

function Title({ title }: { title: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flex: 1,
        alignItems: 'center',
        fontSize: titleSize(title),
        fontWeight: 700,
        lineHeight: 1.4,
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%' }}>
        {phrases(title).map((phrase, index) => (
          <span key={index} style={{ marginRight: phrase.space ? '0.3em' : 0 }}>
            {phrase.text}
          </span>
        ))}
      </div>
    </div>
  );
}

/** The black bar from the site header. */
function Logo({ size }: { size: number }) {
  return (
    <div
      style={{
        fontFamily: fonts.logo.name,
        fontStyle: 'italic',
        fontWeight: 300,
        fontSize: size,
        color: 'white',
        backgroundColor: 'black',
        padding: `0 ${size * 3}px 0 ${size * 0.4}px`,
      }}
    >
      {SITE_NAME}
    </div>
  );
}

function Author({ avatar, size }: { avatar: string; size: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <img
        src={avatar}
        width={size}
        height={size}
        style={{ borderRadius: size, marginRight: size * 0.3 }}
      />
      <div style={{ fontSize: size * 0.5, fontWeight: 700 }}>{AUTHOR}</div>
    </div>
  );
}

/** Qiita-like: tags above the title and author and date below, on plain white. */
export function OgpImage({ title, date, tags, avatar }: OgpProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: '64px 72px 56px',
        background: 'white',
        color: '#111',
        fontFamily: fonts.sans.name,
        borderBottom: '16px solid #111',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {tags.map((tag) => (
          <div
            key={tag}
            style={{
              fontSize: 26,
              color: '#555',
              background: '#eee',
              borderRadius: 8,
              padding: '4px 16px',
              marginRight: 12,
            }}
          >
            {tag}
          </div>
        ))}
      </div>
      <Title title={title} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Author avatar={avatar} size={60} />
          <div style={{ fontSize: 26, color: '#888', marginLeft: 24 }}>{date}</div>
        </div>
        <Logo size={32} />
      </div>
    </div>
  );
}
