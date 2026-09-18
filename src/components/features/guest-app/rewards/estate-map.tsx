'use client';

import { ESTATE_PROPERTIES } from '../prototype-model';

/*
  Where the guest has been, laid out by island group.

  Not a drawn archipelago: that needs coordinates and artwork the estate does
  not have yet, and a decorative map of the wrong islands is worse than none.
  Three columns of the country's three island groups carry the same thing --
  how far across the Philippines someone has actually been -- and they make the
  Luzon to Mindanao badge legible as a route rather than a rule.
*/

const GROUPS = [
  { id: 'luzon', label: 'Luzon' },
  { id: 'visayas', label: 'Visayas' },
  { id: 'mindanao', label: 'Mindanao' },
] as const;

export type EstateMapProps = {
  /** Cities the guest has stayed in, from their own history. */
  visitedCities: string[];
};

export function EstateMap({ visitedCities }: EstateMapProps) {
  const visited = new Set(visitedCities);
  const stayed = ESTATE_PROPERTIES.filter((property) => visited.has(property.city));

  return (
    <section className="estate-map">
      <h2 className="estate-map__heading">
        The estate
        <small>{stayed.length} of {ESTATE_PROPERTIES.length}</small>
      </h2>

      <div className="estate-map__groups">
        {GROUPS.map((group) => {
          const properties = ESTATE_PROPERTIES.filter(
            (property) => property.islandGroup === group.id,
          );

          return (
            <div key={group.id} className="estate-map__group">
              <h3>{group.label}</h3>
              {properties.length ? (
                <ul>
                  {properties.map((property) => {
                    const been = visited.has(property.city);
                    return (
                      <li key={property.id} className={been ? 'is-visited' : undefined}>
                        <i aria-hidden="true" />
                        <span>{property.city}</span>
                        <small>{been ? 'Stayed' : 'Not yet'}</small>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                /* Honest about a gap rather than hiding the column: the group
                   exists, the estate has not reached it, and that is exactly
                   what makes the badge a stretch rather than a defect. */
                <p className="estate-map__none">No property here yet</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
