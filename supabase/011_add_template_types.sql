-- Add new template types for contractor sites.
-- Drop old check constraint and replace with one that includes new templates.

alter table sites drop constraint if exists sites_template_check;
alter table sites add constraint sites_template_check
  check (template in ('storm_insurance', 'residential', 'full_service', 'modern_clean', 'chalkboard', 'bold_confident', 'warm_trustworthy'));
