// Seeds the running backend with realistic demo data so every feature can be
// tested as if the app had real users, stores, deals and activity.
//
// Usage:  node scripts/seed-data.mjs
//         (requires the backend running on http://localhost:8080, Node 18+)
//
// Accounts created share one password:  DealNest123!
//   - plus@demo.co.za   DealNest Plus customer   (Thandi Ncube)
//   - liam@demo.co.za   DealNest Plus customer   (Liam Botha)
//   - free@demo.co.za   Free-plan customer       (Sipho Dlamini)
//   - aisha@demo.co.za  Free-plan customer       (Aisha Patel)
//   - pro@demo.co.za    Store owner (owns the PRO store "Mokoena Electronics")
//   - lerato@demo.co.za / david@demo.co.za / sarah@demo.co.za  store owners
//
// The script is idempotent: re-running it reuses existing users/stores/promos,
// and reconciles Plus/Pro tiers instead of duplicating data.

const API = process.env.API_URL || 'http://localhost:8080/api';
const PASSWORD = 'DealNest123!';

const CATEGORIES = ['GROCERY', 'PHARMACY', 'FASHION', 'ELECTRONICS', 'RESTAURANT', 'BEAUTY', 'HOME_GOODS', 'OTHER'];

const cities = [
  { city: 'Cape Town', lat: -33.9249, lng: 18.4241 },
  { city: 'Johannesburg', lat: -26.2041, lng: 28.0473 },
  { city: 'Durban', lat: -29.8587, lng: 31.0218 },
  { city: 'Pretoria', lat: -25.7479, lng: 28.2293 },
  { city: 'Port Elizabeth', lat: -33.9608, lng: 25.6022 },
  { city: 'Bloemfontein', lat: -29.0852, lng: 26.1596 },
];

const userDefs = [
  { email: 'plus@demo.co.za',   firstName: 'Thandi',   lastName: 'Ncube',    tier: 'PLUS', city: 'Johannesburg' },
  { email: 'liam@demo.co.za',   firstName: 'Liam',     lastName: 'Botha',    tier: 'PLUS', city: 'Cape Town' },
  { email: 'free@demo.co.za',   firstName: 'Sipho',    lastName: 'Dlamini',  tier: 'FREE', city: 'Durban' },
  { email: 'aisha@demo.co.za',  firstName: 'Aisha',    lastName: 'Patel',    tier: 'FREE', city: 'Pretoria' },
  { email: 'pro@demo.co.za',    firstName: 'James',    lastName: 'Mokoena',  tier: 'FREE', city: 'Johannesburg' },
  { email: 'lerato@demo.co.za', firstName: 'Lerato',   lastName: 'Molefe',   tier: 'FREE', city: 'Cape Town' },
  { email: 'david@demo.co.za',  firstName: 'David',    lastName: 'van Wyk',  tier: 'FREE', city: 'Port Elizabeth' },
  { email: 'sarah@demo.co.za',  firstName: 'Sarah',    lastName: 'Johnson',  tier: 'FREE', city: 'Johannesburg' },
];

// ownerEmail is the account that must be logged in to manage the store.
const storeDefs = [
  { storeName: 'Mokoena Electronics', owner: 'pro@demo.co.za',    category: 'ELECTRONICS', city: 'Johannesburg', planTier: 'PRO', verified: true },
  { storeName: 'DigiTech Hub',        owner: 'pro@demo.co.za',    category: 'ELECTRONICS', city: 'Pretoria',     planTier: 'FREE' },
  { storeName: "Lerato's Kitchen",    owner: 'lerato@demo.co.za', category: 'RESTAURANT',  city: 'Cape Town',    planTier: 'FREE' },
  { storeName: 'Fresh & Fabulous',    owner: 'lerato@demo.co.za', category: 'GROCERY',     city: 'Durban',       planTier: 'FREE' },
  { storeName: 'CarePoint Pharmacy',  owner: 'lerato@demo.co.za', category: 'PHARMACY',    city: 'Bloemfontein', planTier: 'FREE' },
  { storeName: 'Van Wyk Home Store',  owner: 'david@demo.co.za',  category: 'HOME_GOODS',  city: 'Port Elizabeth', planTier: 'FREE', verified: true },
  { storeName: 'Style Republic',      owner: 'david@demo.co.za',  category: 'FASHION',     city: 'Cape Town',    planTier: 'FREE' },
  { storeName: 'Ocean Fresh Grill',   owner: 'david@demo.co.za',  category: 'RESTAURANT',  city: 'Durban',       planTier: 'FREE' },
  { storeName: 'Beauty Bar SA',       owner: 'sarah@demo.co.za',  category: 'BEAUTY',      city: 'Johannesburg', planTier: 'FREE' },
  { storeName: 'Kasi Style',          owner: 'sarah@demo.co.za',  category: 'FASHION',     city: 'Johannesburg', planTier: 'FREE' },
];

// promo defs per store name. discountPrice is the INITIAL one; the air fryer
// promo then gets stepped down through a chain of updates so Plus users see a
// price history sparkline and price-drop notifications.
const promoDefs = {
  'Mokoena Electronics': [
    { title: 'Air Fryer XL 5.5L — 45% Off',
      description: 'Family-size hot air fryer with 8 presets. Perfect for quick, healthy weeknight meals.',
      originalPrice: 2199, discountPrice: 1899, days: 21, featured: true },
    { title: 'Wireless Earbuds Pro — 30% Off',
      description: 'Active noise cancelling earbuds with 30h playtime and wireless charging case.',
      originalPrice: 899, discountPrice: 629, days: 14, promoted: true },
    { title: '55" QLED Smart TV — 40% Off',
      description: '4K QLED TV with HDR10+, Dolby Atmos and built-in streaming apps.',
      originalPrice: 15999, discountPrice: 9599, days: 30 },
    { title: 'Gaming Laptop Launch — Coming Soon',
      description: 'Pre-order the new RTX gaming laptop before launch for launch-week pricing.',
      originalPrice: 21999, discountPrice: 17999, days: -1, scheduled: true },
    { title: 'Winter Heater Blowout — Expired',
      description: 'Our winter heater stock-clear was active last month. See the offset state.',
      originalPrice: 899, discountPrice: 499, days: 5, expired: true },
  ],
  'DigiTech Hub': [
    { title: 'Noise-Cancelling Headphones — 35% Off',
      description: 'Over-ear wireless headphones with hybrid ANC and 40-hour battery.',
      originalPrice: 2499, discountPrice: 1624, days: 12 },
    { title: 'Bluetooth Soundbar — 25% Off',
      description: '2.1 channel soundbar with subwoofer, HDMI ARC and easy TV pairing.',
      originalPrice: 1999, discountPrice: 1499, days: 9 },
  ],
  "Lerato's Kitchen": [
    { title: 'R99 Lunch Special — 50% Off',
      description: 'Daily lunch special: main, side and a soft drink. Weekdays until 2pm.',
      originalPrice: 198, discountPrice: 99, days: 45 },
    { title: 'Family Pizza Deal — 30% Off',
      description: 'Two large pizzas and a garlic bread for the whole family.',
      originalPrice: 300, discountPrice: 210, days: 20 },
  ],
  'Fresh & Fabulous': [
    { title: 'Fresh Fruit Bundle — 20% Off',
      description: 'Seasonal fruit bundle, perfect for lunchboxes and smoothies.',
      originalPrice: 120, discountPrice: 96, days: 7 },
    { title: 'Weekend Braai Pack — 25% Off',
      description: 'Burgers, wors and chops — everything you need for the weekend braai.',
      originalPrice: 400, discountPrice: 300, days: 10 },
  ],
  'CarePoint Pharmacy': [
    { title: 'Vitamin C 1000mg — 40% Off',
      description: 'Immunity-boosting effervescent vitamin C, 20 tablets.',
      originalPrice: 150, discountPrice: 90, days: 30 },
    { title: 'First-Aid Kit — 15% Off',
      description: 'Family first-aid kit with 80 essentials in a travel pouch.',
      originalPrice: 260, discountPrice: 221, days: 18 },
  ],
  'Van Wyk Home Store': [
    { title: 'Ergonomic Office Chair — 45% Off',
      description: 'Adjustable lumbar-support office chair with breathable mesh back.',
      originalPrice: 3299, discountPrice: 1814, days: 25 },
    { title: 'Scented Candle Trio — 50% Off',
      description: 'Hand-poured soy candles in vanilla, cedar and rose.',
      originalPrice: 400, discountPrice: 200, days: 8 },
  ],
  'Style Republic': [
    { title: "Men's Running Sneakers — 40% Off",
      description: 'Lightweight running sneakers in a fresh colourway.',
      originalPrice: 1299, discountPrice: 779, days: 15 },
    { title: 'Denim Jacket — 30% Off',
      description: 'Classic mid-blue denim jacket for every season.',
      originalPrice: 849, discountPrice: 594, days: 11 },
  ],
  'Ocean Fresh Grill': [
    { title: 'Sushi Platter 2-for-1 — 50% Off',
      description: 'Two sushi platters for the price of one. Dine-in or take-away.',
      originalPrice: 320, discountPrice: 160, days: 6 },
  ],
  'Beauty Bar SA': [
    { title: 'Professional Hair Dryer — 35% Off',
      description: 'Ionic salon-grade hair dryer with cool-shot and diffuser.',
      originalPrice: 899, discountPrice: 584, days: 16 },
    { title: 'Manicure & Pedi Combo — 40% Off',
      description: 'Full manicure and pedicure with gel polish.',
      originalPrice: 500, discountPrice: 300, days: 22 },
  ],
  'Kasi Style': [
    { title: 'Summer Dress — 25% Off',
      description: 'Flowy printed summer dress in sizes 34–44.',
      originalPrice: 450, discountPrice: 337, days: 13 },
  ],
};

// The air-fryer deal is stepped down after the Plus watch is created so
// price history + price-drop notifications can be tested end-to-end.
const PRICE_DROP_CHAIN = [ { price: 1599 }, { price: 1299 }, { price: 1199 } ];
const AIR_FRYER_TITLE = 'Air Fryer XL 5.5L — 45% Off';

const favoritesByUser = {
  'plus@demo.co.za': ['Mokoena Electronics', 'Van Wyk Home Store', 'Kasi Style'],
  'liam@demo.co.za': ['Mokoena Electronics', 'Beauty Bar SA'],
  'free@demo.co.za': ['Mokoena Electronics', "Lerato's Kitchen", 'Style Republic'],
  'aisha@demo.co.za': ['DigiTech Hub', 'Fresh & Fabulous', 'Beauty Bar SA'],
};

const savesByUser = {
  'plus@demo.co.za': ['Air Fryer XL 5.5L — 45% Off', '55" QLED Smart TV — 40% Off', 'Bluetooth Soundbar — 25% Off',
                      'Ergonomic Office Chair — 45% Off', "Men's Running Sneakers — 40% Off", 'Denim Jacket — 30% Off',
                      'Sushi Platter 2-for-1 — 50% Off', 'Professional Hair Dryer — 35% Off',
                      'Summer Dress — 25% Off', 'Vitamin C 1000mg — 40% Off', 'Weekend Braai Pack — 25% Off'],
  'free@demo.co.za': ['Family Pizza Deal — 30% Off', 'Scented Candle Trio — 50% Off', 'Ergonomic Office Chair — 45% Off', 'Denim Jacket — 30% Off'],
  'liam@demo.co.za': ['Noise-Cancelling Headphones — 35% Off', 'Wireless Earbuds Pro — 30% Off', '55" QLED Smart TV — 40% Off'],
  'aisha@demo.co.za': ['Vitamin C 1000mg — 40% Off', 'Summer Dress — 25% Off'],
};

// claims: [email, promoTitle] pairs claimed by customers
const claims = [
  ['plus@demo.co.za', 'Air Fryer XL 5.5L — 45% Off'],
  ['plus@demo.co.za', '55" QLED Smart TV — 40% Off'],
  ['plus@demo.co.za', 'Ergonomic Office Chair — 45% Off'],
  ['plus@demo.co.za', "Men's Running Sneakers — 40% Off"],
  ['free@demo.co.za', 'Family Pizza Deal — 30% Off'],
  ['free@demo.co.za', 'Fresh Fruit Bundle — 20% Off'],
  ['liam@demo.co.za', 'Noise-Cancelling Headphones — 35% Off'],
  ['liam@demo.co.za', 'Vitamin C 1000mg — 40% Off'],
  ['aisha@demo.co.za', 'Professional Hair Dryer — 35% Off'],
];

// the store owner logs in and redeems these claimed codes in-store
const redeems = [
  { promoTitle: "Men's Running Sneakers — 40% Off", byUser: 'plus@demo.co.za', store: 'Style Republic' },
  { promoTitle: 'Ergonomic Office Chair — 45% Off', byUser: 'plus@demo.co.za', store: 'Van Wyk Home Store' },
  { promoTitle: 'Family Pizza Deal — 30% Off', byUser: 'free@demo.co.za', store: "Lerato's Kitchen" },
];

const reviews = [
  // storeName, reviewer email, rating, comment
  ['Mokoena Electronics', 'plus@demo.co.za', 5, 'Fast delivery and the air fryer was exactly as advertised. Great saving!'],
  ['Mokoena Electronics', 'liam@demo.co.za', 4, 'Good range of electronics and helpful staff.'],
  ['Mokoena Electronics', 'free@demo.co.za', 4, 'TV deal was legit — I saved a lot on my new QLED.'],
  ['DigiTech Hub', 'aisha@demo.co.za', 3, 'Nice headphones, but stock ran out fast.'],
  ["Lerato's Kitchen", 'free@demo.co.za', 5, 'The lunch special is the best value in town. Highly recommend.'],
  ['Van Wyk Home Store', 'plus@demo.co.za', 5, 'Chair is super comfortable and the 45% saving was amazing.'],
  ['Van Wyk Home Store', 'liam@demo.co.za', 4, 'Good quality furniture at fair deal prices.'],
  ['Style Republic', 'free@demo.co.za', 4, 'Sneakers fit perfectly and look great.'],
  ['Style Republic', 'plus@demo.co.za', 5, 'The denim jacket deal made my month.'],
  ['Beauty Bar SA', 'aisha@demo.co.za', 4, 'Lovely spa experience and the combo deal was worth it.'],
  ['Beauty Bar SA', 'liam@demo.co.za', 5, 'Hair dryer is powerful and quiet. Great offer.'],
  ['Kasi Style', 'plus@demo.co.za', 4, 'Cute dresses, lots of compliments.'],
  ['Ocean Fresh Grill', 'free@demo.co.za', 4, 'Sushi platter is massive for the price.'],
  ['Fresh & Fabulous', 'aisha@demo.co.za', 5, 'Fruit is always fresh and the bundle saved me money.'],
  ['CarePoint Pharmacy', 'liam@demo.co.za', 3, 'Fine for basics, vitamin C was a good deal.'],
];

const alerts = [
  { email: 'plus@demo.co.za', keyword: 'air fryer', maxPrice: 1500, category: 'ELECTRONICS' },
  { email: 'plus@demo.co.za', keyword: '', maxPrice: null, category: 'FASHION', minDiscountPercentage: 30 },
  { email: 'plus@demo.co.za', keyword: 'running shoes', maxPrice: 1000, category: 'FASHION' },
  { email: 'liam@demo.co.za', keyword: 'headphones', maxPrice: 2000, category: 'ELECTRONICS' },
  { email: 'liam@demo.co.za', keyword: '', maxPrice: 500, category: 'BEAUTY' },
];

const searchHistory = {
  'plus@demo.co.za': ['air fryer', 'electronics', 'running shoes', 'mokoena electronics'],
  'liam@demo.co.za': ['headphones', 'soundbar'],
  'free@demo.co.za': ['pizza', 'durban'],
  'aisha@demo.co.za': ['hair dryer'],
};

// ---------------------------------------------------------------------------
let counters = { users: 0, stores: 0, promos: 0, updates: 0, reviews: 0, favorites: 0, saves: 0, claims: 0, redeems: 0, alerts: 0, history: 0 };

async function request(path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { ok: res.ok, status: res.status, data };
}

async function getList(path, token) {
  const r = await request(path, { token });
  return Array.isArray(r.data) ? r.data : [];
}

function iso(daysFromNow) {
  const d = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 19);
}

function keyOf(a) { return JSON.stringify(a); }
function randomPhone() {
  return '08' + String(700000000 + Math.floor(Math.random() * 99999999)).slice(0, 8);
}

// Returns the stored promotion object for a title, looked up from the store's DB list.
async function getPromoByTitle(storeByName, storeDefs, title) {
  const def = storeDefs.find(d => (promoDefs[d.storeName] || []).some(x => x.title === title));
  if (!def) throw new Error(`No promo def for: ${title}`);
  const store = storeByName[def.storeName];
  const promos = await getList(`/promotion/findByStoreId/${store.storeId}`);
  return promos.find(x => x.title === title) || null;
}

async function ensureUser(def) {
  const loc = cities.find(c => c.city === def.city) || cities[0];
  const creds = { email: def.email, password: PASSWORD };
  let login = await request('/user/login', { method: 'POST', body: creds });
  if (!login.ok) {
    const created = await request('/user/create', {
      method: 'POST',
      body: {
        email: def.email, password: PASSWORD,
        firstName: def.firstName, lastName: def.lastName,
        phoneNumber: randomPhone(),
        latitude: loc.lat, longitude: loc.lng,
        isActive: true,
        planTier: def.tier,
      },
    });
    if (!created.ok) throw new Error(`create user ${def.email} -> ${created.status}: ${JSON.stringify(created.data)}`);
    login = await request('/user/login', { method: 'POST', body: creds });
  }
  if (!login.ok) throw new Error(`login ${def.email} -> ${login.status}`);
  const user = login.data.user;
  const token = login.data.token;
  if (user.planTier !== def.tier) {
    const updated = await request(`/user/update/${user.userID}`, {
      method: 'PUT', token,
      body: { ...user, planTier: def.tier },
    });
    if (updated.ok) { user.planTier = def.tier; counters.users++; }
  }
  return { user, token };
}

async function ensureStore(def, owners) {
  const owner = owners[def.owner];
  const existing = (await getList('/stores')).find(s => s.storeName === def.storeName);
  if (existing) {
    if (existing.planTier !== def.planTier || existing.verified !== def.verified) {
      await request(`/stores/${existing.storeId}`, {
        method: 'PUT', token: owner.token,
        body: { ...existing, planTier: def.planTier, verified: def.verified, user: { userID: owner.user.userID } },
      });
    }
    return existing;
  }
  const loc = cities.find(c => c.city === def.city) || cities[0];
  const store = {
    storeName: def.storeName,
    category: def.category,
    description: `${def.storeName} — your local ${def.category.toLowerCase().replace('_', ' ')} spot in ${def.city}.`,
    email: `${def.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '')}@dealnest-demo.co.za`,
    phoneNumber: `08${String(730000000 + Math.floor(Math.random() * 9999999)).slice(0, 8)}`,
    address: `${Math.floor(Math.random() * 200) + 1} ${['Main Rd', 'Church St', 'Long St', 'Voortrekker Rd', 'Market St', 'Station Rd'][Math.floor(Math.random() * 6)]}`,
    city: def.city,
    latitude: loc.lat,
    longitude: loc.lng,
    openingTime: '08:00:00',
    closingTime: '18:30:00',
    isActive: true,
    verified: Boolean(def.verified),
    planTier: def.planTier,
    user: { userID: owner.user.userID },
  };
  const r = await request('/stores', { method: 'POST', token: owner.token, body: store });
  if (!r.ok) throw new Error(`create store ${def.storeName} -> ${r.status}: ${JSON.stringify(r.data)}`);
  counters.stores++;
  return r.data;
}

async function ensurePromo(def, store, storeOwnerToken) {
  const existing = await getList(`/promotion/findByStoreId/${store.storeId}`, storeOwnerToken);
  const found = existing.find(p => p.title === def.title);
  if (found) return { promo: found, created: false };

  let start = iso(0);
  let end = iso(def.days > 0 ? def.days : 10);
  let isActive = !def.scheduled && !def.expired;
  if (def.expired) end = iso(-3);
  if (def.scheduled) start = iso(5);

  const pct = Math.round((1 - def.discountPrice / def.originalPrice) * 100);
  const promo = {
    title: def.title,
    description: def.description,
    originalPrice: def.originalPrice,
    discountPrice: def.discountPrice,
    discountPercentage: pct,
    startDate: start,
    endDate: end,
    isActive,
    featured: def.featured ? true : false,
    promoted: def.promoted ? true : false,
    store: { storeId: store.storeId },
  };
  const r = await request('/promotion/create', { method: 'POST', token: storeOwnerToken, body: promo });
  if (!r.ok) throw new Error(`create promo ${def.title} -> ${r.status}: ${JSON.stringify(r.data)}`);
  counters.promos++;
  return { promo: r.data, created: true };
}

async function priceDropUpdate(promo, newPrice, storeOwnerToken) {
  const pct = Math.round((1 - newPrice / promo.originalPrice) * 100);
  const updated = await request(`/promotion/update/${promo.promotionID}`, {
    method: 'PUT', token: storeOwnerToken,
    body: {
      ...promo,
      discountPrice: newPrice,
      discountPercentage: pct,
      store: { storeId: promo.store.storeId },
    },
  });
  if (!updated.ok) throw new Error(`update promo ${promo.title} -> ${updated.status}: ${JSON.stringify(updated.data)}`);
  counters.updates++;
  return updated.data;
}

async function ensureFavorite(customer, storeId) {
  const existing = await getList(`/favoriteStore/findByUserId/${customer.user.userID}`, customer.token);
  if (existing.some(f => f.store?.storeId === storeId)) return;
  const r = await request('/favoriteStore/create', {
    method: 'POST', token: customer.token,
    body: { user: { userID: customer.user.userID }, store: { storeId } },
  });
  if (r.ok) counters.favorites++;
}

async function ensureSave(customer, promotionId) {
  const existing = await getList(`/savedPromotion/findByUserId/${customer.user.userID}`, customer.token);
  if (existing.some(s => s.promotion?.promotionID === promotionId)) return;
  const r = await request('/savedPromotion/create', {
    method: 'POST', token: customer.token,
    body: { user: { userID: customer.user.userID }, promotion: { promotionID: promotionId } },
  });
  if (r.ok) counters.saves++;
}

async function ensureClaim(customer, promotionId) {
  const existing = await getList(`/redemption/findByUserId/${customer.user.userID}`, customer.token);
  if (existing.some(x => x.promotion?.promotionID === promotionId)) return null;
  const r = await request('/redemption/claim', {
    method: 'POST', token: customer.token,
    body: { user: { userID: customer.user.userID }, promotion: { promotionID: promotionId } },
  });
  if (!r.ok) return null;
  counters.claims++;
  return r.data;
}

async function ensureRedeem(storeOwnerToken, code, storeId) {
  const r = await request('/redemption/redeem', {
    method: 'POST', token: storeOwnerToken,
    body: { code, storeId },
  });
  if (r.ok) counters.redeems++;
}

async function ensureAlert(customer, def) {
  const existing = await getList(`/dealAlert/findByUserId/${customer.user.userID}`, customer.token);
  const needle = {
    keyword: def.keyword || null,
    maxPrice: def.maxPrice ?? null,
    category: def.category || null,
  };
  if (existing.some(a => keyOf({ keyword: a.keyword || null, maxPrice: a.maxPrice ?? null, category: a.category || null }) === keyOf(needle))) return;
  const r = await request('/dealAlert/create', {
    method: 'POST', token: customer.token,
    body: {
      user: { userID: customer.user.userID },
      keyword: def.keyword || null,
      maxPrice: def.maxPrice ?? null,
      category: def.category || null,
      minDiscountPercentage: def.minDiscountPercentage ?? null,
    },
  });
  if (r.ok) counters.alerts++;
}

async function ensureSearchHistory(customer, query) {
  const existing = await getList(`/searchHistory/findByUserId/${customer.user.userID}`, customer.token);
  if (existing.some(h => h.searchQuery === query)) return;
  const r = await request('/searchHistory/create', {
    method: 'POST', token: customer.token,
    body: { searchQuery: query, user: { userID: customer.user.userID } },
  });
  if (r.ok) counters.history++;
}

async function ensureReview(reviewer, storeId, rating, comment) {
  const existing = await getList(`/review/findByStoreId/${storeId}`);
  if (existing.some((r) => r.user?.userID === reviewer.user.userID)) return;
  const r = await request('/review/create', {
    method: 'POST', token: reviewer.token,
    body: { rating, comment, store: { storeId }, user: { userID: reviewer.user.userID } },
  });
  if (r.ok) counters.reviews++;
}

function findStoreIdByName(stores, name) {
  const s = stores.find(x => x.storeName === name);
  if (!s) throw new Error(`Store not created: ${name}`);
  return s.storeId;
}

async function main() {
  console.log('Seeding DealNest demo data...\n');

  // 1. Users
  const owners = {};
  const customers = {};
  for (const def of userDefs) {
    const session = await ensureUser(def);
    if (['pro', 'lerato', 'david', 'sarah'].some(p => def.email.startsWith(p + '@'))) owners[def.email] = session;
    else customers[def.email] = session;
    console.log(`  user ${def.email} (${def.tier})`);
  }

  // 2. Stores
  const stores = [];
  const storeByName = {};
  for (const def of storeDefs) {
    const store = await ensureStore(def, owners);
    storeByName[def.storeName] = store;
    stores.push(store);
    console.log(`  store ${def.storeName} [${def.planTier}]`);
  }

  // 3. Favorites (before promotions so followers get "New deal near you" pings)
  for (const [email, names] of Object.entries(favoritesByUser)) {
    for (const name of names) {
      await ensureFavorite(customers[email], storeByName[name].storeId);
    }
  }
  console.log('  favorites done');

  // 4. Promotions
  for (const def of storeDefs) {
    const ownerToken = owners[def.owner].token;
    for (const p of promoDefs[def.storeName] || []) {
      await ensurePromo(p, storeByName[def.storeName], ownerToken);
    }
  }
  console.log('  promotions done');

  // 5. Deal alerts (Plus users only)
  for (const a of alerts) {
    await ensureAlert(customers[a.email], a);
  }
  console.log('  alerts done');

  // 6. Price-drop chain on the air fryer -> price history + price-drop pings.
  // Self-repairing: on a re-run the chain resumes from wherever the recorded
  // history stops, so it also recovers broken states (e.g. a bug that skipped
  // recording points). The final target is 4 points: 1899 -> 1599 -> 1299 -> 1199.
  {
    const store = storeByName['Mokoena Electronics'];
    const ownerToken = owners['pro@demo.co.za'].token;
    const promos = await getList(`/promotion/findByStoreId/${store.storeId}`, ownerToken);
    const airFryer = promos.find(p => p.title === AIR_FRYER_TITLE);
    if (airFryer) {
      const points = await getList(`/priceHistory/findByPromotionId/${airFryer.promotionID}`, ownerToken);
      const seen = new Set(points.map(p => p.price));
      let target = airFryer;
      for (const step of PRICE_DROP_CHAIN) {
        if (seen.has(step.price)) continue; // point already recorded
        target = await priceDropUpdate(target, step.price, ownerToken);
      }
    }
  }
  console.log('  price history done');

  // 7. Reviews
  for (const [storeName, email, rating, comment] of reviews) {
    await ensureReview(customers[email], storeByName[storeName].storeId, rating, comment);
  }
  console.log('  reviews done');

  // 8. Saved deals
  for (const [email, titles] of Object.entries(savesByUser)) {
    for (const title of titles) {
      const promo = await getPromoByTitle(storeByName, storeDefs, title);
      if (promo) await ensureSave(customers[email], promo.promotionID);
    }
  }
  console.log('  saved deals done');

  // 9. Claims + redeems
  const redemptionByClaim = new Map();
  for (const [email, title] of claims) {
    const promo = await getPromoByTitle(storeByName, storeDefs, title);
    if (!promo) continue;
    const redemption = await ensureClaim(customers[email], promo.promotionID);
    if (redemption) redemptionByClaim.set(`${email}|${title}`, redemption);
  }
  for (const { promoTitle, byUser, store } of redeems) {
    const redemption = redemptionByClaim.get(`${byUser}|${promoTitle}`);
    if (!redemption || redemption.redeemed) continue;
    const storeOwner = owners[storeDefs.find(d => d.storeName === store).owner];
    await ensureRedeem(storeOwner.token, redemption.code, storeByName[store].storeId);
  }
  console.log('  claims + redeems done');

  // 10. Search history
  for (const [email, queries] of Object.entries(searchHistory)) {
    for (const q of queries) await ensureSearchHistory(customers[email], q);
  }
  console.log('  search history done');

  console.log(`\nSeeding complete:
  users: ${counters.users + 8} (${counters.users} tier reconciliations)
  stores: ${counters.stores} created
  promos: ${counters.promos} created (${counters.updates} price-drop updates)
  reviews: ${counters.reviews} · favorites: ${counters.favorites} · saves: ${counters.saves}
  claims: ${counters.claims} · redeems: ${counters.redeems} · alerts: ${counters.alerts} · history: ${counters.history}
`);
  console.log('Demo accounts (password: ' + PASSWORD + '):');
  console.log('  plus@demo.co.za / liam@demo.co.za  = DealNest Plus customers');
  console.log('  free@demo.co.za / aisha@demo.co.za = free-plan customers');
  console.log('  pro@demo.co.za (owns Mokoena Electronics, the PRO store)');
  console.log('  lerato@demo.co.za / david@demo.co.za / sarah@demo.co.za = store owners');
}

main().catch(err => {
  console.error('\nFATAL:', err.message);
  console.error('Is the backend running on', API, '?');
  process.exit(1);
});