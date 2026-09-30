# Internal Request Hub

Internal Request Hub is the starter application for the AI-300 greenfield software development course. Employees can view their requests, reviewers can view requests assigned to them, and administrators can view all requests.

The repository intentionally provides a small but realistic base. Approval, rejection, cancellation, and request-history workflows are not implemented; they are reserved for demonstrations and participant exercises.

## Technology

- React and Vite
- Node.js and Express
- SQLite
- Node's built-in test runner
- ESLint

## Requirements

- Node.js 22 or later
- npm 10 or later

## Start locally

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. The API runs on <http://localhost:3001>.

The app creates and seeds `server/data/request-hub.db` on first start.

## Useful commands

```bash
npm run dev       # Start the web app and API
npm test          # Run server and client tests
npm run lint      # Run static checks
npm run build     # Build the React app
npm start         # Run the production server
npm run db:reset  # Delete and recreate the local database
```

## Verify a merged change locally

There is no hosted deployment for this course. GitHub Actions runs lint, tests, and the build on every pull request and on `main` (see `.github/workflows/ci.yml`). After merging a reviewed pull request, verify the change by running the merged `main` commit locally:

```bash
git switch main
git pull
npm install
npm run build
npm start        # serves the built client and API together on port 3001
```

Check `/api/health` and the relevant feature scenario in the browser. The SQLite database persists in `server/data/request-hub.db` between runs, so a restart does not lose data; use `npm run db:reset` to return to the seeded state, including for a rollback rehearsal (`git revert`/`git checkout` the previous commit, restart, verify, then restore).

## Simulated identity

The user selector represents the current signed-in user. It exists only for training and local demonstration. The API accepts `currentUserId` to apply basic data visibility rules. This is not production authentication.

## Current behavior

- Employees see requests they created.
- Reviewers see requests assigned to them.
- Administrators see all requests.
- Users can open a request and see its details.
- Unknown, inactive, or unauthorized users receive a clear API error.

See [`training/issues`](training/issues) for the prepared exercises.
