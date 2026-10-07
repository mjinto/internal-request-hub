# Domain Guide

## Identity (simulated)

There is no real authentication. `UserSwitcher` lets the person using the UI pick a "current user" from the active users returned by `GET /api/users`; the client sends that id as `currentUserId` on every API call, and the server resolves and validates it (`current-user.js`) per request — it is not a session, a cookie, or a token. An invalid, unknown, or inactive user id is rejected by the API (see Errors below) even if the client somehow sent one.

## Roles

| Role | Visibility |
|---|---|
| `employee` | Requests where `requester_id` equals their own id |
| `reviewer` | Requests where `assigned_reviewer_id` equals their own id |
| `admin` | Every request |

These are the only three roles (`users.role CHECK (role IN ('employee', 'reviewer', 'admin'))`). A user also has `active` (boolean); inactive users are excluded from `GET /api/users` and cannot be selected as the current user at all — attempting to use one as `currentUserId` fails with `401 INVALID_CURRENT_USER`.

Role determines both the *list* view (`GET /api/requests`, enforced in SQL) and *single-record* access (`GET /api/requests/:id`, re-checked independently in application code): a reviewer who is not the assigned reviewer on a given request gets `403 REQUEST_FORBIDDEN` even if they know its id.

## Entities

### User (`users` table)

| Field | Type | Notes |
|---|---|---|
| `id` | integer, PK | |
| `name` | text | |
| `email` | text | unique |
| `role` | text | `employee` \| `reviewer` \| `admin` |
| `active` | integer (0/1) | inactive users are hidden and cannot sign in |

### Category (`categories` table)

| Field | Type | Notes |
|---|---|---|
| `id` | integer, PK | |
| `name` | text | unique |

Seeded categories: **Equipment**, **Software Access**, **Training**, **Workplace Services**.

### Request (`requests` table)

| Field | Type | Notes |
|---|---|---|
| `id` | integer, PK | |
| `title` | text | |
| `description` | text | free text |
| `category_id` | integer, FK → `categories.id` | required |
| `requester_id` | integer, FK → `users.id` | required; the request's owner |
| `assigned_reviewer_id` | integer, FK → `users.id` | nullable — a `Draft` request may have no reviewer yet |
| `priority` | text | `Low` \| `Medium` \| `High` |
| `status` | text | `Draft` \| `Submitted` \| `Approved` \| `Rejected` \| `Cancelled` |
| `reviewer_comment` | text | nullable; shown in the UI only when present (e.g. rejection reason) |
| `created_at` / `updated_at` | text (ISO 8601 UTC) | |

Indexes exist on `requester_id`, `assigned_reviewer_id`, and `status` (`server/src/db.js`).

### Status values

`Draft`, `Submitted`, `Approved`, `Rejected`, `Cancelled` — enforced by a SQL `CHECK` constraint; there is no application-level state machine governing *transitions* between them, because nothing in the current app changes a request's status (see Exercise boundaries).

## Seed data

Seeded once, only when the `users` table is empty (`server/src/db.js`, `seed()`):

**Users**

| id | name | role | active |
|---|---|---|---|
| 1 | Maya Nair | employee | yes |
| 2 | Rahul Shah | employee | yes |
| 3 | Priya Menon | reviewer | yes |
| 4 | Daniel George | reviewer | yes |
| 5 | Alex Thomas | admin | yes |
| 6 | Former Reviewer | reviewer | **no** (inactive, for testing the inactive-user error path) |

**Requests**

| id | title | category | requester | reviewer | priority | status |
|---|---|---|---|---|---|---|
| 101 | Additional monitor | Equipment | Maya Nair (1) | Priya Menon (3) | Medium | Submitted |
| 102 | API testing tool | Software Access | Maya Nair (1) | Daniel George (4) | High | Approved |
| 103 | Advanced React workshop | Training | Rahul Shah (2) | Priya Menon (3) | Low | Submitted |
| 104 | Ergonomic keyboard | Equipment | Rahul Shah (2) | Daniel George (4) | Medium | Rejected (has a `reviewer_comment`) |
| 105 | Design software license | Software Access | Maya Nair (1) | *none* | Low | Draft |

So, under the seeded data: Maya Nair (employee) sees requests 105, 101, 102; Priya Menon (reviewer) sees 103, 101; Alex Thomas (admin) sees all five.

## Current behavior

- Employees see only requests they created.
- Reviewers see only requests assigned to them.
- Administrators see every request.
- Any user can open a request's full detail (description, category, priority, requester, assigned reviewer, created/updated timestamps, reviewer comment if any) provided the same visibility rule allows it.
- Unknown, missing, or inactive `currentUserId` values produce a clear API error (`400 CURRENT_USER_REQUIRED` or `401 INVALID_CURRENT_USER`) rather than silently falling back to a default user.
- Requesting a real request id outside the caller's visibility yields `403 REQUEST_FORBIDDEN`; requesting a non-existent id yields `404 REQUEST_NOT_FOUND`; a non-numeric id yields `400 INVALID_REQUEST_ID`.

## Errors

All API errors share the shape `{ "error": { "code": "...", "message": "..." } }`. Known codes, in order of where they're raised:

| Code | Status | Raised when |
|---|---|---|
| `INVALID_JSON` | 400 | Request body fails to parse as JSON |
| `CURRENT_USER_REQUIRED` | 400 | `currentUserId` is missing or not a number |
| `INVALID_CURRENT_USER` | 401 | `currentUserId` doesn't match an existing **active** user |
| `INVALID_REQUEST_ID` | 400 | `:id` path param is not a number |
| `REQUEST_NOT_FOUND` | 404 | No request exists with that id |
| `REQUEST_FORBIDDEN` | 403 | The request exists but the current user's role doesn't grant access to it |
| `INTERNAL_ERROR` | 500 | Default/fallback for anything else (logged server-side) |

## Exercise boundaries (explicitly out of scope for the base app)



- **Notifications, attachments, real authentication, and multi-level approval** are outside the scope of this course entirely — do not design around them.

If a future issue or request doesn't define a business rule explicitly, record the open question or assumption rather than inventing one and extending this guide unilaterally.
