-- Allow public to read contractor data when that contractor has a published site.
-- This is needed so visitors can see the business name, phone, trust badges, etc.
-- on a contractor's public-facing website.

create policy "Public can read contractors with published sites"
  on contractors for select
  to anon
  using (
    id in (select contractor_id from sites where published = true)
  );
