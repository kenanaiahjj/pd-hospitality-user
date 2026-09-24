'use client';

import { MagnifyingGlass, X } from '@phosphor-icons/react';
import Image from 'next/image';
import { useState, type ReactNode } from 'react';
import { AskAnswer, AskSuggestions } from './ask-panel';
import { INTENTS, matchIntent, resolveIntent } from './intent-model';
import { describePostedAgo, formatPostedAgo, searchCatalogue, storyExpiryLabel } from './story-model';
import type { CategoryCard, DiscoverBanner, SearchableItem, Story } from './story-model';

/*
  A promotable discovery page.

  Takes its content and its callbacks, so the guest app supplies real ones and
  the harness supplies demo ones. It sells the same catalogue the list view
  sells -- the argument is only that a guest mid-stay meets it the way they
  meet everything else on their phone, as something to watch.
*/

export type DiscoverFeedProps = {
  /**
   * The house, named.
   *
   * Four Seasons, Aman and Rosewood all put the property's name on the
   * screen; the chains that don't fall back to "hotel". Nobody writes "on
   * property" -- that is the word an operator uses for an estate, and it had
   * four appearances on this screen.
   */
  property?: string;
  stories: Story[];
  /** Legacy banner input retained for harness compatibility; promotions now live in the deck. */
  banners?: DiscoverBanner[];
  categories: CategoryCard[];
  /** Everything bookable, for the search field. */
  searchIndex: SearchableItem[];
  onOpenStory: (storyId: string) => void;
  onOpenBanner?: (bannerId: string) => void;
  onOpenItem: (itemId: string) => void;
  onOpenCategory: (categoryId: string) => void;
  onBrowseAll: () => void;
  /** The swipe deck, composed by the host so this stays presentational. */
  deck?: ReactNode;
};

export function DiscoverFeed({
  property = 'The Henry Manila',
  stories,
  categories,
  searchIndex,
  onOpenStory,
  onOpenItem,
  onOpenCategory,
  onBrowseAll,
  deck,
}: DiscoverFeedProps) {
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
        <h1>What&rsquo;s on at {property}</h1>
        {/* Counted, not written down -- same rule the category cards follow.
            A hardcoded "Eight" survived the rail growing to nine accounts,
            and a screen that miscounts itself is not one a guest trusts on
            anything else. */}
        {/*
          Not "Tonight": the app has no idea what time it is, and a guest
          opening this at nine in the morning is owed better than a screen
          that guesses wrong about something it could simply not claim.

          The count went too. It said "9 places posted today" directly above a
          section headed "Posted today" -- the same fact twice within a
          scroll. What is left is the line no OTA can write.
        */}
        <p>Anything you book goes on your room, settled when you check out.</p>
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
      {/*
        Posts, so they are signed and dated.

        The ring, the account name and the age are what separate this rail
        from the featured deck three sections down -- without them a guest
        sees two rows of pretty pictures and is right to read the second as
        a repeat of the first. The accent ring is DESIGN.md's "live state",
        which is one of the three jobs the pink is allowed to do.
      */}
      {stories.length ? (
        <section className="discover__section discover__section--stories" aria-label="Posts from the property">
          <div className="discover__head">
            <h2>Posted today</h2>
            {/* Says why a ring turns amber, which nothing else on the screen
                explains. A list of departments told the guest nothing. */}
            <p>Straight from the venues. Each post lasts a day.</p>
          </div>
          <div className="discover__rail">
            {stories.map((story) => {
              const expiring = storyExpiryLabel(story);
              return (
                <button
                  key={story.id}
                  className="discover__story"
                  type="button"
                  onClick={() => onOpenStory(story.id)}
                  aria-label={`${story.author.name}, ${describePostedAgo(story.postedHoursAgo)}${expiring ? `. ${expiring}` : ''}`}
                >
                  <span className={`discover__story-ring${expiring ? ' is-expiring' : ''}`}>
                    <span className="discover__story-art">
                      <Image
                        src={story.cover.src}
                        alt=""
                        fill
                        sizes="96px"
                        style={{ objectPosition: story.cover.focalPoint }}
                      />
                    </span>
                  </span>
                  <b>{story.author.name}</b>
                  <small>{expiring ? 'Ending' : formatPostedAgo(story.postedHoursAgo)}</small>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {/*
        High, not buried.

        It sat below the categories on the argument that a guest who knows
        what they want should not scroll past a game -- but that guest uses
        the ask field at the top of the screen, not the category grid. Below
        four category cards the deck started 896px down an 812px viewport,
        which is the same as not shipping it.
      */}
      {deck ? (
        <section className="discover__section discover__deck" aria-label="Featured">
          <div className="discover__head">
            <h2>Featured</h2>
            {/* "Swipe through" is gone: the pile is visibly stacked and
                tilted now, so the instruction was describing an affordance
                the design already makes. */}
            <p>The hotel&rsquo;s picks, and what&rsquo;s booking fastest.</p>
          </div>
          {deck}
        </section>
      ) : null}

      {/*
        A lead card and three followers, not four equal tiles.

        Equal tiles make the guest read all four before choosing anything;
        one card carrying twice the area answers "where do I start" before
        the question is asked. The photograph is masked into the gradient
        rather than boxed inside it, so the card reads as one object.
      */}
      <section className="discover__section discover__section--catalog" aria-label="Categories">
        <div className="discover__head discover__head--catalog">
          <div className="discover__heading-row">
            <div>
          {/* Marriott and Hyatt both say "hotel", plainly, and list the
              nouns. It is the least clever option and the one a guest reads
              without translating. */}
          <h2>Everything at the hotel</h2>
          <p>Browse dining, wellness, experiences and guest services.</p>
            </div>
            <button className="discover__view-all" type="button" onClick={onBrowseAll}>View all</button>
          </div>
        </div>
        <div className="categories">
          {categories.map((category, i) => {
            /*
              The lead spans, and so does an odd card out -- so both need to
              ask for a full-width image. They were requesting 50vw and being
              served a 187px file stretched across 343px, which is a soft,
              blurry hero on the one card the layout is built to make
              biggest.
            */
            const spans = i === 0 || category.id === 'services' || category.id === 'gifts-souvenirs';
            return (
            <button
              key={category.id}
              className={`categories__card${i === 0 ? ' is-lead' : ''}${spans && i !== 0 ? ' is-full' : ''}`}
              type="button"
              onClick={() => onOpenCategory(category.id)}
            >
              <span className="categories__art" aria-hidden="true">
                <Image
                  src={category.image.src}
                  alt=""
                  fill
                  sizes={spans ? '(max-width: 480px) 100vw, 480px' : '(max-width: 480px) 50vw, 240px'}
                  style={{ objectPosition: category.image.focalPoint }}
                />
              </span>
              <span className="categories__copy">
                <b>{category.title}</b>
              </span>
            </button>
            );
          })}
        </div>
      </section>

      </>
      )}
    </div>
  );
}
