# Specification: Approve or reject an assigned request

Intent: training/work/approve-reject-request/intent.md (accepted 2026-10-07)
Engineer (drafter): Claude Code (drafted from accepted intent.md)
Reviewer (approver): Jinto Thomas
State: accepted

## Behavior and acceptance examples

Labeled **Confirmed** where directly required by the accepted intent or
the issue's acceptance criteria; labeled **Design decision** where this
spec is choosing among options intent.md left open (open questions
2–4).

| ID | Actor / request state | Action | Result |
|----|------------------------|--------|--------|
| AC-1 | Assigned reviewer; request status `Submitted` | Approve | **Confirmed.** 200 response; status becomes `Approved`; persists after reload. `reviewer_comment` is left untouched (approval does not require or accept a comment, per intent.md's scope). |
| AC-2 | Assigned reviewer; request status `Submitted` | Reject, with a non-empty comment | **Confirmed.** 200 response; status becomes `Rejected`; the comment is stored in `reviewer_comment`; persists after reload. |
| AC-3 | Assigned reviewer; request status `Submitted` | Reject, with no comment, an empty string, or a whitespace-only string | **Design decision (resolves open question 3).** `400 REJECTION_COMMENT_REQUIRED`; stored row completely unchanged. A comment is required to reject — "required" means non-empty after trimming leading/trailing whitespace; no maximum length is enforced (intent.md raised but didn't require one, and no other text field in this codebase enforces a length limit). |
| AC-4 | A different reviewer (not the one assigned); request status `Submitted` | Approve or reject | **Confirmed.** `403 REQUEST_FORBIDDEN`; stored row unchanged. Being a reviewer in general is not enough — only the *assigned* reviewer for that specific request may decide it. |
| AC-5 | The requesting employee (owner of the request); request status `Submitted` | Approve or reject | **Confirmed.** `403 REQUEST_FORBIDDEN`; stored row unchanged. |
| AC-6 | An administrator; request status `Submitted` | Approve or reject | **Confirmed.** `403 REQUEST_FORBIDDEN`; stored row unchanged. No admin override exists, consistent with the accepted `cancel-request` precedent and intent.md's explicit "not an administrator." |
| AC-7 | Assigned reviewer; request status `Draft`, `Approved`, `Rejected`, or `Cancelled` | Approve or reject | **Design decision (resolves open question 2, by precedent).** `409 REQUEST_NOT_DECIDABLE`; stored row unchanged. Applies identically to all four non-`Submitted` statuses — one eligibility rule (`status === "Submitted"`), not a per-status rule. Follows the `cancel-request` precedent of using `409` for "right caller, wrong state" rather than reusing `403`/`404`. |
| AC-8 | Any actor | Approve or reject a request id that doesn't exist | **Confirmed** (follows the existing lookup pattern in `getVisibleRequest`/`cancelRequest`, `server/src/requests.js`). `404 REQUEST_NOT_FOUND`. |
| AC-9 | Any denied or failed attempt (AC-3 through AC-8) | — | **Confirmed.** No column on the row changes — not just `status` and `reviewer_comment`, but `updated_at` too, matching the `cancel-request` precedent's AC-7. |
| AC-10 | Assigned reviewer views their assigned, `Submitted` request's detail page | View | **Confirmed (UI in scope, per intent.md).** An "Approve" button and a "Reject" control (comment field + Reject button) are rendered on the detail page. |
| AC-11 | Anyone views a request's detail page where AC-1's conditions don't hold (not the assigned reviewer, or status isn't `Submitted`) | View | **Confirmed (UI in scope, per intent.md).** No Approve/Reject controls are rendered at all — not shown-but-disabled. This is a UX convenience only; the server re-checks assignment and status on every call regardless of what the controls' visibility implies (AC-4–AC-7 still apply even if a client bypassed hidden controls and called the endpoint directly). |

## Design

**Confirmed — reuse of existing module boundaries** (`docs/architecture.md`
§4, and the `cancel-request` precedent): decision logic lives in
`server/src/requests.js` as two new exported functions, parallel to
`cancelRequest`, not in `app.js`. Route handlers in `app.js` stay thin.

**Design decision — two endpoints, not one (resolves open question 4).**
`POST /api/requests/:id/approve` and `POST /api/requests/:id/reject`,
rather than a single `POST /api/requests/:id/decision` with an
`action` field. Reasoning: every existing mutating route in this
codebase (`cancelRequest`'s `/cancel`) is one verb per endpoint; a
combined endpoint would be the first branching-on-payload mutation in
the app and would need its own validation for an unrecognized
`action` value, for no benefit here since approve and reject already
have different request bodies (reject needs `comment`, approve needs
nothing). Both reuse the existing `currentUserId` query-param
convention, exactly like `/cancel`.

**Confirmed — new `requests.js` functions**, modeled directly on
`cancelRequest`'s fetch-then-check shape
(`server/src/requests.js:56-79`), sharing one assignment check:

```js
function assertAssignedReviewer(user, request) {
  if (request.assignedReviewerId !== user.id) {
    throw new HttpError(403, "REQUEST_FORBIDDEN", "You cannot decide this request.");
  }
}

export function approveRequest(db, user, requestId) {
  const id = Number(requestId);
  if (!Number.isInteger(id)) {
    throw new HttpError(400, "INVALID_REQUEST_ID", "Request ID must be a number.");
  }

  const request = db.prepare(`${requestSelect} WHERE r.id = ?`).get(id);
  if (!request) {
    throw new HttpError(404, "REQUEST_NOT_FOUND", "Request not found.");
  }

  assertAssignedReviewer(user, request);

  if (request.status !== "Submitted") {
    throw new HttpError(409, "REQUEST_NOT_DECIDABLE", "Only a submitted request can be decided.");
  }

  const now = new Date().toISOString();
  db.prepare(`UPDATE requests SET status = 'Approved', updated_at = ? WHERE id = ?`).run(now, id);

  return db.prepare(`${requestSelect} WHERE r.id = ?`).get(id);
}

export function rejectRequest(db, user, requestId, comment) {
  const id = Number(requestId);
  if (!Number.isInteger(id)) {
    throw new HttpError(400, "INVALID_REQUEST_ID", "Request ID must be a number.");
  }

  const request = db.prepare(`${requestSelect} WHERE r.id = ?`).get(id);
  if (!request) {
    throw new HttpError(404, "REQUEST_NOT_FOUND", "Request not found.");
  }

  assertAssignedReviewer(user, request);

  if (request.status !== "Submitted") {
    throw new HttpError(409, "REQUEST_NOT_DECIDABLE", "Only a submitted request can be decided.");
  }

  const trimmedComment = typeof comment === "string" ? comment.trim() : "";
  if (!trimmedComment) {
    throw new HttpError(400, "REJECTION_COMMENT_REQUIRED", "A comment is required to reject a request.");
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE requests SET status = 'Rejected', reviewer_comment = ?, updated_at = ? WHERE id = ?
  `).run(trimmedComment, now, id);

  return db.prepare(`${requestSelect} WHERE r.id = ?`).get(id);
}
```

Check ordering is deliberate and mirrors the `cancel-request` precedent's
risk note: existence (404) → assignment (403) → status (409) → comment
validation (400, `rejectRequest` only). Assignment is checked before
status so an unassigned caller can't learn a request's status from
which error code comes back; comment validation runs last because by
that point the caller is already known to be authorized and the
request already known to be `Submitted`, so there's no equivalent leak
risk in checking it last.

`assertAssignedReviewer` checks `assignedReviewerId` directly rather
than role — a request's `assigned_reviewer_id` is only ever a
reviewer-role user (per seed data and the app's assignment model), so
this doesn't under-restrict, and it keeps the check identical in shape
to `cancelRequest`'s ownership check.

**Confirmed — response shape.** On success, both functions return the
full updated request row (same shape as `GET /api/requests/:id`),
matching `cancelRequest`.

**Confirmed — error shape.** All failure cases use the existing
`HttpError` → `errorResponse()` pattern; no new error-handling
mechanism. This feature adds two new machine-readable codes:
`REQUEST_NOT_DECIDABLE` (409) and `REJECTION_COMMENT_REQUIRED` (400).

### Routes (`server/src/app.js`)

```js
app.post("/api/requests/:id/approve", (request, response, next) => {
  try {
    const user = getCurrentUser(db, request.query.currentUserId);
    response.json({ data: approveRequest(db, user, request.params.id) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/requests/:id/reject", (request, response, next) => {
  try {
    const user = getCurrentUser(db, request.query.currentUserId);
    response.json({ data: rejectRequest(db, user, request.params.id, request.body?.comment) });
  } catch (error) {
    next(error);
  }
});
```

`reject` is the first route in this app to read a JSON request body;
`express.json()` is already mounted in `createApp` (`app.js:16`), so no
new middleware is needed.

### Client (in scope, per accepted intent.md)

**Design decision — `client/src/api.js`.** `requestJson()` currently
accepts `{ method }` but never sends a body. Extend it to accept an
optional `body`, serialized as JSON with the matching header, only
when provided — so the existing GET and `cancelRequest` call sites are
unaffected:

```js
async function requestJson(url, { method = "GET", body } = {}) {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const responseBody = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(responseBody?.error?.message ?? `Request failed with status ${response.status}.`);
  }
  return responseBody;
}

export async function approveRequest(requestId, currentUserId) {
  return (await requestJson(
    `/api/requests/${requestId}/approve?currentUserId=${currentUserId}`,
    { method: "POST" },
  )).data;
}

export async function rejectRequest(requestId, currentUserId, comment) {
  return (await requestJson(
    `/api/requests/${requestId}/reject?currentUserId=${currentUserId}`,
    { method: "POST", body: { comment } },
  )).data;
}
```

**Design decision — `client/src/components/RequestDetails.jsx`.** Add
an Approve button and a Reject control (a comment textarea plus a
Reject button), conditionally rendered using the same pattern as the
existing Cancel button
(`request.status === "Submitted" && request.assignedReviewerId === currentUserId`).
The Reject button is disabled client-side while the comment is empty
or whitespace-only — a UX convenience mirroring the server's
`REJECTION_COMMENT_REQUIRED` rule, never the actual control, exactly as
AC-11 states for the controls' visibility generally.

**Design decision — click handling, in `App.jsx`.** `approveSelectedRequest()`
and `rejectSelectedRequest(comment)`, parallel to the existing
`cancelSelectedRequest()`: call the corresponding `api.js` function, on
success replace `selectedRequest` with the returned record and re-run
`loadRequests(currentUserId)` to refresh the list pane (same two-step
update `cancelSelectedRequest` already uses); on failure, reuse the
existing `error` state and `notice-error` rendering — no new
error-display mechanism.

## Constraints and unresolved questions

**Confirmed constraints**, carried from the accepted intent:

- No real authentication — identity stays simulated via `currentUserId`.
- No reviewer reassignment, multi-level approval, notifications, or
  reopening a decided request (all explicitly out of scope).
- Server-side enforcement only; hiding the Approve/Reject controls
  (AC-11) is a UX convenience, never the actual access control — the
  server enforces AC-4 through AC-7 unconditionally.

No open questions remain. All four items raised in intent.md are
resolved:

1. Client UI — confirmed in scope by the product owner (intent.md).
2. Error status/code — `409 REQUEST_NOT_DECIDABLE` for wrong status,
   `403 REQUEST_FORBIDDEN` for wrong caller (AC-4–AC-7 above).
3. Rejection comment validation — non-empty after trimming; no length
   limit (AC-3 above).
4. Endpoint design — two endpoints, `/approve` and `/reject` (Design
   above).

## Approval record
Decision: accepted
Approver (reviewer): Jinto Thomas
Date: 2026-10-07
Scope questions resolved by product owner: none beyond intent.md's own
acceptance record — this spec didn't need to revisit intent.md's scope.
Design decisions 1–4 (two endpoints; 409/403 split; comment validation;
response/error shape) accepted as proposed. Proceed to drafting
plan.md.

## Findings routed back here
<If a later plan.md or diff review surfaces unclear or unsuitable
behavior defined above, log it here: date, source review, and what changed.>
