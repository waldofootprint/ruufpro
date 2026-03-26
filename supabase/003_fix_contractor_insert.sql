-- Fix: The auto-create trigger needs permission to insert into contractors.
-- Also add a policy so authenticated users can insert their own contractor row
-- (used during onboarding if we switch away from the trigger approach).

-- Allow the trigger function to bypass RLS by granting insert to the service role
create policy "Allow contractor row creation"
  on contractors for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Also grant insert permission to the postgres role (used by triggers)
create policy "Service role can insert contractors"
  on contractors for insert
  to service_role
  with check (true);
