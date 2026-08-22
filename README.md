# thespot.lol

a public leaderboard with one rule: your rank is the total amount of money you have paid. nothing else.

this file is the runbook. it is written to be followed at 2am.

## stack

- next.js (app router, typescript), plain css
- supabase postgres + realtime
- polar as merchant of record (pay-what-you-want product)
- netlify hosting
- support email: `support@thespot.lol`

## local dev

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # 17 unit tests: normalisation, ranking, platform matcher, image sniffing
npm run build
```

with no `.env.local`, the board renders ~58 demo rows so the design can be
worked on. checkout returns 503 until env is set.

## env vars, all of them

```
# server only. never NEXT_PUBLIC. never in the client bundle.
POLAR_ACCESS_TOKEN=          # polar dashboard → settings → access tokens
POLAR_WEBHOOK_SECRET=        # polar dashboard → settings → webhooks
POLAR_PRODUCT_ID=            # the Spot Upgrade product id
POLAR_SERVER=sandbox         # flip to "production" at step 8 of launch, not before
SUPABASE_URL=                # supabase → settings → api
SUPABASE_SERVICE_ROLE_KEY=   # supabase → settings → api → service_role
CLICK_SALT=                  # any long random string, salts click-dedupe ip hashes

# safe for the client bundle.
NEXT_PUBLIC_SUPABASE_URL=    # same value as SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=https://thespot.lol
NEXT_PUBLIC_LAUNCH_AT=       # iso timestamp; the "since it went up N hours ago" counter
```

## setup, in order

### 1. supabase

1. create a project at supabase.com
2. sql editor → run `supabase/schema.sql` in full (tables, indexes, RLS, realtime, rpc functions). if the db was created from the v1 schema, run `supabase/migration-v2.sql` instead
3. optionally run `supabase/seed.sql` for design rows — delete before launch (statement at the bottom of that file)
4. copy the url, anon key, and service_role key into env

### 2. polar (sandbox first)

1. create an org at sandbox.polar.sh
2. product: name `Spot Upgrade`, one-time purchase, **pay what you want**, minimum $5.00, suggested $10.00, USD, public, no benefits → copy product id
3. settings → access token → `POLAR_ACCESS_TOKEN`
4. settings → webhooks → add endpoint:
   - url: `https://<public-url>/api/polar/webhook` (see "webhook needs a public url" below)
   - events: `order.paid`, `order.refunded`
   - format: raw → copy signing secret
5. `POLAR_SERVER=sandbox`

the checkout call sets `success_url` to `/success?checkout_id={CHECKOUT_ID}&ref=...`
and `return_url` to `/cancelled`. nothing to configure in the polar dashboard for those.

### 3. the webhook needs a public url

polar cannot reach localhost. for sandbox testing:

```bash
ngrok http 3000        # register https://xxx.ngrok.io/api/polar/webhook in polar sandbox
```

or deploy to netlify first and use the live url.

### 4. netlify

1. connect the repo; `netlify.toml` handles the build
2. set every env var above in site settings → environment
3. deploy, point thespot.lol dns at netlify, confirm ssl
4. update the polar webhook to the production url

## the sandbox test matrix

run all of these against polar sandbox before going live. 4 and 5 are the
two that cost real money if they fail — do those first.

| # | test | pass |
|---|---|---|
| 4 | replay the same webhook delivery (polar dashboard → redeliver) | credited once (`payments.polar_order_id` unique) |
| 5 | edit the amount in the checkout url | row reflects the real paid amount (webhook reads the order, never metadata) |
| 1 | pay $5 on a fresh url | row appears at the correct rank |
| 2 | pay again on the same url | row increments, no duplicate |
| 3 | `https://WWW.Example.com/?ref=x` after `example.com` | same row topped up |
| 6 | two listings on the same total | older ranks higher |
| 7 | POST an unsigned payload to `/api/polar/webhook` | 403, nothing written |
| 8 | pay in one browser, watch another | live reorder, glow, activity strip updates |
| 9 | complete a payment | lands on `/success`, real rank shown |
| 10 | cancel at polar | lands on `/cancelled`, form values kept |
| 11 | submit `javascript:alert(1)` | rejected |
| 12 | submit a 200-char title | rejected server-side |
| 13 | hit `/api/checkout` 10x in a minute | rate limited after 5 |
| 14 | `grep -rl SUPABASE_SERVICE_ROLE_KEY .next/static/` | no matches |
| 15 | load with 200 rows | scroll at 60fps |
| 16 | 360px | nothing overflows, sticky bid bar works |
| 17 | refresh in dark mode | no white flash |
| 18 | paste the url in slack or an x dm | og card renders the live top price |

## launch order

1. polar payout account green (dashboard → finance). nothing matters until this
2. legal pages live (`/terms` `/privacy` `/refunds` — they are, keep them that way)
3. submit polar account for review (support email verified, socials added, product described as placement/cosmetic — no wagering language)
4. ngrok up, full test matrix against sandbox
5. fix, re-run
6. polar approval lands
7. recreate product + token + webhook on production polar (polar.sh)
8. flip env on netlify: `POLAR_SERVER=production` + production token, product id, webhook secret
9. **one real $5 payment on your own card, end to end.** not optional
10. run the favicon backfill (below), delete the seed rows
11. post it

## one-off scripts

**favicon backfill** — re-resolves every row's logo with the current
resolver. run once before launch, safe to re-run:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/backfill-logos.ts
```

## moderation: wiping a row fast

when someone lists something vile at 3am, run this in the supabase sql
editor from your phone. the board updates live the moment it commits:

```sql
-- blank a listing's public face, keep its paid total and rank
update listings
set title = '[removed]',
    description = null,
    display_url = 'https://thespot.lol/rules',
    favicon_url = null
where identity_key = 'the-offending-key';
```

the profanity filter in `src/lib/moderation.ts` blocks the obvious stuff
at submit. this query is for everything it misses.

## how money flows

1. `/api/checkout` validates input ($5 minimum new, $1 top-up, fixed category list, profanity filter, 5/min/ip rate limit), resolves the logo server-side, creates a polar checkout with identity metadata
2. buyer pays on polar's hosted checkout, then lands on `/success`, which polls `/api/listing-status` until the webhook has landed (or hands them the support email after 20s — never an error, the money is fine)
3. polar calls `/api/polar/webhook` → signature verified against the raw body → `handle_order_paid` rpc inserts the payment row (unique order id = idempotency) and credits the listing in one transaction
4. supabase realtime nudges every open board; the row glides to its rank with a glow

money is stored in **cents as integers** everywhere. dollars exist only at
the render layer. the paid amount is always read from the polar order
object, never from checkout metadata, so a tampered checkout url cannot
buy a bigger total than was actually paid.

## logos

resolved server-side at submit and stored on the row: `platform:<id>`
renders one of 20 bundled brand marks, an `https://` url renders a
favicon that passed image validation (content-type, byte size, ≥16x16 by
header sniffing), `null` renders a deterministic gradient tile. grey
globes do not exist.

## theme

light/dark via `data-theme` on `<html>`, cookie-stored so the server
renders the right theme on first paint; an inline head script covers the
no-cookie prefers-dark case. no flash.
