# Feature: Reassign a request's reviewer

## Business need

Reviewers sometimes become unavailable after a request is assigned.
Administrators need to redirect a submitted request to a different
active reviewer, without involving the original reviewer or the
requester.

## Confirmed rules

- Only an administrator may reassign a request's reviewer.
- The request must be in `Submitted` status.
- The new reviewer must be an active user with the reviewer role.
- A successful reassignment updates the assigned reviewer and takes
  effect immediately: the new reviewer can see the request, and the
  previous reviewer no longer can.
- A failed reassignment leaves the request unchanged.

## Acceptance criteria

1. An administrator can reassign a submitted request from one active
   reviewer to another.
2. After reassignment, the newly assigned reviewer sees the request
   in their list; the previous reviewer no longer does.
3. An employee or reviewer cannot reassign a request.
4. The administrator cannot reassign to an inactive reviewer.
5. The administrator cannot reassign to a user who is not a reviewer
   (an employee or another administrator).
6. A non-submitted request (draft, approved, rejected, or cancelled)
   cannot be reassigned.
7. Failed attempts return a useful error and do not change stored
   data.

## Out of scope

- Reassigning the requester (ownership never changes)
- Notifications to either reviewer
- Carrying forward or clearing the previous reviewer's comment
- Bulk reassignment
