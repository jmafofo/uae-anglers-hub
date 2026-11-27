import type { FishingSpot } from './spots';
import type { FishSpecies } from './species';

export function filterSpots(spots: FishingSpot[], filters: { q?: string; emirate?: string; access?: string }) {
  const words = (filters.q ?? '').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return spots.filter(spot => {
    const haystack = [spot.name, spot.emirate, spot.accessType, ...spot.species].join(' ').toLocaleLowerCase();
    return (!filters.emirate || spot.emirate === filters.emirate)
      && (!filters.access || spot.accessType.toLowerCase().includes(filters.access.toLowerCase()))
      && words.every(word => haystack.includes(word));
  });
}

export function normalizeSpeciesName(value: string) {
  return value.normalize('NFKD').toLocaleLowerCase()
    .replace(/[\u0300-\u036f\u064b-\u065f\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[’'‘]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

export function matchesSpecies(species: FishSpecies, query: string) {
  const haystack = normalizeSpeciesName([species.name, species.localName, species.scientificName, species.family, species.habitat, ...(species.aliases ?? [])].join(' '));
  return normalizeSpeciesName(query).split(/\s+/).filter(Boolean).every(word => haystack.includes(word));
}

/** Never guess a taxon from an ambiguous family name such as “trevally”. */
export function resolveSpeciesName(species: FishSpecies[], query: string): FishSpecies | undefined {
  const normalized = normalizeSpeciesName(query);
  if (!normalized) return undefined;
  const matches = species.filter(s => [s.name, s.localName, s.scientificName, ...(s.aliases ?? [])]
    .some(name => normalizeSpeciesName(name) === normalized));
  return matches.length === 1 ? matches[0] : undefined;
}
