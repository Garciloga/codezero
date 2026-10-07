# Production learning integrations — 7 October 2026

## Scope and authorization
Isaac explicitly authorized production, then requested deployment of all remaining prepared work. This release follows the earlier published f309532 release. It fixes a production session helper that erroneously still admitted sandbox sessions only; anonymous smoke checks could not detect this authenticated-path defect.

## Implemented
- Workspace session authentication reaches production Auth and the user's own active RLS profile. Regression tests cover the production configuration, invalid Auth, inactive and mismatched profiles.
- Existing awarded CodeZero certificates can be shared through a 256-bit opaque public link after consent. Public projection contains name, title and date only. Withdrawal makes the link unavailable; republishing rotates a withdrawn link. This is verification of the existing program award, not the new paid Customer Success certificate product.
- Exam sittings persist per-user shuffled questions and options, expire after two hours, and grade against private server solutions. Submission and quota consumption are transactional and idempotent. Shuffling is not a claim to prevent all outside AI use; the numeric variant prototype is still unmounted.
- Tutor endpoint uses trusted lesson/progress context, bounded output and a durable atomic request ledger with 100 included Pro queries. Unknown provider cost prevents repeat dispatch until reconciliation. Standard-cost estimates conservatively include cache-write premium; they are not Stripe or OpenAI invoices. Maximum reservation 5,000 micro-USD per call and 2 USD monthly ledger ceiling. Missing provider key disables calls and purchases before usage is consumed.
- Tutor purchase adapter schedules an item on the existing Starter subscription for its next renewal: 50 MXN for the first Tutor month, then 100 MXN. It preserves every other price and quantity. Cancellation removes only Tutor at renewal, retains other items, and refuses unrelated future schedule changes. Durable operation claims block repeats after uncertain Stripe outcomes. The old separate-subscription checkout is removed.
- account_addons supports catalog keys and multiple items on one subscription. No existing customer price is edited. Live Stripe inspection found zero subscriptions. Existing 50 and 100 MXN prices are reused; 75 MXN is absent from new schedules. No Stripe price, customer, charge or subscription was created by this release.
- Webhooks distinguish a combined subscription from a legacy standalone Tutor, re-read current subscription/invoice state, activate checkout only after paid confirmation, and scope invoice updates to its subscription rather than all subscriptions of a customer. Failures do not change a shared subscription's base plan.
- Catalog cards show approved MXN amounts and retain waitlists for unavailable offers.

## Prepared but externally blocked
The Python/Pyodide and SQL/SQLite WASM engine has a deterministic static build and a separate-origin production policy. Vercel rejected creation of `codezero-practice-engine` with HTTP 403; CLI fallback has no credentials. Production execution remains disabled until that isolated project is created/deployed and live browser tests pass. Do not enable CODEZERO_CODE_RUNTIME before this verification.

OPENAI_API_KEY is absent in production. The Tutor integration is deployed but unavailable. Keep the ai_tutor catalog entry coming_soon until a provider integration test and joint-invoice Stripe sandbox test pass. The connector exposes only Live, so billing/provider fixtures and PostgreSQL tests do not substitute for sandbox end-to-end validation.

The paid Customer Success route, 149 MXN certificate purchase/fulfillment, numeric exam variants and remaining future offers still require development/integration. They are not activated by this release. Other future offers intentionally remain Coming soon per launch scope. Existing certificate public sharing does not create paid ownership for those products.

## Validation
153 application tests, 4 isolated engine tests, TypeScript and clean production build pass. Ten PostgreSQL integration checks cover RLS/grants, certificate ownership/consent/revocation, atomic exam quota/replay/expiry, Tutor reservation/replay/budget, Pro included quota, billing operation locks and shared subscription keys. Secret scan is required before publishing. Auth browser end-to-end and real provider/Stripe sandbox calls are not claimed.

## Applied external changes
Migration `production_learning_integrations` was applied to production after an index-name collision rolled back the first attempt completely; the existing equivalent subscription index was reused. Four new tables have RLS and deny anonymous reads/client writes. Supabase reports two informational no-policy findings for service-only tables and the pre-existing leaked-password warning. The existing Stripe webhook now also subscribes to checkout.session.async_payment_succeeded; endpoint URL, signing secret, six original events and prices were retained.
