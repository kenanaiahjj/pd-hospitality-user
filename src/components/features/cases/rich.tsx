import type { ReactNode } from 'react';

/** **bold** and [[pill:kind:Label]] are the only markup in the content data. */
const TOKEN = /(\*\*[^*]+\*\*|\[\[pill:[a-z]+:[^\]]+\]\])/g;

export function Rich({ text }: { text: string }) {
  const parts = text.split(TOKEN).filter((part) => part !== '');
  return (
    <>
      {parts.map((part, index): ReactNode => {
        if (part.startsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
        const pill = /^\[\[pill:([a-z]+):(.+)\]\]$/.exec(part);
        if (pill) {
          return (
            <span key={index} className={`cases-pill cases-pill--${pill[1]}`}>
              {pill[2]}
            </span>
          );
        }
        return part;
      })}
    </>
  );
}
