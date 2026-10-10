-- Assessment evidence v2 uses the existing, manager-reviewed training pipeline.
-- No new permissions: submissions and evidence remain behind current tenant RLS.
-- No automatic unlock, completion, certificate, or promotion.
insert into public.learning_activity_catalog
 (content_key, route_key, title, kind, competencies, version, active)
values
 ('cs-decision-evidence-v2','customer_success','Faro · decisiones complejas con evidencias','deliverable',
  array['diagnosis','data','planning']::text[],'cs-decision-evidence-v2.0',true)
on conflict (content_key) do nothing;
