# Garciloga: brand, owner privacy and paid seats

The public About page contains the founder's supplied mission, vision, values and history in Spanish, English, Portuguese and French. Inter is bundled locally. Headings prefer locally installed Söhne; consistent Söhne rendering still requires licensed Klim webfont files. No unlicensed font was redistributed.

Responsive forms, public navigation and the application sidebar accommodate 320–900 px layouts. Brief entrance, button and progress animations respect reduced-motion preferences. Palette color changes remain immediate to preserve text contrast.

The existing platform proprietor is pinned by a database singleton, an owner uniqueness index and immutable status/role triggers. Global ownership is independent of company responsibility. The proprietor cannot join a company; operator identity columns are not readable by company clients. The administrative user list excludes the proprietor.

Only the proprietor can create an account directly without Stripe. The new account is a student; access is assigned through a service-only RPC. A private one-use signup link exchanges the token for SSR cookies before password setup. Links are not automatically emailed, logged or stored; the owner shares them with their recipient. No actual customer account was created during verification.

Starter and Pro use the existing monthly MXN unit prices and existing per-person quotas. A seat subscription requires at least five users, including the subscriber. Customers acknowledge payment and role/visibility configuration. Existing subscriptions use Stripe pending updates with invoice proration; additional capacity is withheld until payment succeeds. The verified paid subscription creates exactly one company and one responsible membership. Canceled/unpaid contracts lose company access. This purchase flow only increases seats; reducing occupied capacity is rejected. Webhook reconciliation retrieves current subscription state and is replay-safe. No live charge was performed during verification.

Available company messaging, executable code practice and seven role practice routes are removed from the pending roadmap only when their production flags are active. Mentoring, community and other unfinished features remain pending. Role practice uses existing Pro/Enterprise access; commercial add-ons are not enabled.

Validation: 192 unit tests, 20 PostgreSQL permission/capacity groups, production migration checks, localization coverage, production build, and Chromium browser fixtures covering four languages, appearance, mobile widths, zoom, accessibility, owner-only forms and request denial. Auth/PostgREST browser data was synthetic.

Supabase's security advisor reports intentionally closed RLS tables with no client policies. Its existing leaked-password protection warning is unrelated to this release: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
