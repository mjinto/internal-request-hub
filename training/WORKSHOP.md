# Participant walkthrough

This branch is an unfinished application for practicing the AI-assisted development and review workflow. Exercise solutions are intentionally absent.

## Prepare

1. Use Node.js 22.13 or later (Node 22 LTS recommended) and npm 10 or later.
2. Run `npm ci`, then `npm test`, `npm run lint`, and `npm run build`.
3. Run `npm run dev` and open http://localhost:5173.
4. Switch users and inspect request details. Maya's request 101 is Submitted; her request 102 is Approved and request 105 is Draft. Rahul's request 103 belongs to another employee. These seeded records help exercise allowed and denied actions.
5. Create your own feature branch from `audience-starter` before starting an exercise.

The user selector simulates identity. All data is synthetic. The app is a local training tool, not a production service.

## Follow one change

Start with `training/issues/01-cancel-request.md`. Approval/rejection and history are separate later exercises.

Create `training/work/<your-change>/` and copy the blank templates from `training/templates/`. Fill them with actual decisions and evidence rather than asking the agent to invent approvals.

| Step | Record | Workshop decision owner |
| --- | --- | --- |
| Clarify why and scope | intent.md | Product-owner role accepts |
| Agree behavior and design | spec.md | Technical-reviewer role accepts; product owner resolves scope |
| Inspect repository and plan | plan.md | Engineer reviews before implementation |
| Implement and verify | Code diff and check output | Engineer inspects; checks provide evidence |
| Review | review.md | Peer/code-owner role accepts or requests changes |
| Confirm locally | release.md | Release-owner role confirms the approved revision |

One participant may play several roles. If working alone, explicitly record self-review as self-review, not independent approval. When paired, exchange review roles.

## Build the shared project foundations

This minimal starter intentionally contains no `CLAUDE.md`, `.claude/` configuration, skills or agents. Participants create them during the workshop.

Read `docs/domain.md` and `docs/architecture.md` first. Use these and the facilitator's agreed rules to create a concise `CLAUDE.md` covering verified commands, architecture boundaries, coding conventions, required checks and the development/review workflow. Review it with the team before using it for implementation.

Next create a planning skill at `.claude/skills/plan-feature/SKILL.md`. Its task is to inspect the repository and turn an accepted intent and specification into a reviewable plan, using `training/templates/plan.md`. It should map acceptance examples to verification, surface unresolved questions and stop before changing implementation code. Test the skill on your assigned issue and review its output.

If using Claude Code, open it from this repository root using your own installed tool and account. No account, API key or machine-specific configuration is bundled. The application itself does not call an AI API and runs without Claude.

A Markdown rule guides the agent; it is not a technical approval gate. CI runs tests, lint and build. Protected reviews and production permissions are separate infrastructure and are not configured by creating these files.

Review the resulting plan before authorizing implementation. Inspect the diff after each checkpoint. At the end, run tests, lint and build, exercise the relevant UI, and record the actual results.

## When review finds a problem

- Unclear behavior: revisit the specification.
- Unsuitable approach: revise the plan.
- Defect: correct implementation and run the relevant checks.

Keep the records aligned when a decision changes. Do not implement neighboring exercises to make one task appear complete.
