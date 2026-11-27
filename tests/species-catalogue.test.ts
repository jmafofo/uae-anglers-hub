import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fishSpecies } from '../lib/species';
import { additionalSpecies, localNameUpdates } from '../lib/species-expansion';
import { matchesSpecies, resolveSpeciesName } from '../lib/discovery';

test('catalogue covers every taxon in the MOCCAE fishing calendar', () => {
  const names = new Set(fishSpecies.flatMap(s => [s.scientificName, ...(s.aliases ?? [])]));
  for (const name of ['Lethrinus nebulosus', 'Lethrinus lentjan', 'Siganus canaliculatus', 'Diagramma pictum', 'Carangoides bajad', 'Scomberomorus commerson', 'Epinephelus coioides', 'Gnathanodon speciosus', 'Rhabdosargus sarba', 'Acanthopagrus bifasciatus', 'Plectorhinchus sordidus', 'Lutjanus malabaricus', 'Rastrelliger kanagurta', 'Argyrops spinifer', 'Scomberoides commersonnianus', 'Thunnus tonggol', 'Carangoides chrysophrys', 'Lutjanus argentimaculatus', 'Pomadasys argenteus', 'Epinephelus bleekeri', 'Seriolina nigrofasciata', 'Scarus persicus', 'Epinephelus diacanthus', 'Caranx ignobilis', 'Carangoides coeruleopinnatus', 'Valamugil seheli']) {
    assert.ok(names.has(name), `Missing ${name}`);
  }
});

test('species identifiers stay unique and local-name corrections target real records', () => {
  for (const field of ['id', 'slug', 'scientificName'] as const) {
    assert.equal(new Set(fishSpecies.map(s => s[field])).size, fishSpecies.length, field);
  }
  for (const slug of Object.keys(localNameUpdates)) assert.ok(fishSpecies.some(s => s.slug === slug), slug);
  for (const species of additionalSpecies) assert.ok(species.sources?.every(s => s.url.startsWith('https://')));
});

test('familiar names resolve to the correct species in search and catch logging', () => {
  for (const [query, scientificName] of [
    ['Kingfish', 'Scomberomorus commerson'], ['GT', 'Caranx ignobilis'],
    ['Sheri', 'Lethrinus nebulosus'], ['Sha’ari', 'Lethrinus nebulosus'],
    ['Kofer', 'Argyrops spinifer'], ['Faskar', 'Acanthopagrus bifasciatus'],
    ['Safi', 'Siganus canaliculatus'], ['صَافِي', 'Siganus canaliculatus'],
    ['ام ضريس', 'Lutjanus argentimaculatus'], ['Jesh Al Sal', 'Platycaranx chrysophrys'],
  ]) {
    const match = resolveSpeciesName(fishSpecies, query);
    assert.equal(match?.scientificName, scientificName, query);
    assert.ok(matchesSpecies(match!, query));
  }
  for (const query of ['Trevally', 'Snapper', 'Sea Bream', 'fish', '']) {
    assert.equal(resolveSpeciesName(fishSpecies, query), undefined, `Must not guess ${query}`);
  }
});
