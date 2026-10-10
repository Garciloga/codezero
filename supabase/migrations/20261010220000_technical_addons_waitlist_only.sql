-- Approved technical add-ons: discovery + interest registration only.
-- No subscriptions, payment methods, entitlements, invoices or profile data affected.
INSERT INTO public.addons (key,label,billing_type,entitlement_key,monthly_limit,status) VALUES
 ('technical_essential','Programación esencial','monthly','technical_essential',NULL,'coming_soon'),
 ('technical_complete','Programación + Integraciones','monthly','technical_complete',NULL,'coming_soon'),
 ('technical_teams','Programación para equipos','monthly','technical_teams',NULL,'coming_soon')
ON CONFLICT (key) DO NOTHING;
