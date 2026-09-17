'use client';

import { ArrowRight, Sparkle } from '@phosphor-icons/react';
import Image from 'next/image';
import type { IntentResult } from './intent-model';
import { INTENTS } from './intent-model';

/*
  The answer, and the chips that get you one.

  Presentational and promotable: the host owns what a tap means, so in the app
  `onOpenItem` is the same service detail every other surface opens and the
  gate still decides whether a booking may proceed.
*/

export function AskSuggestions({ onAsk }: { onAsk: (intentId: string) => void }) {
  return (
    <div className="ask__chips" role="group" aria-label="Ask about your stay">
      {INTENTS.map((intent) => (
        <button
          key={intent.id}
          className="ask__chip"
          type="button"
          onClick={() => onAsk(intent.id)}
          dangerouslySetInnerHTML={{ __html: intent.prompt }}
        />
      ))}
    </div>
  );
}

export function AskAnswer({
  result,
  onOpenItem,
}: {
  result: IntentResult;
  onOpenItem: (itemId: string) => void;
}) {
  return (
    <section className="ask__answer" aria-label="Answer">
      <p className="ask__said">
        <span className="ask__said-icon" aria-hidden="true"><Sparkle weight="fill" /></span>
        <span dangerouslySetInnerHTML={{ __html: result.intent.answer }} />
      </p>

      <div className="ask__picks">
        {result.items.map((item, i) => (
          <button key={item.id} className="ask__pick" type="button" onClick={() => onOpenItem(item.id)}>
            <span className="ask__pick-rank" aria-hidden="true">{i + 1}</span>
            <span className="ask__pick-art">
              <Image src={item.image.src} alt="" fill sizes="64px" style={{ objectPosition: item.image.focalPoint }} />
            </span>
            <span className="ask__pick-copy">
              <b>{item.title}</b>
              {/* The reason, not the category. A list that explains itself is
                  the whole difference between this and a filtered catalogue. */}
              <small>{item.why}</small>
              <span>{item.price}</span>
            </span>
            <ArrowRight aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  );
}
