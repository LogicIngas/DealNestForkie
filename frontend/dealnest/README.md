# DealNest

Discover local deals. DealNest is a full-stack deal-discovery app with a customer-facing
mobile-style web app, a store-owner dashboard and an admin dashboard. Stores publish
promotions, and customers browse, save, claim and redeem them — with paid tiers
(**DealNest Plus** for customers, **Pro** for stores) that unlock extra power on both sides.

## Stack

| Layer    | Tech                                                                 |
| -------- | -------------------------------------------------------------------- |
| Backend  | Java 21, Spring Boot 4.1, Spring Security + JWT (BCrypt passwords)    |
| Database | PostgreSQL 16 (`localhost:5433/dealnestdb`)                          |
| Frontend | React 19 + Vite, Tailwind CSS 4, Leaflet maps, lucide-react icons    |

## Project layout

```
dealnest/
├── backend/dealnest    Spring Boot REST API (port 8080)
└── frontend/dealnest   React + Vite SPA (port 5173)
```

## Getting started

**Backend** (needs a running PostgreSQL on `localhost:5433/dealnestdb`, user `postgres`):

```bash
cd backend/dealnest
./mvnw spring-boot:run
```

Defaults are in `src/main/resources/application.properties` and can be overridden with the
`DB_URL`, `DB_USERNAME`, `DB_PASSWORD` and `JWT_SECRET` environment variables. The backend
listens on `http://localhost:8080`.

**Frontend:**

```bash
cd frontend/dealnest
npm install
npm run dev
```

Open `http://localhost:5173`. The backend's CORS allow-list defaults to
`http://localhost:5173` — if Vite binds to a different port, API calls fail with CORS
errors.

**Seed demo data** (optional, with the backend running — run from the repo root):

```bash
node scripts/seed-data.mjs
```

Creates 8 demo accounts, 10 stores (categories: electronics, restaurant, grocery, pharmacy,
fashion, beauty, home goods — spread across Joburg, Pretoria, Cape Town, Durban, Gqeberha,
Bloemfontein), 21 promotions (featured/promoted/scheduled/expired), price-drop history with
gold alerts, reviews, favorites, saved deals, claimed/redeemed codes, deal alerts and search
history. Idempotent — safe to re-run; the air-fryer price history self-heals if incomplete.

Demo accounts (password `DealNest123!`):

| Email                  | Role                                                     |
| ---------------------- | -------------------------------------------------------- |
| `plus@demo.co.za`      | DealNest Plus customer (gold price-drop pings + sparklines, unlimited saves) |
| `liam@demo.co.za`      | DealNest Plus customer                                  |
| `free@demo.co.za`      | Free plan (10-deal save cap, no sparklines/alerts)      |
| `aisha@demo.co.za`     | Free plan                                               |
| `pro@demo.co.za`       | Store owner — owns the **Pro** store "Mokoena Electronics" |
| `lerato@demo.co.za`    | Store owner (3 stores)                                  |
| `david@demo.co.za`     | Store owner (3 stores)                                  |
| `sarah@demo.co.za`     | Store owner (2 stores)                                  |

Admin (seeded by `backend/.../src/main/resources/data.sql`): `admin@dealnest` /
`admin1234`.

Things to try after seeding: log in as `pro@demo.co.za` and redeem `plus@demo.co.za`'s
outstanding air-fryer (R2 199 → R1 199) and TV (R15 999 → R9 599) codes in-store — the
savings appear on the customer's **Total saved**; watch the air-fryer deal's sparkline
under DealNest Plus; send a review from a Plus account to see the gold Plus badge.

## Feature guide

Everything below works today and is reachable from the app's bottom navigation:
**Home**, **Explore**, **Deals**, **Favorites**, **Profile**.

---

### Browse & discover (free, no sign-in needed for reading)

- **Hot Deals feed** — Home shows active deals with promoted (flame) and featured (star)
  deals floated to the top. *Home tab.*
- **Category sections** — tap a category chip on Home to jump into Explore pre-filtered.
  *Home tab → category chips.*
- **Explore / search stores** — search stores, cities or categories, with filter chips for
  category, minimum rating, deals-only and max distance, plus sort by relevance, rating,
  name or distance. *Explore tab → search bar + filter chips.*
- **Map view** — switch the Explore list to a Leaflet map with store markers positioned by
  city; distance filters use your browser location. *Explore tab → Map toggle.*
- **Store pages** — address, hours, phone/email, rating, description and verified badge,
  with that store's live deals. *Tap any store card.*
- **Deal product search + budget** — search a product or store name across *all* active
  deals, set a top budget (filters by discounted price) and narrow by category. The search
  bar on Home and the Deals tab both feed this page. *Deals tab, or Home search bar.*
- **Compare deals** — side-by-side price / discount / rating / days-left comparison with
  the cheapest option highlighted. *Favorites tab → Deals → select up to 3 → Compare*, and
  *Deals tab → "Compare deals"* on any search result set.
- **Recently viewed searches** — your searches are remembered and shown as chips you can
  re-run or remove one-by-one. *Deals tab → Recent.*

### Save, claim & share (free, sign-in required)

- **Save stores & deals** — heart a store, bookmark a deal; both live under My Favorites.
  *Store page icons; Favorites tab.* (Free plan can save up to 10 deals.)
- **Claim a deal** — generates a unique voucher code you show in-store. *Ticket icon on any
  deal card → Favorites tab → My Codes.*
- **Review stores** — post a star rating and comment, and edit or delete your own review.
  *Store page → Reviews → Write a review.*
- **Report a bad deal** — flag expired or incorrect deals; reports go to the admin queue.
  *Flag icon on any deal card.*
- **Share** — native share sheet / copy-link for stores and individual deals. *Share icon
  on a store or deal.*
- **Total saved on claimed deals** — a running total of the money you've saved. *Favorites
  tab → My Codes; also on Profile stats.*
- **Notifications bell** — your alerts and updates with unread count and tap-to-mark-read.
  *Bell icon in the header.*

### Gamification (free)

- Daily-login **streak** and **points** (+2 check-in, +5 save a deal, +10 claim, +15
  redeem, +5 review), with badges that grow as you play: *Deal Starter*, *Deal Hunter*,
  *Bargain Master*, *Deal Legend*, plus weekly/monthly streak badges. *Profile tab.*

### DealNest Plus — customers (R49/month)

Upgrade on the Profile tab — checkout runs through PayFast's hosted page (recurring
agreement), and the plan activates automatically when payment is confirmed.

- **Unlimited saved deals** (free plan caps at 10).
- **Deal & price-drop alerts** — create an alert for a category, max price and/or minimum
  discount; the backend matches every new *and* every price-dropping promotion against
  your alerts and fires a gold **Priority** notification. *Profile tab → Deal alerts.*
- **Watch a search** — on the Deals tab, "Watch this search" saves your keyword/budget and
  pings you the moment a match goes live — and again if a watched product's price drops.
  *Deals tab → Watch this search (bell icon).*
- **Personalized recommendations** — Home's "Recommended for You" becomes a ranking built
  from your saved stores, saved/claimed/redeemed deals **and your search history**.
  *Home tab → Recommended for You.*
- **Price history sparklines** — see a deal's discount price trend over time. *Store page →
  each deal card* (Plus-gated; free users see a lock hint).
- **Plus badge on your reviews** — your reviews carry a Plus badge on every store page.
- **Manage or cancel** your subscription any time (stays active to the end of the month).
  *Profile tab → DealNest Plus.*

### Pro — stores (R199/month)

Upgrade from the Store Dashboard. Caveat: paid-tier perks are enforced server-side, so a
non-Pro store's promoted/featured flags are silently dropped.

- **Store dashboard** — publish, edit, deactivate and delete promotions, manage your store
  profile, and **redeem claimed voucher codes** in-store.
- **Promoted deal** — one deal floats to the top of Home's Hot Deals and the active-deals
  feed (flame icon).
- **Featured deal** — one auto-unique featured deal per store (star icon).
- **Analytics dashboard** — views, saves, claims, redeems and shares, follower count,
  per-promotion conversion rates, and a "where your customers come from" city breakdown.
  Tracked automatically as users view/save/claim/redeem/share.
- **Customer insights** — anonymized engagement breakdown by city.
- **Promotion scheduling** — set start/end dates; a background scheduler auto-activates and
  auto-expires deals every 60 seconds (toggleable per promotion).
- **Bulk promotion upload** — paste or upload a CSV (`title,description,originalPrice,
  discountPrice,startDate,endDate,imageUrl`); the browser parses it, posts it in bulk, and
  reports any invalid rows.

### Admin dashboard

Separate admin login (`/api/admin/login`). Manage and moderate the whole platform:

- Verify / deactivate stores, activate / hard-delete user accounts.
- Create, edit and delete any promotion; view all users, stores and promotions.
- Resolve the deal-report queue (PENDING → VERIFIED/REJECTED).
- Send and delete notifications, and view all users' search history.
- Platform stats at a glance (active stores, pending reports, Plus and Pro subscriber
  counts, stores by category).

---

## Premium feature enforcement

Tier gating is enforced **server-side**, not just hidden in the UI:

- Paid endpoints respond `402 Payment Required` (with an `UPGRADE_REQUIRED` code) when the
  account isn't on the right tier.
- Non-Pro stores can't promote/feature deals — those flags are silently sanitized, and
  analytics / insights / bulk-upload endpoints are blocked.
- Non-Plus users get `null` back from deal-alert creation, a 402 from personalized
  recommendations and price history, and the free-plan 10-deal save cap still applies.
- Lapsed Plus subscribers: their alerts stop firing until they renew, even if the alert is
  still "active".

## API surface (new & premium)

```
GET  /api/promotion/search?q=&maxPrice=&category=     free product/budget search
GET  /api/priceHistory/findByPromotionId/{id}         402 unless Plus / owner / admin
POST /api/searchHistory/create                        (authenticated)
GET  /api/searchHistory/findByUserId/{userId}         (authenticated)
DELETE /api/searchHistory/delete/{id}                 (authenticated)

POST /api/dealAlert/create                            (402 unless DealNest Plus)
GET  /api/dealAlert/findByUserId/{userId}

GET  /api/stores/personalized/{userId}                (402 unless DealNest Plus)
GET  /api/stores/recommended/{userId}

POST /api/promotion/bulk                              (402 unless Pro)
POST /api/analytics/track                             (Pro)
GET  /api/analytics/store/{storeId}                   (Pro/owner)
GET  /api/analytics/store/{storeId}/insights          (Pro/owner)
```

## Scripts

Frontend (`frontend/dealnest`):

```bash
npm run lint    # oxlint
npm run build   # production build
npm run dev     # dev server
```