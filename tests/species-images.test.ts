import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import photos, { habitatPhotoCredits } from '../lib/species-images';
test('habitat images retain credits, licenses and local originals', () => {
  assert.equal(Object.keys(habitatPhotoCredits).length, 11);
  for (const [slug, credit] of Object.entries(habitatPhotoCredits)) {
    assert.equal(photos[slug][0], credit.src);
    assert.ok(existsSync(`public${credit.src}`));
    assert.ok(credit.author && credit.license && credit.source.startsWith('https://'));
    assert.ok(credit.licenseUrl.startsWith('https://'));
  }
});
test('rejected specimens and incorrect secondary photographs are not displayed', () => {
  for (const slug of ['giant-catfish', 'silver-grunt', 'smallscaled-therapon', 'yellowfin-seabream']) assert.equal(photos[slug], undefined);
  assert.ok(!photos.queenfish.includes('/fish-species/jesh.jpg'));
});
