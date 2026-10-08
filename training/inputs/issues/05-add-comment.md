# Feature: Add a comment to a request

## Business need

Employees, reviewers, and administrators who can already see a
request need a simple way to record a note on it — a clarifying
question, context for a decision, or a follow-up — without changing
the request's status.

## Confirmed rules

- Anyone who can already view a request may add a comment to it.
- A comment requires non-empty text.
- Comments are visible only to users who can already view the
  request — the same rule that already governs viewing the request
  itself.
- Comments display oldest first, each with its author and timestamp.
- Adding a comment never changes the request's status, priority, or
  reviewer decision.

## Acceptance criteria

1. A user who can view a request can add a comment to it from the
   request's detail page.
2. A new comment appears with its author and timestamp.
3. A user who cannot view a request cannot add a comment to it, and
   cannot see any of its comments.
4. An empty or whitespace-only comment is rejected with a useful
   error, and no comment is stored.
5. Comments appear in chronological order, oldest first.
6. Adding a comment does not alter the request's `status`,
   `priority`, or `reviewer_comment`.

## Out of scope

- Editing or deleting a comment
- Replying to a specific comment (threading)
- Notifications
- Comments on anything other than a request
