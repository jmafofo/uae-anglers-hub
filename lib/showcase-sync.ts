import type { FilmBrand } from '@/lib/home-advertising';

/**
 * Showcase sync bus — lets the hero film player broadcast which clip is
 * playing (and which paid brands are attached to it) so sibling surfaces
 * can react: the "Presented by" spotlight in the hero's left column, and
 * the merchandise ticker, which re-leads with the presenting brand's gear.
 *
 * Decoupled by design: HeroSection's layout stays untouched, and each
 * surface subscribes independently.
 */
export interface ShowcaseState {
  clipId: string;
  clipTitle: string;
  clipCreator: string;
  brands: FilmBrand[];
}

const EVENT = 'uaeangler:showcase';

export function emitShowcase(state: ShowcaseState): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<ShowcaseState>(EVENT, { detail: state }));
}

export function onShowcase(callback: (state: ShowcaseState) => void): () => void {
  const handler = (e: Event) => callback((e as CustomEvent<ShowcaseState>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
