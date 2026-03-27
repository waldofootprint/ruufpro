-- Push notification subscriptions.
-- Each row is a device that a contractor has subscribed for push notifications.
-- One contractor can have multiple devices (phone + laptop).

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid references contractors(id) on delete cascade not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);

alter table push_subscriptions enable row level security;

create policy "Contractors can manage own subscriptions"
  on push_subscriptions for all
  using (contractor_id in (
    select id from contractors where user_id = auth.uid()
  ));

-- Allow server to read all subscriptions for sending notifications
create policy "Public can insert subscriptions"
  on push_subscriptions for insert
  to anon, authenticated
  with check (true);

create policy "Public can read subscriptions"
  on push_subscriptions for select
  to anon, authenticated
  using (true);
