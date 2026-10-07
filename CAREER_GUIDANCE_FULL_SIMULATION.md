# Career Guidance Full Simulation v0.3

Status: design validation only. No production schema changes.

This expands the Career Guidance model to all positions named in the product specification.

## Position catalog

1. Developer / Programmer
2. Technical Support L1
3. Technical Support L2
4. Technical Support L3
5. Customer Support Specialist
6. Onboarding / Implementation Specialist
7. Customer Success Manager
8. Account Manager
9. Key Account Manager
10. SDR / BDR
11. Account Executive / Sales Executive
12. Pre-sales / Solutions Consultant
13. Project Manager
14. Administrative Assistant
15. Executive Assistant
16. Manager / Team Lead

## Additional discriminating signals

The first model used broad dimensions only. v0.3 adds role-specific work signals to reduce artificial collisions:

- software_building
- escalation_depth
- proactive_value
- prospecting
- closing
- strategic_accounts
- executive_support
- people_management

These complement, rather than replace, the general dimensions.

## Synthetic test design

32 fictional profiles:
- 16 canonical profiles, one per position
- 16 borderline profiles blending each position with a neighboring role

This is a mathematical consistency test, not empirical validation of career outcomes.

## Canonical results

All 16 canonical profiles ranked their expected position first.

This is a sanity check only because the synthetic profiles are derived from the same weight matrix.

## Borderline results

| Borderline profile | Top 3 |
| --- | --- |
| Developer ↔ TS L3 | Developer 78.9 · TS L2 70.2 · TS L3 68.8 |
| TS L1 ↔ Customer Support | Customer Support 71.5 · TS L1 68.2 · TS L2 57.7 |
| TS L2 ↔ Pre-sales | TS L2 71.1 · Pre-sales 70.7 · TS L1 66.8 |
| TS L3 ↔ Developer | Developer 78.3 · TS L2 72.2 · TS L3 71.3 |
| Customer Support ↔ CSM | Customer Support 78.5 · CSM 70.7 · AM 58.5 |
| Onboarding ↔ PM | PM 75.6 · Onboarding 73.9 · Customer Support 57.0 |
| CSM ↔ AM | CSM 75.9 · AM 74.4 · Customer Support 67.4 |
| AM ↔ KAM | AM 77.6 · KAM 74.1 · CSM 68.0 |
| KAM ↔ AE | KAM 68.1 · AM 67.2 · AE 64.7 |
| SDR ↔ AE | SDR 77.4 · AE 72.2 · AM 54.9 |
| AE ↔ KAM | AE 67.5 · AM 65.8 · KAM 64.9 |
| Pre-sales ↔ TS L2 | Pre-sales 72.0 · TS L2 69.5 · TS L1 65.6 |
| PM ↔ Onboarding | PM 77.2 · Onboarding 72.3 · Manager 56.8 |
| Admin ↔ Executive Assistant | Admin 78.0 · Executive 72.8 · PM 57.6 |
| Executive Assistant ↔ PM | PM 76.3 · Executive 73.0 · Admin 68.5 |
| Manager ↔ PM | PM 79.4 · Manager 74.1 · Executive Assistant 61.6 |

## Stability test

Each canonical profile was perturbed with approximately ±7% noise, 500 times per position.

- 15 positions retained expected top-1 in 100% of perturbations.
- Technical Support L3 retained top-1 in 99.2%.
- All 16 expected positions remained in the top-3 in 100% of perturbations.

Again, this measures matrix stability, not real-world validity.

## Product rules derived from the simulation

### Practical tie
If two positions differ by <5 points:
- treat them as effectively tied
- show compatible paths, not a fake precise ranking

### Confidence
Keep affinity separate from confidence.

Suggested bands:
- <0.35 preliminary
- 0.35–0.64 medium
- >=0.65 strong

### Experience gate
Some roles require an additional evidence gate:
- Technical Support L3
- Key Account Manager
- Executive Assistant in high-complexity contexts
- Manager / Team Lead

Do not infer seniority from affinity alone.

### Management guardrail
Management remains a progression route, not an entry-level recommendation from the initial diagnostic.

### Position families for UI
- Engineering: Developer
- Technical Support: L1–L3
- Customer Service: Customer Support
- Implementation: Onboarding / Implementation
- Customer Success: CSM
- Account Management: AM / KAM
- Commercial: SDR / AE / Pre-sales
- Projects: Project Manager
- Assistance: Administrative / Executive Assistant
- Leadership: Manager / Team Lead

The engine may score all 16 internally while the UI first shows families plus top 3 positions.

## Remaining role-separation activities

Before production, add targeted activities to separate:
- CSM vs AM
- AM vs KAM
- AE vs KAM
- Onboarding vs PM
- Administrative vs Executive Assistant
- Tech Support L2 vs Pre-sales

## Next step

Define these targeted discriminator activities plus a lightweight experience_gate that does not require a full CV before creating production tables.
