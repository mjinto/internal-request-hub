# Architecture Guide

## Structure

- `client/`: React application built with Vite
- `server/`: Express API and SQLite access
- `server/src/db.js`: schema, seed data, and database creation
- `server/src/current-user.js`: simulated-current-user validation
- `server/src/requests.js`: request queries and visibility rules
- `server/src/app.js`: HTTP routes, static production hosting, and error handling

The Vite development server proxies `/api` to the Express server. In production, Express serves `client/dist`.

## Current request flow

1. `App.jsx` loads users and selects a simulated current user.
2. The client requests visible requests with `currentUserId`.
3. The API validates the selected user.
4. Request queries apply role-based visibility.
5. The client renders the queue and loads details for a selected request.

## Boundaries

- React controls presentation and interaction state.
- Express validates requests and converts domain errors to HTTP responses.
- Database modules enforce persistence rules using parameterized SQL.
- Server-side rules remain authoritative even when the UI hides an action.

## Verification

- Server tests use an in-memory SQLite database.
- Client tests use Vitest and Testing Library.
- CI runs lint, tests, and the production build on every pull request and on `main` and `audience-starter`.
- After review, run your exercise branch locally (`npm run dev` or `npm start`) and check `/api/health` to confirm the merged commit behaves as expected.
