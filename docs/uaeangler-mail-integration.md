# UAEAngler enquiries → VantagePoint

Updated 27 November 2026. Mail DNS is configured and the info mailbox is connected to VantagePoint; automated replies are not yet activated.

## Verified mail configuration

- User approved replacing the SES incoming-mail route with the existing Namecheap Private Email subscription.
- Public MX: `10 mx1.privateemail.com`, `10 mx2.privateemail.com`.
- Root SPF: `v=spf1 include:spf.privateemail.com ~all`.
- Namecheap `default._domainkey` DKIM published and verified through DNS.
- Existing mailboxes: admin, info, support. `info@uaeangler.com` is the catch-all, so press and partnerships arrive there too. No new paid mailbox was needed.
- Correct Resend domain `uaeangler.com` is Verified, with sending enabled and receiving disabled. The old typo domain was left untouched.
- Resend records: TXT `resend._domainkey`, CNAME `rsend` → `rsend-apne1.forge.rmta.net`, CNAME `send` → `send.forge.rmta.net`.
- Website sender: `UAEAngler Website <notifications@uaeangler.com>`. A distinct automated sender prevents VantagePoint from classifying website enquiries as sent mail. Bid notification replies go to info; contact replies use the visitor Reply-To. General/support forms go to info; press forms to press; partnership forms to partnerships. The visitor remains the Reply-To recipient.
- Authorized contact-form test delivered successfully into VantagePoint on 27 November 2026. It exposed sender-based misclassification into Sent; the automated sender was changed to notifications@uaeangler.com and a repeated contact-form test now appears correctly in the UAEAngler Inbox. VantagePoint classified it as active/support and displayed the complete labelled test body. No automated replies have been sent.

## Remaining integration work

1. Completed: dedicated UAEAngler workspace created (5d60bb512b1743b0a52a6ea1cf33d2b2), and info@uaeangler.com connected with mail.privateemail.com. Owner entered the app password directly. UI confirms Connected and successful sync with 0 new messages on 27 November 2026. Existing webmail messages are older; website delivery and Inbox placement are verified. Local database backup was created before workspace setup; existing workspaces were preserved.
2. Preserve Reply-To through VantagePoint ingestion and message storage, then use it as the reply recipient. The existing importer does not retain this header. Otherwise website-originated enquiries may reply to the website sender instead of the visitor.
3. Configure a mailbox-scoped responder with durable processing, idempotency, and the existing routine-reply categories. The mail-agent API alone is not a running responder.
4. Configure important-message notifications. Existing safeguards hold press, partnerships, billing and other sensitive replies for review; use acknowledgement plus escalation without bypassing those checks.
5. Verify website → inbox → correct visitor reply → important-message notification before claiming activation.

## Sponsorship activation

- Separate Stripe account: UAE_Angler (`acct_1SpFxHH7SVdFX8vg`). Dashboard currently shows test mode and requires business verification.
- Production Stripe secret and webhook signing secret are not configured. Do not connect GetButlr's keys.
- Owner must complete Stripe business verification; then configure the UAEAngler live key and webhook securely and test fulfillment.
- Applied `20261127000000_showcase_sponsorship.sql` manually in Supabase SQL Editor. It adds missing legacy columns and the hero slot without replaying old migrations. It is idempotent for future migration-runner execution.
- Production `/api/banner-slots` now succeeds, including `home_hero_leaderboard`, 970×250, AED150/day (the existing historical price).
