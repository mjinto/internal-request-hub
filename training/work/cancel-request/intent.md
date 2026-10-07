# Intent: Cancel a submitted request

Issue: training/inputs/issues/01-cancel-request.md
Originator: Claude Code (drafted from the issue brief)
Product owner: Jinto Thomas
State: accepted (amended 2026-10-07 — see note at the bottom)

## Problem and desired outcome

Employees sometimes submit a request by mistake, or no longer need it,
and currently have no way to withdraw it without contacting a reviewer
(`CLAUDE.md` confirms cancellation is not implemented today — there is
no status-transition code path in `server/src/requests.js` or
`server/src/app.js`, per `docs/architecture.md` §4). The desired outcome
is that the requester who created a request can cancel it themselves,
while it is still in `Submitted` status, without reviewer involvement.

## Scope and constraints

**In scope, per the issue brief's confirmed rules and acceptance
criteria:**

- Only the employee who created a request may cancel it — not another
  employee, not the assigned reviewer, and not an administrator acting
  on the requester's behalf. **Confirmed by product owner:** no admin
  override exists or is planned; this rule stands exactly as written in
  the issue brief's acceptance criterion 4.
- Only a request currently in `Submitted` status is eligible. `Draft`,
  `Approved`, `Rejected`, and already-`Cancelled` requests cannot be
  cancelled.
- A successful cancellation sets status to `Cancelled` and that change
  persists (survives a page reload).
- A failed/denied cancellation attempt leaves the stored request
  completely unchanged and returns a useful error.
- No notification is sent as part of cancellation.
- **Resolved (product owner accepted best-guess default, confirmed
  final in spec.md):** an ineligible cancellation attempt (wrong
  status, or a request that exists but the caller doesn't own) returns
  `409 Conflict` with a new machine-readable code —
  `REQUEST_NOT_CANCELLABLE` — rather than reusing `403`/`404`.
  Reasoning: the request exists and the caller may well be authorized
  to view it; the problem is that its current status conflicts with
  the requested operation, which is what `409` is for. `403
  REQUEST_FORBIDDEN` stays reserved for "you cannot act on this request
  at all" (wrong owner), distinct from "you own it, but it's not
  cancellable right now."
- **Added by amendment (product owner, 2026-10-07):** a "Cancel
  request" button on the request detail page is in scope. It is
  rendered only when the viewer is the requester and the request is
  `Submitted`; hiding it in every other case is a UX convenience only
  — the server enforces eligibility unconditionally regardless of
  whether the button was ever shown. See `spec.md` AC-8/AC-9 for the
  full behavior.

**Non-negotiable constraints, per `CLAUDE.md` and `docs/architecture.md`:**

- Authorization must be enforced on the server, not just hidden in the
  UI (`docs/architecture.md` §5 confirms the client currently holds no
  enforcement logic of its own — this must not change).
- Identity stays simulated (`currentUserId`); this feature does not add
  real authentication.
- Use the existing error shape (`HttpError` + `errorResponse`,
  `server/src/http-errors.js`) for denied/invalid cancellation attempts,
  consistent with the existing `REQUEST_FORBIDDEN`/`REQUEST_NOT_FOUND`
  pattern in `server/src/requests.js`.

**Explicitly out of scope**, per the issue brief:

- Reopening a cancelled request.
- Capturing a cancellation reason.
- Notifications of any kind.
- Bulk/multi-request cancellation.

## Open questions

None outstanding. Both questions raised in the draft were resolved by
the product owner (see the resolutions inline above):

1. Error status/code for an ineligible cancellation — resolved as
   `409 REQUEST_NOT_CANCELLABLE` (best-guess default, product-owner
   accepted; exact code name left for spec.md to finalize).
2. Admin override — resolved as no; acceptance criterion 4 is a firm
   rule, not an oversight.

## Acceptance decision

Accepted by product owner (Jinto Thomas) on 2026-10-07, with the two
open questions resolved as recorded above. Proceed to drafting spec.md.

**Amendment, 2026-10-07:** during spec.md review, the product owner
confirmed client UI work is in scope (a Cancel button on the detail
page) — the original draft's scope section didn't address the client
at all. Scope and constraints above were updated accordingly; no other
part of the accepted intent changed. See `spec.md`'s Review decision
for the corresponding spec-level sign-off.
