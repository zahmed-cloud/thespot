# thespot.lol

a public leaderboard with one rule: your rank is the total amount of money you have paid. nothing else.

## stack

- next.js (app router, typescript), plain css
- supabase postgres + realtime
- polar as merchant of record (pay-what-you-want product)
- netlify hosting

## local dev

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # unit tests for identity normalisation + ranking
npm run build
```

with no `.env.local`, the board renders 8 demo rows so you can work on the design. checkout returns 503 until env is set.

## setup, in order

### 1. supabase

1. create a project at supabase.com
2. sql editor → paste and run `supabase/schema.sql` (tables, indexes, RLS, realtime publication, rpc functions)
3. optionally run `supabase/seed.sql` for the 8 design rows
4. copy from project settings → api:
   - `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL` (same value)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon/public key)
   - `SUPABASE_SERVICE_ROLE_KEY` (service_role — server only, never NEXT_PUBLIC)

### 2. polar (sandbox first)

1. create an org at sandbox.polar.sh
2. create a product:
   - name: Spot Upgrade
   - one-time purchase, **pay what you want**
   - minimum $5.00, suggested $10.00, USD, public, no benefits
3. copy the product id → `POLAR_PRODUCT_ID`
4. settings → create an access token → `POLAR_ACCESS_TOKEN`
5. settings → webhooks → add endpoint:
   - url: `https://<your-domain>/api/polar/webhook` (use the netlify url or a tunnel for local testing)
   - events: `order.paid`, `order.refunded`
   - format: raw
   - copy the signing secret → `POLAR_WEBHOOK_SECRET`
6. set `POLAR_SERVER=sandbox`

### 3. env

copy `.env.example` to `.env.local` and fill it in. also add `CLICK_SALT` (any long random string; it salts the ip hashes for click dedupe).

### 4. netlify

1. connect the repo, framework auto-detects next.js via `netlify.toml`
2. add every env var from `.env.example` in site settings → environment
3. deploy, point dns for `thespot.lol` at netlify
4. update the polar webhook url to the live domain

### 5. go live

1. run the pre-launch tests below against sandbox
2. recreate the product + token + webhook on production polar (polar.sh), submit the domain for review (the terms/privacy/refunds pages exist for this)
3. flip env: `POLAR_SERVER=production` plus the production token, product id, webhook secret
4. delete the seed rows (statement at the bottom of `supabase/seed.sql`)

## pre-launch tests

| test | expected |
|---|---|
| sandbox payment on a new url | new listing appears at the correct rank, stamp animation fires |
| sandbox payment on an existing url | existing row increments, no duplicate |
| `https://WWW.Example.com/` after `example.com` | tops up the same row |
| replay the same webhook delivery (polar dashboard → redeliver) | credited once (`payments.polar_order_id` unique) |
| tamper with the checkout amount in the url | listing reflects the real paid amount only (webhook reads the order, not metadata) |
| two listings at the same total | older one ranks higher |
| board open in two browsers, pay in one | second browser updates live with the stamp |
| load at 360px | row collapses to two lines, money right-aligned |
| `prefers-reduced-motion` on | no slide, no stamp |
| `grep -rl SUPABASE_SERVICE_ROLE_KEY .next/static/` | no matches |
| all six pages load | footer links terms, privacy, refunds |

## moderation: wiping a row fast

listings never lose their rank, but the text and link can be blanked in under a minute. supabase sql editor:

```sql
-- blank a listing's public face, keep its paid total and rank
update listings
set title = '[removed]',
    description = null,
    display_url = 'https://thespot.lol/rules'
where identity_key = 'the-offending-key';
```

the board updates live via realtime the moment this runs. the profanity filter in `src/lib/moderation.ts` blocks the obvious stuff at submission; this query is for everything it misses.

## how money flows

1. `/api/checkout` validates input, checks whether the identity key exists ($5 minimum new, $1 top-up), creates a polar checkout with identity metadata
2. buyer pays on polar's hosted checkout
3. polar calls `/api/polar/webhook` → signature verified against the raw body → `handle_order_paid` rpc inserts the payment row (unique order id = idempotency) and upserts the listing total in one transaction
4. supabase realtime pushes the change to every open board; the row slides to its rank and gets stamped

money is stored in **cents as integers** everywhere. dollars exist only at the render layer.
