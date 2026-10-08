# Feature: Cancel a submitted request

## Business need

Employees sometimes submit a request by mistake or no longer need it. They need a way to cancel an eligible request without contacting a reviewer.

## Confirmed rules

- An employee may cancel only a request they created.
- Only a request in `Submitted` status may be cancelled.
- A successful cancellation changes the status to `Cancelled`.
- A failed cancellation must leave the request unchanged.
- Cancellation does not send a notification.

## Acceptance criteria

1. The requester can cancel their submitted request from its detail page.
2. The status changes to `Cancelled` and remains cancelled after the page reloads.
3. Another employee cannot cancel the request.
4. A reviewer or administrator cannot cancel a request on behalf of the requester.
5. An approved, rejected, cancelled, or draft request cannot be cancelled.
6. Failed attempts return a useful error and do not change stored data.

## Out of scope

- Reopening a cancelled request
- Cancellation reasons
- Notifications
- Bulk cancellation

