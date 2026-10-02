// Generates scripts/seed-supabase.sql for the Supabase SQL Editor.
//   - 50 stores (25 Pro + 25 Free) across 8 categories and 6 cities
//   - 500 promotions (10 per store) with realistic prices/dates/statuses
//   - demo users, reviews, favorites, saved deals, claim codes, alerts,
//     search history, notifications and price history
// All account passwords are Password123 (verified BCrypt hash).
//
// Usage:  node scripts/generate-supabase-seed.mjs
// Output: scripts/seed-supabase.sql   (idempotent, ON CONFLICT DO NOTHING)

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(dir, 'seed-supabase.sql');

const PASSWORD = '$2b$10$50L6r6Me6eRZD5DMcnlKEeCQfL3iT7Jn.zLb8N9JrJUM4lXhklWPC'; // Password123

// deterministic RNG so re-runs produce identical SQL
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260925);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const between = (min, max) => Math.floor(rnd() * (max - min + 1)) + min;

const cities = [
  { city: 'Cape Town', lat: -33.9249, lng: 18.4241 },
  { city: 'Johannesburg', lat: -26.2041, lng: 28.0473 },
  { city: 'Durban', lat: -29.8587, lng: 31.0218 },
  { city: 'Pretoria', lat: -25.7479, lng: 28.2293 },
  { city: 'Port Elizabeth', lat: -33.9608, lng: 25.6022 },
  { city: 'Bloemfontein', lat: -29.0852, lng: 26.1596 },
];
const streets = ['Main Road', 'Church Street', 'Long Street', 'Voortrekker Rd', 'Station Rd', 'Market Street'];

const CATEGORIES = ['ELECTRONICS', 'GROCERY', 'PHARMACY', 'FASHION', 'RESTAURANT', 'BEAUTY', 'HOME_GOODS', 'OTHER'];
const OWNERS = ['pro@demo.co.za', 'lerato@demo.co.za', 'david@demo.co.za', 'sarah@demo.co.za'];

const PRODUCTS = {
  ELECTRONICS: ['Wireless Headphones', 'Bluetooth Earbuds', 'Smart Speaker', '4K Smart TV', 'Air Fryer XL',
                'Gaming Laptop', 'Bluetooth Soundbar', 'Smart Watch', 'Portable Projector', 'Wireless Charger',
                'Cordless Vacuum', 'Espresso Maker', 'Digital Camera', 'Robot Vacuum'],
  GROCERY: ['Fresh Fruit Bundle', 'Weekend Braai Pack', 'Farm Eggs Dozen', 'Sparkling Water Case',
            'Cold Press Juice', 'Bulk Coffee Beans', 'Cheddar Cheese 1kg', 'Honey 500g', 'Vegetable Bundle',
            'Grain Blend 5kg', 'Rice 10kg', 'Olive Oil 750ml'],
  PHARMACY: ['Vitamin C 1000mg', 'First-Aid Kit', 'Omega-3 Capsules', 'Multivitamin 60s', 'Cold & Flu Pack',
             'Antiseptic Care Kit', 'Digestive Health 30s', 'Immunity Boost Zinc', 'Pain Reliever 24s',
             'Blood Pressure Monitor'],
  FASHION: ["Men's Running Sneakers", 'Denim Jacket', 'Summer Dress', 'Leather Wallet', 'Cotton Tee 3-Pack',
            'Sunglasses', 'Hoodie', 'Canvas Backpack', 'Sports Shorts', 'Linen Shirt', 'High-Top Trainers'],
  RESTAURANT: ['Lunch Special', 'Family Pizza Deal', 'Sushi Platter 2-for-1', 'Burger & Fries Combo',
               'Weekend Grill Platter', 'Sunday Roast Special', 'Loaded Nachos', 'Seafood Platter',
               'Breakfast Duo', 'Bottomless Coffee Hour'],
  BEAUTY: ['Professional Hair Dryer', 'Manicure & Pedi Combo', 'Facial Treatment', 'Luxury Skincare Set',
           'Growth Serum Kit', 'Curl Defining Duo', 'SPF Face Cream', 'Nail Art Session', 'Anti-Ageing Bundle'],
  HOME_GOODS: ['Ergonomic Office Chair', 'Scented Candle Trio', 'Lumbar Support Cushion', 'Bedding Bundle',
               'Air Purifier', 'Standing Desk Mat', 'Non-Stick Cookware Set', 'Memory Foam Pillow',
               'Storage Baskets', 'Cutlery Set'],
  OTHER: ['Car Care Kit', 'Gym Shaker & Tub', 'Pet Starter Pack', 'Yoga Mat Combo', 'Desk Organiser',
          'Umbrella Duo', 'Travel Adaptor Set', 'Photo Frame Bundle'],
};

const PRICE_RANGES = {
  ELECTRONICS: [499, 20000], GROCERY: [60, 600], PHARMACY: [50, 800], FASHION: [120, 1500],
  RESTAURANT: [50, 350], BEAUTY: [150, 1200], HOME_GOODS: [120, 4000], OTHER: [80, 900],
};
const NAME_POOL = {
  ELECTRONICS: ['TechZone', 'DigiWorx', 'Volt City', 'Pixel Nook', 'CircuitHub'],
  GROCERY: ['Harvest Mart', 'Fresh Co.', 'Green Pantry', 'Daily Gather', 'Nature Basket'],
  PHARMACY: ['CarePoint', 'MediLife', 'HealthWise', 'Pulse Pharmacy', 'WellPure'],
  FASHION: ['Style Republic', 'Thread & Co.', 'Urban Mode', 'Kasi Style', 'Moda Centre'],
  RESTAURANT: ["Lerato's Kitchen", 'The Grill House', 'Ocean Fresh Grill', 'Bistro Nix', 'Flame & Fork'],
  BEAUTY: ['Beauty Bar SA', 'Glow Clinic', 'Luxe & Bloom', 'Radiance Room'],
  HOME_GOODS: ['Home Nest', 'Cozy Corner', 'Habitat House', 'Essentials Store'],
  OTHER: ['Mega Mart', 'Everyday Store', 'Urban Living', 'Corner Market'],
};
const discountPct = [15, 20, 25, 30, 35, 40, 45, 50, 60];
const REVIEW_COMMENTS = [
  'Great deal, saved quite a bit. Will shop here again.',
  'Exactly as described and half the usual price.',
  'Friendly staff and the deal made it a no-brainer.',
  'Good quality. The discount was genuine.',
  'Quick and easy - the deal boom claimed without any hassle.',
  'Happy customer. Would recommend to friends.',
  'Solid value for money. Keep the deals coming!',
  'Packaging was great and the price unbeatable.',
];

const N_STORES = 50;
const DEALS_PER_STORE = 10; // -> 500 promotions

const PG = (s) => String(s).replace(/'/g, "''");

const userOf = (email) => ({
  'plus@demo.co.za': '00000000-0000-4000-8000-000000000001',
  'liam@demo.co.za': '00000000-0000-4000-8000-000000000002',
  'free@demo.co.za': '00000000-0000-4000-8000-000000000003',
  'aisha@demo.co.za': '00000000-0000-4000-8000-000000000004',
  'pro@demo.co.za': '00000000-0000-4000-8000-000000000005',
  'lerato@demo.co.za': '00000000-0000-4000-8000-000000000006',
  'david@demo.co.za': '00000000-0000-4000-8000-000000000007',
  'sarah@demo.co.za': '00000000-0000-4000-8000-000000000008',
})[email];

const promoId = (n) => `20000000-0000-4000-8000-${String(n).padStart(12, '0').slice(0, 12)}`;
const storeId = (n) => `10000000-0000-4000-8000-${String(n).padStart(12, '0').slice(0, 12)}`;
const reviewId = (n) => `40000000-0000-4000-8000-${String(n).padStart(12, '0').slice(0, 12)}`;
const favoriteId = (n) => `50000000-0000-4000-8000-${String(n).padStart(12, '0').slice(0, 12)}`;
const saveId = (n) => `60000000-0000-4000-8000-${String(n).padStart(12, '0').slice(0, 12)}`;
const redId = (n) => `70000000-0000-4000-8000-${String(n).padStart(12, '0').slice(0, 12)}`;
const alertId = (n) => `80000000-0000-4000-8000-${String(n).padStart(12, '0').slice(0, 12)}`;
const histId = (n) => `90000000-0000-4000-8000-${String(n).padStart(12, '0').slice(0, 12)}`;
const notifId = (n) => `a0000000-0000-4000-8000-${String(n).padStart(12, '0').slice(0, 12)}`;
const priceId = (n) => `b0000000-0000-4000-8000-${String(n).padStart(12, '0').slice(0, 12)}`;

const l = [];
const push = (sql) => l.push(sql);

// -------- build stores & promotions models --------
const stores = [];
const promos = [];
const usedNames = new Set();

for (let i = 0; i < N_STORES; i++) {
  const cat = CATEGORIES[i % CATEGORIES.length];
  const city = cities[i % cities.length];
  const owner = OWNERS[i % OWNERS.length];
  const planTier = i < N_STORES / 2 ? 'PRO' : 'FREE';

  let name = `${NAME_POOL[cat][i % NAME_POOL[cat].length]} ${city.city}`;
  if (usedNames.has(name)) name = `${name} #${i + 1}`;
  usedNames.add(name);

  stores.push({
    n: i + 1, cat, city, owner, planTier,
    name,
    phone: `01${String(100000000 + between(0, 89999999)).slice(0, 8)}`,
    address: `${between(1, 250)} ${streets[i % streets.length]}`,
    opening: ['07:00:00', '08:00:00', '08:30:00', '09:00:00', '11:00:00'][i % 5],
    closing: ['17:00:00', '18:00:00', '18:30:00', '19:00:00', '22:00:00'][i % 5],
    verified: i % 4 === 0,
  });

  const products = PRODUCTS[cat].slice();
  for (let j = 0; j < DEALS_PER_STORE; j++) {
    const [lo, hi] = PRICE_RANGES[cat];
    const original = between(lo, hi);
    const pct = pick(discountPct);
    const discount = Math.round((original * (100 - pct)) / 100);
    const product = products[j % products.length];
    const title = `${product} - ${pct}% Off`;
    let featured = false;
    let promoted = false;
    let section = j; // slot within store
    if (planTier === 'PRO') {
      if (j === 0) featured = true;
      if (j === 1) promoted = true;
    }
    promos.push({
      n: ((i) * DEALS_PER_STORE) + j + 1,
      title, cat, product,
      original, discount, pct,
      store: i + 1,
      section,
      featured, promoted,
    });
  }
}

// air-fryer continuity: store #1 (Mokoena Electronics) keeps a price-drop chain
// air-fryer continuity: store #1 keeps the Pro demo name + the price-drop chain
stores[0].name = 'Mokoena Electronics Cape Town';

const AIR_FRYER_PROMO_N = 1; // slot j=0 of store 1 -> promo id #1? promo n for store1,j0 = 0*10+0+1 = 1. yes
promos.find((p) => p.n === AIR_FRYER_PROMO_N).title = 'Air Fryer XL 5.5L - 45% Off';
promos.find((p) => p.n === AIR_FRYER_PROMO_N).original = 2199;
promos.find((p) => p.n === AIR_FRYER_PROMO_N).discount = 1199;
promos.find((p) => p.n === AIR_FRYER_PROMO_N).pct = 45;
promos.find((p) => p.n === AIR_FRYER_PROMO_N).airFryer = true;

// -------- header --------
push(`-- ============================================================
-- DealNest Supabase SQL Editor seed
--   50 stores (25 Pro / 25 Free) x 10 deals each = 500 promotions
--   All account passwords:  Password123
--   Idempotent - every insert is ON CONFLICT DO NOTHING.
--
-- Accounts:
--   plus@demo.co.za / liam@demo.co.za  = DealNest Plus customers
--   free@demo.co.za / aisha@demo.co.za = free customers
--   pro@demo.co.za / lerato@demo.co.za / david@demo.co.za / sarah@demo.co.za = store owners
--   (store #1 "Mokoena Electronics" is the Pro demo store with the air-fryer)
-- ============================================================

-- ============ USERS (8) ============
INSERT INTO users (userid, email, password, first_name, last_name, phone_number, latitude, longitude, is_active, current_streak, longest_streak, points, plan_tier, created_at, updated_at) VALUES
('00000000-0000-4000-8000-000000000001', 'plus@demo.co.za',    '${PASSWORD}', 'Thandi', 'Ncube',   '0711111111', -26.2041, 28.0473, TRUE, 0, 0, 0, 'PLUS', NOW(), NOW()),
('00000000-0000-4000-8000-000000000002', 'liam@demo.co.za',    '${PASSWORD}', 'Liam',   'Botha',    '0722222222', -33.9249, 18.4241, TRUE, 0, 0, 0, 'PLUS', NOW(), NOW()),
('00000000-0000-4000-8000-000000000003', 'free@demo.co.za',    '${PASSWORD}', 'Sipho',  'Dlamini',  '0733333333', -29.8587, 31.0218, TRUE, 0, 0, 0, 'FREE', NOW(), NOW()),
('00000000-0000-4000-8000-000000000004', 'aisha@demo.co.za',   '${PASSWORD}', 'Aisha',  'Patel',    '0744444444', -25.7479, 28.2293, TRUE, 0, 0, 0, 'FREE', NOW(), NOW()),
('00000000-0000-4000-8000-000000000005', 'pro@demo.co.za',     '${PASSWORD}', 'James',  'Mokoena',  '0755555555', -26.2041, 28.0473, TRUE, 0, 0, 0, 'FREE', NOW(), NOW()),
('00000000-0000-4000-8000-000000000006', 'lerato@demo.co.za',  '${PASSWORD}', 'Lerato', 'Molefe',   '0766666666', -33.9249, 18.4241, TRUE, 0, 0, 0, 'FREE', NOW(), NOW()),
('00000000-0000-4000-8000-000000000007', 'david@demo.co.za',   '${PASSWORD}', 'David',  'van Wyk',  '0777777777', -33.9608, 25.6022, TRUE, 0, 0, 0, 'FREE', NOW(), NOW()),
('00000000-0000-4000-8000-000000000008', 'sarah@demo.co.za',   '${PASSWORD}', 'Sarah',  'Johnson',  '0788888888', -26.2041, 28.0473, TRUE, 0, 0, 0, 'FREE', NOW(), NOW())
ON CONFLICT DO NOTHING;
`);

// -------- stores --------
push(`-- ============ STORES (50) ============
INSERT INTO stores (store_id, store_name, category, description, email, phone_number, address, city, latitude, longitude, opening_time, closing_time, is_verified, is_active, total_reviews, plan_tier, created_at, updated_at, user_id) VALUES`);
for (let i = 0; i < stores.length; i++) {
  const s = stores[i];
  const comma = i < stores.length - 1 ? ',' : '';
  push(`('${storeId(s.n)}', '${PG(s.name)}', '${s.cat}', '${PG(s.name)} - your local ${s.cat.toLowerCase().replace('_', ' ')} spot in ${PG(s.city.city)}.', 'store${s.n}@dealnest-demo.co.za', '${s.phone}', '${PG(s.address)}', '${PG(s.city.city)}', ${s.city.lat}, ${s.city.lng}, '${s.opening}', '${s.closing}', ${s.verified}, TRUE, 0, '${s.planTier}', NOW(), NOW(), '${userOf(s.owner)}')${comma}`);
}
push(`ON CONFLICT DO NOTHING;
`);

// -------- promotions --------
push(`-- ============ PROMOTIONS (500) ============
INSERT INTO promotions (promotionid, title, description, original_price, discount_price, discount_percentage, start_date, end_date, is_active, featured, promoted, schedule_enabled, created_at, updated_at, store_id) VALUES`);
for (let i = 0; i < promos.length; i++) {
  const p = promos[i];
  const s = stores[p.store - 1];
  const comma = i < promos.length - 1 ? ',' : '';
  let start = `NOW() - INTERVAL '1 day'`;
  let end = `NOW() + INTERVAL '${between(3, 30)} days'`;
  let active = 'TRUE';
  let sch = 'FALSE';
  if (p.section === 8) { active = 'FALSE'; start = `NOW() + INTERVAL '5 days'`; end = `NOW() + INTERVAL '15 days'`; sch = 'TRUE'; }
  if (p.section === 9) { active = 'FALSE'; end = `NOW() - INTERVAL '5 days'`; start = `NOW() - INTERVAL '20 days'`; }
  const desc = p.airFryer
    ? 'Family-size hot air fryer with 8 presets. Perfect for quick, healthy weeknight meals.'
    : `${p.product} deal from ${s.name} - grab it before it ends.`;
  push(`('${promoId(p.n)}', '${PG(p.title)}', '${PG(desc)}', ${p.original}, ${p.discount}, ${p.pct}, ${start}, ${end}, ${active}, ${p.featured}, ${p.promoted}, ${sch}, NOW() - INTERVAL '1 day', NOW(), '${storeId(p.store)}')${comma}`);
}
push(`ON CONFLICT DO NOTHING;
`);

// -------- price history (one point per promo + air-fryer drop chain) --------
push(`-- ============ PRICE HISTORY (503) ============
INSERT INTO price_points (price_pointid, price, recorded_at, promotion_id) VALUES`);
const rows = [];
for (let i = 0; i < promos.length; i++) {
  const p = promos[i];
  if (p.airFryer) {
    rows.push({ n: p.n, price: 1899, at: "NOW() - INTERVAL '30 minutes'" });
    rows.push({ n: p.n, price: 1599, at: "NOW() - INTERVAL '15 minutes'" });
    rows.push({ n: p.n, price: 1299, at: "NOW() - INTERVAL '10 minutes'" });
    rows.push({ n: p.n, price: p.discount, at: "NOW() - INTERVAL '5 minutes'" });
  } else {
    rows.push({ n: p.n, price: p.discount, at: `NOW() - INTERVAL '${between(60, 600)} minutes'` });
  }
}
for (let i = 0; i < rows.length; i++) {
  const comma = i < rows.length - 1 ? ',' : '';
  push(`('${priceId(i + 1)}', ${rows[i].price}, ${rows[i].at}, '${promoId(rows[i].n)}')${comma}`);
}
push(`ON CONFLICT DO NOTHING;
`);

// -------- reviews --------
const customers = ['plus@demo.co.za', 'liam@demo.co.za', 'free@demo.co.za', 'aisha@demo.co.za'];
let revRows = [];
for (const s of stores) {
  const howMany = s.planTier === 'PRO' ? between(1, 4) : between(0, 2);
  const shuffled = [...customers].sort(() => rnd() - 0.5).slice(0, howMany);
  for (const c of shuffled) {
    revRows.push({ store: s.n, user: c, rating: between(3, 5), comment: pick(REVIEW_COMMENTS) });
  }
}
// keep the air-fryer store's "Gold reviewer" set for the badge demo
for (const [c, rating] of [['plus@demo.co.za', 5], ['free@demo.co.za', 4]]) {
  if (!revRows.some((r) => r.store === 1 && r.user === c)) revRows.push({ store: 1, user: c, rating, comment: pick(REVIEW_COMMENTS) });
}
push(`-- ============ REVIEWS (${revRows.length}) ============
INSERT INTO reviews (reviewid, rating, comment, created_at, updated_at, store_id, user_id) VALUES`);
for (let i = 0; i < revRows.length; i++) {
  const r = revRows[i];
  const comma = i < revRows.length - 1 ? ',' : '';
  push(`('${reviewId(i + 1)}', ${r.rating}, '${PG(r.comment)}', NOW() - INTERVAL '${between(1, 5)} days', NOW() - INTERVAL '${between(1, 5)} days', '${storeId(r.store)}', '${userOf(r.user)}')${comma}`);
}
push(`ON CONFLICT DO NOTHING;
`);

// -------- favorites --------
let favRows = [];
for (const c of customers) {
  const count = between(3, 6);
  const chosen = new Set();
  while (chosen.size < count) chosen.add(between(1, N_STORES));
  for (const sn of chosen) favRows.push({ user: c, store: sn });
}
push(`-- ============ FAVORITE STORES (${favRows.length}) ============
INSERT INTO favorite_stores (favorite_storeid, added_date, store_id, user_id) VALUES`);
for (let i = 0; i < favRows.length; i++) {
  const f = favRows[i];
  const comma = i < favRows.length - 1 ? ',' : '';
  push(`('${favoriteId(i + 1)}', NOW() - INTERVAL '${between(1, 10)} days', '${storeId(f.store)}', '${userOf(f.user)}')${comma}`);
}
push(`ON CONFLICT DO NOTHING;
`);

// -------- saved deals --------
let saveRows = [];
for (const c of customers) {
  const cap = c.includes('plus') || c.includes('liam') ? between(8, 15) : between(3, 8);
  const chosen = new Set();
  while (chosen.size < cap) chosen.add(between(1, N_STORES * DEALS_PER_STORE));
  for (const pn of chosen) saveRows.push({ user: c, promo: pn, title: promos.find((p) => p.n === pn).title });
}
push(`-- ============ SAVED DEALS (${saveRows.length}) ============
INSERT INTO saved_promotions (saved_promotionid, saved_date, promotion_id, user_id) VALUES`);
for (let i = 0; i < saveRows.length; i++) {
  const d = saveRows[i];
  const comma = i < saveRows.length - 1 ? ',' : '';
  push(`('${saveId(i + 1)}', NOW() - INTERVAL '${between(1, 10)} days', '${promoId(d.promo)}', '${userOf(d.user)}')${comma}`);
}
push(`ON CONFLICT DO NOTHING;
`);

// -------- redemptions (claims + in-store redeems) --------
let redRows = [];
const codes = new Set();
for (const c of customers) {
  const count = c.includes('plus') || c.includes('liam') ? between(4, 6) : between(2, 4);
  const chosen = new Set();
  while (chosen.size < count) chosen.add(between(1, N_STORES * DEALS_PER_STORE));
  for (const pn of chosen) {
    let code;
    do { code = `DN-${c.split('@')[0].toUpperCase().slice(0, 4)}-${String(pn).padStart(3, '0')}`; } while (codes.has(code));
    codes.add(code);
    redRows.push({ user: c, promo: pn, code, redeemed: rnd() < 0.35, claimedAgo: between(1, 4) });
  }
}
push(`-- ============ CLAIM CODES (${redRows.length}) ============
INSERT INTO redemptions (redemptionid, code, redeemed, claimed_at, redeemed_at, promotion_id, user_id) VALUES`);
for (let i = 0; i < redRows.length; i++) {
  const r = redRows[i];
  const comma = i < redRows.length - 1 ? ',' : '';
  const redeemedAt = r.redeemed ? `NOW() - INTERVAL '${between(0, 2)} days'` : 'NULL';
  push(`('${redId(i + 1)}', '${r.code}', ${r.redeemed}, NOW() - INTERVAL '${r.claimedAgo} days', ${redeemedAt}, '${promoId(r.promo)}', '${userOf(r.user)}')${comma}`);
}
push(`ON CONFLICT DO NOTHING;
`);

// -------- deal alerts (Plus only) --------
push(`-- ============ DEAL ALERTS (5, Plus-only) ============
INSERT INTO deal_alerts (alertid, keyword, max_price, min_discount_percentage, category, active, created_at, user_id) VALUES
('${alertId(1)}', 'air fryer',      1500, NULL, 'ELECTRONICS', TRUE, NOW() - INTERVAL '1 day', '${userOf('plus@demo.co.za')}'),
('${alertId(2)}', NULL,             NULL, 30,   'FASHION',     TRUE, NOW() - INTERVAL '1 day', '${userOf('plus@demo.co.za')}'),
('${alertId(3)}', 'running shoes',  1000, NULL, 'FASHION',     TRUE, NOW() - INTERVAL '1 day', '${userOf('plus@demo.co.za')}'),
('${alertId(4)}', 'headphones',     2000, NULL, 'ELECTRONICS', TRUE, NOW() - INTERVAL '1 day', '${userOf('liam@demo.co.za')}'),
('${alertId(5)}', NULL,              500, NULL, 'BEAUTY',      TRUE, NOW() - INTERVAL '1 day', '${userOf('liam@demo.co.za')}')
ON CONFLICT DO NOTHING;
`);

// -------- search history --------
const SEARCH_KEYWORDS = ['air fryer', 'headphones', 'pizza', 'running shoes', 'electronics', 'fashion',
                         'soundbar', 'groceries', 'durban', 'cape town', 'hair dryer', 'summer dress', 'coffee', 'gym gear'];
let histRows = 0;
push(`-- ============ SEARCH HISTORY (drives recent-search chips + recommendations) ============
INSERT INTO search_history (searchid, search_query, search_date, user_id) VALUES`);
const lines = [];
for (const c of customers) {
  const used = new Set();
  const count = between(3, 6);
  while (used.size < count) used.add(pick(SEARCH_KEYWORDS));
  for (const q of used) {
    histRows++;
    const comma = ''; // assembled later
    lines.push(`('${histId(histRows)}', '${q}', NOW() - INTERVAL '${between(1, 3)} days', '${userOf(c)}')`);
  }
}
for (let i = 0; i < lines.length; i++) push(lines[i] + (i < lines.length - 1 ? ',' : ''));
push(`ON CONFLICT DO NOTHING;
`);

// -------- notifications (bell) --------
const notifs = [
  ['Price drop', 'air fryer dropped from R1 599,00 to R1 299,00 - Air Fryer XL 5.5L - 45% Off now fits your budget.', true, false, 'plus@demo.co.za', "NOW() - INTERVAL '15 minutes'"],
  ['Price drop', 'air fryer dropped from R1 299,00 to R1 199,00 - Air Fryer XL 5.5L - 45% Off now fits your budget.', true, false, 'plus@demo.co.za', "NOW() - INTERVAL '5 minutes'"],
  ['Deal alert match', 'Fashion deal matches your alert: Summer Dress - 25% Off.', true, false, 'plus@demo.co.za', "NOW() - INTERVAL '1 hour'"],
  ['New deal near you', 'TechZone Johannesburg just posted a fresh deal - check it out.', false, false, 'plus@demo.co.za', "NOW() - INTERVAL '2 days'"],
  ['New deal near you', 'Home Nest Cape Town just posted a deal in your area.', false, true, 'plus@demo.co.za', "NOW() - INTERVAL '3 days'"],
  ['New deal near you', 'DigiWorx Pretoria just posted a deal in your area.', false, false, 'aisha@demo.co.za', "NOW() - INTERVAL '2 days'"],
  ['Deal alert match', 'Headphones deal matches your alert.', true, false, 'liam@demo.co.za', "NOW() - INTERVAL '1 day'"],
  ['New deal near you', 'Ocean Fresh Grill Durban just posted a deal - check it out.', false, false, 'free@demo.co.za', "NOW() - INTERVAL '2 days'"],
];
push(`-- ============ NOTIFICATIONS (${notifs.length}) ============
INSERT INTO notifications (notificationid, title, message, priority, is_read, created_at, user_id) VALUES`);
for (let i = 0; i < notifs.length; i++) {
  const [title, msg, prio, read, who, when] = notifs[i];
  const comma = i < notifs.length - 1 ? ',' : '';
  push(`('${notifId(i + 1)}', '${PG(title)}', '${PG(msg)}', ${prio}, ${read}, ${when}, '${userOf(who)}')${comma}`);
}
push(`ON CONFLICT DO NOTHING;
`);

const sql = l.join('\n');
writeFileSync(OUT, sql, 'utf8');
console.log(`Wrote ${OUT}`);
console.log(`  stores: ${stores.length}  (Pro: ${stores.filter((s) => s.planTier === 'PRO').length}, Free: ${stores.filter((s) => s.planTier === 'FREE').length})`);
console.log(`  promotions: ${promos.length}  reviews: ${revRows.length}  favorites: ${favRows.length}`);
console.log(`  saved deals: ${saveRows.length}  claim codes: ${redRows.length}  searches: ${histRows}  price points: ${rows.length}`);