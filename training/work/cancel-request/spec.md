# Specification: Cancel a submitted request

Intent: training/work/cancel-request/intent.md (accepted 2026-10-07, amended 2026-10-07)
Technical owner: Claude Code (drafted from accepted intent.md)
State: accepted

## Behavior and acceptance examples

Labeled **Confirmed** where directly required by the accepted intent or
the issue brief's acceptance criteria; labeled **Design decision** where
this spec is choosing among options the intent left to spec.md.

| ID | Actor / request state | Action | Result |
|----|------------------------|--------|--------|
| AC-1 | Requester; their own request, status `Submitted` | Cancel | **Confirmed.** 200 response; status becomes `Cancelled`; persists after reload (re-fetching the request shows `Cancelled`). |
| AC-2 | A different employee (not the requester); request status `Submitted` | Cancel | **Confirmed.** `403 REQUEST_FORBIDDEN`; stored row completely unchanged (status and `updated_at` both unchanged). |
| AC-3 | The assigned reviewer; request status `Submitted` | Cancel | **Confirmed.** `403 REQUEST_FORBIDDEN`; stored row unchanged. Being the assigned reviewer grants *view* access under existing visibility rules, but not cancel access — cancel eligibility is narrower than view eligibility. |
| AC-4 | An administrator; request status `Submitted` | Cancel | **Confirmed.** `403 REQUEST_FORBIDDEN`; stored row unchanged. Per the product owner's resolution in intent.md, there is no admin override, even though admins can view every request. |
| AC-5 | Requester; their own request, status `Draft`, `Approved`, `Rejected`, or already `Cancelled` | Cancel | **Confirmed.** `409 REQUEST_NOT_CANCELLABLE`; stored row unchanged. Applies identically to all four non-`Submitted` statuses — there is one eligibility rule (`status === "Submitted"`), not a per-status rule. |
| AC-6 | Any actor | Cancel a request id that doesn't exist | **Confirmed** (follows from reusing the existing lookup pattern in `getVisibleRequest`, `server/src/requests.js:34-54`). `404 REQUEST_NOT_FOUND`. |
| AC-7 | Any denied or failed attempt (AC-2 through AC-6) | — | **Confirmed.** No column on the row changes — not just `status`, but `updated_at` too, so a reviewer can verify "unchanged" by checking the full row, not only the field that would have changed on success. |
| AC-8 | Requester views their own `Submitted` request's detail page | View | **Confirmed (added — UI in scope).** A "Cancel request" button is rendered on the detail page. |
| AC-9 | Anyone views a request's detail page where AC-1's conditions don't hold (not the requester, or status isn't `Submitted`) | View | **Confirmed (added — UI in scope).** No Cancel button is rendered at all — not shown-but-disabled. This is a UX convenience only: per `docs/architecture.md` §5, the client holds no enforcement logic, so the server re-checks ownership and status on every call regardless of what the button's visibility implies (AC-2–AC-5 still apply even if a client bypassed the hidden button and called the endpoint directly). |

## Design

**Confirmed — reuse of existing module boundaries**
(`docs/architecture.md` §4): cancellation logic lives in
`server/src/requests.js` as a new exported function, parallel to
`getVisibleRequest`/`listVisibleRequests`, not in `app.js`. The route
handler in `app.js` stays thin: call the function, map the result/error
to a response, nothing else.

**Confirmed — endpoint shape** (reviewer accepted as proposed):
`POST /api/requests/:id/cancel`, reusing the existing `currentUserId`
query-param convention (`?currentUserId=...`) rather than moving
identity into the request body, so this endpoint resolves identity
exactly like every existing route
(`getCurrentUser(db, request.query.currentUserId)`,
`server/src/current-user.js`).

**Confirmed — new `requests.js` function** (reviewer accepted as
proposed), modeled directly on `getVisibleRequest`'s fetch-then-check
shape (`server/src/requests.js:34-54`):

```js
export function cancelRequest(db, user, requestId) {
  const id = Number(requestId);
  if (!Number.isInteger(id)) {
    throw new HttpError(400, "INVALID_REQUEST_ID", "Request ID must be a number.");
  }

  const request = db.prepare(`${requestSelect} WHERE r.id = ?`).get(id);
  if (!request) {
    throw new HttpError(404, "REQUEST_NOT_FOUND", "Request not found.");
  }

  if (request.requesterId !== user.id) {
    throw new HttpError(403, "REQUEST_FORBIDDEN", "You cannot cancel this request.");
  }

  if (request.status !== "Submitted") {
    throw new HttpError(409, "REQUEST_NOT_CANCELLABLE", "Only a submitted request can be cancelled.");
  }

  const now = new Date().toISOString();
  db.prepare(`UPDATE requests SET status = 'Cancelled', updated_at = ? WHERE id = ?`).run(now, id);

  return db.prepare(`${requestSelect} WHERE r.id = ?`).get(id);
}
```

This deliberately checks ownership (`requesterId !== user.id`) directly,
rather than calling the existing role-based `visibilityClause` —
cancellation is strictly narrower than visibility (AC-3, AC-4), so
reusing the visibility check would under-restrict it. The `UPDATE` uses
a parameterized statement, consistent with every other query in the
codebase; no string interpolation of user input.

**Confirmed — response shape.** On success, return the full updated
request row (same shape `requestSelect` already produces for
`GET /api/requests/:id`), not just `{ status }`, so the client can
update its UI from the response without an extra fetch.

**Confirmed — error shape.** All failure cases use the existing
`HttpError` → `errorResponse()` pattern (`server/src/http-errors.js`);
no new error-handling mechanism is introduced. `REQUEST_NOT_CANCELLABLE`
is the one new machine-readable code this feature adds.

### Client (in scope, per product-owner resolution)

**Design decision — `client/src/api.js`.** `requestJson()` currently
only does a plain `fetch(url)` (GET). Extend it to accept an options
object with an optional `method`, defaulting to `"GET"`, so the
existing response-unwrapping and error-throwing logic
(`client/src/api.js:1-8`) is reused rather than duplicated:

```js
async function requestJson(url, { method = "GET" } = {}) {
  const response = await fetch(url, { method });
  ...
}

export async function cancelRequest(requestId, currentUserId) {
  return (await requestJson(
    `/api/requests/${requestId}/cancel?currentUserId=${currentUserId}`,
    { method: "POST" },
  )).data;
}
```

**Design decision — `client/src/components/RequestDetails.jsx`.** Add a
"Cancel request" button, conditionally rendered using the same pattern
already used for `reviewerComment` in that file
(`{request.reviewerComment && (...)}`, `RequestDetails.jsx:35-40`):
render the button only when
`request.status === "Submitted" && request.requesterId === currentUserId`.
This requires passing `currentUserId` down from `App.jsx` as a new prop
(`RequestDetails` currently only receives `request`).

**Design decision — click handling, in `App.jsx`.** On click, call
`cancelRequest(selectedRequest.id, currentUserId)`; on success, replace
`selectedRequest` with the returned updated record (so the badge and
button visibility update immediately) and refresh the list (re-run
`loadRequests`, or patch the matching item's status locally — plan.md
should pick one); on failure, reuse the existing `error` state and
`notice-error` rendering already in `App.jsx` — no new error-display
mechanism.

## Constraints and unresolved questions

**Confirmed constraints**, carried from the accepted intent:

- No real authentication — identity stays simulated via `currentUserId`.
- No notification, no cancellation reason field, no reopening, no bulk
  cancellation (all explicitly out of scope).
- Server-side enforcement only; hiding the Cancel button (AC-9) is a UX
  convenience, never the actual access control — the server enforces
  AC-2 through AC-5 unconditionally.

No open questions remain. All three items raised in the draft are
resolved:

1. Endpoint shape — confirmed as proposed.
2. `REQUEST_NOT_CANCELLABLE` — confirmed as the final code name.
3. Client UI — confirmed in scope; a Cancel button is required on the
   request detail page (AC-8, AC-9), and `training/work/cancel-request/intent.md`
   has been amended to record this.

## Review decision

Accepted by the reviewer and product owner (Jinto Thomas) on
2026-10-07: design decisions 1 and 2 accepted as proposed; client UI
(a Cancel button) confirmed in scope. Proceed to drafting plan.md.
