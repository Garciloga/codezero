# Career Guidance Diagnostic Activities v0.1

Status: design only. Do not ship to production yet.

## Goal

Generate initial behavioral evidence in 10–15 minutes without turning the experience into a personality test.

Rules:
- no single answer determines a route;
- behavior/performance evidence weighs more than self-report;
- show multiple route affinities;
- affinity and confidence are separate;
- recommendations are explainable and user-correctable;
- no camera/microphone/emotion inference.

## Eight activities

### 1. Prioritize under pressure
Scenario: four simultaneous tasks: blocked customer login, report due tomorrow, colleague asks non-urgent help, minor internal-page bug.

Observe:
- organization/execution
- customer orientation
- analysis/precision
- ambiguity tolerance

Capture:
- ranking
- time to confirm
- reorder count
- short rationale

### 2. Diagnose a failure
Scenario: integration returns 401, internet works, another user at same company is unaffected.

Possible first actions include:
- inspect token/credentials
- confirm affected user
- review permissions/role
- inspect logs
- destructive/restart actions as distractors

Observe:
- technical problem solving
- analysis/precision
- autonomy
- explanatory communication

### 3. Respond to an upset user
Scenario: user says exporting data has failed for an hour.

Good response characteristics:
- acknowledges impact
- avoids unsupported promises
- requests/uses concrete information
- gives next step
- avoids defensiveness

Observe:
- customer orientation
- explanatory communication
- ambiguity tolerance
- organization

### 4. Organize a mini project
Scenario: prepare a customer onboarding by Friday with missing data, pending integration and three participants.

Task:
- order six work cards
- identify two parallelizable tasks

Observe:
- organization/execution
- analysis/precision
- coordination
- ambiguity tolerance

### 5. Explain a feature
Scenario: explain "What is an API?" to a non-technical person in at most 280 characters.

Observe:
- explanatory communication
- customer orientation
- analysis/precision
- relational-vs-technical preference

### 6. Handle an objection
Scenario: prospect says they do not want to pay for something they may not use.

Good next action:
- ask what result they want
- gather context before recommending a plan
- avoid false urgency/discounts

Observe:
- commercial persuasion
- customer orientation
- explanatory communication
- ambiguity tolerance

### 7. Find a data anomaly
Scenario:
- Acme · Starter · 12 users · $249
- Beta · Pro · 45 users · $699
- Gamma · Free · 3 users · $699
- Delta · Starter · 18 users · $249

Task:
- identify suspicious row
- explain what to verify before editing

Observe:
- analysis/precision
- technical problem solving
- autonomy
- organization

### 8. Choose what to do next
User freely chooses:
A. solve a small bug
B. help a customer
C. organize an implementation plan
D. persuade a skeptical prospect

Afterward:
- enjoyment 1–5
- desire to do similar work 1–5
- short why

Observe:
- voluntary choice
- declared preference
- time spent voluntarily
- enjoyment
- professional intent

## Initial activity-to-dimension weights

| Activity | Tech | Customer | Commercial | Organization | Analysis | Communication | Ambiguity | Leadership | Autonomy |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 Prioritize | .2 | .7 | 0 | 1.0 | .6 | .3 | .7 | .3 | .4 |
| 2 Diagnose | 1.0 | .2 | 0 | .4 | 1.0 | .4 | .6 | 0 | .8 |
| 3 Upset user | .1 | 1.0 | .2 | .5 | .3 | 1.0 | .7 | 0 | .3 |
| 4 Mini project | .2 | .5 | 0 | 1.0 | .8 | .5 | .7 | .8 | .5 |
| 5 Explain API | .4 | .8 | 0 | .2 | .5 | 1.0 | .3 | 0 | .4 |
| 6 Objection | 0 | .8 | 1.0 | .3 | .3 | .8 | .8 | .2 | .5 |
| 7 Data anomaly | .7 | .1 | 0 | .5 | 1.0 | .2 | .4 | 0 | .8 |
| 8 Free choice | option | option | option | option | .2 | .2 | .2 | .1 | .7 |

## First four MVP route weights

Dimensions:
- technical_problem_solving
- customer_orientation
- commercial_persuasion
- organization_execution
- analysis_precision
- explanatory_communication
- ambiguity_tolerance
- leadership_coordination
- autonomy

| Route | Tech | Customer | Commercial | Organization | Analysis | Communication | Ambiguity | Leadership | Autonomy |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Development | 1.0 | .1 | 0 | .4 | 1.0 | .3 | .6 | .1 | .9 |
| Tech Support | .9 | .7 | .1 | .6 | .9 | .8 | .7 | .1 | .8 |
| Customer Support | .2 | 1.0 | .1 | .7 | .5 | 1.0 | .7 | .1 | .5 |
| Onboarding | .5 | .9 | .2 | 1.0 | .6 | .9 | .8 | .5 | .7 |

Use normalized weighted average. Do not expose these raw weights to end users.

## Confidence

Confidence should grow with:
- number of signals
- activity diversity
- cross-signal consistency
- real performance evidence

Suggested MVP confidence bands:
- 0–0.34: preliminary
- 0.35–0.64: medium
- 0.65–1.00: strong

Do not display "certainty".

## MVP guardrail

Do not recommend Management as a top route during initial diagnostic. It can appear later as a future progression once enough evidence exists.

## Next step

Create fictional user simulations before production schema:
- technically strong / low customer preference
- strong customer + communication / low tech
- balanced tech + customer
- commercial / persuasion profile
- organized but low confidence due sparse evidence
