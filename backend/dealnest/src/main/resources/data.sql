-- ============================================================
-- DealNest Sample Data
-- PostgreSQL-compatible seed data
--
-- This file runs automatically when:
-- spring.sql.init.mode=always
-- spring.jpa.defer-datasource-initialization=true
--
-- PostgreSQL equivalent of MySQL's INSERT IGNORE:
-- ON CONFLICT DO NOTHING
-- ============================================================

-- ============================================================
-- ONE-TIME MIGRATION: re-hash any plaintext passwords left in
-- the users table from before BCrypt was introduced.
-- BCrypt hashes always start with '$2a$' or '$2b$'.
-- Running this every startup is safe — it only touches rows
-- that still hold a plaintext value.
-- Password being hashed: Password123
-- ============================================================
UPDATE users
SET password = '$2b$10$50L6r6Me6eRZD5DMcnlKEeCQfL3iT7Jn.zLb8N9JrJUM4lXhklWPC'
WHERE password NOT LIKE '$2%';


-- ============================================================
-- ADMIN
-- ============================================================

-- Admin login:
-- Email: admin@dealnest
-- Password: admin1234

INSERT INTO admins (
    adminid,
    email,
    password_hash,
    is_active,
    created_at,
    updated_at
)
VALUES (
    '5b89bce5-d8a7-476e-899e-a263ba813212',
    'admin@dealnest',
    '$2b$10$g8mrETSe5uPbGtZQL4LYTeQaAwpZIdI14oEH7s7fNVErzJW3gP0hO',
    TRUE,
    NOW(),
    NOW()
)
ON CONFLICT DO NOTHING;


-- ============================================================
-- USERS
-- ============================================================

-- Sample users.
-- Password for all sample users: Password123

INSERT INTO users (
    userid,
    email,
    password,
    first_name,
    last_name,
    phone_number,
    latitude,
    longitude,
    is_active,
    created_at,
    updated_at,
    current_streak,
    longest_streak,
    points
)
VALUES
(
    '51f55b70-7e96-4ad4-a3a8-564e13aec78e',
    'owner@freshbasket.co.za',
    '$2b$10$50L6r6Me6eRZD5DMcnlKEeCQfL3iT7Jn.zLb8N9JrJUM4lXhklWPC',
    'Nomvula',
    'Dlamini',
    '0821234501',
    -33.9008,
    18.6292,
    TRUE,
    NOW(),
    NOW(),
    0,
    0,
    0
),
(
    '7efbbced-729a-4a8e-b949-85773783ac8e',
    'owner@mzansigrill.co.za',
    '$2b$10$50L6r6Me6eRZD5DMcnlKEeCQfL3iT7Jn.zLb8N9JrJUM4lXhklWPC',
    'Sipho',
    'Mokoena',
    '0821234502',
    -33.9375,
    18.4708,
    TRUE,
    NOW(),
    NOW(),
    0,
    0,
    0
),
(
    'b3d4fb6d-2671-4d8c-9b94-64c225d16d1d',
    'owner@urbanthread.co.za',
    '$2b$10$50L6r6Me6eRZD5DMcnlKEeCQfL3iT7Jn.zLb8N9JrJUM4lXhklWPC',
    'Aisha',
    'Petersen',
    '0821234503',
    -33.9833,
    18.4667,
    TRUE,
    NOW(),
    NOW(),
    0,
    0,
    0
),
(
    '86fde77e-acf2-4540-af20-394d0bf4527f',
    'owner@techhub.co.za',
    '$2b$10$50L6r6Me6eRZD5DMcnlKEeCQfL3iT7Jn.zLb8N9JrJUM4lXhklWPC',
    'Liam',
    'van der Merwe',
    '0821234504',
    -33.9249,
    18.4241,
    TRUE,
    NOW(),
    NOW(),
    0,
    0,
    0
),
(
    '076960fb-1650-49a9-8e81-3faf7c33389c',
    'thandi.customer@example.com',
    '$2b$10$50L6r6Me6eRZD5DMcnlKEeCQfL3iT7Jn.zLb8N9JrJUM4lXhklWPC',
    'Thandi',
    'Nkosi',
    '0731234505',
    -33.9249,
    18.4241,
    TRUE,
    NOW(),
    NOW(),
    0,
    0,
    0
),
(
    'c2082ccf-a259-49e6-97ce-11e36d986aaa',
    'jordan.customer@example.com',
    '$2b$10$50L6r6Me6eRZD5DMcnlKEeCQfL3iT7Jn.zLb8N9JrJUM4lXhklWPC',
    'Jordan',
    'Adams',
    '0731234506',
    -33.9249,
    18.4241,
    TRUE,
    NOW(),
    NOW(),
    0,
    0,
    0
)
ON CONFLICT DO NOTHING;


-- ============================================================
-- STORES
-- ============================================================

INSERT INTO stores (
    store_id,
    category,
    store_name,
    description,
    email,
    phone_number,
    address,
    city,
    latitude,
    longitude,
    opening_time,
    closing_time,
    is_verified,
    is_active,
    average_rating,
    total_reviews,
    created_at,
    updated_at,
    user_id
)
VALUES
(
    '5dc33a09-c070-4d88-b3e6-7975a348c6bc',
    'GROCERY',
    'Fresh Basket Grocers',
    'Neighbourhood grocer with daily fresh produce, bakery, and pantry staples.',
    'owner@freshbasket.co.za',
    '0211234501',
    '12 Voortrekker Road',
    'Bellville, Cape Town',
    -33.9008,
    18.6292,
    '07:00:00',
    '19:00:00',
    TRUE,
    TRUE,
    4.5,
    32,
    NOW(),
    NOW(),
    '51f55b70-7e96-4ad4-a3a8-564e13aec78e'
),
(
    '0c213c6b-3510-4ea0-8959-4b2450afa961',
    'RESTAURANT',
    'Mzansi Grill House',
    'Casual grill and shisanyama serving local favourites all week.',
    'owner@mzansigrill.co.za',
    '0211234502',
    '45 Lower Main Road',
    'Observatory, Cape Town',
    -33.9375,
    18.4708,
    '11:00:00',
    '22:00:00',
    TRUE,
    TRUE,
    4.7,
    58,
    NOW(),
    NOW(),
    '7efbbced-729a-4a8e-b949-85773783ac8e'
),
(
    '9ef2e6eb-c843-48b3-abdb-70a2051c78cf',
    'FASHION',
    'Urban Thread Fashion',
    'Affordable streetwear and everyday fashion for the whole family.',
    'owner@urbanthread.co.za',
    '0211234503',
    '8 Main Road',
    'Claremont, Cape Town',
    -33.9833,
    18.4667,
    '09:00:00',
    '18:00:00',
    TRUE,
    TRUE,
    4.2,
    21,
    NOW(),
    NOW(),
    'b3d4fb6d-2671-4d8c-9b94-64c225d16d1d'
),
(
    'c7118da4-febd-4f9e-9935-1f666d640b76',
    'ELECTRONICS',
    'TechHub Electronics',
    'Phones, laptops, and gadgets with trade-in deals every month.',
    'owner@techhub.co.za',
    '0211234504',
    '100 Long Street',
    'Cape Town CBD',
    -33.9249,
    18.4241,
    '09:00:00',
    '20:00:00',
    FALSE,
    TRUE,
    4.0,
    9,
    NOW(),
    NOW(),
    '86fde77e-acf2-4540-af20-394d0bf4527f'
)
ON CONFLICT DO NOTHING;


-- ============================================================
-- PROMOTIONS
-- ============================================================

INSERT INTO promotions (
    promotionid,
    title,
    description,
    original_price,
    discount_price,
    discount_percentage,
    start_date,
    end_date,
    is_active,
    created_at,
    updated_at,
    store_id
)
VALUES
(
    'ad550304-67c2-4200-8596-c2fde096e2b2',
    '20% Off Fresh Produce',
    'All fresh fruit and veg, this week only.',
    500.00,
    400.00,
    20.0,
    '2026-07-15 00:00:00',
    '2026-09-15 23:59:59',
    TRUE,
    NOW(),
    NOW(),
    '5dc33a09-c070-4d88-b3e6-7975a348c6bc'
),
(
    'e7af678b-527e-442d-a7c1-96d48aadeb81',
    'Bakery Bundle Deal',
    'Loaf, dozen rolls, and pastries bundled and discounted.',
    150.00,
    99.00,
    34.0,
    '2026-08-01 00:00:00',
    '2026-08-20 23:59:59',
    TRUE,
    NOW(),
    NOW(),
    '5dc33a09-c070-4d88-b3e6-7975a348c6bc'
),
(
    'e56c9d0e-ea99-4626-b60f-fa239c840c4b',
    'Winter Stock Clearance',
    'Clearance on winter stock, promotion has ended.',
    300.00,
    150.00,
    50.0,
    '2026-06-01 00:00:00',
    '2026-07-01 23:59:59',
    FALSE,
    NOW(),
    NOW(),
    '5dc33a09-c070-4d88-b3e6-7975a348c6bc'
),
(
    '1dabfacb-f81c-4c14-bed0-e5c056fdcaee',
    '2-for-1 Burger Night',
    'Every Tuesday and Wednesday evening.',
    240.00,
    120.00,
    50.0,
    '2026-07-20 00:00:00',
    '2026-09-30 23:59:59',
    TRUE,
    NOW(),
    NOW(),
    '0c213c6b-3510-4ea0-8959-4b2450afa961'
),
(
    '90128b77-53cf-4e98-a2c9-8b1707ad1760',
    'Weekday Lunch Special',
    'Two-course lunch special, Monday to Friday.',
    180.00,
    129.00,
    28.0,
    '2026-08-01 00:00:00',
    '2026-08-31 23:59:59',
    TRUE,
    NOW(),
    NOW(),
    '0c213c6b-3510-4ea0-8959-4b2450afa961'
),
(
    'e69d891b-ee9a-4376-8371-3ada6cfd28a8',
    'Spring Collection 30% Off',
    'New spring arrivals, storewide.',
    899.00,
    629.00,
    30.0,
    '2026-07-10 00:00:00',
    '2026-09-10 23:59:59',
    TRUE,
    NOW(),
    NOW(),
    '9ef2e6eb-c843-48b3-abdb-70a2051c78cf'
),
(
    'a6dd276e-ba47-4b64-bc7b-4e35141d3a47',
    'Buy 2 Get 1 Free Tees',
    'Mix and match any three t-shirts.',
    450.00,
    300.00,
    33.0,
    '2026-08-01 00:00:00',
    '2026-08-25 23:59:59',
    TRUE,
    NOW(),
    NOW(),
    '9ef2e6eb-c843-48b3-abdb-70a2051c78cf'
),
(
    '59374d3a-5b11-4228-9ea8-8810c40259ed',
    'Wireless Earbuds Blowout',
    'Top-brand wireless earbuds while stock lasts.',
    1299.00,
    899.00,
    31.0,
    '2026-07-25 00:00:00',
    '2026-09-25 23:59:59',
    TRUE,
    NOW(),
    NOW(),
    'c7118da4-febd-4f9e-9935-1f666d640b76'
),
(
    'b9bb54d9-d0b8-48d4-9cee-c4484654dd37',
    'Laptop Trade-In Special',
    'Trade in any working laptop for a discount on a new one.',
    12999.00,
    10999.00,
    15.0,
    '2026-08-01 00:00:00',
    '2026-08-31 23:59:59',
    TRUE,
    NOW(),
    NOW(),
    'c7118da4-febd-4f9e-9935-1f666d640b76'
)
ON CONFLICT DO NOTHING;


-- ============================================================
-- REVIEWS
-- ============================================================

INSERT INTO reviews (
    reviewid,
    rating,
    comment,
    created_at,
    updated_at,
    store_id
)
VALUES
(
    'c3b7d2f7-6af1-40d2-840b-dd9de76e2b5f',
    5,
    'Always fresh, and the bakery deal saved me a lot this week.',
    NOW(),
    NOW(),
    '5dc33a09-c070-4d88-b3e6-7975a348c6bc'
),
(
    '8e68d001-d0eb-4b77-8755-83d21d02db69',
    4,
    'Good produce, gets busy on weekends.',
    NOW(),
    NOW(),
    '5dc33a09-c070-4d88-b3e6-7975a348c6bc'
),
(
    'a10ec0a5-d093-44eb-ba87-7f7c886cba5a',
    5,
    'Best burger night in Obs, hands down.',
    NOW(),
    NOW(),
    '0c213c6b-3510-4ea0-8959-4b2450afa961'
),
(
    '0ed3283a-4529-4993-985e-bf969a32e6dd',
    5,
    'Lunch special is huge value, will be back.',
    NOW(),
    NOW(),
    '0c213c6b-3510-4ea0-8959-4b2450afa961'
),
(
    'e0cf2f61-4ccd-4d9c-860e-283cb9fd1ea0',
    4,
    'Nice range for the price, staff were helpful.',
    NOW(),
    NOW(),
    '9ef2e6eb-c843-48b3-abdb-70a2051c78cf'
),
(
    'b7a01561-7d75-4f3a-8909-70cf33a4f891',
    3,
    'Decent stock but sizes run out fast on sale items.',
    NOW(),
    NOW(),
    '9ef2e6eb-c843-48b3-abdb-70a2051c78cf'
),
(
    '6922807d-fead-46c6-bfc1-6612da1ca14c',
    4,
    'Traded in my old laptop, smooth process.',
    NOW(),
    NOW(),
    'c7118da4-febd-4f9e-9935-1f666d640b76'
),
(
    'b7a98537-b636-4c3c-881b-5962fa959298',
    4,
    'Earbuds deal was worth the trip into town.',
    NOW(),
    NOW(),
    'c7118da4-febd-4f9e-9935-1f666d640b76'
)
ON CONFLICT DO NOTHING;


-- ============================================================
-- NOTIFICATIONS
-- ============================================================

INSERT INTO notifications (
    notificationid,
    title,
    message,
    is_read,
    created_at,
    user_id
)
VALUES
(
    '89887268-4db7-4b61-b28a-72351d102922',
    'New deal near you',
    'Fresh Basket Grocers just posted 20% Off Fresh Produce.',
    FALSE,
    NOW(),
    '076960fb-1650-49a9-8e81-3faf7c33389c'
),
(
    '09bc202b-2cb8-4d73-887e-6d53dfc14931',
    'Saved deal ending soon',
    'Bakery Bundle Deal at Fresh Basket Grocers ends in a few days.',
    TRUE,
    NOW(),
    '076960fb-1650-49a9-8e81-3faf7c33389c'
),
(
    '36aa8b8b-7bab-4efb-b13d-e4a96b476298',
    'Welcome to DealNest',
    'Start exploring stores and deals near you.',
    TRUE,
    NOW(),
    'c2082ccf-a259-49e6-97ce-11e36d986aaa'
),
(
    'f322f38c-c0dd-4212-8ce7-041447666e89',
    'New deal near you',
    'TechHub Electronics just posted Wireless Earbuds Blowout.',
    FALSE,
    NOW(),
    'c2082ccf-a259-49e6-97ce-11e36d986aaa'
)
ON CONFLICT DO NOTHING;