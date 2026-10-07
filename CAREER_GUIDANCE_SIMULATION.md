# Career Guidance Affinity Simulation v0.1

Status: design validation only. No production schema changes.

## Purpose

Validate the first deterministic affinity model against fictional users before storing career-guidance data in production.

Routes in this simulation:
- Development
- Tech Support
- Customer Support
- Onboarding

## Route scores

### Profile A — technically strong
Inputs emphasize technical problem solving, analysis and autonomy.

Results:
- Development 78.2
- Tech Support 68.3
- Onboarding 60.2
- Customer Support 59.2

Interpretation: expected differentiation works.

### Profile B — customer + communication
Inputs emphasize customer orientation, communication, organization and ambiguity tolerance.

Results:
- Customer Support 76.7
- Onboarding 69.5
- Tech Support 67.1
- Development 59.1

Interpretation: expected differentiation works, but Support/Onboarding/Tech Support overlap substantially.

### Profile C — hybrid technical + customer
Inputs are strong across technical, customer, communication, analysis and autonomy.

Results:
- Customer Support 78.9
- Development 78.8
- Tech Support 78.6
- Onboarding 75.3

Interpretation: this is an intended multi-affinity case. The UI must not pretend a 0.1–3 point difference is meaningful.

### Profile D — commercial
Inputs emphasize commercial persuasion, communication, customer orientation and ambiguity tolerance.

Results within current route catalog:
- Customer Support 73.1
- Onboarding 68.2
- Tech Support 64.6
- Development 57.7

Interpretation: catalog limitation. The current MVP has no Sales or Account Management route, so the engine projects this user onto the nearest available routes.

Guardrail: if a strong dimension has poor route coverage, disclose that the catalog is incomplete rather than misclassifying the user.

### Profile E — organized, sparse evidence
Scores are similar across routes:
- Customer Support 62.8
- Onboarding 62.0
- Development 61.8
- Tech Support 61.2

Interpretation: affinity is not sufficiently discriminative and confidence should be low.

## Rules derived from simulation

### Practical tie
If two route affinities differ by less than 5 points:
- treat them as effectively tied;
- avoid “your best route is…” language.

### Insufficient evidence
If confidence < 0.35:
- show “preliminary profile”;
- avoid a single highlighted route;
- recommend more activities.

### Unrepresented route signal
If a dimension > 0.80 has low coverage in the current route catalog:
- surface the dimension;
- indicate a likely future route family;
- do not force-fit to an available route.

Examples:
- commercial persuasion -> future Sales / Account Management
- leadership/coordination -> future PM / Management

### Explainability minimum
Do not show a recommendation unless it can cite:
- at least 2 concrete pieces of evidence;
- at least 1 primary dimension;
- a human-readable explanation.

### User correction
“Does not represent me”:
- does not erase behavioral evidence;
- adds a correction signal;
- temporarily reduces recommendation strength;
- prompts another contrasting activity.

## Product conclusion

The v0.1 model is usable as a design base, but the product must recommend affinities rather than classify people.

The MVP may expose only four navigable routes while still maintaining a full dimension radar and surfacing “future route detected” signals for:
- Sales
- Customer Success
- Project Management
- Account Management

## Next validation step

Before production:
1. generate 20–30 synthetic profiles;
2. test extreme and contradictory profiles;
3. perturb scores slightly and inspect stability;
4. test missing evidence;
5. tune confidence thresholds;
6. only then approve the production schema and UI.
