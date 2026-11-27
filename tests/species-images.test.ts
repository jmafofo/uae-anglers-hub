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
  for (const slug of ['giant-catfish', 'silver-grunt']) assert.equal(photos[slug], undefined);
  // Reinstated with reviewed, approved photos (2026-11-27)
  assert.ok(photos['smallscaled-therapon'].includes('/fish-species/commons/smallscaled-therapon.jpg'));
  assert.ok(photos['yellowfin-seabream'].includes('/fish-species/commons/yellowfin-seabream.jpg'));
  assert.ok(!photos.queenfish.includes('/fish-species/jesh.jpg'));
});
