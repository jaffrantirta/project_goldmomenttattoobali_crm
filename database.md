# Gold Moment Tattoo Bali CRM — Database Structure

Copy and paste the SQL below into your **Supabase SQL Editor** and run it.

---

```sql
-- ============================================================
-- Gold Moment Tattoo Bali CRM — Database Setup
-- ============================================================

-- 1. INQUIRIES TABLE
-- Stores client inquiry submissions from the public form
-- ============================================================
create table public.inquiries (
  id              uuid        default gen_random_uuid() primary key,
  name            text        not null,
  whatsapp        text        not null,
  referral_source text        not null check (referral_source in ('google', 'instagram', 'friend', 'tour_guide')),
  status          text        not null default 'not_followed_up' check (status in ('not_followed_up', 'followed_up')),
  notes           text,
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null
);

-- 2. BOOKINGS TABLE
-- Stores confirmed bookings (client has dealt / agreed to book)
-- ============================================================
create table public.bookings (
  id                uuid        default gen_random_uuid() primary key,
  inquiry_id        uuid        references public.inquiries(id) on delete set null,
  client_name       text        not null,
  whatsapp          text        not null,
  source            text,
  booking_date      date,
  tattoo_description text,
  deposit_amount    numeric(12,2),
  booking_status    text        not null default 'confirmed' check (booking_status in ('confirmed', 'completed', 'cancelled')),
  notes             text,
  created_at        timestamptz default now() not null,
  updated_at        timestamptz default now() not null
);

-- 3. ADMINS TABLE
-- Stores admin profiles linked to Supabase Auth users
-- ============================================================
create table public.admins (
  id          uuid  references auth.users(id) on delete cascade primary key,
  email       text  not null unique,
  name        text  not null,
  role        text  not null default 'admin' check (role in ('super_admin', 'admin')),
  created_at  timestamptz default now() not null,
  created_by  uuid  references public.admins(id) on delete set null
);

-- 4. AUDIT LOGS TABLE
-- Records every create / update / delete action for full traceability
-- ============================================================
create table public.audit_logs (
  id          uuid        default gen_random_uuid() primary key,
  admin_id    uuid        references public.admins(id) on delete set null,
  admin_email text,
  action      text        not null,   -- e.g. 'CREATE_INQUIRY', 'UPDATE_INQUIRY_STATUS', 'CREATE_BOOKING'
  table_name  text        not null,
  record_id   uuid,
  old_data    jsonb,
  new_data    jsonb,
  created_at  timestamptz default now() not null
);

-- ============================================================
-- TRIGGER: auto-update updated_at on row changes
-- ============================================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_inquiries_updated_at
  before update on public.inquiries
  for each row execute function update_updated_at_column();

create trigger update_bookings_updated_at
  before update on public.bookings
  for each row execute function update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table public.inquiries  enable row level security;
alter table public.bookings   enable row level security;
alter table public.admins     enable row level security;
alter table public.audit_logs enable row level security;

-- Inquiries: anyone can INSERT (public form), admins can read/update
create policy "Public can insert inquiries"
  on public.inquiries for insert to anon
  with check (true);

create policy "Admins can view inquiries"
  on public.inquiries for select to authenticated
  using (exists (select 1 from public.admins where id = auth.uid()));

create policy "Admins can update inquiries"
  on public.inquiries for update to authenticated
  using (exists (select 1 from public.admins where id = auth.uid()));

-- Bookings: admins only
create policy "Admins can manage bookings"
  on public.bookings for all to authenticated
  using (exists (select 1 from public.admins where id = auth.uid()))
  with check (exists (select 1 from public.admins where id = auth.uid()));

-- Admins: authenticated admins can view, only super_admin can insert/update/delete
create policy "Admins can view admin list"
  on public.admins for select to authenticated
  using (exists (select 1 from public.admins where id = auth.uid()));

create policy "Super admin can manage admins"
  on public.admins for all to authenticated
  using (exists (select 1 from public.admins where id = auth.uid() and role = 'super_admin'))
  with check (exists (select 1 from public.admins where id = auth.uid() and role = 'super_admin'));

-- Audit logs: admins can view only (service_role writes them via API)
create policy "Admins can view audit logs"
  on public.audit_logs for select to authenticated
  using (exists (select 1 from public.admins where id = auth.uid()));

-- ============================================================
-- FIRST SUPER ADMIN SETUP
-- ============================================================
-- STEP 1: Go to Supabase Dashboard → Authentication → Users
-- STEP 2: Click "Add user" → create with your email & password
-- STEP 3: Copy the UUID shown for that user
-- STEP 4: Run this SQL (replace values with your info):
--
-- insert into public.admins (id, email, name, role)
-- values (
--   'PASTE_YOUR_USER_UUID_HERE',
--   'your@email.com',
--   'Your Name',
--   'super_admin'
-- );
```

---

## Migration: Add source column to bookings (if table already exists)

```sql
alter table public.bookings add column if not exists source text;
alter table public.bookings drop column if exists total_amount;
```

---

## Tables Summary

| Table | Purpose |
|-------|---------|
| `inquiries` | Client inquiry submissions from the public form |
| `bookings` | Confirmed bookings where client has agreed to proceed |
| `admins` | Admin users (linked to Supabase Auth) |
| `audit_logs` | Full audit trail of all admin actions |

## Referral Sources

| Value | Display |
|-------|---------|
| `google` | Google |
| `instagram` | Instagram |
| `friend` | Friend |
| `tour_guide` | Tour Guide |

## Inquiry Statuses

| Value | Display |
|-------|---------|
| `not_followed_up` | Not Followed Up Yet |
| `followed_up` | Already Followed Up |

## Booking Statuses

| Value | Display |
|-------|---------|
| `confirmed` | Confirmed |
| `completed` | Completed |
| `cancelled` | Cancelled |

## Admin Roles

| Value | Display |
|-------|---------|
| `admin` | Admin |
| `super_admin` | Super Admin (can create/delete other admins) |
