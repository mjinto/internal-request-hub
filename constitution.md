# Internal Request Hub constitution

This is the team's shared rule source. `CLAUDE.md` is the agent's entry
point and points here for the rules themselves; this file does not
duplicate verified commands or file-level architecture detail already
covered by `docs/domain.md` and `docs/architecture.md` — it cites them
instead. `constitution.md` is this project's own convention; it has no
special automatic-loading behavior in Claude Code.

Each section below separates **existing facts** (what the application
already does, drawn from the reviewed `docs/domain.md` and
`docs/architecture.md`) from **rules the team agrees to follow** going
forward. A fact describes current behavior; a rule is a commitment the
team is making. Where a rule simply continues an existing fact (e.g.
"keep using parameterized SQL"), both are stated so it's clear the rule
isn't inventing new behavior.

## 1. Architecture and engineering

**Existing facts** (`docs/architecture.md` §§1, 4–5; `docs/domain.md` §§2, 4):
- The stack is React + Vite on the client, Express 5 + SQLite
  (`node:sqlite`) on the server, split into npm workspaces.
- Each server module has one job: `db.js` (schema/seed), `current-user.js`
  (identity resolution), `requests.js` (visibility + queries),
  `http-errors.js` (error shape), `app.js` (routing only).
- Every existing query uses `db.prepare(...).run()/.get()` with bound
  parameters; none interpolate request- or user-supplied values.
- Authorization is enforced only on the server: identity validity, then
  row-level ownership/role/status checks. The client holds no
  enforcement logic of its own.
- Denials use `HttpError` (status + machine-readable `code`) formatted by
  `errorResponse()`; this is the only error-shaping mechanism in the app.

**Rules the team agrees to:**
- Keep the existing JavaScript, React, Express and SQLite stack.
- Keep HTTP handlers thin; keep database behavior in focused modules
  (`requests.js`, `db.js`, etc.), not in `app.js`.
- Use parameterized SQL for every query, and enforce access/state rules
  on the server — never rely on the client to hide an action as the
  actual control.
- Preserve the existing API error shape (`HttpError`/`errorResponse`)
  and the existing visibility behavior (employee → own requests,
  reviewer → assigned requests, administrator → all requests). A new
  feature may add a new error `code`; it must not invent a new error
  shape or a new visibility rule without going through intent → spec.

## 2. Workshop boundaries

**Existing facts** (`docs/domain.md` §§2, 7):
- Identity is simulated via a "Viewing as" selector and a plain
  `currentUserId` value — there is no login, session, or token.
- Notifications, attachments, real authentication, and multi-level
  approval are not implemented and are explicitly out of scope for the
  running application today.

**Rules the team agrees to:**
- Keep simulated identity. No real authentication, notifications, or
  external services are part of this exercise.
- Keep each change within its assigned exercise. Cancellation,
  approval/rejection, and history are separate exercises — implementing
  one does not license scope-creep into another; a reason to touch a
  different exercise's area is a reason to stop and return to that
  exercise's own intent/spec, not to expand the current one.

## 3. Verification and ownership

**Rules the team agrees to:**
- Map every acceptance example to a verification step, including denied
  and invalid actions — not just the success path.
- Run tests, lint, and build, and inspect the actual diff, before
  calling any checkpoint or change complete. A command that wasn't run
  is not a passing command.
- Record who reviews each change and any exception to this process.
  Never invent or assume an approval that wasn't actually given — read
  the approval record in the artifact, don't infer one from a general
  sense that things "went fine."

## 4. Spec-driven workflow

Every feature in this repo goes through the same three artifacts, in
the same order, before any implementation diff exists. The full
convention — artifacts, owners/approvers, the gate rule, the optional
issue-driven entry point, and the diff/review feedback loop — is
written out in [`training/work/README.md`](training/work/README.md);
this section states it as the team's binding rule, not as a how-to.

- **Home.** Each feature gets its own folder under
  `training/work/<feature-name>/`. `training/work/` is the single home
  for all feature work in this repo — there is no separate `specs/`
  folder.
- **Artifacts, in strict order.** `intent.md`, then `spec.md`, then
  `plan.md`.
  - `intent.md` — problem, outcome, scope. The originator drafts it;
    the **product owner** accepts it. When the feature originates from
    a GitHub issue, the originator may use the `draft-intent-from-issue`
    skill to fetch the issue and produce a draft `intent.md`; that
    skill's output is always a draft — it must not mark the intent
    accepted, and it must record the issue link in `intent.md` as the
    artifact's source. The product owner still accepts it separately,
    exactly as with a hand-drafted intent.
  - `spec.md` — behavior, design, constraints. The engineer drafts it;
    the **reviewer** approves it.
  - `plan.md` — implementation steps and checks. The engineer owns it;
    the **reviewer** accepts it.

  **Deferred for now:** splitting this single reviewer role into a
  distinct technical lead (spec approver) and technical reviewer (plan
  approver) is a future refinement, not a current rule — one reviewer
  may approve both `spec.md` and `plan.md` for a feature today. Revisit
  this once reviewer capacity or workshop pairing makes a split useful.
- **The gate rule.** An artifact for a phase is drafted only once the
  previous phase's artifact in that same folder has been explicitly
  approved by its named approver. Do not draft the next phase's
  artifact, and do not invent or assume an approval that wasn't
  actually given.
- **Diff and review, after `plan.md` is approved.** Implementation then
  proceeds to a diff, then a review of that diff. Every diff gets an
  authorization review — the `authorization-reviewer` agent — and, once
  `plan.md` has an Acceptance-to-evidence map, a verification check
  against it — the `verify-checkpoint` skill — rather than an ad hoc
  read-through. (Invocation details — paths, when to run each one,
  arguments — are in `CLAUDE.md`, not here.) `/code-review` and
  `/security-review` remain available for concerns outside the
  authorization boundary (general correctness, reuse, simplification,
  and broader security review).
- **Where findings go.** A review finding returns to whichever earlier
  decision needs correction, never forward to a new artifact: a defect
  in the implementation returns to the diff for a fix; an unsuitable
  approach returns to `plan.md` for revision; unclear behavior returns
  to `spec.md` for clarification. Record which stage a finding was
  routed back to.
- **Recording decisions.** Record the actual approval decision and
  approver for each phase transition inside the artifact itself (or a
  short note beside it). Never mark a phase approved on the agent's own
  authority.
- **Artifacts, not chat history.** These saved records are what carry
  decisions forward between sessions. Do not rely on replaying prior
  chat history to reconstruct a decision — read the artifact instead.

## Status of this document

**Approved** by Jinto Thomas on 2026-10-07.

None of the rules above have technical enforcement behind them today —
no CI check or branch rule currently requires the gate rule, the named
approvers, or the review tools to have actually run; they rely on the
people following this convention. Treat every "accepted"/"approved"
label elsewhere in this repo's artifacts as a human decision this
document describes, not one this document — or any agent — can grant on
its own.
