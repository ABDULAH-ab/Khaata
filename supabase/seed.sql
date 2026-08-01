-- Khata Assistant — Seed Data
-- Run this AFTER schema.sql in Supabase SQL Editor
-- 8 customers with transaction history spanning ~30 days

-- ============================================
-- INSERT CUSTOMERS
-- ============================================

-- 1. Ali Khan — normal customer, active balance (AMBIGUOUS: shares "Ali" prefix with Ali Raza)
INSERT INTO customers (id, name, aliases, balance, created_at, last_transaction_at)
VALUES (
  'a1111111-1111-1111-1111-111111111111',
  'Ali Khan',
  ARRAY['Ali', 'Ali bhai'],
  850,
  now() - interval '60 days',
  now() - interval '2 days'
);

-- 2. Ali Raza — AMBIGUOUS NAME pair with Ali Khan
INSERT INTO customers (id, name, aliases, balance, created_at, last_transaction_at)
VALUES (
  'a2222222-2222-2222-2222-222222222222',
  'Ali Raza',
  ARRAY['Ali R', 'Raza'],
  320,
  now() - interval '45 days',
  now() - interval '5 days'
);

-- 3. Sara Bibi — OVERDUE customer (last transaction 21+ days ago, positive balance)
INSERT INTO customers (id, name, aliases, balance, created_at, last_transaction_at)
VALUES (
  'a3333333-3333-3333-3333-333333333333',
  'Sara Bibi',
  ARRAY['Sara'],
  1200,
  now() - interval '90 days',
  now() - interval '22 days'
);

-- 4. Ahmed Malik — cleared tab (zero balance, for "paid off" testing)
INSERT INTO customers (id, name, aliases, balance, created_at, last_transaction_at)
VALUES (
  'a4444444-4444-4444-4444-444444444444',
  'Ahmed Malik',
  ARRAY['Ahmed'],
  0,
  now() - interval '30 days',
  now() - interval '3 days'
);

-- 5. Usman Tariq — active, recent transaction
INSERT INTO customers (id, name, aliases, balance, created_at, last_transaction_at)
VALUES (
  'a5555555-5555-5555-5555-555555555555',
  'Usman Tariq',
  ARRAY['Usman'],
  450,
  now() - interval '40 days',
  now() - interval '1 day'
);

-- 6. Fatima Noor — active, recent transaction
INSERT INTO customers (id, name, aliases, balance, created_at, last_transaction_at)
VALUES (
  'a6666666-6666-6666-6666-666666666666',
  'Fatima Noor',
  ARRAY['Fatima'],
  680,
  now() - interval '50 days',
  now() - interval '4 days'
);

-- 7. Bilal Chaudhry — zero balance, no outstanding debt
INSERT INTO customers (id, name, aliases, balance, created_at, last_transaction_at)
VALUES (
  'a7777777-7777-7777-7777-777777777777',
  'Bilal Chaudhry',
  ARRAY['Bilal'],
  0,
  now() - interval '20 days',
  now() - interval '7 days'
);

-- 8. Zainab Akhtar — small balance
INSERT INTO customers (id, name, aliases, balance, created_at, last_transaction_at)
VALUES (
  'a8888888-8888-8888-8888-888888888888',
  'Zainab Akhtar',
  ARRAY['Zainab'],
  275,
  now() - interval '35 days',
  now() - interval '6 days'
);

-- ============================================
-- INSERT TRANSACTION HISTORY
-- ============================================

-- Ali Khan transactions (balance should = 850)
INSERT INTO transactions (customer_id, type, amount, description, raw_input, created_at) VALUES
('a1111111-1111-1111-1111-111111111111', 'charge', 500, 'groceries and rice', 'Ali Khan took groceries 500', now() - interval '15 days'),
('a1111111-1111-1111-1111-111111111111', 'charge', 200, 'cooking oil', 'Ali bhai cooking oil 200', now() - interval '10 days'),
('a1111111-1111-1111-1111-111111111111', 'payment', 100, 'partial payment', 'Ali Khan paid 100', now() - interval '5 days'),
('a1111111-1111-1111-1111-111111111111', 'charge', 250, 'milk and bread', 'Ali took milk and bread 250', now() - interval '2 days');

-- Ali Raza transactions (balance should = 320)
INSERT INTO transactions (customer_id, type, amount, description, raw_input, created_at) VALUES
('a2222222-2222-2222-2222-222222222222', 'charge', 400, 'flour and sugar', 'Ali Raza flour and sugar 400', now() - interval '20 days'),
('a2222222-2222-2222-2222-222222222222', 'payment', 200, 'cash payment', 'Raza paid 200', now() - interval '12 days'),
('a2222222-2222-2222-2222-222222222222', 'charge', 120, 'tea and biscuits', 'Ali R tea biscuits 120', now() - interval '5 days');

-- Sara Bibi transactions (balance should = 1200, OVERDUE — last txn 22 days ago)
INSERT INTO transactions (customer_id, type, amount, description, raw_input, created_at) VALUES
('a3333333-3333-3333-3333-333333333333', 'charge', 800, 'monthly groceries', 'Sara monthly groceries 800', now() - interval '45 days'),
('a3333333-3333-3333-3333-333333333333', 'payment', 300, 'partial payment', 'Sara paid 300', now() - interval '30 days'),
('a3333333-3333-3333-3333-333333333333', 'charge', 700, 'household items', 'Sara household items 700', now() - interval '22 days');

-- Ahmed Malik transactions (balance should = 0, cleared tab)
INSERT INTO transactions (customer_id, type, amount, description, raw_input, created_at) VALUES
('a4444444-4444-4444-4444-444444444444', 'charge', 600, 'weekly groceries', 'Ahmed weekly groceries 600', now() - interval '14 days'),
('a4444444-4444-4444-4444-444444444444', 'charge', 150, 'snacks', 'Ahmed snacks 150', now() - interval '7 days'),
('a4444444-4444-4444-4444-444444444444', 'payment', 750, 'full payment - cleared tab', 'Ahmed paid everything', now() - interval '3 days');

-- Usman Tariq transactions (balance should = 450)
INSERT INTO transactions (customer_id, type, amount, description, raw_input, created_at) VALUES
('a5555555-5555-5555-5555-555555555555', 'charge', 300, 'rice and lentils', 'Usman rice lentils 300', now() - interval '8 days'),
('a5555555-5555-5555-5555-555555555555', 'charge', 150, 'vegetables', 'Usman vegetables 150', now() - interval '1 day');

-- Fatima Noor transactions (balance should = 680)
INSERT INTO transactions (customer_id, type, amount, description, raw_input, created_at) VALUES
('a6666666-6666-6666-6666-666666666666', 'charge', 500, 'kitchen supplies', 'Fatima kitchen supplies 500', now() - interval '12 days'),
('a6666666-6666-6666-6666-666666666666', 'payment', 200, 'partial payment', 'Fatima paid 200', now() - interval '8 days'),
('a6666666-6666-6666-6666-666666666666', 'charge', 380, 'spices and oil', 'Fatima spices oil 380', now() - interval '4 days');

-- Bilal Chaudhry transactions (balance should = 0)
INSERT INTO transactions (customer_id, type, amount, description, raw_input, created_at) VALUES
('a7777777-7777-7777-7777-777777777777', 'charge', 200, 'bread and eggs', 'Bilal bread eggs 200', now() - interval '14 days'),
('a7777777-7777-7777-7777-777777777777', 'payment', 200, 'full payment', 'Bilal cleared his tab', now() - interval '7 days');

-- Zainab Akhtar transactions (balance should = 275)
INSERT INTO transactions (customer_id, type, amount, description, raw_input, created_at) VALUES
('a8888888-8888-8888-8888-888888888888', 'charge', 350, 'monthly provisions', 'Zainab monthly provisions 350', now() - interval '15 days'),
('a8888888-8888-8888-8888-888888888888', 'payment', 150, 'partial payment', 'Zainab paid 150', now() - interval '10 days'),
('a8888888-8888-8888-8888-888888888888', 'charge', 75, 'milk', 'Zainab milk 75', now() - interval '6 days');
