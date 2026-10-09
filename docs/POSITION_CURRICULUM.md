# Formation by role

SUG-26/27: `/positions` starts with the job and situational diagnostic. `/dashboard` shows the job and the existing competency matrix before the optional technical path. Technical lesson IDs, existing progress and the original CS pilot are preserved.

Customer Success: 15 levels, 92 application lessons, two formative decisions each (184), 15 situational assessments with five questions/keys each (75), two projects at levels 8 and 15. The existing 29 authored common/CS units provide referenced teaching, case data, deliverable templates, examples and feedback. The 92 application titles, specific decision criteria, usable deliverable specifications, 184 formative prompts and level sequence are new; they are not 92 independent newly researched source texts. Canonical Faro facts remain unchanged. The final project adds an explicitly fictional portfolio.

The sequence is `lib/position-curricula/customer-success.json`; `cs-lesson-applications.json` authors a specific criterion and evidence requirement for every lesson, in four languages. The shared application framework builds the process, template, two keyed decisions and explanatory feedback without copying common teaching. Level 1 uses a separately labelled fictional Orion financial cohort; it never changes Faro facts. Keep source references intact when extending a lesson; do not duplicate common teaching. All application titles and new UI copy exist in ES/EN/PT/FR. Teaching uses the existing translated references. Content remains pending editorial review and learner calibration. This delivery is not a claim of editorial validation, 92 distinct cases or native translation review.

The diagnostic is optional and records recognition evidence through the existing matrix; it never awards level 4 by itself. Human review and sustained evidence control validated competency levels. The diagnostic recommends the weakest evidenced competency; it cannot block progression.

`codezero_private.position_assessments` holds answer keys and progression metadata. No client can read it or call the grading RPC. The RPC verifies the actor, organization, entitlement, previous assessment, all required lesson submissions and human project approval. Submitted/self-reviewed projects never unlock assessments. Latest human review, critical errors and review workflow state determine approval. Assessment attempts consume existing exam quota atomically. Replays do not consume extra quota. Optional technical material is not in any prerequisite query.

SUG-28 phase 1: eight `*.draft.json` files under `docs/position-curricula` provide hidden outlines. They are not published to learners. Phase 2 must follow publication and verification of Customer Success and complete each role with its own cases, exercises, assessments and rubrics; do not publish these skeletons as complete courses.

## Clone checklist

1. Define role-specific situations, sequence and 92 application titles. Reuse the common nine units by reference.
2. Author two decisions with explanatory feedback per lesson and five complete keyed decisions per assessment.
3. Define two projects, fictional data and human scoring criteria. Reuse project review scope/flows.
4. Add diagnostic and optional technical support outside the 92 required lessons.
5. Keep draft material out of `POSITION_ITEMS` and production seeds until the curriculum is complete.
6. Run integrity, scope, quota, progression and browser checks, plus all existing CI.
7. Publish and verify the exact production SHA before moving the original Notion suggestion to Roadmap/Hecho.
