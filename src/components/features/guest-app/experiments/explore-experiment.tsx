'use client';

import { CaretRight, MagnifyingGlass } from '@phosphor-icons/react';
import { useState } from 'react';
import { MINI_APP_CATEGORIES, SERVICES } from '../prototype-model';
import type { MiniAppCategoryId } from '../prototype-model';

/*
  A copy of the shipped Explore catalogue, free to diverge.

  It reads the same `SERVICES` and `MINI_APP_CATEGORIES` the guest app does,
  so the content stays honest while the presentation is pulled apart. Reading
  the catalogue is safe -- it is data, not flow -- but nothing here writes to
  a session or is imported by the guest app.
*/

type Filter = MiniAppCategoryId | 'all';

export function ExploreExperiment() {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const results = SERVICES.filter((service) => {
    if (filter !== 'all' && service.categoryId !== filter) return false;
    if (!query.trim()) return true;
    const needle = query.trim().toLowerCase();
    return service.name.toLowerCase().includes(needle)
      || service.category.toLowerCase().includes(needle);
  });

  return (
    <div className="guest-stack">
      <div className="guest-page-title">
        <h1>Discover</h1>
        <p>Experiment · a different way through the same catalogue.</p>
      </div>

      <label className="guest-experiment-search">
        <MagnifyingGlass aria-hidden="true" />
        <input
          type="search"
          value={query}
          placeholder="Search everything on property"
          aria-label="Search activities"
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      <div className="guest-chip-grid" role="group" aria-label="Filter by category">
        <button
          type="button"
          className={filter === 'all' ? 'is-active' : undefined}
          aria-pressed={filter === 'all'}
          onClick={() => setFilter('all')}
        >
          Everything
        </button>
        {MINI_APP_CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            className={filter === category.id ? 'is-active' : undefined}
            aria-pressed={filter === category.id}
            onClick={() => setFilter(category.id)}
          >
            {category.shortTitle}
          </button>
        ))}
      </div>

      <p className="guest-scanner__status">
        {results.length} {results.length === 1 ? 'result' : 'results'}
      </p>

      <div className="guest-list-group">
        {results.map((service) => (
          <button key={service.id} className="guest-list-row" type="button">
            <span aria-hidden="true" />
            <div>
              <b>{service.name}</b>
              <small>{service.category} · {service.price}</small>
            </div>
            <CaretRight aria-hidden="true" />
          </button>
        ))}
      </div>

      {results.length === 0 ? (
        <div className="guest-hub-empty">
          <h2>Nothing matches</h2>
          <p>Try a different word, or clear the filter.</p>
        </div>
      ) : null}
    </div>
  );
}
