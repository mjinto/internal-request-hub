# Live demo: add Claude Code to Internal Request Hub

Use this guide to walk one change through intent, specification and plan by hand, then write down the shared project rules and automate the repeatable parts for the next change. Estimated segment: 30–40 minutes, depending on discussion.

This is an instruction guide. It does not pre-create Claude configuration or implement an exercise. Terminal commands and prompts below are actions for the presenter to perform during the demo.

## The story to tell

“Each developer can give an agent a different set of instructions. We will first walk one small change through intent, specification and plan by hand, so everyone feels what the manual process is like. Only then will we write that down as shared rules and automate the repeatable parts — Claude can discover facts about the repository, but the team must decide the rules it should follow.”

| Step | Action | Audience takeaway |
| --- | --- | --- |
| 1 | Verify the starter and create a demo branch | Begin from a known baseline |
| 2 | Launch Claude and run `/init` | Discover initial project context |
| 3 | Review the generated `CLAUDE.md` | Inspect the initialization output |
| 4 | Discover and review `docs/domain.md` | Establish what the application currently does |
| 5 | Discover and review `docs/architecture.md` | Establish how the application currently works |
| 6 | Walk the cancellation change through intent, spec and plan, by hand | Feel the manual process before automating it |
| 7 | Create `constitution.md` | Write down the rules we just followed, for every future change |
| 8 | Import the reviewed documents from `CLAUDE.md` | Connect shared understanding and rules to the agent |
| 9 | Confirm the context loaded | Check the wiring, not just the filenames |
| 10 | Create a planning skill | Turn the repeated plan-drafting step into a procedure |
| 11 | Review and checkpoint the setup | Inspect what actually changed |

## Before presenting

- Have Claude Code installed and signed in using your own account. Installation and account setup are outside this repo demo; see the official [setup instructions](https://code.claude.com/docs/en/setup).
- Rehearse with the installed version: `claude --version`. Interface details and generated `/init` content can vary by version and user configuration.
- Use Node.js 22.13 or later and npm 10 or later. Allow time for dependency installation before the live session.
- Inspect `git status --short`. Save unrelated work before switching branches. Do not reset or clean someone else's work to obtain a fresh demo.
- Check whether `docs/domain.md`, `docs/architecture.md`, `CLAUDE.md`, `constitution.md`, `training/work/cancel-request/` or `.claude/` already exist. On a reused demo checkout, review or reuse them; `/init` may suggest changes to an existing file instead of creating a new one.
- Existing personal or parent-directory Claude instructions can also affect the session. Keep the distinction between personal settings and the repository's shared rules visible.

## Step 1 — Open and verify the starter

**Terminal:**

```bash
cd /Users/jintomenachery/Documents/Codex/2026-09-21/we/outputs/internal-request-hub
git status --short
git switch audience-starter
git switch -c demo/claude-foundations
npm ci
npm test
npm run lint
npm run build
```

If the demo branch already exists, use `git switch demo/claude-foundations` and inspect its current state. Participants use the path of their own clone and their own feature branch name.

Run the application in another terminal:

```bash
npm run dev
```

Open http://localhost:5173. Show Maya's submitted request 101 and the absence of a cancellation action. The user selector simulates identity; the application is not a production authentication system.

**Say:** “We know what currently works, and we have an unfinished feature to work on. We will walk that feature through its first few steps by hand before deciding on any shared rules.”

**Checkpoint:** Baseline tests, lint and build pass. No feature changes have started.

## Step 2 — Start Claude, then initialize the project

**Terminal, from the repository root:**

```bash
claude
```

**Inside Claude Code:**

```text
/init
```

The command is `/init` inside the Claude session, not `claude init` in the shell. Let Claude inspect the repository and prepare its initial project guidance. Review normal tool permissions as they appear.

**Say:** “Initialization helps discover the stack, commands and existing structure. It cannot infer every team decision or approval rule.”

**Checkpoint:** Open the generated or proposed `CLAUDE.md`. If the installed version offers a broader initialization flow, choose project guidance first and keep additional setup within the agreed demo scope.

## Step 3 — Review CLAUDE.md

Open the generated `CLAUDE.md` and review it with the audience. Keep this step focused on the initialization output; domain and architecture discovery follow in steps 4 and 5.

Review the stated stack, available commands and basic repository orientation. Check commands against `package.json`, flag obviously unsupported claims, and note anything that needs later investigation. Do not expand this into a detailed domain or architecture analysis or add the project constitution yet.

**Optional Claude prompt:**

```text
Review the generated CLAUDE.md only. Check its commands against
package.json and flag unsupported claims or unclear wording.
Report concise findings for my review. Do not edit files, conduct a
detailed domain or architecture analysis, or implement features.
We will create and review the domain and architecture documents next.
```

**Say:** “This is Claude's initial understanding of the repository. We are reviewing the starting point. Next we will investigate the domain and architecture in more detail before touching the feature.”

**Checkpoint:** The audience understands what `/init` produced. Findings are noted for later correction; this review does not imply that the full domain or architecture has been validated. No feature changes have started.

## Step 4 — Discover and review the domain

**Say:** “Before changing the application, we need a shared understanding of what it does today. We will derive a domain draft from the code, then review that interpretation with the product-owner role.”

On a fresh workshop starter, create this document now. In this checkout the document already exists: review and improve it instead of overwriting it blindly. To demonstrate discovery from scratch, ask for a separate draft first and compare it with the existing document after review. Do not delete prepared references merely to make the demo look fresh.

**Claude prompt:**

```text
Inspect the current application code, schema, seed data and tests, but
write for a product-owner audience, not an engineer. Propose a domain
guide describing the problem this application solves and the business
area it covers, based on implemented behavior only, not desired features.

Cover: the purpose of the app, roles and simulated identity, entities and
their meaning in plain business terms, request visibility rules, status
values and what currently happens at each one, access/error cases in
plain language (not HTTP codes), and workflows that are not yet
implemented.

Write every rule as a plain statement of behavior - do not cite files,
functions, or line numbers in the body. Label each statement as
Confirmed, Inference, or Open question so a non-technical reviewer knows
which claims are solid and which need a decision. Do not invent business
rules, and do not treat a database status value as proof that a
status-transition workflow exists.

Do not implement features or edit application code.
If docs/domain.md exists, propose changes for review without overwriting
it. Otherwise write a draft at docs/domain.md for review.
```

Review the draft with the audience. Have the technical-reviewer role trace at least one visibility rule to the server code and its tests separately, since the document itself intentionally omits file/function citations. Check that cancellation, approval/rejection and history are not represented as existing workflows merely because status fields exist.

**Suggested structure:** purpose, identity and roles, entities, current behavior, state/workflow boundaries, errors, open questions. Keep the language business-facing throughout; code-level evidence belongs in the architecture discovery step (step 5), not here.

**Checkpoint:** The domain guide describes the current application. The product-owner role reviews the interpretation; the engineer checks code evidence. Where intended behavior and implemented behavior differ, record the mismatch instead of calling either one automatically correct. Apply only the accepted documentation changes.

## Step 5 — Discover and review the architecture

**Say:** “We understand what the application does. Now we need to understand how it works, so the agent can extend the existing design rather than invent a new one.”

**Claude prompt:**

```text
Inspect package.json, the client/server source, startup code, database code,
existing tests and CI configuration. Use the reviewed domain guide as
context, but verify architecture claims against the implementation.
Propose docs/architecture.md covering the stack, repository structure,
request flow from React through Express to SQLite, responsibility boundaries,
identity and access enforcement, database lifecycle, development versus
production serving, and actual verification commands.
Trace one request-list or request-detail call through the real files.
Cite file/function evidence for each claim. Label each claim as Confirmed,
Inference, or Open question, the same convention used in the domain guide,
so uncertainty and gaps are explicit rather than implied. A simple Mermaid
flow diagram is useful if it accurately describes the code.
Describe current architecture separately from recommendations.
Do not change application code, dependencies or deployment configuration.
If the document exists, propose edits for review rather than overwriting it.
```

Walk through the request trace with the technical-reviewer role. Confirm where the server enforces visibility, how the development proxy reaches the API, and how SQLite is created and seeded. SQLite is local; Docker and a separate database server are not needed. Check that the commands match the package scripts and your baseline results.

**Suggested structure:** stack, module map, request flow, boundaries, persistence, runtime modes, verification, evidence references and open questions.

**Checkpoint:** The technical-reviewer role accepts or corrects the architecture description. Apply the reviewed documentation edits. Keep proposals separate from current implementation facts.

**Transition:** “We now understand what the application does and how it's built. Before we write down any rules, let's run one small change through the shape of the work by hand.”

## Step 6 — Walk the cancellation change through intent, spec and plan, by hand

**Say:** “We are not going to write down any rules yet. We are going to draft intent, then spec, then plan for one real change — by hand, from memory, with nothing enforcing the order except our own discipline. The rules we write afterward should describe what we actually did here, not something invented in the abstract.”

**Continuation prerequisite:** Confirm `training/inputs/issues/` and `training/inputs/templates/` are present in this checkout before running the copy commands below. Steps 1–5 can be demonstrated independently; do not invent missing requirements to continue.

Return to the intent and specification slides. Read `training/inputs/issues/01-cancel-request.md` with the audience.

**Terminal:**

```bash
mkdir -p training/work/cancel-request
cp training/inputs/templates/intent.md training/work/cancel-request/intent.md
cp training/inputs/templates/spec.md training/work/cancel-request/spec.md
```

**Claude prompt (intent):**

```text
Read training/inputs/issues/01-cancel-request.md and our project guidance.
Draft the intent in training/work/cancel-request/intent.md using its
existing sections. Separate confirmed rules from questions. Keep the
acceptance decision pending for the product-owner role. Do not modify
application code or expand into other exercises.
```

Have the product-owner role accept or correct the intent before continuing.

**Claude prompt (spec):**

```text
Using the accepted training/work/cancel-request/intent.md, draft
training/work/cancel-request/spec.md from its template, covering
success, denied actors, invalid statuses, persistence and unchanged
data on failure. Separate confirmed rules from questions. Keep the
acceptance decision pending for a reviewer. Do not modify application
code.
```

Have a reviewer accept or correct the spec; record only the actual decision made. Do not create `plan.md` yet — copy its template only once the spec is accepted:

```bash
cp training/inputs/templates/plan.md training/work/cancel-request/plan.md
```

**Claude prompt (plan):**

```text
Read the accepted training/work/cancel-request/intent.md and spec.md,
along with CLAUDE.md, docs/domain.md and docs/architecture.md. Inspect
repository behavior and cite files. Using the
training/work/cancel-request/plan.md template, draft the smallest
implementation approach consistent with the accepted spec. Map every
acceptance example to a checkpoint and verification method. Flag risks
and open questions. Do not edit application code — stop once the plan
is written for review.
```

Have a reviewer accept or correct the plan. Check it with the audience:

- Does it use real repository files and existing patterns?
- Does it enforce cancellation eligibility on the server?
- Does it map every acceptance example to evidence?
- Does it preserve unrelated visibility behavior and exercise scope?
- Has it stopped before application edits?

**Terminal:**

```bash
git add training/work/cancel-request
git diff --cached
git commit -m "Capture the cancellation change: accepted intent, spec and plan"
```

**Say:** “Notice three different roles each accepted one artifact before the next was drafted — the product owner for intent, a reviewer for spec, a reviewer for plan. We did all of that by hand, with nothing enforcing the order or who was allowed to approve what. Let's write that down so it isn't memory-dependent next time.”

**Checkpoint:** `training/work/cancel-request` contains an accepted `intent.md`, `spec.md` and `plan.md`, each drafted only after the previous one was reviewed. Implementation has not started — that stays a separate, later decision.

## Step 7 — Agree and create the project constitution

**Say:** “We just followed a shape by hand: intent approved by the product owner, spec approved by a reviewer, plan approved by a reviewer, in that order. Now we write that shape down as a rule, so the next feature starts from an agreed convention instead of an ad hoc memory of what we did last time. CLAUDE.md is the entry point for the agent; the constitution is the shared rule source for the team. We choose this filename — it has no special automatic-loading behavior.”

**Claude prompt:**

```text
Draft constitution.md at the repository root for team review, and propose
a lightweight spec-driven SDLC convention for how we develop every
feature in this repo going forward.

Use the newly reviewed docs/domain.md and docs/architecture.md as
project context. Separate existing facts from the rules the team agrees.

Include these proposed team rules in constitution.md:
- Keep the existing JavaScript, React, Express and SQLite stack.
- Keep HTTP handlers thin and database behavior in focused modules.
- Use parameterized SQL and enforce access/state rules on the server.
- Preserve the existing API error shape and visibility behavior.
- Keep each change within its assigned exercise.
- Map acceptance examples to verification, including denied actions.
- Run tests, lint and build and inspect the diff before completion.
- Record who reviews changes and exceptions; never invent approval.
- Keep simulated identity; no real authentication, notifications or
  external services are part of this exercise.

Also document this spec-driven workflow as a team rule, in place of a
single "agree intent and specification" line:
- Each feature gets its own folder under specs/<feature-name>/,
  containing three artifacts in strict order: intent.md, then spec.md,
  then plan.md.
- intent.md records the problem, outcome and scope. The originator
  drafts it; the product owner accepts it.
- spec.md records behavior, design and constraints. The engineer drafts
  it; the technical lead approves it.
- plan.md records implementation steps and checks. The engineer owns it;
  the technical reviewer accepts it.
- An artifact for a phase is only drafted once the previous phase's
  artifact in that same folder has been explicitly approved by its named
  approver. Do not draft the next phase's artifact, and do not invent or
  assume an approval that was not actually given.
- Once plan.md is approved, implementation proceeds to a diff, then a
  review of that diff.
- Review findings return to whichever earlier decision needs correction,
  not forward to a new artifact: a defect in the implementation returns
  to the diff for a fix; an unsuitable approach returns to plan.md for
  revision; unclear behavior returns to spec.md for clarification.
  Record which stage a finding was routed back to.
- Record the actual approval decision and approver for each phase
  transition inside the artifact itself (or a short note beside it);
  never mark a phase approved on the agent's own authority.
- These saved records are what carry decisions forward between sessions
  — do not rely on replaying prior chat history to reconstruct a
  decision; read the artifact instead.
- Propose a short specs/README.md describing this convention (the three
  artifacts, their owners/approvers, the gate rule, and the diff/review
  feedback loop) and a blank template for intent.md, spec.md and plan.md,
  for reuse by future features.

Do not implement features or claim these rules already have technical
approval enforcement. Do not scaffold a specs/ folder for any specific
feature yet — only the convention, its README, and the blank templates.
Report any conflict with the current repository, including the existing
training/inputs/templates and the training/work/cancel-request/{intent,spec,plan}.md
artifacts just created by hand in the previous step — note in particular
that those artifacts used informal, undifferentiated reviewer roles for
spec and plan, not the distinct technical-lead/technical-reviewer
approvers proposed here. Note whether specs/ should generalize the
training/work convention for ongoing repo work while training/work stays
scoped to workshop exercises, or whether the two should be unified.
```

Review the draft with the audience. The following is a compact fallback to type manually if the generation takes too long:

```markdown
# Internal Request Hub constitution

## Architecture and engineering
- Use the existing JavaScript, React, Express and SQLite stack.
- Keep route handlers thin and database behavior in focused modules.
- Use parameterized SQL for values.
- Enforce authorization and state-transition rules on the server.
- Preserve the API error shape and existing visibility rules.

## Development workflow — specs/<feature-name>/
- intent.md: problem, outcome and scope. Originator drafts; product
  owner accepts.
- spec.md: behavior, design and constraints. Engineer drafts; technical
  lead approves.
- plan.md: implementation steps and checks. Engineer owns; technical
  reviewer accepts.
- Draft the next artifact only after the current one is approved by its
  named approver. Never assume or invent an approval.
- After plan.md is approved, implement one reviewable checkpoint at a
  time, producing a diff for review.
- Route review findings back to the stage that needs correction: a
  defect returns to the diff, an unsuitable approach returns to plan.md,
  unclear behavior returns to spec.md.
- Saved artifacts carry decisions forward between sessions; read them
  instead of replaying chat history.

## Verification and ownership
- Map acceptance examples to evidence, including denied actions.
- Run npm test, npm run lint and npm run build before completion.
- Inspect the diff and record actual results and unverified areas.
- The engineer submits work; the named approver for each artifact
  records the acceptance decision.
- The technical owner reviews rule changes and relevant exceptions.
- Do not invent approval or silently weaken a check to claim success.

## Workshop boundaries
- Keep the user selector as simulated identity.
- Do not add real authentication, notifications or external services.
- Cancellation, approval/rejection and history are separate exercises.
- These instructions guide the agent. Permissions, review protection and
  CI provide separate enforcement where configured.
```

**Checkpoint:** Explain which rules come from the repository and which decisions the team just agreed, and compare the named approvers against the informal roles actually used by hand in step 6. Record the actual review, not a fictional approval label.

## Step 8 — Link the constitution through CLAUDE.md

**Claude prompt:**

```text
Update CLAUDE.md to import @constitution.md at the repository root.
Keep verified commands and useful project context. Remove duplicated
rules now maintained in the constitution, preserving any relevant guidance
that is not duplicated. Import docs/domain.md and docs/architecture.md.
Only edit CLAUDE.md. Show the resulting diff.
```

A compact resulting entry point might be:

```markdown
# Internal Request Hub

## Shared project rules
@constitution.md

## Domain and architecture
@docs/domain.md
@docs/architecture.md

## Verified commands
- Develop: npm run dev
- Test: npm test
- Lint: npm run lint
- Build: npm run build

## Working context
Use the accepted intent, specification and plan for the assigned change.
Report conflicting instructions or unresolved requirements before edits.
```

The example is shown in a code block here for copying. In the actual `CLAUDE.md`, the import lines must be ordinary Markdown text, outside code fences and backticks. All referenced files must exist.

**Say:** “We maintain the rules in one place. CLAUDE.md connects the agent to that rule source rather than copying it into every prompt.”

**Checkpoint:** Inspect the diff and verify the three import paths.

## Step 9 — Confirm the files load

Exit the current Claude session and launch `claude` again from the repository root, so the demonstration uses a fresh context after the setup change.

**Inside the new Claude session:**

```text
/context
```

Inspect the memory-file information to confirm the repository guidance and imported constitution are present. The display can vary by version. If they are missing, check the root, exact filenames, import syntax and whether a code fence accidentally surrounds the import.

**Claude prompt:**

```text
Without editing files, explain the shared rules you will apply to the
next feature change. Cite the repository instruction files supplying
them. Distinguish the constitution, project context and per-change
artifacts.
```

**Say:** “We checked that the context is loaded. Following the rules still needs verification: these files guide the agent and do not create branch protection or a release gate.”

**Checkpoint:** The agent identifies server-side authorization, exercise boundaries and review-before-implementation. Its summary is a context check, not proof that every future action will comply.

## Step 10 — Create the planning skill

**Say:** “We already drafted plan.md by hand for cancellation, in step 6. The constitution now defines that shape as a shared rule; a skill makes applying it automatic for the next feature. Our first procedure is drafting a plan for a change that already has an accepted intent and spec — exactly what we just did ourselves, now repeatable.”

**Claude prompt:**

```text
Create .claude/skills/plan-feature/SKILL.md as a planning-only skill.
Use name: plan-feature and a description for planning an accepted change.
Set disable-model-invocation: true so I invoke it explicitly in this demo.
Accept a change folder as its argument. Read intent.md and spec.md there,
then CLAUDE.md, constitution.md and the domain/architecture guides.
If required inputs or actual acceptance decisions are missing, report
that gap instead of inventing them. Inspect repository behavior and cite
files. Use training/inputs/templates/plan.md to write plan.md in the change folder.
Map every acceptance example to verification, flag risks and questions,
and stop for technical-reviewer acceptance of plan.md before editing
implementation code.
Create only the skill file. Do not implement the cancellation exercise,
and do not re-run this against training/work/cancel-request — that
feature's plan was already accepted by hand in step 6.
```

Review the skill. A concise fallback body is:

```markdown
---
name: plan-feature
description: Plan an accepted change before implementation.
disable-model-invocation: true
---

# Plan a feature

Change folder: $ARGUMENTS

1. Read intent.md and spec.md in the change folder. If inputs or acceptance
   decisions are missing, report the gap and stop.
2. Read CLAUDE.md, constitution.md, docs/domain.md and docs/architecture.md.
3. Inspect relevant client, API, database and test behavior; cite files.
4. Propose the smallest approach consistent with the accepted spec.
5. Use training/inputs/templates/plan.md to write plan.md in the change folder.
6. Map each acceptance example to a checkpoint and verification method.
7. Report risks, unresolved questions and the plan path.
8. Stop for technical-reviewer acceptance of plan.md. Do not edit
   application code or approve the plan yourself.
```

The triple-backtick wrappers belong to this guide, not the skill file. Its first line must be the frontmatter delimiter `---`.

**Checkpoint:** The skill refers to existing templates and keeps planning separate from implementation. Manual invocation controls when it is used; it does not make the surrounding session read-only.

## Step 11 — Inspect and checkpoint the setup

**Terminal:**

```bash
git status --short
git diff --stat
git diff -- CLAUDE.md constitution.md
```

New files may be untracked and absent from `git diff`; open them explicitly before staging.

If the setup is accepted, stage only the intended files and inspect the staged result:

```bash
git add CLAUDE.md constitution.md docs/domain.md docs/architecture.md .claude/skills/plan-feature/SKILL.md
git diff --cached --stat
git diff --cached
git commit -m "Establish shared project rules and planning skill"
```

**Say:** “This checkpoint contains project foundations, not the feature — the feature's own artifacts were already committed by hand in step 6. These foundations can now be reviewed and shared like other repository changes.”

**Checkpoint:** No application code or unrelated files were changed. Do not stage personal account settings or credentials. If Git identity is not configured, pause the commit step and keep the reviewed files; do not change a participant's global identity for the demo.

This completes the setup demo. The cancellation plan from step 6 is already accepted — continue into its implementation using bounded checkpoints, inspecting the diff, running the relevant checks, and recording actual results in the review template. Any feature planned after this point can use the `specs/` convention and the `plan-feature` skill instead of repeating step 6 by hand.

## Final demonstration recap

```text
Project understanding:
repository inspection -> reviewed domain -> reviewed architecture

One change, by hand:
accepted intent -> accepted spec -> accepted plan (implementation deferred)

Project foundations, written down after:
team constitution -> CLAUDE.md imports -> planning skill
```

Doing the work by hand first meant the rules written down afterward describe something the team actually experienced, not an assumption about how work should go. The shared rules prevent every session after this from starting with a different convention. The change records make decisions visible. Verification and review assess whether the implementation follows them. Reviewer capacity still needs managing.

## References

Command and import guidance checked against official documentation on 7 October 2026:

- [Claude Code project memory and initialization](https://code.claude.com/docs/en/memory)
- [Import additional files from CLAUDE.md](https://code.claude.com/docs/en/memory#import-additional-files)
- [Claude Code skills and manual invocation](https://code.claude.com/docs/en/skills)

Project examples and proposed team rules in this guide are workshop-specific. `constitution.md` is our convention, not a Claude-reserved filename.
