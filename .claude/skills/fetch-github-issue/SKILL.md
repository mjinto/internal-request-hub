---
name: fetch-github-issue
description: Fetches a GitHub issue's title, state, labels, URL and
  body via the gh CLI, given an issue reference (a bare number for the
  current repo, owner/repo#number, or a full GitHub issue URL).
  Read-only - never comments on, labels, or closes the issue, and
  never writes a file. Invoked explicitly by name, either directly or
  as a step inside another skill (e.g. draft-intent-from-issue) that
  needs real issue content as its input.
disable-model-invocation: true
---

# Fetch a GitHub issue

Issue reference: $ARGUMENTS

1. If `$ARGUMENTS` is empty, report that an issue reference is
   required - a bare number (for the current repo), `owner/repo#number`,
   or a full GitHub issue URL - and stop.
2. Confirm `gh` is installed and authenticated: run `gh auth status`.
   If it fails, report the exact error (not a guess at the cause) and
   stop. Do not fabricate issue content if `gh` is unavailable.
3. Fetch the issue:
   `gh issue view <reference> --json number,title,state,url,labels,body`.
   If the issue can't be found or the command errors, report the real
   error and stop.
4. Report back, verbatim from the fetched JSON, never paraphrased or
   summarized:
   - Number, title, state, URL
   - Labels, if any
   - The full body text, unedited

Do not fetch or report comments - this is scoped to the issue's own
title/body/labels/state, to keep output bounded and predictable for
whatever calls it. Do not modify the issue in any way (no comments, no
label or state changes), and do not write any file - this skill only
reports what it found.
