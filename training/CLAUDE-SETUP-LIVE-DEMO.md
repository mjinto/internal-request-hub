# Live demo: add Claude Code to Internal Request Hub

Use this guide to walk one change through intent, specification and plan by
hand and implement it, then write down the shared project rules, automate
the repeatable parts, and use that automation to take a second feature
through the same shape end to end. Estimated segment: 70–90 minutes,
depending on discussion and how long each implementation takes to generate.

This is an instruction guide. It does not pre-create Claude configuration.
Terminal commands and prompts below are actions for the presenter to
perform during the demo. By the end, cancellation and approve/reject are
both implemented, reviewed and committed; request history is left for
participants.

## The story to tell

“Each developer can give an agent a different set of instructions. We will
first walk one small change through intent, specification, plan and
implementation by hand, so everyone feels what the manual process is like.
Only then will we write that down as shared rules and automate the
repeatable parts — Claude can discover facts about the repository, but the
team must decide the rules it should follow. Then we'll run a second
feature through that automation, so you can feel the difference.”

| Step | Action | Audience takeaway |
| --- | --- | --- |
| 1 | Verify the starter and create a demo branch | Begin from a known baseline |
| 2 | Launch Claude and run `/init` | Discover initial project context |
| 3 | Review the generated `CLAUDE.md` | Inspect the initialization output |
| 4 | Discover and review `docs/domain.md` | Establish what the application currently does |
| 5 | Discover and review `docs/architecture.md` | Establish how the application currently works |
| 6 | Walk the cancellation change through intent, spec and plan, by hand | Feel the manual process before automating it |
| 7 | Build custom tools: a review agent and three skills | See a project-specific agent, a skill that calls it, and two skills that chain together |
| 8 | Implement the cancellation change and review the diff | See the review tools used for real, not just described |
| 9 | Create `constitution.md` | Write down the rules we just followed, for every future change |
| 10 | Import the reviewed documents from `CLAUDE.md` | Connect shared understanding and rules to the agent |
| 11 | Confirm the context loaded | Check the wiring, not just the filenames |
| 12 | Create a planning skill | Turn the repeated plan-drafting step into a procedure |
| 13 | Take approve/reject through the automated workflow | Feel the before/after difference directly |
| 14 | Review and checkpoint the setup | Inspect what actually changed |

## Before presenting

- Have Claude Code installed and signed in using your own account. Installation and account setup are outside this repo demo; see the official [setup instructions](https://code.claude.com/docs/en/setup).
- Rehearse with the installed version: `claude --version`. Interface details and generated `/init` content can vary by version and user configuration.
- Use Node.js 22.13 or later and npm 10 or later. Allow time for dependency installation before the live session.
- Inspect `git status --short`. Save unrelated work before switching branches. Do not reset or clean someone else's work to obtain a fresh demo.
- Check whether `docs/domain.md`, `docs/architecture.md`, `CLAUDE.md`, `constitution.md`, `training/work/cancel-request/`, `training/work/approve-or-reject/` or `.claude/` already exist. On a reused demo checkout (for example, a prior rehearsal), review or reuse them; `/init` may suggest changes to an existing file instead of creating a new one. A fresh checkout of `facilitator-starter` has none of these — the demo builds all of them live.
- Existing personal or parent-directory Claude instructions can also affect the session. Keep the distinction between personal settings and the repository's shared rules visible.
- If you want to actually demonstrate fetching a live GitHub issue in step 7, install and authenticate the GitHub CLI beforehand: `gh --version` and `gh auth status`. Without it, `fetch-github-issue` still works as designed — it fails with the real `gh` error instead of inventing issue content — but you won't have a real issue to fetch from.

## Step 1 — Open and verify the starter

**Terminal:**

```bash
cd /Users/jintomenachery/Documents/Codex/2026-09-21/we/outputs/internal-request-hub
git status --short
git switch facilitator-starter
git switch -c demo/claude-foundations
npm ci
npm test
npm run lint
npm run build
```

`facilitator-starter` is the facilitator's own baseline: application code,
a plain README, the issue briefs under `training/inputs/issues/`, and the
blank templates under `training/work/_templates/` — but no `CLAUDE.md`,
`constitution.md`, `docs/`, `.claude/`, or implemented features. It is
separate from `audience-starter`, which participants receive later with
none of the training scaffolding. If the demo branch already exists, use
`git switch demo/claude-foundations` and inspect its current state.

Run the application in another terminal:

```bash
npm run dev
```

Open http://localhost:5173. Show Maya's submitted request 101 and the absence of a cancellation action. The user selector simulates identity; the application is not a production authentication system.

**Say:** “We know what currently works, and we have two unfinished features to work on. We will walk the first through its full shape by hand before deciding on any shared rules.”

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

On a fresh `facilitator-starter` checkout this document does not exist yet — create it now. If you're reusing a checkout from an earlier rehearsal and it already exists, review and improve it instead of overwriting it blindly; to demonstrate discovery from scratch in that case, ask for a separate draft first and compare it with the existing document after review. Do not delete prepared references merely to make the demo look fresh.

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

**Transition:** “We now understand what the application does and how it's built. Before we write down any rules, let's run one small change through the whole shape of the work by hand — including implementing it.”

## Step 6 — Walk the cancellation change through intent, spec and plan, by hand

**Say:** “We are not going to write down any rules yet. We are going to draft intent, then spec, then plan for one real change — by hand, from memory, with nothing enforcing the order except our own discipline. The rules we write afterward should describe what we actually did here, not something invented in the abstract.”

**Continuation prerequisite:** Confirm `training/inputs/issues/` and `training/work/_templates/` are present in this checkout before running the copy commands below. Steps 1–5 can be demonstrated independently; do not invent missing requirements to continue.

Return to the intent and specification slides. Read `training/inputs/issues/01-cancel-request.md` with the audience.

**Terminal:**

```bash
mkdir -p training/work/cancel-request
cp training/work/_templates/intent.md training/work/cancel-request/intent.md
cp training/work/_templates/spec.md training/work/cancel-request/spec.md
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
cp training/work/_templates/plan.md training/work/cancel-request/plan.md
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
- Does it require `/code-review` and `/security-review` before
  implementation is considered complete, not just `npm test`/`lint`/
  `build`? This change adds a new mutating endpoint and new
  authorization logic — exactly the shape a dedicated security pass is
  for, and a manual read-through alone can miss it.

**Terminal:**

```bash
git add training/work/cancel-request
git diff --cached
git commit -m "Capture the cancellation change: accepted intent, spec and plan"
```

**Say:** “Notice three different roles each accepted one artifact before the next was drafted — the product owner for intent, a reviewer for spec, a reviewer for plan. We did all of that by hand, with nothing enforcing the order or who was allowed to approve what. We also added `/code-review` and `/security-review` as explicit gates in the plan before sign-off — those are built-in, generic review skills. Next, let's build something project-specific instead of relying only on generic tools — then we'll actually implement this plan — before we write any of it down as a rule.”

**Checkpoint:** `training/work/cancel-request` contains an accepted `intent.md`, `spec.md` and `plan.md`, each drafted only after the previous one was reviewed. Implementation comes next, once the review tools below exist.

## Step 7 — Build custom tools: a review agent and three skills

**Say:** “`/code-review` and `/security-review` are generic — they don't know this app's one specific rule: every request action must be checked on the server, using ownership, status and role, never just hidden in the UI. Let's build two things once, so every future exercise reuses them instead of re-explaining the rule each time: an **agent**, which knows the rule and reviews a diff against it, and a **skill**, which runs a whole verification checklist automatically. Both are triggered by name, on purpose — neither fires itself.”

An agent and a skill are different tools for different jobs. An agent
is a separate worker with its own instructions and its own set of
tools, good at one focused kind of judgment call. A skill is a
procedure — a checklist loaded into the current session, good at
repeating the same multi-step task the same way every time, and able
to call on an agent as one of its steps, or on another skill as one of
its steps. We build one of each first, then two more skills later in
this step that chain together the second way.

**Claude prompt (agent):**

```text
Create .claude/agents/authorization-reviewer.md as a custom subagent.
Its only job: audit a diff against this repo's authorization boundary -
identity resolved via getCurrentUser, explicit ownership/role/status
checks before any read beyond what's allowed or any mutation, denials
using the existing HttpError/errorResponse shape and codes, and
parameterized SQL only. Base the rule on CLAUDE.md, docs/domain.md and
docs/architecture.md section 5 - cite them in the agent's instructions,
don't invent new rules. Give it read-only tools (no Edit or Write) since
it reviews, it does not implement. Write its description so it is only
used when explicitly named, not inferred from a general "review my
code" request. Create only this one file.
```

**Claude prompt (skill):**

```text
Create .claude/skills/verify-checkpoint/SKILL.md as a manually-invoked
skill (disable-model-invocation: true). Given a change folder as its
argument, it should: read that folder's plan.md Acceptance-to-evidence
map; run npm test, npm run lint and npm run build and report real
pass/fail, not an assumption; invoke the authorization-reviewer agent
on the current diff and include its findings; check that every
acceptance example in the map has real, existing evidence, flagging any
that don't; and end with one summary table plus a plain pass/fail
recommendation for engineer review. It must not edit application code
or mark anything verified that it did not actually check. Create only
this one file.
```

Review both files with the audience:

- Does the agent's description make clear it's only used when asked
  for by name — not something Claude would reach for on its own for an
  unrelated request?
- Does the agent cite the actual repository files its rule comes from,
  instead of inventing a rule?
- Does the skill use `disable-model-invocation: true`, matching the
  convention the `plan-feature` skill will use later?
- Does the skill read evidence rather than assume the plan's claims
  are already true?

**Say:** “Neither of these has run yet — there's no diff to check until
we actually implement the cancellation change, which is the very next
step. We built them now so they're ready to use the moment
implementation begins, and so the constitution we write after that can
simply point at them as the expected review step, instead of describing
review in the abstract.”

**Checkpoint:** `.claude/agents/authorization-reviewer.md` and
`.claude/skills/verify-checkpoint/SKILL.md` exist, are scoped to manual
invocation, and cite real repository evidence for their rules. Neither
has been invoked yet.

**How to invoke these later:**

- **The agent** usually does not need a session restart — Claude Code
  can pick up a new `.claude/agents/*.md` file within the current
  session. Invoke it by naming it in plain language: "Use the
  authorization-reviewer agent to review this diff."
- **The skill** follows Claude Code's usual skill-loading behavior:
  the slash-command list is normally built once per session, so expect
  to need a fresh session before `/verify-checkpoint` appears. Exit and
  run `claude` again from the repo root, type `/` to confirm it's
  listed (or type the command directly), then invoke it with a change
  folder: `/verify-checkpoint training/work/cancel-request`. Because of
  `disable-model-invocation: true`, it will never run on its own.
- If either is missing after a restart, check the file is at the exact
  path shown above and that its frontmatter starts with `---` as the
  very first line — the same failure mode already noted for
  `plan-feature` in step 12.

### Two more skills: fetching a real GitHub issue into an intent

**Say:** “In step 6 we read a pre-written issue brief from
`training/inputs/issues/`. A real team's issues live in GitHub. Let's
build the same intake step, but pointed at a real issue — one skill
that only fetches, and a second skill that reuses the first one to
draft `intent.md` from whatever it fetched. This is the other way
skills compose: not a skill calling an agent, but a skill calling
another skill.”

**Prerequisite for this part:** the GitHub CLI (`gh`), installed and
authenticated (`gh auth status`). If it isn't available, build the
skills anyway — `fetch-github-issue` is designed to fail with the real
`gh` error rather than invent issue content, which is itself worth
showing the audience once.

To install `gh`:

```text
macOS (Homebrew):   brew install gh
Windows (winget):   winget install --id GitHub.cli
Linux (apt):        sudo apt install gh
```

See <https://github.com/cli/cli#installation> for other package managers.
Then authenticate once with `gh auth login` and verify with
`gh auth status`.

**Claude prompt (fetch-github-issue skill):**

```text
Create .claude/skills/fetch-github-issue/SKILL.md as a manually-invoked
skill (disable-model-invocation: true). Given an issue reference as its
argument (a bare number for the current repo, owner/repo#number, or a
full GitHub issue URL), it should: confirm gh is installed and
authenticated (gh auth status), stop with the real error if not; fetch
the issue with gh issue view <reference> --json
number,title,state,url,labels,body; and report the number, title,
state, URL, labels and full body verbatim, not paraphrased. It must not
fetch comments, must not modify the issue in any way, and must not
write any file - this skill only reports. Create only this one file.
```

**Claude prompt (draft-intent-from-issue skill):**

```text
Create .claude/skills/draft-intent-from-issue/SKILL.md as a
manually-invoked skill (disable-model-invocation: true). It takes two
arguments - an issue reference and a change folder. It should: invoke
the fetch-github-issue skill with the issue reference and stop if that
fails; read training/work/_templates/intent.md plus CLAUDE.md,
docs/domain.md and docs/architecture.md for project context; create the
change folder if needed; and draft intent.md there using the template's
sections - problem and desired outcome from the issue, scope and
constraints cross-checked against the real repository, open questions
for anything the issue leaves ambiguous, and the acceptance decision
left pending for the product owner. Record the issue's number and URL
as intent.md's source. Propose changes instead of overwriting if
intent.md already exists. It must not draft spec.md or plan.md, and
must not edit application code. Create only this one file.
```

**How to use them, with examples:**

Fetching an issue directly — any of these three reference forms work:

```text
/fetch-github-issue 42
/fetch-github-issue anthropics/claude-code#1234
/fetch-github-issue https://github.com/owner/repo/issues/42
```

Drafting an intent from an issue in one step — this invokes
`fetch-github-issue` internally, so you don't run that first yourself:

```text
/draft-intent-from-issue 42 training/work/some-feature
```

This creates `training/work/some-feature/intent.md` from issue #42 in
the current repository, with the acceptance decision left pending —
review and accept it with the product-owner role exactly as in step 6,
before anyone drafts `spec.md`. If `gh` can't reach the issue (not
authenticated, issue doesn't exist, wrong repo), the skill reports that
real failure and stops; it does not draft a fictional intent to keep
going.

**Checkpoint:** `.claude/skills/fetch-github-issue/SKILL.md` and
`.claude/skills/draft-intent-from-issue/SKILL.md` exist, both scoped to
manual invocation. `draft-intent-from-issue`'s instructions name
`fetch-github-issue` explicitly rather than duplicating its `gh`
commands inline. Neither has necessarily been run yet — note that a
live fetch requires `gh` to be installed and authenticated, per the
prerequisite above.

## Step 8 — Implement the cancellation change and review the diff

**Say:** “Intent, spec and plan are all accepted. Now we implement — one
checkpoint at a time — and use the two tools we just built to review the
diff before we call it done. This is the only hand-built implementation
in this session; everything after the constitution reuses it.”

**Claude prompt (implement):**

```text
Implement training/work/cancel-request/plan.md's accepted approach, one
ordered checkpoint at a time. Follow the plan exactly; if you find a
reason to deviate, stop and report it instead of silently changing the
approach. After each checkpoint, run npm test, npm run lint and npm run
build and report real results. Do not mark a checkpoint done without
running its verification.
```

Watch the diff as it grows. Confirm the new route is thin (`app.js`),
the ownership/status checks and the status mutation live in
`requests.js`, and new tests exercise both the allowed case and every
denied case from the spec.

**Say:** “The plan has an Acceptance-to-evidence map and this diff adds
a new mutating endpoint with new authorization logic — exactly what we
built the agent and the skill for.”

**Claude prompt (authorization review):**

```text
Use the authorization-reviewer agent to review the current diff for
training/work/cancel-request. Report its findings before I decide
whether to request changes.
```

**Inside Claude Code:**

```text
/verify-checkpoint training/work/cancel-request
/code-review
/security-review
```

Address any findings from these four checks before treating the change
as done — route a plain implementation defect back into the diff; if a
review finds the chosen approach itself unsuitable, that's a plan-level
finding, not something to patch around in the diff.

**Terminal:**

```bash
git add -A
git status --short
git diff --cached --stat
git commit -m "Implement cancellation: server authorization, API route, UI action"
```

**Say:** “Cancellation is done: planned, implemented and reviewed, all by
hand. Now we write down the shape we just followed, so the next feature
doesn't repeat all of this from memory.”

**Checkpoint:** Cancellation works end to end in the running app (reload
http://localhost:5173, cancel Maya's request 101, confirm the status
persists). Tests, lint and build pass. `authorization-reviewer` and
`verify-checkpoint` findings were addressed, not skipped. The diff is
committed separately from the intent/spec/plan commit in step 6.

## Step 9 — Agree and create the project constitution

**Say:** “We just followed a shape by hand, all the way through: intent
approved by the product owner, spec approved by a reviewer, plan approved
by a reviewer, implementation reviewed by our two tools, in that order.
Now we write that shape down as a rule, so the next feature starts from
an agreed convention instead of an ad hoc memory of what we did last
time. CLAUDE.md is the entry point for the agent; the constitution is the
shared rule source for the team. We choose this filename — it has no
special automatic-loading behavior.”

**Claude prompt:**

```text
Draft constitution.md at the repository root for team review, and document
a lightweight spec-driven SDLC convention for how we develop every feature
in this repo going forward.

Use the newly reviewed docs/domain.md and docs/architecture.md as project
context. Separate existing facts from the rules the team agrees.

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
- Each feature gets its own folder under training/work/<feature-name>/,
  containing three artifacts in strict order: intent.md, then spec.md,
  then plan.md. training/work is the single home for all feature work in
  this repo; there is no separate specs/ folder.
- intent.md records the problem, outcome and scope. The originator
  drafts it; the product owner accepts it. When the feature comes from a
  GitHub issue, the originator may use the `draft-intent-from-issue`
  skill to fetch the issue and produce a draft intent.md. Its output is
  always a draft: it must not mark the intent accepted, and the issue
  link must be recorded in intent.md as its source.
- spec.md records behavior, design and constraints. The engineer drafts
  it; the technical lead approves it.
- plan.md records implementation steps and checks. The engineer owns it;
  the technical reviewer accepts it. Once accepted, the engineer may
  draft plan.md with the forthcoming `plan-feature` skill instead of by
  hand - the output and approval requirement are identical either way.
- An artifact for a phase is only drafted once the previous phase's
  artifact in that same folder has been explicitly approved by its named
  approver. Do not draft the next phase's artifact, and do not invent or
  assume an approval that was not actually given.
- Once plan.md is approved, implementation proceeds to a diff, then a
  review of that diff. Every diff gets an authorization review and, once
  plan.md has an Acceptance-to-evidence map, a verification check against
  it, rather than an ad hoc read-through. State this requirement in
  constitution.md and name the tools once (the `authorization-reviewer`
  agent and the `verify-checkpoint` skill). Put invocation details
  (paths, when to run, arguments) in CLAUDE.md, not the constitution.
  `/code-review` and `/security-review` remain available for concerns
  outside the authorization boundary.
- Review findings return to whichever earlier decision needs correction,
  not forward to a new artifact: a defect in the implementation returns
  to the diff for a fix; an unsuitable approach returns to plan.md for
  revision; unclear behavior returns to spec.md for clarification.
  Record which stage a finding was routed back to.
- Record the actual approval decision and approver for each phase
  transition inside the artifact itself (or a short note beside it);
  never mark a phase approved on the agent's own authority.
- These saved records are what carry decisions forward between sessions.
  Do not rely on replaying prior chat history to reconstruct a decision;
  read the artifact instead.
- Write training/work/README.md describing this convention (the three
  artifacts, their owners/approvers, the gate rule, the optional
  draft-intent-from-issue entry point, and the diff/review feedback
  loop). Point it at the templates in training/work/_templates/ as the
  canonical starting point for intent.md, spec.md and plan.md —
  training/inputs/templates/ has been retired in favor of this single
  location.
- Confirm training/work/_templates covers what the convention requires
  (named owner and approver per artifact, an approval record section
  with decision, approver and date, a source-issue field in intent.md,
  an Acceptance-to-evidence map in plan.md, a place to record which
  stage a review finding was routed back to). Keep the templates blank:
  no example approvals or filled-in names.
- Add the CLAUDE.md pointers for the review tools and the
  draft-intent-from-issue skill as a proposed diff for review; do not
  rewrite unrelated parts of CLAUDE.md.

State plainly, under a short "Status" note, which features this repository
has implemented so far using this convention (cancellation, implemented
and reviewed in this session) and which remain open (approval/rejection,
about to follow the same convention; request history, a separate later
exercise).

Do not implement features or claim these rules already have technical
approval enforcement. Do not create a feature folder for any new feature.
Do not build or modify the draft-intent-from-issue skill in this step;
if it does not exist under .claude/skills/, report that as a gap.

Report any conflict with the current repository, without changing the
affected files:
- training/work/cancel-request/{intent,spec,plan}.md: these were created
  by hand before this convention and used informal, undifferentiated
  reviewer roles for spec and plan rather than the distinct technical
  lead / technical reviewer approvers. List what would need to change
  for them to conform, but do not edit them or backfill approvals.
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

## Development workflow — training/work/<feature-name>/
- intent.md: problem, outcome and scope. Originator drafts; product
  owner accepts.
- spec.md: behavior, design and constraints. Engineer drafts; technical
  lead approves.
- plan.md: implementation steps and checks. Engineer owns, by hand or
  with the plan-feature skill; technical reviewer accepts either way.
- Draft the next artifact only after the current one is approved by its
  named approver. Never assume or invent an approval.
- After plan.md is approved, implement one reviewable checkpoint at a
  time, producing a diff for review.
- Review a diff with the `authorization-reviewer` agent and, once
  plan.md has an evidence map, the `verify-checkpoint` skill; use
  `/code-review` and `/security-review` for concerns outside the
  authorization boundary.
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
- Cancellation is implemented and reviewed. Approval/rejection follows
  next using this same convention. Request history is a separate,
  later exercise.
- These instructions guide the agent. Permissions, review protection and
  CI provide separate enforcement where configured.
```

**Checkpoint:** Explain which rules come from the repository and which decisions the team just agreed, and compare the named approvers against the informal roles actually used by hand in steps 6 and 8. Record the actual review, not a fictional approval label.

## Step 10 — Link the constitution through CLAUDE.md

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

## Step 11 — Confirm the files load

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

## Step 12 — Create the planning skill

**Say:** “We drafted plan.md by hand for cancellation, in step 6, and then implemented and reviewed it ourselves in step 8. The constitution now defines that shape as a shared rule; a skill makes the planning step automatic for the next feature. Let's build it, then immediately use it for real on approve/reject.”

**Claude prompt:**

```text
Create .claude/skills/plan-feature/SKILL.md as a planning-only skill.
Use name: plan-feature and a description for planning an accepted change.
Set disable-model-invocation: true so I invoke it explicitly in this demo.
Accept a change folder as its argument. Read intent.md and spec.md there,
then CLAUDE.md, constitution.md and the domain/architecture guides.
If required inputs or actual acceptance decisions are missing, report
that gap instead of inventing them. Inspect repository behavior and cite
files. Use training/work/_templates/plan.md to write plan.md in the change folder.
Map every acceptance example to verification, flag risks and questions,
and stop for technical-reviewer acceptance of plan.md before editing
implementation code.
Create only the skill file. Do not implement anything, and do not re-run
this against training/work/cancel-request — that feature's plan was
already accepted and implemented by hand in steps 6 and 8.
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
5. Use training/work/_templates/plan.md to write plan.md in the change folder.
6. Map each acceptance example to a checkpoint and verification method.
7. Report risks, unresolved questions and the plan path.
8. Stop for technical-reviewer acceptance of plan.md. Do not edit
   application code or approve the plan yourself.
```

The triple-backtick wrappers belong to this guide, not the skill file. Its first line must be the frontmatter delimiter `---`.

**Checkpoint:** The skill refers to existing templates and keeps planning separate from implementation. Manual invocation controls when it is used; it does not make the surrounding session read-only. Not invoked yet — step 13 is where it actually runs.

## Step 13 — Take approve/reject through the automated workflow

**Say:** “Same shape as cancellation — intent, spec, plan, implementation, review — but this time the convention is written down and two of our tools already exist. Watch which parts stay manual and which parts just got shorter.”

Read `training/inputs/issues/02-approve-or-reject-request.md` with the audience.

**Terminal:**

```bash
mkdir -p training/work/approve-or-reject
cp training/work/_templates/intent.md training/work/approve-or-reject/intent.md
cp training/work/_templates/spec.md training/work/approve-or-reject/spec.md
```

**Claude prompt (intent):**

```text
Read training/inputs/issues/02-approve-or-reject-request.md and our
project guidance (CLAUDE.md, constitution.md, docs/domain.md,
docs/architecture.md). Draft the intent in
training/work/approve-or-reject/intent.md using its existing sections.
Separate confirmed rules from questions. Keep the acceptance decision
pending for the product-owner role. Do not modify application code or
expand into other exercises.
```

Have the product-owner role accept or correct the intent — still manual, same as step 6.

**Claude prompt (spec):**

```text
Using the accepted training/work/approve-or-reject/intent.md, draft
training/work/approve-or-reject/spec.md from its template, covering
success for both approve and reject, denied actors, invalid statuses,
the required rejection comment, persistence and unchanged data on
failure. Separate confirmed rules from questions. Keep the acceptance
decision pending for a reviewer. Do not modify application code.
```

Have a reviewer accept or correct the spec — still manual.

This is where step 6 took a hand-written prompt. Here, the skill does it instead:

**Inside Claude Code:**

```text
/plan-feature training/work/approve-or-reject
```

Have the technical reviewer accept or correct the resulting `plan.md`, same checklist as step 6:

- Does it use real repository files and existing patterns?
- Does it enforce the assigned-reviewer and `Submitted`-status checks on the server?
- Does it map every acceptance example to evidence, including the required rejection comment?
- Does it preserve unrelated visibility behavior and exercise scope?
- Does it require `/code-review`, `/security-review`, the `authorization-reviewer` agent and `verify-checkpoint` before sign-off?

**Claude prompt (implement):**

```text
Implement training/work/approve-or-reject/plan.md's accepted approach,
one ordered checkpoint at a time. After each checkpoint, run npm test,
npm run lint and npm run build and report real results.
```

**Claude prompt (authorization review):**

```text
Use the authorization-reviewer agent to review the current diff for
training/work/approve-or-reject. Report its findings.
```

**Inside Claude Code:**

```text
/verify-checkpoint training/work/approve-or-reject
/code-review
/security-review
```

Address any findings, the same way as step 8.

**Terminal:**

```bash
git add -A
git status --short
git diff --cached --stat
git commit -m "Implement approve/reject using the plan-feature skill and constitution workflow"
```

**Say:** “Compare the two features. For cancellation, every stage was a hand-written prompt and we built the review tools as we went. For approve/reject, intent and spec were still ours to accept — the team's judgment doesn't get automated away — but planning was one skill call, and the review tools already existed. That's the actual payoff of writing the rule down, not a claim about it.”

**Checkpoint:** Cancellation and approve/reject both work end to end in the running app. `training/work/approve-or-reject` has an accepted intent, spec and a plan drafted via `/plan-feature`. The feature is implemented, reviewed by `authorization-reviewer` and `verify-checkpoint`, and committed separately from the cancellation work.

## Step 14 — Inspect and checkpoint the setup

**Terminal:**

```bash
git status --short
git diff --stat
git diff -- CLAUDE.md constitution.md
```

New files may be untracked and absent from `git diff`; open them explicitly before staging.

If the setup is accepted, stage only the intended files and inspect the staged result:

```bash
git add CLAUDE.md constitution.md docs/domain.md docs/architecture.md
git add .claude/agents/authorization-reviewer.md
git add .claude/skills/verify-checkpoint/SKILL.md
git add .claude/skills/fetch-github-issue/SKILL.md
git add .claude/skills/draft-intent-from-issue/SKILL.md
git add .claude/skills/plan-feature/SKILL.md
git add training/work/README.md training/work/_templates/
git diff --cached --stat
git diff --cached
git commit -m "Establish shared project rules and planning skill"
```

**Say:** “This checkpoint contains project foundations, not the features — cancellation and approve/reject were already committed separately, as we built and then used the tools. These foundations can now be reviewed and shared like other repository changes.”

**Checkpoint:** No unrelated files were changed. Do not stage personal account settings or credentials. If Git identity is not configured, pause the commit step and keep the reviewed files; do not change a participant's global identity for the demo.

This completes the demo. Cancellation and approve/reject are both implemented, reviewed and committed. Request history remains open — participants can take it through the `training/work/<feature-name>/` convention and the `plan-feature` skill themselves, instead of doing it by hand the way we did for cancellation.

## Final demonstration recap

```text
Project understanding:
repository inspection -> reviewed domain -> reviewed architecture

One change, entirely by hand:
accepted intent -> accepted spec -> accepted plan -> implemented -> reviewed
(cancellation)

Reusable tools, built once:
authorization-reviewer agent -> verify-checkpoint skill

Project foundations, written down after:
team constitution -> CLAUDE.md imports -> planning skill

One change, with the rule and tools already in place:
accepted intent -> accepted spec -> /plan-feature -> implemented -> reviewed
(approve/reject)
```

Doing the work by hand first meant the rules written down afterward describe something the team actually experienced, not an assumption about how work should go. Running a second feature through the same shape with the tools already built let the audience feel the before/after directly, rather than being told about it. The shared rules prevent every session after this from starting with a different convention. The change records make decisions visible. Verification and review assess whether the implementation follows them. Reviewer capacity still needs managing.

## References

Command and import guidance checked against official documentation on 7 October 2026:

- [Claude Code project memory and initialization](https://code.claude.com/docs/en/memory)
- [Import additional files from CLAUDE.md](https://code.claude.com/docs/en/memory#import-additional-files)
- [Claude Code skills and manual invocation](https://code.claude.com/docs/en/skills)

Project examples and proposed team rules in this guide are workshop-specific. `constitution.md` is our convention, not a Claude-reserved filename.
