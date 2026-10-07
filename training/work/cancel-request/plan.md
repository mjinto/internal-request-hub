# Implementation plan: Cancel a submitted request

Intent: training/work/cancel-request/intent.md (accepted 2026-10-07, amended 2026-10-07)
Specification: training/work/cancel-request/spec.md (accepted 2026-10-07)
Engineer: Claude Code (drafted from accepted spec.md)
State: draft

## Repository evidence

**Observations (confirmed in the repository, not assumed):**

- `server/src/requests.js:34-54` — `getVisibleRequest` is the closest
  existing precedent: fetch-by-id, then an authorization check, then
  throw `HttpError` on failure. `cancelRequest` (spec.md) follows the
  same shape, with ownership + status checks instead of the role-based
  visibility check.
- `server/src/http-errors.js` — `HttpError(status, code, message)` and
  `errorResponse()` are the only error primitives in the codebase;
  reused as-is, no new mechanism.
- `server/src/app.js:39-55` — the two existing routes are both thin:
  resolve the current user, call a `requests.js` function, respond or
  `next(error)`. The new `POST /api/requests/:id/cancel` route follows
  this exact shape.
- `server/test/app.test.js` — a single `before()` creates one
  `createDatabase(":memory:")` shared across all `it()` blocks in the
  file (`db.close()` in `after()`); tests already rely on fixture ids
  1–6 (users) and 101–105 (requests), per `CLAUDE.md`'s testing section.
  New cancellation tests reuse this same shared-db pattern rather than
  creating a second database.
- Seed fixtures usable without modification (`server/src/db.js`):
  request **101** (requester 1 = Maya, reviewer 3 = Priya, status
  `Submitted`) covers AC-1 (success, as Maya), AC-2 (denied, as Rahul =
  2), AC-3 (denied, as Priya = 3, the assigned reviewer), AC-4 (denied,
  as Alex = 5, admin). Request **102** (requester 1, status `Approved`)
  and **105** (requester 1, status `Draft`) cover two of AC-5's four
  non-`Submitted` cases as Maya, the actual owner. There is no seeded
  `Cancelled` row (confirmed in `docs/domain.md` §5) — the fourth AC-5
  case is covered by re-attempting cancellation on 101 *after* the AC-1
  test has already cancelled it, reusing mutated state the same way the
  existing shared-db tests already do.
- `client/src/api.js:1-8` — `requestJson(url)` is a bare `fetch(url)`
  (GET only); must be extended to accept a method, not duplicated.
- `client/src/components/RequestDetails.jsx:35-40` — the existing
  `{request.reviewerComment && (...)}` conditional-render is the
  pattern the new Cancel button reuses for its visibility rule.
- `client/src/App.jsx:29-38` — `loadRequests(currentUserId)` is already
  the single way the request list gets (re)loaded, triggered by a
  `useEffect` on `currentUserId`. Re-using this function after a
  successful cancel (see Approach) avoids writing a second, bespoke
  list-update path.
- `client/src/App.test.jsx`, `client/src/test-setup.js` — client tests
  mock `fetch` and render `<App/>` with Testing Library/jsdom; new
  client tests follow this existing pattern.

## Approach and tradeoffs

Implement server-side first (it's independently testable and is the
actual enforcement boundary), then the client, matching the dependency
order and keeping each checkpoint reviewable on its own.

**Deferred decision from spec.md, resolved here:** after a successful
cancel, update the UI in two independent steps rather than one bespoke
merge — (1) replace `selectedRequest` directly with the record the
`POST` response already returns (no extra fetch needed for the detail
pane), and (2) re-run the existing `loadRequests(currentUserId)` to
refresh the list pane. This reuses `loadRequests` exactly as the
user-switch effect already does, instead of writing new logic to patch
one item inside the `requests` array in place — fewer code paths, at
the cost of one extra network call per cancellation. Given cancellation
is a low-frequency, user-initiated action, that tradeoff favors
simplicity over the saved round trip.

**Risk ruled out, not deferred:** double-submit / concurrent cancel
requests racing each other. `node:sqlite`'s `DatabaseSync` is
synchronous and Express handles each request on the same event loop
with no `await` between `cancelRequest`'s read and its `UPDATE` — there
is no window for a second call to interleave between the status check
and the write within one process. No debounce/lock is added for this.

## Ordered checkpoints

1. **Server: `cancelRequest` function.** Add `cancelRequest(db, user,
   requestId)` to `server/src/requests.js`, exactly as specified in
   `spec.md`'s Design section. No route wired yet.
   Verify: `npm run lint --workspace=server` passes; function is
   unreachable but type-checks/lints cleanly.
2. **Server: route.** Add `POST /api/requests/:id/cancel` to
   `server/src/app.js`, mirroring the existing two routes' shape
   (resolve current user, call `cancelRequest`, respond `{ data }` or
   `next(error)`). No new error-handling code in `app.js` — the
   existing middleware already maps `HttpError` instances.
   Verify: manual `curl`/`npm run dev` smoke check of one success and
   one denied case.
3. **Server: automated tests.** Add a `describe("cancel request")`
   block to `server/test/app.test.js` covering AC-1 through AC-7 (see
   Acceptance-to-evidence map). Reuses the shared in-memory db and
   fixture ids identified in Repository evidence.
   Verify: `npm run test --workspace=server` — all new and existing
   tests pass.
4. **Client: API wrapper.** Extend `requestJson()` in
   `client/src/api.js` to accept `{ method = "GET" }`; add
   `cancelRequest(requestId, currentUserId)` calling
   `POST /api/requests/:id/cancel`.
   Verify: `npm run lint --workspace=client`.
5. **Client: Cancel button and wiring.** Add the conditionally-rendered
   button to `RequestDetails.jsx` (new `currentUserId` prop); add the
   click handler in `App.jsx` per the two-step update in Approach
   above, including the `error`-state path on failure.
   Verify: manual check via `npm run dev` — cancel Maya's request 101
   as Maya, confirm the badge and list both update and the button
   disappears; confirm the button is absent for Rahul on the same
   request.
6. **Client: automated tests.** Extend `client/src/App.test.jsx` (or a
   new `RequestDetails.test.jsx`, following the existing mocked-`fetch`
   pattern) covering AC-8 and AC-9.
   Verify: `npm run test --workspace=client`.
7. **Full automated verification.** Run `npm test`, `npm run lint`,
   `npm run build` from the repo root. `npm run build && npm start` and
   check `/api/health`, per `CLAUDE.md`'s verification note.
8. **Specialized review agents.** This change adds a new mutating
   endpoint and new authorization logic (ownership + status checks) —
   exactly the shape worth a dedicated pass beyond manual read-through.
   Run `/code-review` on the diff for correctness, reuse and
   simplification findings. Run `/security-review` on the diff
   specifically for the authorization surface: confirm the
   ownership-before-status ordering noted in Risks below actually
   landed as implemented, and that `requestId`/`currentUserId` are only
   ever used in parameterized queries, never interpolated. Triage every
   finding: a defect routes back to the implementation (checkpoints
   1–6) for a fix; a finding that the chosen approach itself is
   unsuitable (not just a bug in executing it) routes back to this
   plan, not a silent patch. Inspect the complete diff against this
   plan and against `CLAUDE.md`'s stated boundaries (preserve existing
   API error shape, server-side enforcement, no speculative
   approval/rejection/history work) and `docs/architecture.md`'s
   documented patterns (parameterized SQL, thin handlers), before
   requesting engineer sign-off. (`constitution.md` doesn't exist yet
   at this point in the workshop — it's written in the step after this
   one, partly by codifying what this plan already follows by
   convention, including this review-agent step.)

## Acceptance-to-evidence map

| Acceptance example | Checkpoint | Automated check or manual observation |
| --- | --- | --- |
| AC-1 (success, Maya cancels 101) | 3 | `server/test/app.test.js`: 200, `status === "Cancelled"`, re-fetch confirms persistence |
| AC-2 (denied, Rahul on 101) | 3 | `server/test/app.test.js`: `403 REQUEST_FORBIDDEN`, row unchanged |
| AC-3 (denied, Priya — assigned reviewer — on 101) | 3 | `server/test/app.test.js`: `403 REQUEST_FORBIDDEN`, row unchanged |
| AC-4 (denied, Alex — admin — on 101) | 3 | `server/test/app.test.js`: `403 REQUEST_FORBIDDEN`, row unchanged |
| AC-5 (Draft/Approved/Rejected/already-Cancelled) | 3 | `server/test/app.test.js`: four cases (105, 102, 104-style, and re-cancel of 101 after AC-1) all `409 REQUEST_NOT_CANCELLABLE`, rows unchanged |
| AC-6 (nonexistent id) | 3 | `server/test/app.test.js`: cancel id `999` → `404 REQUEST_NOT_FOUND` |
| AC-7 (unchanged data on any denial) | 3 | `server/test/app.test.js`: assert full row (incl. `updated_at`) equals pre-attempt snapshot for AC-2–AC-6 |
| AC-8 (button visible when eligible) | 6 | `client` test: render `RequestDetails` as Maya viewing 101-shaped data, button present |
| AC-9 (button absent otherwise) | 6 | `client` test: render as Rahul, or as Maya viewing non-`Submitted` data, button absent; cross-referenced by checkpoint 3's server tests, which prove the server rejects the action even if the hidden button were bypassed |

## Risks and recovery

- **Authorization ordering risk.** `cancelRequest` must check ownership
  (`403`) *before* status (`409`) — checking status first would let an
  unauthorized caller learn a request's status indirectly through which
  error code comes back. Spec.md's function already orders it this way;
  checkpoint 1's review should confirm the order wasn't altered during
  implementation.
- **State risk — double submit.** Addressed under Approach (ruled out
  structurally; no additional recovery needed given the synchronous
  single-process database access).
- **Persistence risk.** An `UPDATE` that touches unrelated columns
  would silently violate AC-7. Recovery: the AC-7 tests assert the full
  row, not just `status`, so an accidental extra column write fails the
  test immediately rather than passing unnoticed.
- **Integration risk — list/detail desync.** If the list pane isn't
  refreshed after a cancel, a user could see `Cancelled` in the detail
  pane but a stale `Submitted` badge in the list. Addressed under
  Approach by refreshing both from the same `loadRequests` call.
- **Scope-creep risk.** Nothing in this plan touches approval,
  rejection, or request-history — if implementation surfaces a reason
  to touch those, stop and return to spec.md rather than expanding this
  plan's scope, per `CLAUDE.md`'s "reserved for exercises... don't add
  them speculatively" boundary and the issue brief's own "Out of scope"
  list.
- **Review-coverage risk.** A manual read-through of the diff can miss
  the class of issue this change is most exposed to: a subtle break in
  the ownership-before-status ordering, or an unparameterized value
  slipping into the new `UPDATE`. Checkpoint 8 runs `/security-review`
  specifically for this, and `/code-review` for correctness/reuse
  issues more broadly, rather than relying on the engineer's own
  read-through alone.

## Engineer review

Accepted by the engineer/reviewer (Jinto Thomas) on 2026-10-07,
including checkpoint 8's addition of `/code-review` and
`/security-review` as required gates before implementation is
considered complete — neither was in the original draft. Implementation
may begin. The open confirmation from the earlier draft still applies:
checkpoints 4–6 should be revisited once checkpoint 3 (server) is in
hand, since the client wiring in checkpoint 5 depends on exactly what
checkpoint 2's response shape turns out to be in practice.
