# CodeZero Career Guidance — Design v0.1

Status: design only. Do not migrate to production yet.

## Product rule

Career Guidance must remain independent from the current programming curriculum. The generic chain is:

`area -> skill -> activity -> signal -> dimension -> route -> recommendation`

Recommendations are advisory, multi-route, explainable and user-correctable.

## Initial dimensions

- technical_problem_solving
- customer_orientation
- commercial_persuasion
- organization_execution
- analysis_precision
- explanatory_communication
- ambiguity_tolerance
- leadership_coordination
- autonomy
- relational_technical_preference

## Signal weighting

Default signal weights:

- observed behavior: 1.00
- performance evidence: 1.00
- post-activity preference: 0.60
- initial self-report: 0.35

A dimension is preliminary until it has at least 3 signals from at least 2 activities and at least one behavioral/performance signal.

```text
dimension_score =
  weighted_average(
    normalized_value
    * signal_weight
    * recency_factor
    * confidence_factor
  )
```

Route affinity:

```text
route_affinity =
  sum(dimension_score * route_dimension_weight)
  / sum(route_dimension_weight)
```

Affinity and confidence must be shown separately.

## Proposed data model

No production migration should be created until dimensions, first routes, onboarding activities and privacy text are approved.

```sql
career_dimensions
career_routes
career_route_dimension_weights
career_activities
career_activity_signals
career_user_signals
career_user_dimension_scores
career_user_route_scores
career_user_feedback
career_goals
```

All user-specific tables must use RLS.

## MVP 0

Start with four routes:

1. Development
2. Technical Support
3. Customer Support
4. Onboarding / Implementation

Build eight short activities and a deterministic scoring engine. No AI is required.

At the end, show:

- top 3 routes;
- affinity percentage;
- confidence level;
- observable reasons;
- user feedback controls;
- option to explore any other route.

## Privacy constraints

Do not infer health, mental state or sensitive personality traits. Do not use camera/microphone-based emotion analysis.

Collect only product-learning evidence necessary for recommendations.

## Next design tasks

1. Finalize 6–8 dimensions for MVP.
2. Design 8 onboarding activities.
3. Create route-to-dimension weight matrix.
4. Define normalization rules per activity.
5. Write consent/privacy copy.
6. Run fictional-user simulations before any production schema.
