# Suggested Commands

Dev (auto embedded PGlite DB; leave DATABASE_URL unset):
- pnpm install && pnpm dev — API + UI both at http://localhost:3100 (UI served by API server in dev middleware mode). Health: curl http://localhost:3100/api/health
- pnpm dev:server / pnpm dev:ui — individual processes; pnpm dev:stop to stop
- Reset dev DB: rm -rf data/pglite && pnpm dev

Build/verify:
- pnpm build (runs preflight:workspace-links first)
- pnpm typecheck — workspace-wide (also runs preflight:workspace-links)
- pnpm test — cheap default, Vitest suite only (test:run)
- pnpm test:watch
- Browser suites are OPT-IN: pnpm test:e2e, pnpm test:release-smoke — only when change touches them or verifying CI/release.

Database:
- Edit packages/db/src/schema/*.ts → export new tables from packages/db/src/schema/index.ts → pnpm db:generate (compiles packages/db first; drizzle.config reads dist/schema) → pnpm -r typecheck.

Other:
- pnpm storybook — UI verification surface
- pnpm paperclipai — run the CLI
- Checks: pnpm check:token-gates (UI tokens), pnpm check:module-boundaries, pnpm check:forbidden-tokens (check:tokens)
- pnpm release:stable / release:canary
