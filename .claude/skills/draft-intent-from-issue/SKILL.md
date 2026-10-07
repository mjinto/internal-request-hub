---
name: draft-intent-from-issue
description: Given a GitHub issue reference and a change folder, fetches
  the issue (via the fetch-github-issue skill) and drafts intent.md in
  that folder from the project's intent template, grounded in the
  issue plus the repository's actual code and docs - leaving the
  acceptance decision pending for the product owner, the same gate
  rule as drafting intent.md by hand.
disable-model-invocation: true
---

# Draft an intent from a GitHub issue

Arguments: $ARGUMENTS - expected as two tokens:
`<issue-reference> <change-folder>`, e.g.
`42 training/work/some-feature` or
`owner/repo#42 training/work/some-feature`.

1. Parse `$ARGUMENTS`. If either the issue reference or the change
   folder is missing, report the gap and stop - do not guess a folder
   name or invent an issue reference.
2. Invoke the `fetch-github-issue` skill with the issue reference to
   get its number, title, state, labels, URL and body. If that fails,
   stop and report the failure - do not draft from a partial or
   imagined issue.
3. Read `training/work/_templates/intent.md` for the required
   sections, and `CLAUDE.md`, `docs/domain.md`, and
   `docs/architecture.md` (whichever exist) for project context - the
   same grounding used when intent.md is drafted by hand.
4. Create `<change-folder>/` if it doesn't exist. Draft
   `<change-folder>/intent.md` using the template's sections:
   - Problem and desired outcome, from the issue's title and body.
   - Scope and constraints, cross-checked against the actual
     repository - cite `CLAUDE.md`/`docs/domain.md`/
     `docs/architecture.md` specifically where a constraint comes from
     the project rather than the issue.
   - Open questions, for anything the issue leaves ambiguous - do not
     invent an answer the issue itself doesn't give.
   - Acceptance decision left pending, for the product owner to accept
     or correct.
5. Record the issue's number and URL at the top of `intent.md` as its
   source, so the artifact stays traceable back to the real issue.
6. If `<change-folder>/intent.md` already exists, propose changes for
   review rather than silently overwriting it.

Do not draft `spec.md` or `plan.md`, and do not edit application code -
this skill stops once `intent.md` is written. The product owner reviews
and accepts it before anyone drafts the specification, exactly as in
the by-hand workflow.
