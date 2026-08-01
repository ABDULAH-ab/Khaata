-- Khata Assistant — Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL → New Query)

-- ============================================
-- TABLE: customers
-- ============================================
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  aliases text[] default '{}',
  balance numeric not null default 0,
  created_at timestamptz default now(),
  last_transaction_at timestamptz
);

-- ============================================
-- TABLE: transactions
-- ============================================
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) not null,
  type text not null check (type in ('charge', 'payment')),
  amount numeric not null,
  description text,
  raw_input text,
  created_at timestamptz default now()
);

-- ============================================
-- INDEXES for performance
-- ============================================
create index if not exists idx_customers_name on customers using gin (to_tsvector('english', name));
create index if not exists idx_transactions_customer_id on transactions(customer_id);
create index if not exists idx_customers_balance on customers(balance);

-- ============================================
-- RLS (Row Level Security) — disabled for now
-- since this is a single-user app
-- ============================================
alter table customers enable row level security;
alter table transactions enable row level security;

-- Allow all operations for the service role and anon key
create policy "Allow all for anon" on customers for all using (true) with check (true);
create policy "Allow all for anon" on transactions for all using (true) with check (true);
