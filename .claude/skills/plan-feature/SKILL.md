---
name: plan-feature
description: Plan an accepted change before implementation. Given a
  change folder with an accepted intent.md and spec.md, draft plan.md
  from the repository's plan template and stop for technical-reviewer
  acceptance before any implementation code is touched.
disable-model-invocation: true
---

# Plan a feature

Change folder: $ARGUMENTS

1. Read `<folder>/intent.md` and `<folder>/spec.md`. If either is
   missing, or its `State:` field is not `accepted`, report that gap
   and stop — do not invent or assume an acceptance that was not
   actually recorded.
2. Read `CLAUDE.md`, `constitution.md`, `docs/domain.md` and
   `docs/architecture.md` for project rules and context.
3. Inspect the relevant client, API, database and test files for real
   precedent — the existing route/handler/query shape, error
   conventions, and test patterns. Cite the actual files and
   functions you base the approach on.
4. Propose the smallest implementation approach consistent with the
   accepted spec. Note alternatives only where they materially change
   risk or effort.
5. Copy `training/work/_templates/plan.md` to `<folder>/plan.md` if it
   does not already exist, then write the plan into it using the
   template's sections.
6. In the Acceptance-to-evidence map, map every acceptance example
   from `spec.md` to an ordered checkpoint and a concrete automated
   check or manual observation — not a restatement of the example.
7. List risks and open questions in their section, including anything
   the spec left ambiguous.
8. State plainly, in the plan or in your report, that before this
   change is considered complete the diff needs: the
   `authorization-reviewer` agent, the `verify-checkpoint` skill (once
   this plan has its evidence map), and `/code-review` and
   `/security-review`.
9. Report the plan's path and a short summary, then stop. Do not edit
   application code, and do not mark `plan.md`'s approval record as
   accepted yourself — that decision belongs to the technical reviewer
   named in the constitution.
