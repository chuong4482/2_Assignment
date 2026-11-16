# Process and evidence register
The assignments require Scrum roles, backlog and versioned delivery. This file is a handoff register, not evidence that meetings, commits or deployment occurred.

| Item | Required record | Current evidence status |
|---|---|---|
| Team | Named PO, Scrum Master and developers | Pending team input |
| Product backlog | Prioritized stories FR-01 through FR-12, estimates, acceptance criteria | Requirements documented; actual issue board pending |
| Sprint 1 | Goal: platform/menu; planning, backlog, daily updates, review/retro | Historical records pending |
| Sprint 2 | Goal: checkout/payment/delivery; planning, daily updates, review/retro | Historical records pending |
| Assignment 1 cadence | Three sprints suggested; record actual cadence and mapping | Pending actual team chronology |
| Git and review | Clear commits and peer-reviewed PRs for docs and code | Local main and origin configured; no commits or push; remote exists with empty branches and zero workflow runs |
| Sequential Task 1 through 5 acceptance | Dated commits showing prerequisite artifacts before later acceptance | Cannot establish retroactively from current files |
| CI | Successful run and run catching error; required branch checks | Pending external run links |
| Handover | Customer feedback, demo/video, review, retrospective and next backlog | Pending actual session |

Branch proposal: short feature branches, PR to main, required lint/unit/build and reviewer approval. Commit convention: type(scope): concrete change. Definition of Done: builds and acceptance pass, validated API input, UI loading/error handling, docs updated, reviewed commit and evidence links recorded.

Suggested next backlog (not historical commitments): protected CI/CD, HTTPS deployment, real Sandbox demo and operational rollback rehearsal. Retrospective should record actual observations, concrete improvement, owner and follow-up date after the team reviews the increment.

Repository supplied by user: https://github.com/chuong4482/2_Assignment.git . Remote existence verified through GitHub API; branches empty and workflow runs zero. Lecturer access, PR reviews and branch protection remain externally unverified; local GitHub CLI is unauthenticated.

Implemented delivery sources now include `.github/workflows/ci.yml`, `.github/workflows/delivery.yml`, `scripts/deploy.sh` and `scripts/rollback.sh`. GitHub required checks, ENABLE_DEPLOY variables, production secrets, hosted runs and rollback rehearsal remain pending external setup/evidence. See deployment.md for the exact setup and known review caveats.

Local verification completed on 2026-11-16: lint, unit 45/45, integration 17/17, mobile E2E 5/5, host API/web builds, locked Node 22 Docker builds, actionlint and shell syntax checks passed. This does not establish historical Scrum records, remote CI success or production deployment.
