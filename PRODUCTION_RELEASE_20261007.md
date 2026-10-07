# CodeZero production release — 7 October 2026

Isaac explicitly authorized deployment of all pending work to production. This supersedes earlier sandbox-only release restrictions; it does not make unfinished adapters operational.

## Operational scope

- Public interface, responsive navigation, dark/light/system mode and four accent colors.
- Appearance saved per authenticated account; authenticated private practice, decisions, cases and process guides.
- Private modular catalog and 19 waitlists. No charge or fulfillment is inferred from interest or a checkout return.
- Organizations, scoped manager/supervisor reports, assignments, errors and role hierarchy. Invitations are shared manually with existing or newly registered accounts; acceptance requires the invited confirmed email. No outbound email sent by this release.
- Private block diplomas use server verified lesson/exam/project requirements, idempotent issuance and stored snapshots.
- Export includes appearance, practice, waitlists, diplomas and own memberships.

## Deployment requirements and checks

Apply only `production_workspace_activation` to the verified production project `kwfzhpapvpdatdfwhouf`. It creates new workspace tables/RPCs with RLS and limited grants and contains no synthetic records. Existing quota limits, subscriptions and Auth settings remain intact. Historical sandbox DDL is now under `supabase/sandbox/migrations`; never replay the sandbox bootstrap on production. Existing remote migration versions differ from repository historical filenames: do not run an indiscriminate db push.

Enable `CODEZERO_WORKSPACE_PRODUCTION=1` and `CODEZERO_ENVIRONMENT=production` only for production. The guard additionally requires VERCEL_ENV=production and the exact production database URL. Review flags do not activate production. Runtime review keeps its isolated local host guard.

Validation: 144 unit tests, 20 checks against the exact production migration, 33 existing PostgreSQL checks, TypeScript and Next.js production build. Production Auth browser journeys remain to be checked with real signed-in users; policy fixtures are not an Auth integration test.

## Remaining integrations

OPENAI_API_KEY is absent from Vercel production metadata. Tutor remains unavailable; its new atomic budget/provider store is a candidate, not an active endpoint. Modular Stripe changes, 50-to-100 schedule migration, professional route purchases and verifiable public certificates are still candidates requiring completed adapters and payment lifecycle checks. All 19 new catalog entries remain coming_soon. Existing billing paths are preserved. Python/SQLite executable runtime stays local pending isolated hosting. Assessment variants are not connected to official exams. Review pages stay blocked in production. A release does not guarantee prevention of external AI use.

## Recovery

Prior production deployment: dpl_BXG7e9LFAvpYo3WKFTsddkZVb6eM (f615c97). Roll back routing if the new deployment fails verification. The additive schema can stay in place with activation flags disabled; do not delete user records to roll back UI. Retain the prior Git main SHA 04102ee0179abdd1b43a1c8a755a2392fc09b932. New production deployment/commit and verification are recorded in Notion after the actual release.
