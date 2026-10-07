# Career Guidance Retention & Deletion Draft v0.1

Status: product/privacy draft. Requires legal review before production.

## Goals

- collect the minimum data needed for recommendations;
- keep enough history to explain and reproduce results;
- give the user meaningful controls;
- avoid retaining unnecessary free text;
- make deletion technically possible before public rollout.

## Data classes

### 1. Consent & preferences
Examples:
- personalization_enabled
- consent_version
- consented_at
- disabled_at

Proposed retention:
- keep while account exists;
- retain an audit-safe minimal record if required to demonstrate consent history, subject to legal review.

### 2. Activity attempts
Examples:
- activity id
- started/completed timestamps
- structured response
- limited metadata

Proposed retention:
- active account: retain while useful for recalculation and user history;
- after Career Guidance deletion request: delete or irreversibly detach user-owned attempt data unless a legal/security obligation requires otherwise.

### 3. Derived signals
Examples:
- normalized_value
- signal_type
- dimension
- evidence summary
- model_version

Proposed retention:
- retain while personalization is enabled;
- when personalization is disabled: stop creating new signals;
- deletion request: delete user-linked signals.

### 4. Scores and recommendations
Examples:
- dimension score
- route affinity
- confidence
- experience gate
- explanation
- model_version

Proposed retention:
- keep latest and optional historical snapshots while feature is enabled;
- deletion request: delete user-linked scores.

### 5. Experience evidence
Examples:
- years bands
- autonomy band
- complexity band
- selected booleans

Proposed retention:
- only while needed for Experience Gate;
- user can replace/update;
- deletion request: delete.

### 6. Free text
Default policy:
- avoid storing unless required by the activity;
- enforce length limits;
- do not use raw text in logs;
- do not store secrets or sensitive personal information.

## Disable vs delete

### Disable personalization
Effect:
- no new Career Guidance signals;
- no new recalculations based on activity;
- course access unaffected;
- existing history remains until user requests deletion or account policy removes it.

### Delete Career Guidance history
Effect target:
- delete career_user_feedback;
- delete career_user_route_scores;
- delete career_user_dimension_scores;
- delete career_user_signals;
- delete career_user_activity_attempts;
- delete career_experience_evidence;
- reset/disable career_user_preferences while retaining only legally necessary consent audit fields if required.

Deletion must be server-side and transactional where possible.

## Account deletion

Career Guidance user-owned rows use FK ON DELETE CASCADE in the draft schema so account deletion can remove dependent rows.

Before production, verify:
- every user-owned table is covered;
- exports include Career Guidance;
- deletion tests cover all tables.

## Operational logs

Do not put raw activity answers in:
- Vercel logs;
- GitHub Actions logs;
- admin audit metadata.

Allowed operational fields:
- user id when necessary for server operation;
- activity key;
- model_version;
- success/error code;
- latency;
- event timestamp.

Review pseudonymization later if scale requires analytics.

## Aggregated analytics

If aggregated metrics are retained after user-level deletion:
- they must not reasonably identify the user;
- do not retain raw answer payloads;
- define aggregation threshold before launch.

## Proposed product controls

Career Guidance settings:
- Personalization: On/Off
- Download my Career Guidance data
- Delete my Career Guidance history

Deletion UI must:
1. explain what will be deleted;
2. require explicit confirmation;
3. perform server-side deletion;
4. return completion status;
5. write non-sensitive admin/security audit if appropriate.

## Initial retention recommendation

Until validated with legal/privacy review:
- no permanent retention duration claim in public copy;
- avoid “we keep X for Y days” until technically enforced;
- implement deletion first;
- document actual system behavior accurately.

## Test requirements

Before public rollout:
- disabling prevents new signals;
- deletion removes all user-linked Career Guidance rows;
- account deletion cascades correctly;
- export returns Career Guidance data;
- logs do not include raw responses;
- old model-version scores remain reproducible while present.

## Legal review questions

- consent/legal basis under Mexican privacy law;
- treatment of minors;
- required consent records;
- retention requirements;
- whether derived professional-affinity data requires special notice;
- handling of anonymized analytics after deletion.
