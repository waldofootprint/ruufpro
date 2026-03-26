-- Add design style options to the sites table.
-- We're pivoting from business-type templates to visual design styles,
-- all focused on residential roofing.

alter table sites drop constraint if exists sites_template_check;
alter table sites add constraint sites_template_check
  check (template in ('modern_clean', 'bold_confident', 'warm_trustworthy', 'storm_insurance', 'residential', 'full_service'));
