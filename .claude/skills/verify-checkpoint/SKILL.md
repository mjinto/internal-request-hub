---
name: verify-checkpoint
description: Given a change folder, verify an implemented change
  against its plan.md before requesting engineer review - run the real
  test/lint/build commands, invoke the authorization-reviewer agent,
  and check every acceptance example in the plan's evidence map
  actually has passing evidence.
disable-model-invocation: true
---

# Verify a checkpoint

Change folder: $ARGUMENTS

1. Read `<folder>/plan.md`. If the folder or `plan.md` is missing,
   report that and stop.
2. Run `npm test`, `npm run lint`, and `npm run build` from the repo
   root. Report the real pass/fail result for each, including the
   actual failing output when something fails — never report a pass
   you did not observe.
3. Invoke the `authorization-reviewer` agent against the current diff
   (`git diff`). Include its findings in the report verbatim.
4. For every row in `plan.md`'s Acceptance-to-evidence map, locate the
   test or manual-check evidence it names and confirm it actually
   exists and currently passes. Report any acceptance example with no
   real evidence yet as not verified, rather than assuming the plan's
   claim already holds.
5. End with one summary: a table of acceptance example → verified
   (yes/no) → note, followed by the authorization-reviewer's findings,
   followed by a single plain pass/fail recommendation for engineer
   review.

Do not edit application code. Do not mark anything verified that you
did not actually run or read yourself.
