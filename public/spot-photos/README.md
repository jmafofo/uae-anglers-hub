# Spot Photos

Drop your real fishing spot photos here. The site will automatically use them.

## Naming convention

Name each photo using the spot's URL slug:

| Spot name              | File name                    |
|------------------------|------------------------------|
| Dubai Creek            | dubai-creek.jpg              |
| Al Garhoud Bridge      | al-garhoud-bridge.jpg        |
| Jumeirah Beach         | jumeirah-beach.jpg           |
| The Palm Jumeirah      | the-palm-jumeirah.jpg        |
| Al Hamra Marina        | al-hamra-marina.jpg          |
| Fujairah Marine Club   | fujairah-marine-club.jpg     |
| Khor Fakkan            | khor-fakkan.jpg              |
| Dibba                  | dibba.jpg                    |
| … and so on            |                              |

The slug is always the spot name lowercased with spaces replaced by hyphens
and special characters removed — same as what appears in the URL.

## Multiple photos per spot (gallery)

You can add multiple photos for any spot by numbering them:

```
dubai-creek.jpg        ← used as the main card/hero image
dubai-creek-2.jpg
dubai-creek-3.jpg
dubai-creek-4.jpg
```

The detail page will show all of them in a scrollable gallery.

## Supported formats

.jpg  .jpeg  .png  .webp  .avif

## After adding photos

Run this command once to register them with the site:

```bash
npm run scan-photos
```

Then commit the updated `lib/local-photos.json` and push to deploy.

## All 41 spot slugs for reference

al-garhoud-bridge
al-maktoum-bridge
dubai-creek
jumeirah-beach
the-palm-jumeirah
jebel-ali-beach
dubai-marina
safa-park-lake
al-seef-district
umm-suqeim-beach
al-aryam-island
mina-breakwater
marina-mall-island
salam-corniche
mussafah-bridge
al-bateen
mina-zayed
al-khan-lagoon
al-hamriyah-port
khor-kalba
marbella-resort-area
sharjah-corniche
ajman-marina
ajman-corniche
ajman-beach
uaq-coastline
uaq-lagoons
al-hamra-marina
al-marjan-island
al-jazeera-al-hamra-beach
al-rams-beach
mina-al-arab-lagoon
dhayah-bay
khor-al-beidah
rak-offshore
flamingo-beach
fujairah-marine-club
fujairah-port-area
dibba
khor-fakkan
fujairah-beaches
