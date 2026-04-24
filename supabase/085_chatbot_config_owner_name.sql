-- 085: chatbot_config.owner_name
-- Optional first name of the roofer/owner. When set, Riley references the owner
-- by name naturally (e.g. "Mike's team", "Mike runs things here"). When null,
-- Riley stays generic ("our team"). Named-owner context was the #1 signal in
-- Riley conversion experiments (14/13 vs 10/10 leads).

ALTER TABLE chatbot_config
  ADD COLUMN IF NOT EXISTS owner_name text;
