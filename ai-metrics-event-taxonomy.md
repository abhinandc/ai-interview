# AI Metrics and Event Taxonomy

## 1) Purpose

Define a strict event contract for:

- Live assessment observability.
- Candidate AI-skill measurement.
- Interviewer decision support.
- Post-session analytics and benchmarking.

This taxonomy is designed for Supabase-backed ingestion into `public.analytics_events`.

---

## 2) Event Envelope (Required for All Events)

Each event must include:

- `event_name` (string)
- `event_version` (integer)
- `occurred_at` (ISO-8601 UTC timestamp)
- `session_id` (uuid, nullable only for pre-session events)
- `round_id` (uuid, nullable when not round-specific)
- `actor_type` (`candidate|interviewer|admin|assistant|system`)
- `actor_user_id` (uuid, nullable for system/assistant events)
- `correlation_id` (uuid for request chain)
- `payload` (json object)

Recommended envelope extensions:

- `client_ts` (client-side timestamp)
- `server_ts` (server receipt timestamp)
- `ui_surface` (`center_canvas|sidekick_sidebar|interviewer_console|admin_console`)
- `source` (`web|edge_function|worker`)

---

## 3) Event Naming Standard

Pattern:

- `<domain>.<entity>.<action>`

Examples:

- `auth.magic_link.requested`
- `session.round.started`
- `sidekick.message.sent`
- `score.dimension.assigned`

Versioning:

- Increment `event_version` when payload contract changes.
- Never repurpose an existing `event_name` with incompatible semantics.

---

## 4) Domain Events

## 4.1 Authentication and Session Entry

1. `auth.magic_link.requested`
- Trigger: interviewer/admin clicks `Send Link`.
- Payload:
  - `candidate_id`
  - `request_channel`
  - `requested_by_role`

2. `auth.magic_link.generated`
- Trigger: Supabase function creates magic link.
- Payload:
  - `candidate_id`
  - `expires_at`
  - `ttl_seconds`

3. `auth.magic_link.opened`
- Trigger: candidate opens link.
- Payload:
  - `candidate_id`
  - `user_agent`
  - `ip_region`

4. `auth.magic_link.consumed`
- Trigger: successful auth and session bind.
- Payload:
  - `candidate_id`
  - `session_id`
  - `consume_latency_ms`

5. `auth.magic_link.failed`
- Trigger: invalid/expired/reused link.
- Payload:
  - `candidate_id`
  - `failure_reason`
  - `attempt_count_window`

## 4.2 Live Session Lifecycle

1. `session.lifecycle.started`
2. `session.lifecycle.paused`
3. `session.lifecycle.resumed`
4. `session.lifecycle.completed`
5. `session.lifecycle.aborted`

Payload baseline:

- `session_status`
- `triggered_by_role`
- `reason` (for paused/aborted)

## 4.3 Round Lifecycle

1. `session.round.opened`
2. `session.round.timer_started`
3. `session.round.curveball_injected`
4. `session.round.submitted`
5. `session.round.timed_out`
6. `session.round.closed`

Payload baseline:

- `round_index`
- `round_name`
- `duration_seconds`
- `remaining_seconds` (where applicable)

## 4.4 Candidate Interaction Events

1. `candidate.input.changed`
- Payload:
  - `input_type` (`text|code|email|mcq|form`)
  - `char_delta`
  - `autosave_triggered`

2. `candidate.input.autosaved`
- Payload:
  - `input_type`
  - `content_size_bytes`
  - `save_latency_ms`

3. `candidate.input.submitted`
- Payload:
  - `input_type`
  - `submission_version`
  - `is_final`

4. `candidate.ui.focus_changed`
- Payload:
  - `from_surface`
  - `to_surface`
  - `duration_ms`

## 4.5 Sidekick Messaging and Tools

1. `sidekick.message.sent`
- Payload:
  - `prompt_id`
  - `prompt_length_chars`
  - `prompt_tokens_est`
  - `round_id`

2. `sidekick.message.responded`
- Payload:
  - `prompt_id`
  - `model_id`
  - `latency_ms`
  - `output_tokens`
  - `policy_flags`

3. `sidekick.tool.invoked`
- Payload:
  - `tool_name`
  - `invocation_id`
  - `input_size_bytes`

4. `sidekick.tool.completed`
- Payload:
  - `tool_name`
  - `invocation_id`
  - `status`
  - `latency_ms`
  - `output_size_bytes`

5. `sidekick.policy.violation_detected`
- Payload:
  - `policy_version`
  - `rule_key`
  - `severity`
  - `message_id`

## 4.6 Scoring and TruthLog

1. `score.dimension.assigned`
- Payload:
  - `dimension`
  - `score`
  - `max_score`
  - `confidence`
  - `rubric_clause`

2. `score.evidence.attached`
- Payload:
  - `score_card_id`
  - `evidence_source`
  - `snippet_length`

3. `score.total.calculated`
- Payload:
  - `total_score`
  - `dimension_breakdown`
  - `confidence`

4. `gate.decision.issued`
- Payload:
  - `decision` (`proceed|caution|stop`)
  - `rationale`
  - `confidence`

## 4.7 Reliability and Failure Events

1. `reliability.reconnect.started`
2. `reliability.reconnect.succeeded`
3. `reliability.reconnect.failed`
4. `reliability.timer.drift_detected`
5. `reliability.model.fallback_triggered`
6. `reliability.autosave.failed`

Payload baseline:

- `error_code` (where applicable)
- `duration_ms`
- `recovery_action`

## 4.8 Admin and Governance Events

1. `admin.model.added`
2. `admin.model.updated`
3. `admin.model.deactivated`
4. `admin.policy.version_activated`
5. `admin.policy.rule_changed`

Payload baseline:

- `model_id` or `policy_version_id`
- `changed_fields`
- `change_reason`

---

## 5) Derived Metrics (Dashboard Contract)

## 5.1 Session-Level AI Fluency Metrics

1. `prompt_clarity_score`
- Definition: weighted score of prompt specificity, context completeness, and ambiguity rate.
- Inputs:
  - `sidekick.message.sent`
  - annotation outputs from prompt-quality classifier

2. `prompt_iteration_quality`
- Definition: quality delta between sequential prompts for the same task intent.
- Inputs:
  - prompt thread grouping via `correlation_id`

3. `tool_selection_precision`
- Definition: fraction of tool calls that were necessary and produced useful output.
- Inputs:
  - `sidekick.tool.invoked`
  - `sidekick.tool.completed`
  - evaluator labels

4. `hallucination_recovery_index`
- Definition: normalized score of detection and correction after incorrect AI outputs.
- Inputs:
  - flagged assistant responses
  - subsequent candidate edits and verification behavior

5. `ai_dependency_ratio`
- Definition: proportion of final answer text directly accepted from assistant output.
- Inputs:
  - content diff between assistant response and final submission

6. `verification_rigor_score`
- Definition: evidence of tests/checks/validation after AI suggestions.
- Inputs:
  - candidate actions
  - test execution logs
  - round output artifacts

7. `time_to_first_valid_outcome`
- Definition: elapsed time between round open and first rubric-valid submission milestone.
- Inputs:
  - `session.round.opened`
  - `candidate.input.submitted`
  - rubric validator

8. `candidate_ownership_score`
- Definition: degree to which final deliverable reflects candidate reasoning and edits.
- Inputs:
  - assistant-to-final text overlap
  - justification statements
  - evaluator signals

## 5.2 Reliability Metrics

1. `autosave_success_rate`
2. `reconnect_success_rate`
3. `fallback_activation_rate`
4. `timer_drift_incidents_per_100_sessions`

---

## 6) Data Quality Rules

Required quality checks:

- Event ingestion must reject payloads missing required envelope fields.
- `occurred_at` cannot be more than 10 minutes in the future.
- Duplicate events with same `event_name`, `correlation_id`, and millisecond timestamp must dedupe.
- Unknown `event_name` values must route to quarantine stream.

Completeness thresholds:

- Session analytics considered complete only if all mandatory lifecycle events exist.
- Scorecards are invalid when `score.evidence.attached` count is zero for any scored dimension.

---

## 7) Privacy and Compliance Rules for Events

Rules:

- Do not log secrets or raw auth tokens.
- Mask direct PII in free-text payload fields.
- Classify prompt/response events with sensitivity tags.
- Restrict raw prompt visibility to interviewer/admin roles per RLS.

Retention guidance:

- Raw high-volume interaction events: 90 days hot, archive thereafter.
- Scoring and evidence events: retain according to hiring policy window.
- Audit/governance events: retain longer than operational telemetry.

---

## 8) Recommended Supabase Artifacts

Implementation artifacts:

- `public.analytics_events` table with indexes on `session_id`, `event_name`, and `occurred_at`.
- Materialized views for session summaries and AI-fluency metrics.
- Scheduled refresh jobs for dashboard views.
- Edge Function middleware that enforces event schema before insert.

---

## 9) Minimum Instrumentation Checklist

Must instrument before launch:

1. Magic-link event chain (`requested` -> `generated` -> `opened` -> `consumed/failed`).
2. Round lifecycle events for every round.
3. Candidate submit/autosave events.
4. Sidekick prompt/response/tool events.
5. Score assignment and evidence attachment events.
6. Gate decision event with confidence and rationale.
7. Reliability events for reconnect, timer drift, and model fallback.
8. Admin governance events for model and policy changes.
