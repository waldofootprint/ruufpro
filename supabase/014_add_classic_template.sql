-- Add new template types: classic, clean_professional, forge, bold_dark.
-- Classic = clean corporate monochromatic. Forge = dark bold with blue accent.

alter table sites drop constraint if exists sites_template_check;
alter table sites add constraint sites_template_check
  check (template in ('storm_insurance', 'residential', 'full_service', 'modern_clean', 'chalkboard', 'blueprint', 'bold_confident', 'warm_trustworthy', 'classic', 'clean_professional', 'forge', 'bold_dark'));
