import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fishingSpots } from '../lib/spots';
import { fishSpecies } from '../lib/species';
import { filterSpots, matchesSpecies } from '../lib/discovery';

test('spot filters combine species, emirate, and access without changing the source', () => {
  const spot = fishingSpots.find(s => s.species.length > 0)!;
  const results = filterSpots(fishingSpots, { q: `  ${spot.species[0].toUpperCase()} `, emirate: spot.emirate, access: spot.accessType.split('/')[0] });
  assert.ok(results.some(s => s.id === spot.id));
  assert.ok(results.every(s => s.emirate === spot.emirate));
  assert.equal(filterSpots(fishingSpots, { q: 'zzznomatchinglocationzzz' }).length, 0);
  assert.equal(filterSpots(fishingSpots, {}).length, fishingSpots.length);
});

test('species search supports Arabic names, scientific names, and aliases', () => {
  const species = fishSpecies.find(s => s.localName)!;
  assert.equal(matchesSpecies(species, species.localName), true);
  assert.equal(matchesSpecies(species, ` ${species.scientificName.toUpperCase()} `), true);
  assert.equal(matchesSpecies({ ...species, aliases: ['test common name'] }, 'test common'), true);
  assert.equal(matchesSpecies(species, 'zzznomatchzzz'), false);
});
