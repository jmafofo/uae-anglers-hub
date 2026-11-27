# Design Tokens — UAE Anglers Hub

Status: v1, 2026-11-27. Aligns with the `coastal-*` design system in `app/globals.css`
(light editorial surfaces, Georgia serif display type, deep-teal accents) and adds
the gold "achievement" layer from the Deep Current proposal.

Use these values everywhere. In Tailwind, prefer the `coastal-*` utility classes
where they exist; otherwise use arbitrary values with these exact hex codes.

## Color

| Token | Value | Use |
|---|---|---|
| `surface` | `#f7f9fa` | Page background (light discovery pages) |
| `surface-card` | `#ffffff` | Cards, panels |
| `border` | `#e1e7eb` | Card/panel borders |
| `border-strong` | `#cbd5dc` | Secondary buttons, inputs |
| `ink` | `#182e3c` | Body text |
| `ink-heading` | `#18333f` | Headings |
| `ink-muted` | `#5b6b77` | Secondary text |
| `ink-faint` | `#7a8891` | Placeholders |
| `primary` | `#23675e` | Primary buttons, links, active states |
| `primary-hover` | `#174e47` | Primary hover |
| `primary-soft` | `#e7f2ee` | Selected chips, hover washes |
| `ring` | `#45a99b` | Focus-visible outlines |
| `gold` | `#b8892d` | Achievement/premium text + icons |
| `gold-bright` | `#d4af5a` | Gold highlights, crown accents |
| `gold-soft` | `#faf3e3` | Gold badge backgrounds |
| `deep` | `#0a1828` | Dark sections (footer, immersive headers) — matches legacy `--background` |
| `deep-teal` | `#0d2b33` | Dark-section gradients |

Rules:
- **Gold is reserved** for achievement, ranking, and premium (Hall of Fame crown,
  dealer/premium badges, #1 placements). Never use it for ordinary actions.
- Dark sections are used sparingly as contrast bands (hero, footer); the product
  is primarily light.

## Type

- **Display/headings**: `Georgia, 'Times New Roman', serif`, tight tracking
  (`-0.035em` to `-0.045em`), sizes via `clamp()` (see `.coastal-display`).
- **Body/UI**: system sans (Tailwind default), `.875rem` for controls.
- **Eyebrow labels**: `.75rem`, 600 weight, `.16em` tracking, uppercase, `primary`.

## Shape & depth

- Radius: `.65rem` (controls), `1rem` (cards), `999px` (chips/pills).
- Card border: `1px solid border`; hover: border `#a8c9c2` + shadow `0 12px 32px #173b4a0b`.
- Lift on hover: shadow deepen only — no translate on cards (Codex coastal convention).

## Motion

- Transitions: `150–250ms ease-out`; color/background `200ms`.
- Ambient animation (backdrop, carousel): slow (5–8s cycles), subtle.
- **Always** honor `prefers-reduced-motion`: disable non-essential animation
  (canvas animations render a static frame; carousels stop autoplay).

## Signature elements

- `FishSplashBackdrop` (`components/FishSplashBackdrop.tsx`) — animated canvas
  of water, leaping fish, and splash particles. Use behind hero/immersive
  headers. Subtle by default; never behind long-form reading content.
- `PremiumBadge` — gold pill, only for paid/achievement status.
- King crown treatment (`components/KingCrown.tsx`) — Hall of Fame #1 only.

## Accessibility

- Focus-visible: `3px solid ring`, offset 4px (already global via coastal CSS).
- Contrast: `ink` on `surface` ≈ 12:1; `primary` on white ≈ 5.9:1 — both pass AA.
- Never place text over animated backdrop without a white/85+ scrim.
