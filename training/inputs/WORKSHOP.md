# Participant walkthrough

This branch is an unfinished application for practicing the AI-assisted development and review workflow. Exercise solutions are intentionally absent.

## Prepare

1. Use Node.js 22.13 or later (Node 22 LTS recommended) and npm 10 or later.
2. Run `npm ci`, then `npm test`, `npm run lint`, and `npm run build`.
3. Run `npm run dev` and open http://localhost:5173.
4. Switch users and inspect request details. Maya's request 101 is Submitted; her request 102 is Approved and request 105 is Draft. Rahul's request 103 belongs to another employee. These seeded records help exercise allowed and denied actions.
5. Create your own feature branch from `audience-starter` before starting an exercise.

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

Read `docs/domain.md` and `docs/architecture.md` first. Use these and the facilitator's agreed rules to create a concise `CLAUDE.md` covering verified commands, architecture boundaries, coding conventions, required checks and the development/review workflow. Review it with the team before using it for implementation.

For the presenter-led setup sequence, use [the Claude setup live-demo guide](CLAUDE-SETUP-LIVE-DEMO.md). It establishes constitution.md, imports it through CLAUDE.md, and creates the planning skill before feature implementation.
