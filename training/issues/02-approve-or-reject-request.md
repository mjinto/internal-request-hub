# Feature: Approve or reject an assigned request

## Business need

Reviewers need to decide requests assigned to them without changing requests owned by another reviewer.

## Confirmed rules

- Only the assigned reviewer may approve or reject a request.
- The request must be in `Submitted` status.
- Rejection requires a reviewer comment.
- A successful decision persists the new status.
- A failed decision leaves the request unchanged.

## Acceptance criteria

1. The assigned reviewer can approve a submitted request.
2. The assigned reviewer can reject a submitted request after entering a comment.
3. An unrelated reviewer cannot decide the request.
4. An employee or administrator cannot decide the request.
5. A non-submitted request cannot be decided again.
6. Failed attempts return a useful error and do not change stored data.

## Out of scope

- Reviewer reassignment
- Multi-level approvals
- Notifications
- Reopening a decided request

