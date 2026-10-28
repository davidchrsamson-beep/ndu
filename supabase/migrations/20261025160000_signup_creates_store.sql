-- =====================================================================
-- Ndu — Step 3A: one sign-up creates the login, profile, store and trial
-- =====================================================================
begin;

-- Storefront banner text from sign-up step 4 ("10% off all Ankara").
alter table public.vendors
  add column special_offer text check (char_length(special_offer) <= 120);

-- Phone is now store contact info, not a login, so it no longer has to be unique.
alter table public.profiles drop constraint if exists profiles_phone_key;

-- When someone signs up, create their profile AND their store in the same moment.
-- (Creating the store also starts the free trial, through the trigger from Step 2.)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  base_slug text;
  final_slug text;
  n integer := 1;
  new_vendor_id uuid;
begin
  insert into public.profiles (id, phone, full_name)
  values (new.id, nullif(meta ->> 'phone', ''), nullif(meta ->> 'full_name', ''));

  if coalesce(meta ->> 'business_name', '') <> '' then
    -- Store address from the business name: "Amaka's Arts" -> "amaka-s-arts"
    base_slug := trim(both '-' from lower(regexp_replace(meta ->> 'business_name', '[^a-zA-Z0-9]+', '-', 'g')));
    if base_slug = '' then base_slug := 'store'; end if;
    if char_length(base_slug) < 3 then base_slug := base_slug || '-store'; end if;
    base_slug := trim(both '-' from left(base_slug, 50));

    -- If the address is taken, add -2, -3 ... until it is free.
    final_slug := base_slug;
    while exists (select 1 from public.vendors where slug = final_slug) loop
      n := n + 1;
      final_slug := base_slug || '-' || n;
    end loop;

    insert into public.vendors (owner_id, business_name, slug, neighbourhood, whatsapp, tagline, special_offer)
    values (
      new.id,
      meta ->> 'business_name',
      final_slug,
      nullif(meta ->> 'neighbourhood', ''),
      meta ->> 'whatsapp',
      nullif(meta ->> 'tagline', ''),
      nullif(meta ->> 'special_offer', '')
    )
    returning id into new_vendor_id;

    insert into public.vendor_categories (vendor_id, category_id)
    select new_vendor_id, c.id
    from public.categories c
    where c.slug in (select jsonb_array_elements_text(coalesce(meta -> 'categories', '[]'::jsonb)));

    -- Only subtypes that belong to the categories the vendor picked.
    insert into public.vendor_subcategories (vendor_id, subcategory_id)
    select new_vendor_id, s.id
    from public.subcategories s
    where s.id::text in (select jsonb_array_elements_text(coalesce(meta -> 'subcategories', '[]'::jsonb)))
      and s.category_id in (select category_id from public.vendor_categories where vendor_id = new_vendor_id);
  end if;

  return new;
end;
$$;

commit;