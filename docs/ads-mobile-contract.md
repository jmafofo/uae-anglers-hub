# Ocean Sentinel — Ad Slot Integration Contract

This is the contract for the mobile app to display sponsored placements
that offset the cost of running Ocean Sentinel for free-tier users.

**Premium subscribers see no ads** — the API enforces this server-side.
The app just calls the endpoint and renders whatever it gets back; if
`ad` is `null`, the slot is hidden.

---

## Placements

| Key | Where | Suggested layout |
|---|---|---|
| `identify_result` | After a successful fish identification, between the result card and the action buttons | Full-width card with image + headline + body + CTA button |
| `home_banner` | Home screen, between sections | Compact horizontal card |

The web app uses additional placements (`spot_sidebar`, `ban_banner`)
that aren't relevant to mobile yet.

---

## 1. Fetch the next ad

```
GET /api/ads/next?placement=identify_result&species=hammour&emirate=Abu+Dhabi
Authorization: Bearer <user-token>          (optional — but pass if signed in)
```

### Why pass auth

- Premium gating happens here. If `ocean_sentinel_premium = true`, the
  server returns `{ ad: null }` and the app shouldn't render anything.
- Per-user impression attribution — useful later for frequency capping
  and analytics.

### Why pass `species` and `emirate`

Targeted campaigns (e.g. a tackle shop running a "Hammour gear" promo
for Abu Dhabi users) outscore untargeted ones. Always pass the species
the user just identified and the emirate of the catch GPS.

### Response

```json
{
  "ad": {
    "id":            "uuid",
    "impression_id": "uuid",
    "sponsor_id":    "uuid",
    "sponsor_name":  "Bu Tinah Tackle",
    "sponsor_logo":  "https://…/logo.png",
    "headline":      "Hammour bites at dawn — get the right rig",
    "body":          "Heavy-action rods + circle hooks for grouper.",
    "image_url":     "https://…/creative.jpg",
    "cta_text":      "Shop grouper kit",
    "target_url":    "https://butinah.example/grouper",
    "charge_aed":    0.05
  }
}
```

Or, when no campaign is eligible:

```json
{ "ad": null }
```

The impression has **already been recorded** server-side as part of this
call — the app does not need to fire a separate beacon.

---

## 2. Click-through

Open the user's browser to:

```
GET /api/ads/click?cid=<id>&iid=<impression_id>
```

The endpoint records the click and returns a 302 to the sponsor's
`target_url`. Use the device's external browser, not an in-app webview
— external is required for some sponsor sites and makes attribution
cleaner. The redirect happens in milliseconds.

---

## 3. Mandatory: "Sponsored" disclosure

UAE National Media Council guidelines require visible sponsored
labelling. Every ad slot **must** render a "Sponsored" chip (or
equivalent — "Ad", "Promoted", or Arabic equivalent "إعلان"). The web
component places it top-right with amber styling; the mobile app
should follow a similar convention.

**Don't** disguise the ad as native content — visually distinct
border, sponsor name, and disclosure are all required.

---

## 4. Edge cases

- **Network failure** → silently render no ad. Don't show error UI for
  ad failures; users shouldn't even know there was supposed to be one.
- **Image fails to load** → render the text-only version of the card.
  Headline + body + CTA without the image is still a valid layout.
- **No campaigns eligible** → backend returns `{ ad: null }`. App
  should hide the slot entirely (no empty box).
- **Ad blocker behaviour on click endpoint** → the `/api/ads/click`
  redirect is first-party, so most ad blockers won't intercept it.
  If they do, the user just lands on the target URL without the
  click being recorded — acceptable.

---

## 5. Frequency capping (future)

Not implemented in v1. If a user identifies 20 fish in a session,
they'll potentially see 20 different ad slots (or the same campaign
re-served). Add client-side caching of the last ad shown if this
becomes a UX problem before a backend frequency cap is built.

---

## 6. Privacy

The impression record stores `user_id` (when authed) and the
`context` JSON (species + emirate). No PII beyond the user UUID.
Click records add a row in `ad_clicks` with the same data. Sponsors
do not get raw user lists — only aggregate counts via the admin
console.
