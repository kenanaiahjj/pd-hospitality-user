'use client';

import { CaretRight, MagnifyingGlass, X } from '@phosphor-icons/react';
import Image from 'next/image';
import { useState } from 'react';
import type { ServiceImageDefinition } from '../service-images';
import { AskAnswer, AskSuggestions } from './ask-panel';
import { INTENTS, matchIntent, resolveIntent } from './intent-model';
import { searchCatalogue } from './story-model';
import type { SearchableItem } from './story-model';
import './reels.css';

/*
  The two ways out of the feed that are not a reel: search, for a guest who
  already knows what they want, and browse, for one who would rather look
  the old-fashioned way. Both sit over the feed, so closing either puts the
  guest back on the reel they left.
*/

export type SearchSheetProps = {
  index: SearchableItem[];
  onOpenItem: (itemId: string) => void;
  onClose: () => void;
};

/**
 * A prompt first, a search box second: the field tries to understand a
 * situation ("it's raining") and only falls through to keyword matching when
 * it cannot -- the same rule the old Explore search followed.
 */
export function SearchSheet({ index, onOpenItem, onClose }: SearchSheetProps) {
  const [query, setQuery] = useState('');
  const [askedId, setAskedId] = useState<string | null>(null);
  const intent = askedId ? INTENTS.find((entry) => entry.id === askedId) : matchIntent(query);
  const answer = intent ? resolveIntent(intent) : undefined;
  const results = answer ? [] : searchCatalogue(index, query);
  const searching = query.trim().length > 0 || Boolean(askedId);

  return (
    <div className="feed-sheet feed-sheet--search" role="dialog" aria-modal="true" aria-label="Search">
      <div className="feed-sheet__search">
        <div className="discover__search">
          <MagnifyingGlass aria-hidden="true" />
          <input
            type="search"
            value={query}
            placeholder="Ask anything about your stay"
            aria-label="Ask anything about your stay"
            onChange={(event) => { setQuery(event.target.value); setAskedId(null); }}
          />
          {searching ? (
            <button type="button" onClick={() => { setQuery(''); setAskedId(null); }} aria-label="Clear"><X aria-hidden="true" /></button>
          ) : null}
        </div>
        <button type="button" className="feed-sheet__cancel" onClick={onClose}>Cancel</button>
      </div>

      <div className="feed-sheet__body">
        {!searching ? <AskSuggestions onAsk={setAskedId} /> : null}
        {answer ? (
          <AskAnswer result={answer} onOpenItem={onOpenItem} />
        ) : searching ? (
          <section aria-label="Search results">
            <p className="discover__count" role="status">
              {results.length} {results.length === 1 ? 'result' : 'results'} for &ldquo;{query.trim()}&rdquo;
            </p>
            <div className="discover__results">
              {results.map((item) => (
                <button key={item.id} className="discover__result" type="button" onClick={() => onOpenItem(item.id)}>
                  <span className="discover__result-art">
                    <Image src={item.image.src} alt="" fill sizes="72px" style={{ objectPosition: item.image.focalPoint }} />
                  </span>
                  <span className="discover__result-copy">
                    <b>{item.title}</b>
                    <small>{item.category} · {item.detail}</small>
                  </span>
                  <span className="discover__result-price">{item.price}</span>
                </button>
              ))}
            </div>
            {results.length === 0 ? (
              <div className="guest-hub-empty">
                <h2>Nothing matches</h2>
                <p>Try a category instead — dining, spa, tours, or services.</p>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  );
}

export type BrowseCategory = { id: string; label: string; detail: string; image: ServiceImageDefinition };

export type BrowseSheetProps = {
  categories: BrowseCategory[];
  onOpen: (categoryId: string) => void;
  onClose: () => void;
};

/** The categories, as they always were: each one lands on its existing page. */
export function BrowseSheet({ categories, onOpen, onClose }: BrowseSheetProps) {
  return (
    <div className="feed-sheet-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="feed-sheet feed-sheet--browse" role="dialog" aria-modal="true" aria-labelledby="feed-browse-title">
        <div className="feed-sheet__head">
          <h2 id="feed-browse-title">Browse</h2>
          <button type="button" className="feed-sheet__close" aria-label="Close" onClick={onClose}><X aria-hidden="true" /></button>
        </div>
        <ul className="feed-sheet__list">
          {categories.map((category) => (
            <li key={category.id}>
              <button type="button" onClick={() => onOpen(category.id)}>
                <span className="feed-sheet__art" aria-hidden="true">
                  <Image src={category.image.src} alt="" fill sizes="56px" style={{ objectPosition: category.image.focalPoint }} />
                </span>
                <span className="feed-sheet__copy"><b>{category.label}</b><small>{category.detail}</small></span>
                <CaretRight aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
