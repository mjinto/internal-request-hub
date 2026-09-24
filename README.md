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

## Deploy to Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

The repository includes a `render.yaml` Blueprint for a free Render web service. During setup, connect the private GitHub repository and allow Render access to it. Render deploys `main` only after its GitHub checks pass and verifies the service through `/api/health`.

The free service uses an ephemeral filesystem. Its seeded SQLite database is recreated when the service restarts, redeploys, or wakes after spinning down. This makes the deployment suitable for demonstrations and resettable training exercises. Use PostgreSQL or a paid persistent disk if request data must survive restarts.

## Simulated identity

The user selector represents the current signed-in user. It exists only for training and local demonstration. The API accepts `currentUserId` to apply basic data visibility rules. This is not production authentication.

## Current behavior

- Employees see requests they created.
- Reviewers see requests assigned to them.
- Administrators see all requests.
- Users can open a request and see its details.
- Unknown, inactive, or unauthorized users receive a clear API error.

See [`training/issues`](training/issues) for the prepared exercises.
