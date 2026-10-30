-- Reference schema for a future Supabase project.
-- Nothing in the app applies this file. The screens use lib/mock/data.ts.
-- Enable RLS before the Data API can reach these tables.
-- Put authorization roles in auth.users.raw_app_meta_data (app_metadata).
-- Never use user_metadata for access checks: the user can edit it.

create extension if not exists pgcrypto;

create type public.user_role as enum ('donor', 'student', 'recycler', 'admin');
create type public.device_category as enum ('phone', 'laptop', 'tablet', 'monitor', 'appliance', 'accessory');
create type public.device_condition as enum ('excellent', 'good', 'fair', 'poor');
create type public.working_status as enum ('working', 'partial', 'not_working');
create type public.pickup_status as enum ('requested', 'scheduled', 'collected', 'inspected', 'processing', 'donated', 'completed');
create type public.donation_status as enum ('available', 'reserved', 'donated');
create type public.assistance_status as enum ('open', 'matched', 'fulfilled');
create type public.review_status as enum ('pending', 'verified', 'needs_info');

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin';
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role public.user_role not null default 'donor',
  city text,
  points_month integer not null default 0 check (points_month >= 0),
  points_lifetime integer not null default 0 check (points_lifetime >= 0),
  created_at timestamptz not null default now()
);

create table public.recycler_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  org_name text not null,
  license text not null,
  city text not null,
  status public.review_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  category public.device_category not null,
  brand text not null,
  model text not null,
  description text not null default '',
  age_years integer not null check (age_years >= 0 and age_years <= 30),
  condition public.device_condition not null,
  working_status public.working_status not null,
  estimated_value integer not null default 0 check (estimated_value >= 0),
  points integer not null default 0 check (points >= 0),
  status public.pickup_status not null default 'requested',
  created_at timestamptz not null default now()
);

create table public.pickups (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices (id) on delete cascade,
  recycler_id uuid references public.recycler_profiles (id),
  address text not null,
  city text not null,
  collection_date date,
  status public.pickup_status not null default 'requested',
  created_at timestamptz not null default now()
);

create table public.pickup_events (
  id uuid primary key default gen_random_uuid(),
  pickup_id uuid not null references public.pickups (id) on delete cascade,
  status public.pickup_status not null,
  note text not null,
  happened_at timestamptz
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null unique references public.devices (id) on delete cascade,
  student_price integer check (student_price is null or student_price >= 0),
  donation_status public.donation_status not null default 'available',
  campus text not null,
  note text not null default ''
);

create table public.assistance_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  category public.device_category not null,
  need text not null,
  campus text not null,
  status public.assistance_status not null default 'open',
  created_at timestamptz not null default now()
);

create table public.reward_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  label text not null,
  points integer not null,
  created_at timestamptz not null default now()
);

create table public.monthly_winners (
  id uuid primary key default gen_random_uuid(),
  month date not null,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  rank integer not null check (rank between 1 and 3),
  points integer not null check (points >= 0),
  published boolean not null default false,
  unique (month, rank)
);

alter table public.profiles enable row level security;
alter table public.recycler_profiles enable row level security;
alter table public.devices enable row level security;
alter table public.pickups enable row level security;
alter table public.pickup_events enable row level security;
alter table public.listings enable row level security;
alter table public.assistance_requests enable row level security;
alter table public.reward_events enable row level security;
alter table public.monthly_winners enable row level security;

create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select p.role from public.profiles p where p.id = auth.uid()));

create policy "devices_owner_or_admin" on public.devices
  for all to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

create policy "pickups_visible_to_parties" on public.pickups
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.devices d
      where d.id = device_id and d.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.recycler_profiles r
      where r.id = recycler_id and r.profile_id = auth.uid()
    )
  );

create policy "listings_read_authenticated" on public.listings
  for select to authenticated
  using (true);

create policy "assistance_own_or_admin" on public.assistance_requests
  for all to authenticated
  using (student_id = auth.uid() or public.is_admin())
  with check (student_id = auth.uid() or public.is_admin());

create policy "rewards_read_own" on public.reward_events
  for select to authenticated
  using (profile_id = auth.uid() or public.is_admin());

create policy "winners_read_published" on public.monthly_winners
  for select to authenticated
  using (published or public.is_admin());

-- Device photos belong in a private Storage bucket named device-images.
-- Owner path: {auth.uid()}/{device_id}/{filename}
-- Policies need insert, select, and update for the owner. Do not make the bucket public.
