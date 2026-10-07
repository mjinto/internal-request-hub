# Feature work: the spec-driven convention

This folder is the single home for all feature work in this repo —
there is no separate `specs/` folder. Each feature gets its own folder
here: `training/work/<feature-name>/`. This document describes the
convention; `constitution.md` at the repo root states it as the team's
binding rule.

## The three artifacts

Every feature produces three artifacts, in this order, before any
implementation diff exists:

| Artifact | Records | Drafted by | Approved by |
| --- | --- | --- | --- |
| `intent.md` | Problem, desired outcome, scope | Originator | Product owner |
| `spec.md` | Behavior, design, constraints | Engineer | Reviewer |
| `plan.md` | Implementation steps and checks | Engineer | Reviewer |

One reviewer may approve both `spec.md` and `plan.md` for now — splitting
this into a distinct technical lead (spec) and technical reviewer (plan)
is deferred, not a current rule.

Blank templates for all three are in
[`_templates/`](_templates/) — copy them into your feature folder
rather than writing an artifact from scratch.

## The gate rule

An artifact for a phase is drafted only once the previous phase's
artifact in the same folder has been **explicitly approved by its named
approver**. Do not draft `spec.md` before `intent.md` is accepted; do
not draft `plan.md` before `spec.md` is approved. Do not invent or
assume an approval that wasn't actually given — if an artifact's
Approval record says "pending," the next artifact doesn't exist yet.

Record the actual decision and approver for each phase transition
inside the artifact's own Approval record section (the templates have
one). These saved records — not replayed chat history — are what carry
the decision forward to the next session. If you're unsure whether
something was approved, read the artifact; don't assume from memory.

## Optional entry point: starting from a GitHub issue

When a feature originates from a GitHub issue, the originator may
invoke the `draft-intent-from-issue` skill (`<issue-reference>
<change-folder>`) to fetch the issue and produce a draft `intent.md`.
Its output is **always a draft**:
- it must not mark the intent accepted — the product owner still
  reviews and accepts it exactly as with a hand-drafted intent;
- it records the issue's link in `intent.md` as the artifact's source.

This entry point only ever produces `intent.md`. It does not draft
`spec.md` or `plan.md`, and it does not touch application code.

## After `plan.md` is approved: diff, then review

Once `plan.md` is accepted, implementation proceeds to a diff, then a
review of that diff:

- **Authorization review**, on every diff: the `authorization-reviewer`
  agent checks the diff against this repo's authorization boundary
  (identity resolution, ownership/role/status checks, denial error
  shape, parameterized SQL).
- **Verification**, once `plan.md` has an Acceptance-to-evidence map:
  the `verify-checkpoint` skill re-runs the real test/lint/build
  commands, invokes the authorization-reviewer agent, and confirms
  every row in the evidence map has real, currently-passing evidence —
  rather than trusting the plan's own claim that it does.
- `/code-review` and `/security-review` remain available for concerns
  outside the authorization boundary (general correctness, reuse,
  simplification, and broader security review).

(Exact invocation — paths, when to run each one, arguments — is in
`CLAUDE.md`, not here.)

### Where review findings go

A finding returns to whichever earlier decision needs correction, never
forward to a new artifact:

- a defect in the implementation → fixed in the diff;
- an unsuitable approach → `plan.md`, for revision;
- unclear or disputed behavior → `spec.md`, for clarification.

Record which stage a finding was routed back to. The templates each
have a "Findings routed back here" section for this.

## Templates

`_templates/` is the single, canonical location for feature-work
templates in this repo:
[`intent.md`](_templates/intent.md), [`spec.md`](_templates/spec.md),
[`plan.md`](_templates/plan.md), plus [`review.md`](_templates/review.md)
and [`release.md`](_templates/release.md) for the post-implementation
review and local release-verification steps. The older
`training/inputs/templates/` has been retired in favor of this folder;
nothing elsewhere in the repo should still point at that path.
