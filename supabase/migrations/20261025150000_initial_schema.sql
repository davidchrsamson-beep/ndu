-- =====================================================================
-- Ndu — Step 2: initial database
-- Everything runs as one unit: if any line fails, nothing is kept,
-- so it is always safe to fix the problem and run it again.
-- =====================================================================
begin;

-- ---------------------------------------------------------------------
-- 1. Fixed lists of allowed values
-- ---------------------------------------------------------------------
create type public.user_role as enum ('vendor', 'staff', 'admin');
create type public.product_status as enum ('draft', 'live', 'hidden');
create type public.media_type as enum ('image', 'video');
create type public.visit_source as enum ('market', 'chat', 'direct');
create type public.subscription_kind as enum ('trial', 'paid');

-- Keeps "updated_at" correct automatically whenever a row changes.
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 2. Tables
-- ---------------------------------------------------------------------

-- One row per login (vendor, staff or admin). Linked to Supabase's own login table.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'vendor',
  full_name text check (char_length(full_name) <= 100),
  phone text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The 9 market categories, and the product subtypes under each.
create table public.categories (
  id smallint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  sort_order smallint not null default 0
);

create table public.subcategories (
  id integer generated always as identity primary key,
  category_id smallint not null references public.categories (id),
  slug text not null,
  name text not null,
  sort_order smallint not null default 0,
  unique (category_id, slug)
);

-- The business. One store per login.
create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles (id),
  business_name text not null check (char_length(business_name) between 2 and 80),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 60),
  neighbourhood text check (char_length(neighbourhood) <= 80),
  whatsapp text not null check (whatsapp ~ '^\+?[0-9]{10,15}$'),
  instagram text check (char_length(instagram) <= 60),
  tiktok text check (char_length(tiktok) <= 60),
  logo_url text,
  hero_urls text[] not null default '{}',
  tagline text check (char_length(tagline) <= 120),
  story text check (char_length(story) <= 2000),
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz  -- soft delete: hidden, not destroyed
);

-- Which categories and subtypes each vendor sells in (sign-up steps 2 and 3).
create table public.vendor_categories (
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  category_id smallint not null references public.categories (id),
  primary key (vendor_id, category_id)
);

create table public.vendor_subcategories (
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  subcategory_id integer not null references public.subcategories (id),
  primary key (vendor_id, subcategory_id)
);

-- Products. Prices are whole kobo (₦4,000 = 400000) so maths is always exact.
create table public.products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id),
  subcategory_id integer references public.subcategories (id),
  name text not null check (char_length(name) between 1 and 120),
  description text check (char_length(description) <= 2000),
  price_kobo bigint not null check (price_kobo > 0 and price_kobo <= 100000000000),
  status public.product_status not null default 'draft',
  sort_order integer not null default 0,
  search tsvector generated always as
    (to_tsvector('english', name || ' ' || coalesce(description, ''))) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Photos and short videos for each product (files live in Cloudflare R2; we store the link).
create table public.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  vendor_id uuid not null references public.vendors (id),
  url text not null check (url ~ '^https://'),
  type public.media_type not null default 'image',
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

-- Ndu Magazine posts.
create table public.editorial_posts (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id),
  media_url text not null check (media_url ~ '^https://'),
  media_type public.media_type not null default 'image',
  caption text check (char_length(caption) <= 500),
  featured boolean not null default false,   -- only admins can feature a post
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Every trial or paid period. A store is live while today is inside one.
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id),
  kind public.subscription_kind not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  grace_ends_at timestamptz not null,   -- trial: same as ends_at; paid: ends_at + 3 days
  amount_kobo bigint not null default 0 check (amount_kobo >= 0),
  paystack_reference text unique,       -- stops one payment ever counting twice
  created_at timestamptz not null default now(),
  check (ends_at > starts_at and grace_ends_at >= ends_at)
);

-- Values the admin can change without code (price, period, trial, grace).
create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Storefront visits and WhatsApp checkout taps, with where the buyer came from.
create table public.visits (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  source public.visit_source not null default 'direct',
  created_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  source public.visit_source not null default 'direct',
  items jsonb not null default '[]' check (jsonb_typeof(items) = 'array'),
  total_kobo bigint not null default 0 check (total_kobo >= 0),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. Indexes: keep pages fast when there are thousands of products
-- ---------------------------------------------------------------------
create index products_vendor_idx on public.products (vendor_id);
create index products_subcategory_idx on public.products (subcategory_id);
create index products_price_idx on public.products (price_kobo);
create index products_search_idx on public.products using gin (search);
create index product_media_product_idx on public.product_media (product_id);
create index editorial_vendor_idx on public.editorial_posts (vendor_id);
create index subscriptions_vendor_idx on public.subscriptions (vendor_id, grace_ends_at);
create index visits_vendor_idx on public.visits (vendor_id, created_at);
create index leads_vendor_idx on public.leads (vendor_id, created_at);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger vendors_updated_at before update on public.vendors
  for each row execute function public.set_updated_at();
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger editorial_updated_at before update on public.editorial_posts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 4. Helper checks used by the security rules
-- ---------------------------------------------------------------------

-- Is the logged-in person Ndu staff or admin?
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('admin', 'staff')
  );
$$;

-- The store owned by the logged-in person (or nothing).
create or replace function public.my_vendor_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select id from public.vendors
  where owner_id = (select auth.uid()) and deleted_at is null;
$$;

-- Is this store live right now? (inside a trial, a paid period, or its grace days)
create or replace function public.vendor_is_live(v_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.vendors v
    join public.subscriptions s on s.vendor_id = v.id
    where v.id = v_id
      and v.deleted_at is null
      and s.starts_at <= now()
      and s.grace_ends_at > now()
  );
$$;

-- ---------------------------------------------------------------------
-- 5. Automatic actions
-- ---------------------------------------------------------------------

-- When someone signs up, create their profile row.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, phone, full_name)
  values (
    new.id,
    coalesce(nullif(new.phone, ''), new.raw_user_meta_data ->> 'phone'),
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- When a store is created, start its free trial (length comes from settings).
create or replace function public.start_trial()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  days integer;
begin
  select (value #>> '{}')::integer into days
  from public.settings where key = 'trial_days';

  insert into public.subscriptions (vendor_id, kind, starts_at, ends_at, grace_ends_at, amount_kobo)
  values (
    new.id, 'trial', now(),
    now() + make_interval(days => coalesce(days, 14)),
    now() + make_interval(days => coalesce(days, 14)),  -- no grace after a trial
    0
  );
  return new;
end;
$$;

create trigger vendors_start_trial
  after insert on public.vendors
  for each row execute function public.start_trial();

-- Nobody can make themselves an admin.
create or replace function public.protect_profile_role()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.role is distinct from old.role
     and (select auth.uid()) is not null
     and not public.is_admin() then
    raise exception 'Only an admin can change roles';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- Vendors cannot verify themselves or hand their store to another account.
create or replace function public.protect_vendor_fields()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (select auth.uid()) is null or public.is_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.verified then
      raise exception 'Only an admin can verify a store';
    end if;
  else
    if new.verified is distinct from old.verified then
      raise exception 'Only an admin can verify a store';
    end if;
    if new.owner_id is distinct from old.owner_id then
      raise exception 'A store cannot change owner';
    end if;
  end if;
  return new;
end;
$$;

create trigger vendors_protect
  before insert or update on public.vendors
  for each row execute function public.protect_vendor_fields();

-- Only admins can feature a Magazine post.
create or replace function public.protect_editorial_featured()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (select auth.uid()) is null or public.is_admin() then
    return new;
  end if;
  if (tg_op = 'INSERT' and new.featured)
     or (tg_op = 'UPDATE' and new.featured is distinct from old.featured) then
    raise exception 'Only an admin can feature a Magazine post';
  end if;
  return new;
end;
$$;

create trigger editorial_protect
  before insert or update on public.editorial_posts
  for each row execute function public.protect_editorial_featured();

-- A ready-made list of live stores for the market pages.
create view public.live_vendors with (security_invoker = on) as
select id, business_name, slug, neighbourhood, logo_url, hero_urls, tagline, verified, created_at
from public.vendors
where deleted_at is null and public.vendor_is_live(id);

-- ---------------------------------------------------------------------
-- 6. Row-level security: who can see and change which rows
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.subcategories enable row level security;
alter table public.vendors enable row level security;
alter table public.vendor_categories enable row level security;
alter table public.vendor_subcategories enable row level security;
alter table public.products enable row level security;
alter table public.product_media enable row level security;
alter table public.editorial_posts enable row level security;
alter table public.subscriptions enable row level security;
alter table public.settings enable row level security;
alter table public.visits enable row level security;
alter table public.leads enable row level security;

-- Profiles: you see and edit only your own (admins see all).
create policy "profiles: read own" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());
create policy "profiles: update own" on public.profiles for update to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

-- Categories: everyone reads; only admins change.
create policy "categories: public read" on public.categories for select to anon, authenticated using (true);
create policy "categories: admin write" on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "subcategories: public read" on public.subcategories for select to anon, authenticated using (true);
create policy "subcategories: admin write" on public.subcategories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Vendors: the public sees live stores only; owners and admins see their own.
create policy "vendors: public read live" on public.vendors for select to anon, authenticated
  using (deleted_at is null and public.vendor_is_live(id));
create policy "vendors: owner read" on public.vendors for select to authenticated
  using (owner_id = (select auth.uid()) or public.is_admin());
create policy "vendors: owner create" on public.vendors for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy "vendors: owner update" on public.vendors for update to authenticated
  using (owner_id = (select auth.uid()) or public.is_admin())
  with check (owner_id = (select auth.uid()) or public.is_admin());

-- Vendor categories and subtypes.
create policy "vendor_categories: public read" on public.vendor_categories for select to anon, authenticated using (true);
create policy "vendor_categories: owner manage" on public.vendor_categories for all to authenticated
  using (vendor_id = public.my_vendor_id() or public.is_admin())
  with check (vendor_id = public.my_vendor_id() or public.is_admin());
create policy "vendor_subcategories: public read" on public.vendor_subcategories for select to anon, authenticated using (true);
create policy "vendor_subcategories: owner manage" on public.vendor_subcategories for all to authenticated
  using (vendor_id = public.my_vendor_id() or public.is_admin())
  with check (vendor_id = public.my_vendor_id() or public.is_admin());

-- Products: the public sees live products of live stores; owners see all of their own.
create policy "products: public read live" on public.products for select to anon, authenticated
  using (status = 'live' and deleted_at is null and public.vendor_is_live(vendor_id));
create policy "products: owner read" on public.products for select to authenticated
  using (vendor_id = public.my_vendor_id() or public.is_admin());
create policy "products: owner create" on public.products for insert to authenticated
  with check (vendor_id = public.my_vendor_id() or public.is_admin());
create policy "products: owner update" on public.products for update to authenticated
  using (vendor_id = public.my_vendor_id() or public.is_admin())
  with check (vendor_id = public.my_vendor_id() or public.is_admin());

-- Product photos follow their product.
create policy "product_media: read with product" on public.product_media for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id));
create policy "product_media: owner manage" on public.product_media for all to authenticated
  using (vendor_id = public.my_vendor_id() or public.is_admin())
  with check (
    public.is_admin()
    or (vendor_id = public.my_vendor_id()
        and exists (select 1 from public.products p
                    where p.id = product_id and p.vendor_id = public.my_vendor_id()))
  );

-- Magazine posts.
create policy "editorial: public read" on public.editorial_posts for select to anon, authenticated
  using (published and deleted_at is null and public.vendor_is_live(vendor_id));
create policy "editorial: owner read" on public.editorial_posts for select to authenticated
  using (vendor_id = public.my_vendor_id() or public.is_admin());
create policy "editorial: owner create" on public.editorial_posts for insert to authenticated
  with check (vendor_id = public.my_vendor_id() or public.is_admin());
create policy "editorial: owner update" on public.editorial_posts for update to authenticated
  using (vendor_id = public.my_vendor_id() or public.is_admin())
  with check (vendor_id = public.my_vendor_id() or public.is_admin());

-- Subscriptions: owners can look; only the server (Paystack) and the trial trigger write.
create policy "subscriptions: owner read" on public.subscriptions for select to authenticated
  using (vendor_id = public.my_vendor_id() or public.is_admin());

-- Settings: everyone reads (the sign-up page shows the price); only admins change.
create policy "settings: public read" on public.settings for select to anon, authenticated using (true);
create policy "settings: admin update" on public.settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Visits and leads: anyone can record one for a live store; only the owner can read them.
create policy "visits: record" on public.visits for insert to anon, authenticated
  with check (public.vendor_is_live(vendor_id));
create policy "visits: owner read" on public.visits for select to authenticated
  using (vendor_id = public.my_vendor_id() or public.is_admin());
create policy "leads: record" on public.leads for insert to anon, authenticated
  with check (public.vendor_is_live(vendor_id));
create policy "leads: owner read" on public.leads for select to authenticated
  using (vendor_id = public.my_vendor_id() or public.is_admin());

-- ---------------------------------------------------------------------
-- 7. Least privilege: start from "no access", then allow only what is needed
-- ---------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select on public.categories, public.subcategories, public.vendors, public.vendor_categories,
  public.vendor_subcategories, public.products, public.product_media, public.editorial_posts,
  public.settings, public.live_vendors to anon, authenticated;
grant insert on public.visits, public.leads to anon, authenticated;
grant select on public.profiles, public.subscriptions, public.visits, public.leads to authenticated;
grant insert, update on public.vendors, public.products, public.product_media,
  public.editorial_posts to authenticated;
grant delete on public.product_media to authenticated;
grant insert, update, delete on public.vendor_categories, public.vendor_subcategories,
  public.categories, public.subcategories to authenticated;
grant update on public.profiles, public.settings to authenticated;

-- ---------------------------------------------------------------------
-- 8. Starting data
-- ---------------------------------------------------------------------
insert into public.settings (key, value) values
  ('price_kobo', '300000'),   -- ₦3,000
  ('period_days', '60'),      -- 2 months
  ('trial_days', '14'),       -- 2-week free trial
  ('grace_days', '3');        -- after paid periods only

insert into public.categories (slug, name, sort_order) values
  ('fashion', 'Fashion', 1),
  ('accessories', 'Accessories', 2),
  ('beauty', 'Beauty Products', 3),
  ('perfumes', 'Perfumes', 4),
  ('wigs', 'Wigs / Extensions', 5),
  ('bags', 'Bags', 6),
  ('phone-accessories', 'Phone Accessories', 7),
  ('kids-baby', 'Kids & Baby', 8),
  ('home-living', 'Home & Living', 9);

insert into public.subcategories (category_id, name, slug, sort_order)
select c.id, s.name,
       trim(both '-' from lower(regexp_replace(s.name, '[^a-zA-Z0-9]+', '-', 'g'))),
       s.ord
from (values
  ('fashion', 'Basic Tops', 1), ('fashion', 'Dresses', 2), ('fashion', 'Gowns', 3),
  ('fashion', 'Tops / Blouses', 4), ('fashion', 'Shirts', 5), ('fashion', 'Skirts', 6),
  ('fashion', 'Trousers', 7), ('fashion', 'Jeans', 8), ('fashion', 'Shorts', 9),
  ('fashion', 'Jumpsuits / Playsuits', 10), ('fashion', 'Native / Traditional', 11),
  ('fashion', 'Lingerie / Underwear', 12),
  ('accessories', 'Watches', 1), ('accessories', 'Sunglasses', 2), ('accessories', 'Belts', 3),
  ('accessories', 'Necklaces', 4), ('accessories', 'Earrings', 5), ('accessories', 'Bracelets', 6),
  ('accessories', 'Rings', 7), ('accessories', 'Scarves', 8),
  ('beauty', 'Skincare', 1), ('beauty', 'Makeup', 2), ('beauty', 'Hair Care', 3),
  ('beauty', 'Nails', 4), ('beauty', 'Body Care', 5),
  ('perfumes', 'Men''s Fragrances', 1), ('perfumes', 'Women''s Fragrances', 2),
  ('perfumes', 'Unisex Perfumes', 3), ('perfumes', 'Body Sprays', 4), ('perfumes', 'Perfume Oils', 5),
  ('wigs', 'Human Hair Wigs', 1), ('wigs', 'Synthetic Wigs', 2), ('wigs', 'Bundles', 3),
  ('wigs', 'Braids / Extensions', 4), ('wigs', 'Wig Care', 5),
  ('bags', 'Handbags', 1), ('bags', 'Clutches', 2), ('bags', 'Backpacks', 3),
  ('bags', 'Travel Bags', 4), ('bags', 'Purses / Wallets', 5),
  ('phone-accessories', 'Cases', 1), ('phone-accessories', 'Chargers / Cables', 2),
  ('phone-accessories', 'Earphones', 3), ('phone-accessories', 'Power Banks', 4),
  ('phone-accessories', 'Screen Protectors', 5),
  ('kids-baby', 'Kids Clothing', 1), ('kids-baby', 'Baby Clothing', 2), ('kids-baby', 'Toys', 3),
  ('kids-baby', 'Baby Care', 4), ('kids-baby', 'School Items', 5),
  ('home-living', 'Kitchen / Dining', 1), ('home-living', 'Home Decor', 2),
  ('home-living', 'Bedding', 3), ('home-living', 'Cleaning', 4), ('home-living', 'Small Appliances', 5)
) as s(cat, name, ord)
join public.categories c on c.slug = s.cat;

commit;