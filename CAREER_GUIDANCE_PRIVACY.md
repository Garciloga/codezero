# Career Guidance Privacy & Consent v0.1

Status: product/legal draft only. Requires professional legal review before production.

## Consent copy

CodeZero may use activity inside the platform — such as tasks chosen, results, retries, declared enjoyment and learning progress — to suggest professional areas and roles worth exploring.

Recommendations:
- are advisory, not diagnoses;
- can change over time;
- never block content;
- can be ignored or corrected;
- do not determine whether someone is "fit" or "unfit" for a profession.

Personalization should be optional and refusing it must not restrict access to the learning product.

## Data used

When Career Guidance is enabled:
- completed activities;
- outcomes/retries;
- voluntary choices;
- defined performance signals;
- declared enjoyment;
- routes explored;
- user feedback on recommendations;
- optional declared work experience.

## Data not used

Do not infer:
- physical or mental health;
- emotion through camera/microphone;
- ideology, religion, sexual orientation or other sensitive traits;
- personality typologies as scientific truth;
- off-platform information the user did not choose to provide.

## User controls

Users should be able to:
- see why a recommendation appears;
- mark it as representative / not representative / unsure;
- explore any route regardless of ranking;
- disable future personalized recommendations;
- export Career Guidance data once production persistence exists.

## Data minimization

Prefer storing:
- activity id;
- signal/dimension;
- normalized value;
- source type;
- timestamp;
- evidence needed for explanation/audit;
- model version.

Avoid unnecessary free text and never request secrets or sensitive personal data.

## Model versioning

Every production score must record:
- model_version;
- input signal references;
- calculation timestamp.

Weight changes must not silently rewrite historical scores.

## Before production

1. Update Privacy Notice.
2. Validate consent/legal basis in Mexico.
3. Define retention/deletion rules.
4. Confirm handling for minors.
5. Extend data export to Career Guidance.
6. Add audit/version history for scoring models.
