import { useEffect, useState } from 'react';
import { LuShare } from 'react-icons/lu';

// Hydrated as an island: the static HTML can't know whether the browser
// supports the Web Share API, so the button appears only after mount.
export default function NativeShare({ title, url }: { title: string; url: string }) {
  const [supported, setSupported] = useState(false);
  useEffect(() => setSupported(typeof navigator.share === 'function'), []);
  if (!supported) return null;

  // share() rejects when the user dismisses the sheet; nothing to do then.
  const share = () => navigator.share({ title, url }).catch(() => {});
  return (
    <button type="button" title="共有" aria-label="共有" onClick={share}>
      <LuShare aria-hidden="true" />
    </button>
  );
}
