# Architecture Guide

## Stack

- **Client**: React 19 + Vite 7, built as a static SPA (`client/`)
- **Server**: Node.js (>=22) + Express 5, ESM (`server/`, `"type": "module"`)
- **Database**: SQLite via Node's built-in `node:sqlite` (`DatabaseSync`) — no native driver dependency
- **Tests**: Node's built-in test runner (`node:test`) on the server; Vitest + Testing Library (jsdom) on the client
- **Lint**: ESLint 9 (flat config), separate configs for `server/` and `client/`
- **CI**: GitHub Actions (`.github/workflows/ci.yml`)

npm workspaces (`client`, `server`) are orchestrated from the root `package.json`; `concurrently` runs both dev servers for `npm run dev`.

## Directory structure

```
server/
  src/
    db.js             # schema, seed data, createDatabase()
    current-user.js   # simulated-current-user resolution/validation
    requests.js        # request SELECT, visibility rules, per-record authorization
    http-errors.js      # HttpError class + errorResponse() shape
    app.js             # Express app: routes, static hosting, error middleware
    index.js           # process entry point (listen, env vars, shutdown)
    reset-db.js         # deletes the SQLite file(s) and recreates + seeds
  test/
    app.test.js        # integration-style tests against an in-memory DB
  data/
    request-hub.db      # created at runtime, gitignored

client/
  src/
    main.jsx            # ReactDOM root
    App.jsx             # top-level state and data loading
    api.js              # fetch wrappers for the API
    components/
      UserSwitcher.jsx
      RequestList.jsx
      RequestDetails.jsx
      StatusBadge.jsx
    styles.css
    test-setup.js        # Vitest/jsdom setup
    App.test.jsx
```

## Server module responsibilities

- **`db.js`** — `createDatabase(filename = defaultDatabasePath)`. Opens a `DatabaseSync`, enables `PRAGMA foreign_keys = ON`, enables WAL mode (file-backed DBs only), runs `migrate()` (idempotent `CREATE TABLE IF NOT EXISTS`), then `seed()`. Seeding is skipped once any row exists in `users`. Passing `":memory:"` (used by tests) skips directory creation and WAL.
- **`current-user.js`** — `getCurrentUser(db, rawUserId)`. Coerces `rawUserId` to an integer; throws `HttpError(400, "CURRENT_USER_REQUIRED")` if it isn't one. Looks the user up by id; throws `HttpError(401, "INVALID_CURRENT_USER")` if the user doesn't exist or `active` is falsy. Returns the user with `active` coerced to a boolean.
- **`requests.js`** — a single reusable SQL fragment (`requestSelect`) joins `requests` to `categories`, the requester (`users`), and the assigned reviewer (`users`, `LEFT JOIN`), aliasing columns to camelCase (`categoryName`, `requesterName`, `assignedReviewerId`, `assignedReviewerName`, `reviewerComment`, `createdAt`, `updatedAt`).
  - `listVisibleRequests(db, user)` appends a `WHERE` clause from `visibilityClause(user)` and orders by `created_at DESC, id DESC`.
  - `visibilityClause(user)`: `admin` → `1 = 1`; `reviewer` → `assigned_reviewer_id = ?`; everyone else (`employee`) → `requester_id = ?`.
  - `getVisibleRequest(db, user, requestId)` validates `requestId` is an integer (`HttpError(400, "INVALID_REQUEST_ID")`), fetches the row by id (`HttpError(404, "REQUEST_NOT_FOUND")` if missing), then re-checks authorization in JS (not SQL): allowed if `role === "admin"`, or `role === "employee"` and the user is the requester, or `role === "reviewer"` and the user is the assigned reviewer. Otherwise throws `HttpError(403, "REQUEST_FORBIDDEN")`.
- **`http-errors.js`** — `HttpError extends Error` carries `status` and `code`. `errorResponse(error)` produces `{ error: { code, message } }`, defaulting `code` to `"INTERNAL_ERROR"` and `message` to a generic string.
- **`app.js`** — `createApp({ db })` builds and returns the Express app (not started here, so it can be reused by tests):
  - `app.use(cors())`, `app.use(express.json())`.
  - `GET /api/health` → `{ status: "ok" }`.
  - `GET /api/users` → active users only, ordered `employee, reviewer, admin` then by name.
  - `GET /api/categories` → all categories, ordered by name.
  - `GET /api/requests` → resolves `currentUserId` from the query string via `getCurrentUser`, returns `{ data: listVisibleRequests(...), meta: { currentUser } }`.
  - `GET /api/requests/:id` → resolves the user the same way, returns `{ data: getVisibleRequest(...) }`.
  - If `client/dist` exists on disk, serves it statically and falls back to `index.html` for any other `GET` path (`GET /{*path}`) — this is what lets `npm start` serve client + API from one process in production.
  - A single error-handling middleware: JSON body-parse `SyntaxError` → 400 `INVALID_JSON`; otherwise uses `error.status` (default 500) and logs to `console.error` when status >= 500; always responds with `errorResponse(error)`.
- **`index.js`** — reads `PORT` (default `3001`) and `DB_FILE` (default handled inside `db.js`) from the environment, creates the DB and app, starts listening, and registers `SIGINT`/`SIGTERM` handlers that close the HTTP server and the DB connection before exiting.
- **`reset-db.js`** — deletes `request-hub.db`, `request-hub.db-shm`, and `request-hub.db-wal` (ignoring missing files), then calls `createDatabase()` to recreate and reseed. Invoked via `npm run db:reset`.

## Client module responsibilities

- **`api.js`** — `requestJson(url)` does a `fetch`, parses JSON (tolerating a non-JSON body), and throws `new Error(body.error.message)` on a non-2xx response, or a generic "Request failed with status N" if the body has no `error.message`. `loadUsers()`, `loadRequests(currentUserId)`, and `loadRequest(requestId, currentUserId)` wrap this and unwrap `.data`.
- **`App.jsx`** — owns all top-level state: `users`, `currentUserId`, `requests`, `selectedRequest`, `loading`, `error`.
  - On mount: loads users, sets `currentUserId` to the first user returned (no explicit "logged out" state — there is always a default current user once users load).
  - On `currentUserId` change: clears `selectedRequest`/`error`, sets `loading`, loads the visible requests for that user.
  - `openRequest(requestId)`: loads one request's full detail via `loadRequest`.
  - Renders `UserSwitcher`, an error banner (`role="alert"`) when `error` is set, and a two-pane `content-grid` of `RequestList` + `RequestDetails`.
  - `headingFor`/`descriptionFor` derive page copy from `currentUser.role` (`"reviewer"` → "Assigned requests", `"admin"` → "All requests", else → "My requests").
- **`components/UserSwitcher.jsx`** — a `<select>` of `name · role`; emits the chosen id as a `Number` via `onChange`.
- **`components/RequestList.jsx`** — renders loading / empty / populated states; each card shows `REQ-{id}`, a `StatusBadge`, `title`, and `categoryName · priority priority`; clicking a card calls `onSelect(request.id)`.
- **`components/RequestDetails.jsx`** — empty state when no request is selected; otherwise renders `id`, `title`, `status`, `description`, a `<dl>` of category/priority/requester/reviewer (`"Not assigned"` if `assignedReviewerName` is null)/created/updated (dates formatted with `Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" })`), and a reviewer-comment block only if `reviewerComment` is truthy.
- **`components/StatusBadge.jsx`** — renders `<span class="status status-{status.toLowerCase()}">{status}</span>`; styling-only, carries no business logic.

## Request flow (end to end)

1. `App.jsx` calls `loadUsers()` on mount and defaults `currentUserId` to the first user in the response.
2. On every `currentUserId` change, the client calls `GET /api/requests?currentUserId=<id>`.
3. `app.js` resolves and validates that id via `getCurrentUser` (400 if missing/non-numeric, 401 if unknown/inactive).
4. `requests.js` builds the visible list in SQL via `visibilityClause` (role-scoped) and returns it with the resolved `currentUser` as `meta`.
5. The client renders the queue (`RequestList`) and, when a card is clicked, calls `GET /api/requests/:id?currentUserId=<id>`.
6. `getVisibleRequest` fetches the row by id then re-authorizes per-record in JS before returning it; a mismatch (e.g. a reviewer requesting a request assigned to someone else) yields 403 regardless of what the list endpoint would have shown.
7. The client renders the full record in `RequestDetails`, or surfaces `error.message` in the banner if any step failed.

## Data flow / dev vs. production

- **Development**: `npm run dev` runs `node --watch server/src/index.js` and `vite` concurrently. Vite's dev server (port 5173) proxies `/api/*` to `http://localhost:3001` (see `client/vite.config.js`); the client never talks to Express directly in dev.
- **Production**: `npm run build` runs `vite build` to produce `client/dist`. `npm start` runs `node server/src/index.js`, which serves `client/dist` as static files and answers `/api/*` from the same Express process on one port (`PORT`, default 3001). There is no reverse proxy in this setup.

## Boundaries

- React owns presentation and interaction state only; it holds no authorization logic.
- Express validates the simulated current user on every request and converts domain errors (`HttpError`) to HTTP responses in one place (`app.js`'s error middleware).
- `requests.js` is the only place that encodes visibility and per-record authorization; both the list query (SQL `WHERE`) and the single-record fetch (JS boolean check) must independently enforce the same rule for a given role.
- All SQL uses parameterized queries (`db.prepare(...).run/get/all(params)`); no string-concatenated SQL exists in the codebase.
- The client never implements its own visibility rules — it displays whatever the API returns and relies on the API refusing the rest.

## Verification

- Server tests (`server/test/app.test.js`) run against `createDatabase(":memory:")` with the real seed data (ids 1–6 for users, 101–105 for requests) — no mocking of SQLite.
- Client tests use Vitest + Testing Library with a jsdom environment (`client/src/test-setup.js`).
- CI (`.github/workflows/ci.yml`) runs on every pull request and on pushes to `main` and `audience-starter`: `npm ci`, `npm run lint`, `npm test`, `npm run build`, on `ubuntu-latest` with Node 22.
- There is no hosted deployment for this course. After merging, verify locally: `npm ci && npm run build && npm start`, then check `GET /api/health` and the relevant scenario in the browser. `server/data/request-hub.db` persists across restarts; use `npm run db:reset` to return to the seeded state.
