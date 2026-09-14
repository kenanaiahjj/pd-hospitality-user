'use client';

import { ArrowRight, CaretRight, MagnifyingGlass, X } from '@phosphor-icons/react';
import Image from 'next/image';
import { useState, type ReactNode } from 'react';
import { AskAnswer, AskSuggestions } from './ask-panel';
import { INTENTS, matchIntent, resolveIntent } from './intent-model';
import { searchCatalogue } from './story-model';
import type { CategoryCard, DiscoverBanner, SearchableItem, Story } from './story-model';

/*
  A promotable discovery page.

  Takes its content and its callbacks, so the guest app supplies real ones and
  the harness supplies demo ones. It sells the same catalogue the list view
  sells -- the argument is only that a guest mid-stay meets it the way they
  meet everything else on their phone, as something to watch.
*/

export type DiscoverFeedProps = {
  stories: Story[];
  banners: DiscoverBanner[];
  categories: CategoryCard[];
  /** Everything bookable, for the search field. */
  searchIndex: SearchableItem[];
  onOpenStory: (storyId: string) => void;
  onOpenBanner: (bannerId: string) => void;
  onOpenItem: (itemId: string) => void;
  onOpenCategory: (categoryId: string) => void;
  onBrowseAll: () => void;
  /** The swipe deck, composed by the host so this stays presentational. */
  deck?: ReactNode;
};

export function DiscoverFeed({
  stories,
  banners,
  categories,
  searchIndex,
  onOpenStory,
  onOpenBanner,
  onOpenItem,
  onOpenCategory,
  onBrowseAll,
  deck,
}: DiscoverFeedProps) {
  const [lead, ...rest] = banners;
  const [query, setQuery] = useState('');

  /*
    Typing replaces the feed rather than filtering it.

    The rail and the banners are an argument about what to do tonight; a guest
    who already knows they want a massage is not browsing, and leaving the
    curation on screen under a filtered list would be two answers to two
    different questions at once.
  */
  /*
    A prompt first, a search box second.

    "spa" is not a question anyone has; "it is raining and I have three hours"
    is. So the field tries to understand a situation, and only falls through
    to keyword matching when it cannot -- a wrong answer delivered confidently
    is worse than a list that never claimed to understand.
  */
  const [askedId, setAskedId] = useState<string | null>(null);
  const intent = askedId
    ? INTENTS.find((entry) => entry.id === askedId)
    : matchIntent(query);
  const answer = intent ? resolveIntent(intent) : undefined;

  const results = answer ? [] : searchCatalogue(searchIndex, query);
  const searching = query.trim().length > 0 || Boolean(askedId);

  return (
    <div className="discover" data-testid="discover-feed">
      <div className="discover__title">
        <h1>Tonight on property</h1>
        <p>Eight places open now, and what people are booking.</p>
      </div>

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
          <button type="button" onClick={() => { setQuery(''); setAskedId(null); }} aria-label="Clear">
            <X aria-hidden="true" />
          </button>
        ) : null}
      </div>

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
      ) : (
      <>

      {/* The rail. Rounded squares rather than circles: the subject is a
          place, and a circle crops a room to a face. */}
      <section aria-label="Stories">
        <div className="discover__rail">
          {stories.map((story) => (
            <button key={story.id} className="discover__story" type="button" onClick={() => onOpenStory(story.id)}>
              <span className="discover__story-art">
                <Image
                  src={story.cover.src}
                  alt=""
                  fill
                  sizes="96px"
                  style={{ objectPosition: story.cover.focalPoint }}
                />
              </span>
              <small>{story.title}</small>
            </button>
          ))}
        </div>
      </section>

      {/*
        A lead card and three followers, not four equal tiles.

        Equal tiles make the guest read all four before choosing anything;
        one card carrying twice the area answers "where do I start" before
        the question is asked. The photograph is masked into the gradient
        rather than boxed inside it, so the card reads as one object.
      */}
      <section aria-label="Categories">
        <div className="categories">
          {categories.map((category, i) => (
            <button
              key={category.id}
              className={`categories__card categories__card--${category.tone}${i === 0 ? ' is-lead' : ''}`}
              type="button"
              onClick={() => onOpenCategory(category.id)}
            >
              <span className="categories__art" aria-hidden="true">
                <Image
                  src={category.image.src}
                  alt=""
                  fill
                  sizes="(max-width: 480px) 50vw, 240px"
                  style={{ objectPosition: category.image.focalPoint }}
                />
              </span>
              <span className="categories__copy">
                <b>{category.title}</b>
                <small>{category.count} to book{i === 0 ? ` · ${category.subtitle}` : ''}</small>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/*
        Below the categories, deliberately. A guest who knows what they want
        takes a category; the deck is for the one who does not, and putting it
        above would make the decisive path scroll past the browsing one.
      */}
      {deck}

      {lead ? (
        <button
          className={`discover__hero discover__hero--${lead.tone}`}
          type="button"
          onClick={() => onOpenBanner(lead.id)}
        >
          <Image
            src={lead.image.src}
            alt=""
            fill
            sizes="480px"
            style={{ objectPosition: lead.image.focalPoint }}
          />
          <span className="discover__wash" aria-hidden="true" />
          <span className="discover__hero-copy">
            <small>{lead.eyebrow}</small>
            <b>{lead.headline}</b>
            <span>{lead.meta}</span>
          </span>
        </button>
      ) : null}

      <section aria-label="Featured">
        <div className="discover__grid">
          {rest.map((banner) => (
            <button
              key={banner.id}
              className={`discover__card discover__card--${banner.tone}`}
              type="button"
              onClick={() => onOpenBanner(banner.id)}
            >
              <Image
                src={banner.image.src}
                alt=""
                fill
                sizes="240px"
                style={{ objectPosition: banner.image.focalPoint }}
              />
              <span className="discover__wash" aria-hidden="true" />
              <span className="discover__card-copy">
                <small>{banner.eyebrow}</small>
                <b>{banner.headline}</b>
              </span>
            </button>
          ))}
        </div>
      </section>

      <button className="discover__all" type="button" onClick={onBrowseAll}>
        <span><b>Browse everything</b><small>Dining, spa, tours and hotel services</small></span>
        <CaretRight aria-hidden="true" />
      </button>
      </>
      )}
    </div>
  );
}

/** A dismissible strip promoting one thing, for the top of any screen. */
export function DiscoverPromo({ banner, onOpen }: { banner: DiscoverBanner; onOpen: () => void }) {
  return (
    <button className={`discover__promo discover__promo--${banner.tone}`} type="button" onClick={onOpen}>
      <span className="discover__promo-copy">
        <small>{banner.eyebrow}</small>
        <b>{banner.headline}</b>
      </span>
      <ArrowRight aria-hidden="true" />
    </button>
  );
}
