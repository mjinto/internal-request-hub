# Intent: Approve or reject an assigned request

Source issue: https://github.com/mjinto/internal-request-hub/issues/2 (#2)
Originator: Claude Code (drafted from GitHub issue #2)
Product owner (approver): Jinto Thomas
State: accepted

## Problem and desired outcome

Reviewers need to decide (approve or reject) requests assigned to them,
without being able to change requests owned by another reviewer. Today
this is entirely unimplemented: `docs/domain.md` §1 and §7 confirm the
application is "a read-only tracking and visibility tool" and that
"approving or rejecting a request" is explicitly not available to any
role — there is no status-transition code path anywhere in
`server/src/requests.js` or `server/src/app.js`. `docs/domain.md` §5
also notes the `reviewer comment` field already exists on a request
record and appears intended for exactly this purpose ("populated on
the one rejected example and empty elsewhere") but currently has no
way to be written by a real user.

The desired outcome, per the issue: the reviewer assigned to a
`Submitted` request can approve it, or reject it after entering a
comment, and that decision persists. Nobody else — not another
reviewer, not the requesting employee, not an administrator — can
decide the request on the assigned reviewer's behalf.

## Scope and constraints

**In scope, per the issue's confirmed rules and acceptance criteria:**

- Only the reviewer assigned to a request may approve or reject it
  (acceptance criteria 1, 2, 3).
- The request must currently be in `Submitted` status to be decided
  (acceptance criterion 5). This matches the status set confirmed in
  `CLAUDE.md` ("Request statuses are `Draft`, `Submitted`, `Approved`,
  `Rejected`, `Cancelled`").
- Rejecting a request requires the reviewer to enter a comment
  (acceptance criterion 2). Approving does not require a comment —
  the issue only ties the comment requirement to rejection.
- A successful decision persists the new status (acceptance
  criterion 1, 2, 6).
- A failed/denied decision attempt leaves the stored request
  completely unchanged and returns a useful error (acceptance
  criterion 6).
- Neither an unrelated reviewer, an employee, nor an administrator may
  decide a request — this is explicit in acceptance criteria 3 and 4,
  not left to inference.
- **Resolved (product owner, 2026-10-07):** a client UI is in scope —
  approve/reject controls on the request detail page, visible only to
  the assigned reviewer on a `Submitted` request — same as the
  `cancel-request` precedent. This resolves open question 1 below; the
  server enforces eligibility unconditionally regardless of what the
  client shows, per the non-negotiable constraints below.

**Non-negotiable constraints, per `CLAUDE.md` and `docs/architecture.md`:**

- Authorization must be enforced on the server, never just hidden in
  the UI (`docs/architecture.md` §5: the client "holds no enforcement
  logic of its own"; this must not change).
- Identity stays simulated (`currentUserId`); this feature does not
  add real authentication (`CLAUDE.md` Architecture, "Boundaries to
  preserve").
- Visibility/ownership checks belong in `requests.js`, following the
  existing pattern of role-based `visibilityClause` (list) and
  ownership/status-checked mutation already established by
  `cancelRequest` in the same file (`CLAUDE.md` Architecture, and
  `training/work/cancel-request/intent.md`), not in the client.
- Use parameterized SQL for every query (`CLAUDE.md` Architecture:
  "Use parameterized SQL for every query — never interpolate
  request- or user-supplied values into a query string").
- Use the existing error shape (`HttpError` + `errorResponse`,
  `server/src/http-errors.js`) for denied/invalid decision attempts,
  consistent with the established `REQUEST_FORBIDDEN` /
  `REQUEST_NOT_FOUND` pattern in `server/src/requests.js`, and with
  the `409`-for-wrong-status precedent (`REQUEST_NOT_CANCELLABLE`) set
  by the accepted `cancel-request` feature.

**Explicitly out of scope**, per the issue:

- Reviewer reassignment.
- Multi-level approvals.
- Notifications.
- Reopening a request that has already been decided.

## Open questions

The issue leaves the following ambiguous. Question 1 is resolved above
(product owner, 2026-10-07); questions 2–4 are implementation detail
explicitly left for the engineer to settle in `spec.md`, not blockers
to accepting this intent:

1. ~~**Client UI scope.**~~ Resolved: in scope (see Scope and
   constraints above).
2. **Error status/code for criteria 3 vs. 5.** The issue says both
   "an unrelated reviewer cannot decide the request" and "a
   non-submitted request cannot be decided again" must return "a
   useful error," but doesn't specify the HTTP status or machine
   code for either case. A precedent exists in the accepted
   `cancel-request` feature (403 `REQUEST_FORBIDDEN` for wrong owner,
   409 `REQUEST_NOT_CANCELLABLE` for wrong status) but applying the
   same split here is a spec-level decision, not stated in this issue.
3. **Rejection comment validation.** The issue requires "a reviewer
   comment" on rejection but doesn't say whether an empty/whitespace-
   only comment is acceptable, or whether there's a length limit.
4. **Single decision endpoint vs. two.** The issue describes two
   actions (approve, reject) without specifying whether these are one
   endpoint with an action/comment payload or two separate endpoints —
   an implementation detail left for spec.md.

## Approval record
Decision: accepted
Approver: Jinto Thomas
Date: 2026-10-07
Notes: Open question 1 (client UI scope) resolved as in-scope, recorded
inline above. Open questions 2–4 (error code split, comment
validation, single- vs. two-endpoint design) are left for spec.md, per
their own framing as implementation detail. Proceed to drafting
spec.md.

## Findings routed back here
<If a later spec.md, plan.md or diff review surfaces a problem with the
problem/outcome/scope recorded above, log it here: date, source review,
and what changed.>
