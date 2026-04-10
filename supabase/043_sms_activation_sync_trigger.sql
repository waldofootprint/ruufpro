-- Prevent activation split-brain: when sms_numbers.status changes to 'active',
-- automatically sync sms_enabled + twilio_number on the contractors table.
-- This is the permanent fix — even if activateSMS() partially fails,
-- the DB trigger ensures both tables stay in sync.

create or replace function sync_sms_activation()
returns trigger as $$
begin
  -- Only fire when status changes TO 'active'
  if new.status = 'active' and (old.status is null or old.status != 'active') then
    update contractors
    set sms_enabled = true,
        twilio_number = new.phone_number,
        updated_at = now()
    where id = new.contractor_id;
  end if;

  -- If status changes FROM 'active' to something else, disable SMS
  if old.status = 'active' and new.status != 'active' then
    update contractors
    set sms_enabled = false,
        updated_at = now()
    where id = new.contractor_id;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger sms_numbers_activation_sync
  after update of status on sms_numbers
  for each row execute function sync_sms_activation();
