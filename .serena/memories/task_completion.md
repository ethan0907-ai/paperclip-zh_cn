# Task Completion

Per AGENTS.md §7 — run the smallest relevant verification first; do NOT default to repo-wide checks on every change.

PR-ready / broad-scope hand-off (full check, report anything not run and why):
- pnpm -r typecheck
- pnpm test:run
- pnpm build

Browser/e2e only when touched: pnpm test:e2e, pnpm test:release-smoke.
DB changes additionally: pnpm db:generate then pnpm -r typecheck.
UI visual changes: storybook verification + pnpm check:token-gates.
