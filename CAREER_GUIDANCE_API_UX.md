# Career Guidance API & UX Draft v0.1

Status: design only. No production routes or database writes yet.

## Goal

Define the server boundaries before connecting Career Guidance to user data.

## Server-side principles

- Every write goes through a same-origin authenticated route.
- Browser clients never write directly to Career Guidance tables.
- Personalization must be explicitly enabled before recording new Career Guidance signals.
- All scoring responses include model_version.
- Senior roles keep affinity separate from experience_gate.
- Rate limit all write endpoints.
- Admin model changes must be audited.

## Proposed endpoints

### POST /api/career/consent
Purpose:
- enable or disable Career Guidance personalization;
- persist consent version and timestamp.

Input:
```json
{
  "enabled": true,
  "consent_version": "career-consent-v0.1"
}
```

Rules:
- authenticated user only;
- same-origin;
- disabling stops future signal generation;
- disabling does not promise deletion unless deletion is explicitly requested and implemented.

### GET /api/career/status
Returns:
- personalization_enabled;
- consent_version;
- current model_version;
- diagnostic status;
- number of completed base/discriminator activities;
- whether a result can be shown.

### GET /api/career/activity/next
Purpose:
- return next base or adaptive activity.

Rules:
- require personalization enabled;
- first complete 8 base activities;
- then use adaptive selector;
- max 3 discriminators;
- never reveal hidden scoring weights.

### POST /api/career/activity/:key/submit
Input:
- validated activity response;
- optional enjoyment score;
- optional declared interest;
- client timing metadata only when necessary.

Server actions:
1. authenticate;
2. verify consent;
3. rate limit;
4. validate activity is expected/active;
5. validate response schema;
6. create activity attempt;
7. derive allowed signals server-side;
8. recalculate dimension scores;
9. recalculate route scores;
10. store model_version;
11. return progress and next-step summary.

Never trust client-sent normalized signals.

### GET /api/career/results
Returns:
- top 3 positions;
- family;
- rounded affinity;
- confidence band;
- experience gate;
- reason dimensions;
- compatible-path indicator;
- disclaimer;
- model_version.

Do not return:
- internal route weights;
- hidden model configuration;
- sensitive inferred traits.

### POST /api/career/feedback
Input:
```json
{
  "route_key": "tech_support_l2",
  "feedback_type": "does_not_represent_me"
}
```

Allowed feedback:
- represents_me
- does_not_represent_me
- unsure
- explore_anyway

Feedback never deletes prior evidence.

### POST /api/career/experience
Purpose:
- collect minimum experience data needed for seniority gates.

Use ranges/booleans, not a full CV.

### POST /api/career/disable
Optional alias for consent disable if UX benefits from a dedicated route.

### DELETE /api/career/history
Future only.
Do not expose until deletion behavior is fully implemented, audited and reflected in privacy policy.

## Admin endpoints

### GET /api/admin/career/model
Owner/admin only.

### POST /api/admin/career/model/version
Create a new draft model version.

### POST /api/admin/career/model/activate
Activate reviewed model version.

Guardrails:
- never mutate an active historical version;
- activation creates auditable event;
- run regression tests before activation.

## Result UX

### Screen 1 — Intro
Title:
"Descubre rutas que podrían encajar contigo"

Explain:
- 10–15 min;
- practical activities;
- multiple paths;
- recommendations can change;
- user remains in control.

Actions:
- Start personalized diagnostic
- Continue without personalization

### Screen 2 — Activity
Show:
- progress, e.g. 3 of at least 8;
- scenario;
- task;
- one focused action;
- no visible scoring labels.

### Screen 3 — Adaptive activity
Copy:
"Estas dos rutas comparten varias señales en tu perfil. Una actividad extra puede ayudarnos a diferenciarlas."

Do not tell the user which answer maps to which role before submission.

### Screen 4 — Results
Top area:
- "Rutas para explorar"
- confidence band
- current model version hidden under "How this works", not prominent.

Each card:
- position;
- family;
- affinity integer;
- confidence;
- 2–4 reasons;
- experience gate note when relevant;
- Explore route;
- Why this?;
- This represents me / does not represent me.

### Screen 5 — All paths
Show all families and positions.
Top-3 does not restrict navigation.

## Error handling

- no consent -> 403 CAREER_PERSONALIZATION_DISABLED
- stale model/activity -> 409 CAREER_MODEL_CHANGED
- unexpected activity -> 409 CAREER_ACTIVITY_NOT_EXPECTED
- invalid response -> 400 INVALID_ACTIVITY_RESPONSE
- rate limit -> 429 RATE_LIMITED
- unavailable model -> 503 CAREER_MODEL_UNAVAILABLE

## Observability

Log server-side without storing sensitive response content where unnecessary:
- endpoint;
- model_version;
- activity key;
- latency;
- validation outcome;
- scoring success/failure.

Do not log raw free-text responses by default.

## Rollout proposal

Phase 0:
- owner-only hidden route
- no public navigation
- synthetic data only

Phase 1:
- internal/beta users
- explicit consent
- persistence enabled
- feedback captured

Phase 2:
- broader user rollout after metrics/privacy review

## Production blockers

Before implementation:
1. approve draft schema;
2. approve retention/deletion policy;
3. approve consent copy;
4. extend export;
5. implement server routes;
6. add RLS/grants;
7. test migrations in isolated environment;
8. run end-to-end diagnostic tests;
9. review legal/privacy wording.
