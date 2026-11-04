import { useEffect, useState } from 'react';

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
      <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M3.75 6.5a.25.25 0 0 0-.25.25v6.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-6.5a.25.25 0 0 0-.25-.25h-1a.75.75 0 0 1 0-1.5h1c.966 0 1.75.784 1.75 1.75v6.5A1.75 1.75 0 0 1 12.25 15h-8.5A1.75 1.75 0 0 1 2 13.25v-6.5C2 5.784 2.784 5 3.75 5h1a.75.75 0 0 1 0 1.5ZM7.47.22a.749.749 0 0 1 1.06 0l2.5 2.5a.749.749 0 1 1-1.06 1.06L8.75 2.56v7.69a.75.75 0 0 1-1.5 0V2.56L6.03 3.78a.749.749 0 1 1-1.06-1.06Z" />
      </svg>
    </button>
  );
}
