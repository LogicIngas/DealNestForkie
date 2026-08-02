# DealNest — Manual Testing Guide

This is a walkthrough for manually testing the app end-to-end: registration, the
customer-facing app (Home, Explore, Saved, Profile), and the store-owner dashboard.

## 1. Environment setup

**Prerequisites:** MySQL running locally, Java 21, Node 18+.

**Backend** (`backend/dealnest/src/main/resources/application.properties` has the DB
connection — defaults to `jdbc:mysql://localhost:3306/dealnestdb`, user `root`):

```
cd backend/dealnest
./mvnw spring-boot:run
```

Wait for `Started DealnestApplication` in the console. It listens on port `8080`.
DevTools is enabled, so most backend code changes hot-reload in a few seconds — if an
endpoint seems to still show old behavior right after an edit, wait a couple seconds
and retry before assuming something's broken.

**Frontend:**

```
cd frontend/dealnest
npm install
npm run dev
```

**Important:** the backend's CORS is hardcoded to `http://localhost:5173`. If that
port is already taken (stale dev server from an earlier session), Vite will silently
bind to `5174`/`5175` instead and every API call will fail with a CORS error that looks
like a network/login failure. Before testing, confirm you're actually on `5173` — check
the URL bar, or free the port:

```
netstat -ano | findstr :5173      # find what's holding it (Windows)
```

**Sanity check both are up:**
```
curl http://localhost:8080/api/stores      # should return [] or a list, not a connection error
```
Then open `http://localhost:5173` in the browser.

## 2. Seed demo data (recommended)

With the backend running:

```
node scripts/seed-data.mjs
```

Creates ~54 stores spread across all 8 categories and South African cities, each with
0–2 active promotions. Safe to re-run — it just adds more stores each time. Needs
Node 18+ (uses the built-in `fetch`).

## 3. Test accounts

- **Customer:** just sign up fresh through the UI (see 4.1).
- **Store owner:** requires a two-step workaround — see the "Store owner flow" note in
  Known Limitations (§6) before you try this, or you'll hit a dead end.

## 4. Test checklist

### 4.1 Registration & Login
- [ ] Sign up with all fields filled in → success alert → redirected to Login.
- [ ] Sign up again with the **same email** → should show a clean
      `This record already exists.` message, not a blank/generic error.
- [ ] Log in with the registered email (any password — see §6) → lands on Home.
- [ ] Log in with an email that was never registered → "User not found" message.
- [ ] Log out via the header icon, and separately via the Profile page button → both
      return you to the Login screen and clear the session (refreshing shouldn't
      silently log you back in).

### 4.2 Navigation
- [ ] Click Home / Explore / Saved / Account in the bottom nav → each should switch
      instantly with no full white-page flash (client-side routing).
- [ ] While on `/explore` or `/favorites`, refresh the browser → should stay on that
      page, not bounce back to Home.

### 4.3 Home page
- [ ] Hero banner shows a live deal count and store count that match reality.
- [ ] "Browse by Category" row: all 8 icons render correctly, each links to
      `/explore?category=X` and the Explore search box arrives pre-filled with that
      category.
- [ ] "Hot Deals" carousel scrolls horizontally; each card shows discount %, price
      (with strikethrough original price), and days remaining.
- [ ] Tap the bookmark icon on a deal card → fills in teal immediately, and the deal
      appears under Saved → Deals.
- [ ] "Featured Stores" shows up to 4 active stores.
- [ ] Tap the heart icon on a store card → fills red immediately, and the store
      appears under Saved → Stores.
- [ ] If there's no active data (empty DB), you should see friendly empty states, not
      a blank page.

### 4.4 Explore page
- [ ] Typing in the search box filters live by store name, city, or category.
- [ ] List / Map toggle switches views.
- [ ] Map view: browser will prompt for location permission. Accept → map centers on
      you with a teal dot marker. Deny → map centers on the average location of the
      visible stores instead (no crash either way).
- [ ] Clicking a map marker opens a popup with category icon, store name, city,
      distance from you (only if location was granted), and either the cheapest
      active deal price or "No active deals".
- [ ] Heart icon on a list row adds it to favorites (confirmation alert appears).

### 4.5 Saved page
- [ ] "Stores" tab lists favorited stores; the tab label shows a live count.
- [ ] "Deals" tab lists saved promotions with discount badge, price, and days left.
- [ ] Trash icon asks for confirmation, then removes the item immediately without a
      page reload.

### 4.6 Profile page
- [ ] Shows avatar initials, full name, "Member since" date, and live counts of saved
      stores / saved deals.
- [ ] Edit → change first name, last name, or phone → Save → the header greeting
      updates immediately, and the change survives a page refresh.
- [ ] Cancel discards changes without saving.
- [ ] Logout button works.

### 4.7 Store owner flow
Read §6 first — registering a store does **not** by itself give you a login. Steps to
actually test this end-to-end:
1. Sign up as a normal customer (§4.1) using an email containing the word "store",
   e.g. `owner-store@example.com`.
2. Separately, go to "Register Store" from the Login page and fill in the store form
   using **the same email**.
3. Log out if needed, then log in with that email → you should land on the Store
   Dashboard (not the customer app).
4. "Add New Promotion" → fill in title, description, original/discount price, start
   and end date → Publish → success alert.
5. Confirm it appears in `curl http://localhost:8080/api/promotion/findByIsActiveTrue`
   and shows up on the customer Home page's Hot Deals (log in as a customer in another
   browser/incognito window to check).

## 5. Known limitations (expected — not bugs to report)

- **Login doesn't verify the password.** Any password logs you in as long as the
  email exists in the system. This is a real gap worth fixing before any real
  deployment, but it's not something you're doing wrong in testing.
- **Store-owner role detection is a hack:** it just checks whether the login email
  contains the substring "store". There's no real role field on the account.
- **"Register Store" does not create a login account.** It only creates a `Store`
  row. To actually log in as that store afterward, you need a separate customer
  signup with the same email (see §4.7).
- **Store detail pages don't exist yet.** Clicking a store name or a Hot Deal card
  navigates to `/store/{id}`, which has no matching route — you'll see a blank
  content area under the header/nav rather than a crash.
- **"View My Promotions" button on the Store Dashboard is not wired up** — it does
  nothing when clicked.

## 6. Quick backend smoke tests

Useful when you need to tell whether something is a frontend bug or a backend bug.

```bash
# List stores
curl http://localhost:8080/api/stores

# List active promotions
curl http://localhost:8080/api/promotion/findByIsActiveTrue

# Register a user
curl -X POST http://localhost:8080/api/user/create \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User","phoneNumber":"0821234567","latitude":0,"longitude":0,"isActive":true}'

# Find a user by email
curl http://localhost:8080/api/user/findByEmail/test@example.com

# Create a store
curl -X POST http://localhost:8080/api/stores \
  -H "Content-Type: application/json" \
  -d '{"storeName":"Test Store","category":"OTHER","email":"store@example.com","phoneNumber":"0821234567","address":"1 Main Rd","city":"Cape Town","latitude":-33.9,"longitude":18.4}'

# Favorite a store (needs real userID + storeId)
curl -X POST http://localhost:8080/api/favoriteStore/create \
  -H "Content-Type: application/json" \
  -d '{"user":{"userID":"<userID>"},"store":{"storeId":"<storeId>"}}'

# Save a promotion (needs real userID + promotionID)
curl -X POST http://localhost:8080/api/savedPromotion/create \
  -H "Content-Type: application/json" \
  -d '{"user":{"userID":"<userID>"},"promotion":{"promotionID":"<promotionID>"}}'
```

If a response is a big Java stack trace instead of JSON, that's a backend 500 —
copy the `"message"` field, it's usually enough to identify the root cause.
