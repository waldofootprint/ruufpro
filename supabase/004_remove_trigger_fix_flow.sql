-- Remove the auto-create trigger. Instead, the app will create the
-- contractor row during onboarding when the roofer provides their info.
-- This is cleaner — no empty-string rows in the database.

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user();

-- Clean up any partial test users that may have been created
delete from contractors where business_name = '';
