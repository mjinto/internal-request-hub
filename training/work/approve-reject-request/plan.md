# Implementation plan: Approve or reject an assigned request

Intent: training/work/approve-reject-request/intent.md (accepted 2026-10-07)
Specification: training/work/approve-reject-request/spec.md (accepted 2026-10-07)
Engineer: Claude Code (drafted from accepted spec.md)
Reviewer (approver): Jinto Thomas
State: accepted

## Repository evidence

**Observations (confirmed in the repository, not assumed):**

- `server/src/requests.js:56-79` — `cancelRequest` is the direct
  precedent: fetch-by-id, then an authorization check, then a status
  check, then a parameterized `UPDATE`. `approveRequest`/`rejectRequest`
  (spec.md) follow the same shape, substituting an assignment check for
  the ownership check and adding comment validation for reject only.
- `server/src/app.js:57-64` — the existing `POST /api/requests/:id/cancel`
  route is the shape the two new routes copy exactly (resolve user, call
  a `requests.js` function, respond or `next(error)`); `express.json()`
  is already mounted (`app.js:16`), so `reject`'s JSON body needs no new
  middleware.
- `server/test/app.test.js` — one shared `createDatabase(":memory:")`
  across all `it()` blocks (`before`/`after`), fixture ids 1–6 (users),
  101–105 (requests). The existing `describe("cancel request")` block
  runs before any new block I add and **consumes request 101**,
  leaving it `Cancelled` by the time later blocks run — this is
  actually useful evidence for AC-7 (deciding a `Cancelled` request),
  not a conflict, as long as the new tests run after it in file order.
- Seed fixtures and their state *after* the existing cancel tests have
  run (`server/src/db.js`):
  - **101** → `Cancelled` (reviewer 3 = Priya, requester 1 = Maya) —
    usable for AC-7 (409 on a `Cancelled` request).
  - **102** → `Approved` (reviewer 4 = Daniel, requester 1 = Maya) —
    untouched by cancel tests — usable for AC-7 (409 on `Approved`).
  - **103** → `Submitted` (reviewer 3 = Priya, requester 2 = Rahul) —
    untouched — the only still-`Submitted` seed row. Used for AC-2
    through AC-6 (denials don't mutate state, so they can all run
    against 103 before the one test that finally rejects it).
  - **104** → `Rejected` (reviewer 4 = Daniel, requester 2 = Rahul) —
    untouched — usable for AC-7 (409 on `Rejected`).
  - **105** → `Draft` (reviewer: **none** — `assigned_reviewer_id` is
    `null`) — untouched, but **not usable** for AC-7's `Draft` case,
    because nobody is the assigned reviewer of 105, so
    `assertAssignedReviewer` would throw `403` before the status check
    is ever reached, not the `409` AC-7 needs to demonstrate.
  - **Gap:** no seed row is both `Draft` and has a non-null assigned
    reviewer. See Approach below for how this is covered.
  - There is exactly one `Submitted` row left after cancel-request's
    tests run (103); AC-1 (approve) and AC-2 (reject) both need their
    own fresh `Submitted` row to reach a genuine success, and only one
    is available. See Approach below.
- `client/src/api.js:1-8` — `requestJson(url, { method })` has no body
  support yet; must be extended, not duplicated (mirrors how
  `cancel-request` extended it to add `method` in the first place).
- `client/src/components/RequestDetails.jsx:42-46` — the existing
  Cancel button's conditional-render
  (`request.status === "Submitted" && request.requesterId === currentUserId`)
  is the direct pattern the new Approve/Reject controls copy, swapping
  in `assignedReviewerId`.
- `client/src/App.jsx:49-57` — `cancelSelectedRequest` is the direct
  pattern for `approveSelectedRequest`/`rejectSelectedRequest`: call the
  API function, replace `selectedRequest` with the response, re-run
  `loadRequests(currentUserId)`, catch into the existing `error` state.
- `.claude/agents/authorization-reviewer.md`, `constitution.md`, and
  the current `CLAUDE.md` (both post-date `cancel-request`'s plan.md)
  — the authorization-reviewer agent and the `verify-checkpoint` skill
  are now the named review tools for this stage, replacing the
  `/security-review`-only step `cancel-request`'s plan used before
  `constitution.md` existed.

## Approach and tradeoffs

Implement server-side first (independently testable, the actual
enforcement boundary), then the client — same dependency order as
`cancel-request`.

**Deferred decision from spec.md, resolved here: test fixtures for
AC-1/AC-2's two success paths.** Only one seed row (103) is still
`Submitted` once the existing cancel tests have run, but the new tests
need two independent successes (one approve, one reject) plus denial
coverage that must run on a still-`Submitted` row. Resolution: run all
non-mutating denial checks (AC-3 wrong-comment, AC-4 wrong reviewer,
AC-5 requester, AC-6 admin) against 103 first — none of them change its
status — then consume 103 once, at the end, via the reject success
case (AC-2). For AC-1 (approve success), insert one additional
request row inside this describe block's own setup (not into
`server/src/db.js`'s shared seed — that stays product seed data, not
test scaffolding): a `Submitted` row assigned to Priya (3), requester
Maya (1), inserted with `db.prepare(...).run(...)` using the same
parameterized pattern as the rest of the codebase. This keeps the
approve path tested against a row nothing else depends on, rather than
racing cancel-request's tests for 101 or reordering `describe` blocks
across files.

**Same resolution for AC-7's `Draft` case.** Insert one more test-only
row (also scoped to this describe block) that is `Draft` with a
non-null assigned reviewer, since no seed row combines those two
facts. Both inserted rows exist only for the duration of the shared
in-memory test database and never touch `server/src/db.js`.

**Risk ruled out, not deferred:** the same double-submit/concurrent
reasoning from `cancel-request`'s plan applies unchanged —
`node:sqlite`'s `DatabaseSync` is synchronous, so there is no window for
a second call to interleave between a decision's read and its write.

## Ordered checkpoints

1. **Server: `approveRequest`/`rejectRequest` functions.** Add both,
   plus the shared `assertAssignedReviewer` helper, to
   `server/src/requests.js`, exactly as specified in `spec.md`'s
   Design section (check order: 404 → 403 → 409 → 400). No route wired
   yet.
   Verify: `npm run lint --workspace=server` passes.
2. **Server: routes.** Add `POST /api/requests/:id/approve` and
   `POST /api/requests/:id/reject` to `server/src/app.js`, mirroring
   the existing `/cancel` route's shape.
   Verify: manual `curl`/`npm run dev` smoke check — one approve
   success, one reject success, one denied case.
3. **Server: automated tests.** Add a `describe("approve/reject
   request")` block to `server/test/app.test.js`, placed after the
   existing `describe("cancel request")` block, covering AC-1 through
   AC-9 per the Acceptance-to-evidence map below, including the two
   test-scoped row insertions identified in Approach.
   Verify: `npm run test --workspace=server` — all new and existing
   tests pass.
4. **Client: API wrapper.** Extend `requestJson()` in
   `client/src/api.js` to accept an optional `body` (JSON-serialized,
   with the matching header, only when provided); add
   `approveRequest(requestId, currentUserId)` and
   `rejectRequest(requestId, currentUserId, comment)`.
   Verify: `npm run lint --workspace=client`.
5. **Client: controls and wiring.** Add the Approve button and the
   Reject control (comment textarea + button, client-side disabled
   while empty) to `RequestDetails.jsx` (reusing the existing
   `currentUserId` prop, checked against `assignedReviewerId`); add
   `approveSelectedRequest`/`rejectSelectedRequest(comment)` to
   `App.jsx`, parallel to `cancelSelectedRequest`.
   Verify: manual check via `npm run dev` — as Priya, open one of her
   assigned `Submitted` requests, confirm both controls render;
   approve one, reject another with a comment, confirm status badges
   and the list both update; confirm the controls are absent when
   viewing as Rahul (employee) or Alex (admin) on the same request.
6. **Client: automated tests.** Extend `client/src/App.test.jsx` (or a
   new `RequestDetails.test.jsx`, following the existing mocked-`fetch`
   pattern) covering AC-10 and AC-11.
   Verify: `npm run test --workspace=client`.
7. **Full automated verification.** Run `npm test`, `npm run lint`,
   `npm run build` from the repo root. `npm run build && npm start` and
   check `/api/health`, per `CLAUDE.md`'s verification note.
8. **Specialized review.** This change adds two new mutating endpoints
   and new authorization logic (assignment + status checks, plus input
   validation). Explicitly invoke the `authorization-reviewer` agent on
   the diff (identity resolution, ownership/role/status checks, denial
   error shape, parameterized SQL — per `constitution.md` §4 and
   `CLAUDE.md`'s "Feature workflow and review tools"). Then run
   `/verify-checkpoint training/work/approve-reject-request`, which
   re-runs `npm test`/`npm run lint`/`npm run build`, re-invokes
   `authorization-reviewer`, and checks every row in the
   Acceptance-to-evidence map below has real, passing evidence. Run
   `/code-review` for correctness/reuse/simplification concerns outside
   the authorization boundary. Triage every finding: a defect routes
   back to the implementation (checkpoints 1–6) for a fix; a finding
   that the chosen approach itself is unsuitable routes back to this
   plan or to `spec.md`, per `constitution.md`'s "where findings go"
   rule, not a silent patch.

## Acceptance-to-evidence map

| Acceptance example | Checkpoint | Automated check or manual observation |
| --- | --- | --- |
| AC-1 (approve success, Priya on a test-inserted `Submitted` row) | 3 | `server/test/app.test.js`: 200, `status === "Approved"`, re-fetch confirms persistence |
| AC-2 (reject success, Priya on 103, with comment) | 3 | `server/test/app.test.js`: 200, `status === "Rejected"`, `reviewer_comment` matches the submitted comment, re-fetch confirms persistence |
| AC-3 (reject denied — empty/whitespace comment, Priya on 103) | 3 | `server/test/app.test.js`: `400 REJECTION_COMMENT_REQUIRED`, row unchanged |
| AC-4 (denied, Daniel — unassigned reviewer — on 103) | 3 | `server/test/app.test.js`: `403 REQUEST_FORBIDDEN`, row unchanged |
| AC-5 (denied, Rahul — the requester — on 103) | 3 | `server/test/app.test.js`: `403 REQUEST_FORBIDDEN`, row unchanged |
| AC-6 (denied, Alex — admin — on 103) | 3 | `server/test/app.test.js`: `403 REQUEST_FORBIDDEN`, row unchanged |
| AC-7 (Draft/Approved/Rejected/Cancelled, each decided by its assigned reviewer) | 3 | `server/test/app.test.js`: four cases — test-inserted `Draft` row (Priya), 102 (`Approved`, Daniel), 104 (`Rejected`, Daniel), 101 (`Cancelled`, Priya, after cancel-request's tests) — all `409 REQUEST_NOT_DECIDABLE`, rows unchanged |
| AC-8 (nonexistent id) | 3 | `server/test/app.test.js`: approve/reject id `999` → `404 REQUEST_NOT_FOUND` |
| AC-9 (unchanged data on any denial) | 3 | `server/test/app.test.js`: assert full row (incl. `updated_at`, `reviewer_comment`) equals pre-attempt snapshot for AC-3–AC-8 |
| AC-10 (controls visible when eligible) | 6 | `client` test: render `RequestDetails` as Priya viewing her assigned `Submitted` request, Approve and Reject controls present |
| AC-11 (controls absent otherwise) | 6 | `client` test: render as Rahul (requester) or Alex (admin), or as Priya viewing a non-`Submitted` request, controls absent; cross-referenced by checkpoint 3's server tests, which prove the server rejects the action even if hidden controls were bypassed |

## Risks and recovery

- **Authorization ordering risk.** `approveRequest`/`rejectRequest`
  must check assignment (`403`) before status (`409`) before comment
  validity (`400`) — reordering would let an unassigned caller learn a
  request's status, or let a status-ineligible caller learn whether
  their comment would have been accepted. Checkpoint 8's
  authorization-reviewer pass should confirm this order survived
  implementation.
- **State risk — double submit.** Ruled out structurally (see
  Approach), same as `cancel-request`.
- **Persistence risk.** An `UPDATE` touching unrelated columns, or
  `rejectRequest` writing an empty/whitespace comment after all, would
  silently violate AC-2/AC-9. Recovery: AC-9's tests assert the full
  row, and AC-2's test asserts the exact stored comment, not just that
  the call returned 200.
- **Integration risk — list/detail desync.** Same pattern and same fix
  as `cancel-request`: refresh both the detail pane (from the response)
  and the list pane (`loadRequests`) after any successful decision.
- **Test-fixture risk.** The two test-scoped row insertions (Approach)
  must stay inside this describe block's own setup and never touch
  `server/src/db.js`'s seed data — conflating the two would change
  fixture ids/counts relied on by the *other* existing test blocks
  (`request visibility`'s exact-count assertions, for instance).
  Recovery: checkpoint 3's implementation inserts rows with ids outside
  the seeded 101–105 range (e.g. 201, 202) to avoid any collision, and
  checkpoint 7's full `npm test` run would catch a count/id regression
  in the existing `describe("request visibility")` block immediately.
- **Scope-creep risk.** Nothing in this plan touches reviewer
  reassignment, multi-level approval, notifications, or reopening a
  decided request — if implementation surfaces a reason to touch any
  of those, stop and return to `spec.md` rather than expanding this
  plan's scope, per `constitution.md` §2's "a reason to touch a
  different exercise's area is a reason to stop" rule.
- **Review-coverage risk.** Same as `cancel-request`: a manual
  read-through alone can miss a subtle break in check ordering or an
  unparameterized value. Checkpoint 8 runs `authorization-reviewer`
  and `/verify-checkpoint` specifically for this, not just `/code-review`.

## Approval record
Decision: accepted
Approver (reviewer): Jinto Thomas
Date: 2026-10-07
Implementation may begin.

## Findings routed back here
<If a diff review (authorization-reviewer, verify-checkpoint, /code-review,
/security-review) finds the chosen approach unsuitable rather than a plain
implementation defect, log it here: date, source review, and what changed.
A plain implementation defect is fixed in the diff, not logged here.>
