# Internal Request Hub — Domain Guide

This guide describes what the application actually does today, based on
its code and data. It is written for anyone deciding what the product
should do next, not for engineers. Every statement is labeled:

- **Confirmed** — directly observable in the running application's logic or data.
- **Inference** — a reasonable reading of the evidence, but not stated outright anywhere.
- **Open question** — something a reviewer needs to decide or clarify; not yet answered by the system.

---

## 1. What this application is for

**Confirmed.** This is an internal tool for tracking requests that
employees make to the organization — for things like equipment,
software access, training, or workplace services. An employee records
what they want, and the request becomes visible to the reviewer
assigned to it and to administrators.

**Confirmed.** The application today is a **read-only tracking and
visibility tool**. There is no way, anywhere in the running
application, to create a new request, submit one for review, approve
it, reject it, cancel it, reassign its reviewer, or add a reviewer's
comment. Every request currently visible in the system was placed there
ahead of time as example data, not created through the app itself.

**Inference.** The intended product is a request-and-approval workflow
(an employee asks for something, a reviewer decides on it), but only
the "viewing what was asked for" half of that workflow exists right
now.

---

## 2. Roles and simulated identity

**Confirmed.** Every person in the system has exactly one role:
- **Employee** — someone who submits requests.
- **Reviewer** — someone requests are assigned to for review.
- **Administrator** — someone with an overview of all requests.

**Confirmed.** There is no login or password. Instead, the screen has a
"Viewing as" selector where you pick which person you want to browse
the system as. This is explicitly a simulation for training/demo
purposes, standing in for a real sign-in.

**Confirmed.** Even though identity is simulated, the server — not just
the screen — enforces who can see what based on the selected person's
role. Switching the "Viewing as" selection is the only way the
application changes whose requests you see; there is no separate
concept of "logging in."

**Confirmed.** A person can be marked inactive. An inactive person
cannot be selected as the current viewer at all — they don't appear in
the selector, and if their identity is somehow used anyway, the system
refuses it.

**Open question.** What should happen to an inactive reviewer's
existing assignments (e.g., does another reviewer need to pick them
up)? Nothing in the system currently handles this — it's a case a
real workflow would need to address.

---

## 3. Entities and what they mean

**Confirmed.** The system tracks three kinds of records:

- **People** — name, email, role (employee / reviewer / administrator),
  and whether they're currently active.
- **Categories** — a fixed list of request types the organization
  recognizes: *Equipment*, *Software Access*, *Training*, and
  *Workplace Services*. Every request belongs to exactly one category.
- **Requests** — the core record. Each one has a title, a free-text
  description, a category, a priority (*Low* / *Medium* / *High*), a
  status (see below), the employee who asked for it, the reviewer
  it's assigned to (if any), an optional reviewer comment, and the
  dates it was created and last updated.

**Confirmed.** A request does not have to have a reviewer assigned —
one of the example requests has no reviewer at all.

**Inference.** The category list (*Equipment*, *Software Access*,
*Training*, *Workplace Services*) reads as a starting set for a
request-management tool, not a definitive business taxonomy — there's
nothing indicating these four are final or exhaustive.

**Open question.** Who decides the category list, and can it be
changed or extended by anyone through the product, or only by someone
editing the system directly? Today, nothing in the running application
lets anyone add, rename, or remove a category.

---

## 4. Who can see which requests

**Confirmed.** Visibility is strictly role-based and applies to every
request in the system:

- An **employee** sees only the requests **they personally submitted**.
- A **reviewer** sees only the requests **assigned specifically to
  them** — not requests assigned to other reviewers, even if those
  requests are in the same category.
- An **administrator** sees **every** request in the system, regardless
  of who submitted or is reviewing it.

**Confirmed.** This rule is enforced centrally, not just by what the
screen chooses to display — even if someone tried to view a specific
request directly by its number, the same role-based rule decides
whether they're allowed to see it.

**Confirmed.** There is no concept of a request being shared with, or
visible to, anyone beyond the requester, the one assigned reviewer, and
administrators. For example, a second reviewer cannot see a request
assigned to a colleague, and a co-worker cannot see a peer's request
just because they work on a related category.

**Open question.** Is there a business need for broader visibility —
e.g., a team of reviewers all seeing a shared queue instead of only
their personally assigned items? The current rule assumes assignment
is always to one specific individual.

---

## 5. Status values and what each one currently means

**Confirmed.** A request can carry one of five status labels: *Draft*,
*Submitted*, *Approved*, *Rejected*, or *Cancelled*. These are the only
values the system will store.

**Confirmed — and important.** None of these status values currently
do anything beyond being displayed. There is no button, action, or
automated process anywhere in the running application that moves a
request from one status to another, checks that a transition is valid,
or records when/why a status changed. A request's status is set once,
as example data, and the application only ever displays it — it does
not enforce any order between statuses (nothing stops a record from
existing as "Approved" with no prior "Submitted" stage, for instance).
**The presence of these five values in the data is not evidence that
an approval workflow is implemented — it only shows that the system
can label a request with one of these words.**

Given that, here is what each label currently represents — a
description, not a stage in an enforced process:

- **Draft** — reads as "not yet finalized by the employee." In the
  example data, a Draft request has no reviewer assigned yet.
- **Submitted** — reads as "waiting for the reviewer's decision."
- **Approved** — reads as "the reviewer agreed to the request."
- **Rejected** — reads as "the reviewer declined the request." In the
  example data, a Rejected request carries an explanatory comment from
  the reviewer.
- **Cancelled** — reads as "no longer active," though no example
  request currently uses this status.

**Inference.** The reviewer comment field appears meant for reviewers
to explain their decision (it's populated on the one rejected example
and empty elsewhere), but since there's no way to actually reject a
request in the app, there's also no way for a real reviewer to write
one.

**Open question.** What should actually be required to move a request
between these statuses (who can do it, what information is needed,
whether a comment is mandatory on rejection, whether a status change
should be reversible) is undecided — this guide can't answer it because
nothing in the system attempts it yet.

---

## 6. Access and error situations, in plain language

**Confirmed.** The system handles a specific set of situations where
someone can't get what they asked for, each with its own plain message:

- **No viewer selected, or an invalid one.** If the system can't tell
  who you're browsing as, it refuses and asks you to select a current
  user.
- **Viewer doesn't exist, or is inactive.** If the selected person
  isn't a real, active person in the system, the system says that
  person is unavailable and refuses to show anything.
- **Asking for a specific request by a non-existent number.** The
  system says the request wasn't found.
- **Asking for a specific request using an invalid identifier** (for
  example, text instead of a number). The system says the identifier
  must be a number.
- **Asking for a specific request you're not allowed to see** (not
  your own, not assigned to you, and you're not an administrator). The
  system says you cannot view this request — it does not reveal
  anything about the request's content, just that it's off-limits.

**Confirmed.** In every one of these cases, the person is shown a
plain explanatory message rather than a blank screen or a crash.

**Inference.** These messages appear designed for an internal/training
audience (they're direct and technical-adjacent, e.g. "the selected
user is unavailable") rather than consumer-friendly copy — worth a
pass if this is ever shown to end users outside a demo context.

---

## 7. Workflows that are not implemented

Based on what the application can and cannot do today, the following
are explicitly **not available**, anywhere, to any role:

- **Creating a new request.** There is no way for an employee (or
  anyone) to submit a new request through the application. All
  requests visible today exist only as pre-loaded example data.
- **Submitting a Draft request for review.**
- **Approving or rejecting a request.**
- **Cancelling a request.**
- **Reassigning a request to a different reviewer, or assigning a
  reviewer to an unassigned request.**
- **Adding or editing a reviewer's comment.**
- **Any history or audit trail of a request's past statuses or
  changes.** The system only ever shows a request's current state —
  there's no way to see what it looked like before, or who changed it.
- **Notifications** to employees or reviewers about new or updated
  requests.
- **Attachments** of any kind on a request.
- **Real sign-in/authentication**, as distinct from the simulated
  "viewing as" selector.
- **Multiple levels or rounds of approval** (e.g., escalation to a
  second reviewer or administrator).

**Open question.** All of the above are natural next steps for this
kind of tool, but none should be assumed to be "coming soon" or
scoped — that decision belongs to whoever owns this product's roadmap.

---

*This document reflects the application's behavior as of the current
codebase and example data. It should be revisited whenever the
underlying behavior changes materially.*
