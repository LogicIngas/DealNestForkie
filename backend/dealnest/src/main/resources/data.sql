-- Sample data for local development. Runs automatically on every startup
-- (see spring.sql.init.mode / spring.jpa.defer-datasource-initialization in
-- application.properties). INSERT IGNORE makes it safe to re-run.

-- Admin login: admin@dealnest / admin1234
INSERT IGNORE INTO admins (adminid, email, password_hash, is_active, created_at, updated_at) VALUES
('5b89bce5-d8a7-476e-899e-a263ba813212', 'admin@dealnest', '$2a$10$madqrhkCXDhF2hEVwfJ1Zu7y4GdG.sI8eOpqMUEg2tYQ7FJ5LPKU.', 1, NOW(), NOW());

-- Sample users. Password for all of them: Password123
-- (store owners: userid 51f5.. / 7efb.. / b3d4.. / 86fd.. ; customers: 0769.. / c208..)
INSERT IGNORE INTO users (userid, email, password, first_name, last_name, phone_number, latitude, longitude, is_active, created_at, updated_at) VALUES
('51f55b70-7e96-4ad4-a3a8-564e13aec78e', 'owner@freshbasket.co.za', 'Password123', 'Nomvula', 'Dlamini', '0821234501', -33.9008, 18.6292, 1, NOW(), NOW()),
('7efbbced-729a-4a8e-b949-85773783ac8e', 'owner@mzansigrill.co.za', 'Password123', 'Sipho', 'Mokoena', '0821234502', -33.9375, 18.4708, 1, NOW(), NOW()),
('b3d4fb6d-2671-4d8c-9b94-64c225d16d1d', 'owner@urbanthread.co.za', 'Password123', 'Aisha', 'Petersen', '0821234503', -33.9833, 18.4667, 1, NOW(), NOW()),
('86fde77e-acf2-4540-af20-394d0bf4527f', 'owner@techhub.co.za', 'Password123', 'Liam', 'van der Merwe', '0821234504', -33.9249, 18.4241, 1, NOW(), NOW()),
('076960fb-1650-49a9-8e81-3faf7c33389c', 'thandi.customer@example.com', 'Password123', 'Thandi', 'Nkosi', '0731234505', -33.9249, 18.4241, 1, NOW(), NOW()),
('c2082ccf-a259-49e6-97ce-11e36d986aaa', 'jordan.customer@example.com', 'Password123', 'Jordan', 'Adams', '0731234506', -33.9249, 18.4241, 1, NOW(), NOW());

-- Sample stores, one per store-owner user above
INSERT IGNORE INTO stores (store_id, category, store_name, description, email, phone_number, address, city, latitude, longitude, opening_time, closing_time, is_verified, is_active, average_rating, total_reviews, created_at, updated_at, user_id) VALUES
('5dc33a09-c070-4d88-b3e6-7975a348c6bc', 'GROCERY', 'Fresh Basket Grocers', 'Neighbourhood grocer with daily fresh produce, bakery, and pantry staples.', 'owner@freshbasket.co.za', '0211234501', '12 Voortrekker Road', 'Bellville, Cape Town', -33.9008, 18.6292, '07:00:00', '19:00:00', 1, 1, 4.5, 32, NOW(), NOW(), '51f55b70-7e96-4ad4-a3a8-564e13aec78e'),
('0c213c6b-3510-4ea0-8959-4b2450afa961', 'RESTAURANT', 'Mzansi Grill House', 'Casual grill and shisanyama serving local favourites all week.', 'owner@mzansigrill.co.za', '0211234502', '45 Lower Main Road', 'Observatory, Cape Town', -33.9375, 18.4708, '11:00:00', '22:00:00', 1, 1, 4.7, 58, NOW(), NOW(), '7efbbced-729a-4a8e-b949-85773783ac8e'),
('9ef2e6eb-c843-48b3-abdb-70a2051c78cf', 'FASHION', 'Urban Thread Fashion', 'Affordable streetwear and everyday fashion for the whole family.', 'owner@urbanthread.co.za', '0211234503', '8 Main Road', 'Claremont, Cape Town', -33.9833, 18.4667, '09:00:00', '18:00:00', 1, 1, 4.2, 21, NOW(), NOW(), 'b3d4fb6d-2671-4d8c-9b94-64c225d16d1d'),
('c7118da4-febd-4f9e-9935-1f666d640b76', 'ELECTRONICS', 'TechHub Electronics', 'Phones, laptops, and gadgets with trade-in deals every month.', 'owner@techhub.co.za', '0211234504', '100 Long Street', 'Cape Town CBD', -33.9249, 18.4241, '09:00:00', '20:00:00', 0, 1, 4.0, 9, NOW(), NOW(), '86fde77e-acf2-4540-af20-394d0bf4527f');

-- Sample promotions (mostly active, one expired/inactive for variety)
INSERT IGNORE INTO promotions (promotionid, title, description, original_price, discount_price, discount_percentage, start_date, end_date, is_active, created_at, updated_at, store_id) VALUES
('ad550304-67c2-4200-8596-c2fde096e2b2', '20% Off Fresh Produce', 'All fresh fruit and veg, this week only.', 500.00, 400.00, 20.0, '2026-07-15 00:00:00', '2026-09-15 23:59:59', 1, NOW(), NOW(), '5dc33a09-c070-4d88-b3e6-7975a348c6bc'),
('e7af678b-527e-442d-a7c1-96d48aadeb81', 'Bakery Bundle Deal', 'Loaf, dozen rolls, and pastries bundled and discounted.', 150.00, 99.00, 34.0, '2026-08-01 00:00:00', '2026-08-20 23:59:59', 1, NOW(), NOW(), '5dc33a09-c070-4d88-b3e6-7975a348c6bc'),
('e56c9d0e-ea99-4626-b60f-fa239c840c4b', 'Winter Stock Clearance', 'Clearance on winter stock, promotion has ended.', 300.00, 150.00, 50.0, '2026-06-01 00:00:00', '2026-07-01 23:59:59', 0, NOW(), NOW(), '5dc33a09-c070-4d88-b3e6-7975a348c6bc'),
('1dabfacb-f81c-4c14-bed0-e5c056fdcaee', '2-for-1 Burger Night', 'Every Tuesday and Wednesday evening.', 240.00, 120.00, 50.0, '2026-07-20 00:00:00', '2026-09-30 23:59:59', 1, NOW(), NOW(), '0c213c6b-3510-4ea0-8959-4b2450afa961'),
('90128b77-53cf-4e98-a2c9-8b1707ad1760', 'Weekday Lunch Special', 'Two-course lunch special, Monday to Friday.', 180.00, 129.00, 28.0, '2026-08-01 00:00:00', '2026-08-31 23:59:59', 1, NOW(), NOW(), '0c213c6b-3510-4ea0-8959-4b2450afa961'),
('e69d891b-ee9a-4376-8371-3ada6cfd28a8', 'Spring Collection 30% Off', 'New spring arrivals, storewide.', 899.00, 629.00, 30.0, '2026-07-10 00:00:00', '2026-09-10 23:59:59', 1, NOW(), NOW(), '9ef2e6eb-c843-48b3-abdb-70a2051c78cf'),
('a6dd276e-ba47-4b64-bc7b-4e35141d3a47', 'Buy 2 Get 1 Free Tees', 'Mix and match any three t-shirts.', 450.00, 300.00, 33.0, '2026-08-01 00:00:00', '2026-08-25 23:59:59', 1, NOW(), NOW(), '9ef2e6eb-c843-48b3-abdb-70a2051c78cf'),
('59374d3a-5b11-4228-9ea8-8810c40259ed', 'Wireless Earbuds Blowout', 'Top-brand wireless earbuds while stock lasts.', 1299.00, 899.00, 31.0, '2026-07-25 00:00:00', '2026-09-25 23:59:59', 1, NOW(), NOW(), 'c7118da4-febd-4f9e-9935-1f666d640b76'),
('b9bb54d9-d0b8-48d4-9cee-c4484654dd37', 'Laptop Trade-In Special', 'Trade in any working laptop for a discount on a new one.', 12999.00, 10999.00, 15.0, '2026-08-01 00:00:00', '2026-08-31 23:59:59', 1, NOW(), NOW(), 'c7118da4-febd-4f9e-9935-1f666d640b76');
