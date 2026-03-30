-- Fix: The previous policy caused infinite recursion because contractors
-- and sites RLS policies referenced each other in a loop.
--
-- New approach: allow public to read all contractor rows. This data
-- (business name, phone, city) is meant to be public on their website.
-- RLS still protects UPDATE/DELETE — only the owner can modify their data.

drop policy if exists "Public can read contractors with published sites" on contractors;

create policy "Public can read contractor profiles"
  on contractors for select
  to anon
  using (true);

