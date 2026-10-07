# Domain Guide

## Roles

- **Employee:** sees requests they created.
- **Reviewer:** sees requests assigned to them.
- **Administrator:** sees all requests.

The current user is selected in the UI for training. This simulates identity and is not production authentication.

## Request fields

A request has a requester, optional assigned reviewer, category, priority, status, description, and timestamps.

Statuses are `Draft`, `Submitted`, `Approved`, `Rejected`, and `Cancelled`.

## Existing visibility rules

- Employees may view only their requests.
- Reviewers may view only requests assigned to them.
- Administrators may view every request.

## Exercise boundaries

- Request cancellation is issue #1.
- Approval and rejection are a separate exercise.
- Request history is a separate advanced exercise.
- Notifications, attachments, real authentication, and multi-level approval are outside scope.

If an issue does not define a business rule, record a question or assumption instead of extending this guide.
