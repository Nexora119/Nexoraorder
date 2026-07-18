-- NexoraOrders — Supabase Schema (Phase 1, Item 1) — Revision 2
-- Incorporates: order snapshots, structured address, provider-agnostic payments,
-- audit trail, split order/payment status, indexes, approval audit fields.
-- Run this in the Supabase SQL Editor on a fresh project.

create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES
-- ============================================================
create type user_role as enum ('customer', 'business_owner', 'admin');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'customer',
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- BUSINESSES
-- ============================================================
create type business_status as enum ('pending', 'active', 'inactive', 'rejected');

create table businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  category text,
  description text,

  -- Structured address (replaces single `location text`)
  street_address text,
  suburb text,
  city text,
  province text,
  postal_code text,

  email text not null,
  phone text not null,
  operating_hours jsonb,

  -- Provider-agnostic payment linkage (was Paystack-only)
  payment_provider text not null default 'paystack', -- 'paystack' | 'payfast' | future providers
  provider_account_id text, -- e.g. Paystack subaccount code

  status business_status not null default 'pending',
  rejection_reason text,

  -- Approval audit
  approved_at timestamptz,
  approved_by uuid references profiles(id),

  trial_start_date timestamptz,
  created_at timestamptz not null default now(),
  unique (email),
  unique (phone),
  unique (payment_provider, provider_account_id)
);

create index idx_businesses_owner_id on businesses(owner_id);
create index idx_businesses_status on businesses(status);
create index idx_businesses_created_at on businesses(created_at);

-- ============================================================
-- MENU ITEMS
-- ============================================================
create table menu_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  photo_url text,
  available boolean not null default true,
  -- Lightweight placeholder for future customization (extra cheese, sizes, etc.)
  -- Full option_groups/option_values structure deferred to post-MVP.
  option_config jsonb,
  created_at timestamptz not null default now()
);

create index idx_menu_items_business_id on menu_items(business_id);

-- ============================================================
-- ORDERS
-- ============================================================
-- Split order fulfillment status from payment status.
create type order_status as enum (
  'pending_acceptance', 'accepted', 'ready', 'completed', 'rejected'
);
create type payment_status as enum (
  'paid', 'refunded', 'failed'
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  customer_id uuid not null references profiles(id),

  order_status order_status not null default 'pending_acceptance',
  payment_status payment_status not null default 'paid',

  pickup_time timestamptz,
  total_amount numeric(10,2) not null check (total_amount >= 0),

  -- Provider-agnostic payment reference (was Paystack-only)
  payment_provider text not null default 'paystack',
  provider_reference text not null,

  created_at timestamptz not null default now(),
  unique (payment_provider, provider_reference)
);

create index idx_orders_business_id on orders(business_id);
create index idx_orders_customer_id on orders(customer_id);
create index idx_orders_order_status on orders(order_status);
create index idx_orders_created_at on orders(created_at);

-- Full snapshot per line item — immune to later menu edits/deletions.
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id) on delete set null, -- optional now

  item_name text not null,
  item_description text,
  unit_price numeric(10,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  selected_options jsonb, -- placeholder for future extras/customization
  line_total numeric(10,2) not null check (line_total >= 0)
);

create index idx_order_items_order_id on order_items(order_id);

-- Audit trail: who changed an order's status, when, and why.
create table order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  old_status order_status,
  new_status order_status not null,
  changed_by uuid references profiles(id),
  reason text,
  created_at timestamptz not null default now()
);

create index idx_order_status_history_order_id on order_status_history(order_id);

-- ============================================================
-- SUBSCRIPTIONS (business -> platform billing, R200/month)
-- ============================================================
create type billing_status as enum ('trial', 'active', 'inactive');

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references businesses(id) on delete cascade,
  trial_end_date timestamptz not null,
  billing_status billing_status not null default 'trial',

  -- Provider-agnostic billing linkage (was Paystack-only)
  payment_provider text not null default 'paystack',
  provider_customer_id text,
  provider_subscription_id text,

  created_at timestamptz not null default now()
);

create index idx_subscriptions_business_id on subscriptions(business_id);
create index idx_subscriptions_billing_status on subscriptions(billing_status);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table businesses enable row level security;
alter table menu_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_status_history enable row level security;
alter table subscriptions enable row level security;

create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

create policy "businesses_select_active_public" on businesses
  for select using (status = 'active' or owner_id = auth.uid());
create policy "businesses_insert_own" on businesses
  for insert with check (owner_id = auth.uid());
create policy "businesses_update_own" on businesses
  for update using (owner_id = auth.uid());

create policy "menu_items_select_public" on menu_items
  for select using (
    exists (select 1 from businesses b where b.id = business_id and (b.status = 'active' or b.owner_id = auth.uid()))
  );
create policy "menu_items_owner_manage" on menu_items
  for all using (
    exists (select 1 from businesses b where b.id = business_id and b.owner_id = auth.uid())
  );

create policy "orders_select_own_customer" on orders
  for select using (customer_id = auth.uid());
create policy "orders_select_own_business" on orders
  for select using (
    exists (select 1 from businesses b where b.id = business_id and b.owner_id = auth.uid())
  );
create policy "orders_insert_customer" on orders
  for insert with check (customer_id = auth.uid());
create policy "orders_update_business" on orders
  for update using (
    exists (select 1 from businesses b where b.id = business_id and b.owner_id = auth.uid())
  );

create policy "order_items_select" on order_items
  for select using (
    exists (
      select 1 from orders o
      where o.id = order_id
      and (o.customer_id = auth.uid()
        or exists (select 1 from businesses b where b.id = o.business_id and b.owner_id = auth.uid()))
    )
  );

create policy "order_status_history_select" on order_status_history
  for select using (
    exists (
      select 1 from orders o
      where o.id = order_id
      and (o.customer_id = auth.uid()
        or exists (select 1 from businesses b where b.id = o.business_id and b.owner_id = auth.uid()))
    )
  );

create policy "subscriptions_select_own" on subscriptions
  for select using (
    exists (select 1 from businesses b where b.id = business_id and b.owner_id = auth.uid())
  );

-- NOTE: Admin (you) bypasses RLS via the Supabase service role key,
-- used only in server-side code (admin panel, webhooks) — never exposed to the browser.
