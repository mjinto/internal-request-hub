# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Internal Request Hub is the starter application for the AI-300 greenfield software development course. Employees view requests they created, reviewers view requests assigned to them, and administrators view all requests.

## Commands

Run from the repo root (npm workspaces: `client`, `server`).

```bash
npm ci              # install
npm run dev         # start API (3001) and web app (5173) together, via concurrently
npm test            # run server tests then client tests
npm run lint        # lint server then client
npm run build       # build the React client (client/dist)
npm start           # run the production server (serves client/dist + API on 3001)
npm run db:reset    # delete and recreate server/data/request-hub.db from seed data
```

Single-workspace equivalents (useful for faster iteration):

```bash
npm run dev --workspace=server     # node --watch src/index.js
npm run test --workspace=server    # node's built-in test runner (node --test)
npm run lint --workspace=server

npm run dev --workspace=client     # vite
npm run test --workspace=client    # vitest run
npm run lint --workspace=client
```

To run a single server test file directly: `node --test server/test/app.test.js` (run from `server/`, or adjust the path). To run a single client test: `npx vitest run src/App.test.jsx` from `client/`.

The server uses Node's built-in `node:sqlite` (`DatabaseSync`) — no native module install needed. The SQLite file lives at `server/data/request-hub.db` and is created/seeded automatically on first run; it persists across restarts, so use `npm run db:reset` to return to seed state.

CI (`.github/workflows/ci.yml`) runs `npm ci`, `npm run lint`, `npm test`, `npm run build` on every PR and on pushes to `main` and `audience-starter`. There is no hosted deployment — verify a merged change by running `npm run build && npm start` locally and checking `/api/health`.

## Architecture

- `server/`: Express 5 API + SQLite access (ESM, `type: module`)
  - `src/db.js` — schema (`users`, `categories`, `requests`), seed data, `createDatabase()`. Pass `":memory:"` for tests.
  - `src/current-user.js` — validates the simulated `currentUserId` against active users.
  - `src/requests.js` — single `requestSelect` query joined against categories/requester/reviewer, plus role-based visibility clauses (`visibilityClause`), single-record authorization in `getVisibleRequest`, and ownership/status-checked mutation in `cancelRequest`.
  - `src/http-errors.js` — `HttpError` (status + code + message) and `errorResponse()` shared JSON error shape.
  - `src/app.js` — `createApp({ db })` builds the Express app: routes, static-serves `client/dist` in production (catch-all `GET /{*path}` → `index.html`), and a single error-handling middleware that maps `HttpError`/JSON parse errors/unexpected errors to responses.
  - `src/index.js` — process entry point; reads `PORT`/`DB_FILE` env vars, wires `createApp`, handles `SIGINT`/`SIGTERM` shutdown.
- `client/`: React 19 + Vite SPA
  - `src/api.js` — thin fetch wrappers (`loadUsers`, `loadRequests`, `loadRequest`, `cancelRequest`) that unwrap `{ data }` and throw on `{ error }`.
  - `src/App.jsx` — top-level state: loads users, tracks the simulated `currentUserId`, loads visible requests on user change, loads a single request on selection.
  - `src/components/` — `UserSwitcher`, `RequestList`, `RequestDetails`, `StatusBadge`.
  - Vite dev server proxies `/api/*` to `http://localhost:3001` (see `vite.config.js`); in production Express serves the built client directly.

### Request flow

1. `App.jsx` loads users and picks a simulated current user (first user returned).
2. The client requests visible requests, passing `currentUserId` as a query param.
3. The API resolves and validates that user (`getCurrentUser` — must exist and be active).
4. `requests.js` applies role-based visibility entirely in SQL (`visibilityClause`).
5. The client renders the queue and fetches full details on selection; `getVisibleRequest` re-checks authorization per-record (admin sees all, reviewer must be the assigned reviewer, employee must be the requester) before returning data.

### Boundaries to preserve

- Identity is simulated: the client sends `currentUserId`, not real auth. Keep server-side visibility/authorization checks authoritative — never rely on the UI hiding something as the actual control.
- Visibility rules belong in `requests.js` (SQL `WHERE`/row checks), not in the client.
- Use parameterized SQL for every query — never interpolate request- or user-supplied values into a query string. Every existing query (`server/src/db.js`, `server/src/requests.js`) uses `db.prepare(...).run(...)`/`.get(...)` with bound parameters; keep that pattern for any new query.
- Domain errors are `HttpError` instances with an HTTP status and a machine-readable `code`; the app-level error middleware in `app.js` is the only place that converts errors to HTTP responses.
- Request statuses are `Draft`, `Submitted`, `Approved`, `Rejected`, `Cancelled`.
- Notifications, attachments, real authentication, and multi-level approval are out of scope entirely.

### Testing

- Server tests (`server/test/app.test.js`) use `createDatabase(":memory:")` and Node's built-in test runner (`node:test` / `node:assert/strict`) — no mocking of SQLite, exercise real queries against seeded fixture data (ids 1–6 for users, 101–105 for requests).
- Client tests use Vitest + Testing Library with jsdom (`client/src/test-setup.js`).
