import { Fragment } from 'react';

/*
  A message's text with its web links made tappable, as any messaging app does:
  a vendor's tracking link is a tap, not something to copy by hand. Only
  http(s) links; a full stop or bracket closing the sentence is not part of the
  link. Everything else stays plain text (escaped by React, never parsed as HTML).
*/

const LINK = /(https?:\/\/[^\s<>"]+)/g;

export function Linkified({ text }: { text: string }) {
  const parts = text.split(LINK);
  return (
    <>
      {parts.map((part, index) => {
        if (index % 2 === 0) return <Fragment key={index}>{part}</Fragment>;
        const trailing = part.match(/[.,;:!?)\]]+$/)?.[0] ?? '';
        const href = trailing ? part.slice(0, -trailing.length) : part;
        return (
          <Fragment key={index}>
            <a className="guest-message__link" href={href} target="_blank" rel="noopener noreferrer">{href}</a>
            {trailing}
          </Fragment>
        );
      })}
    </>
  );
}
