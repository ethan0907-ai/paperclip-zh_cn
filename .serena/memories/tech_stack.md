# Tech Stack

- Runtime: Node.js >= 24.11 (engines), pnpm 9.15.4 (packageManager) — pnpm workspace, pnpm-workspace.yaml is authoritative for patchedDependencies/overrides.
- TypeScript ~7 (root devDep), vitest 4, esbuild; @playwright/test for e2e.
- Server: Express, embedded Postgres (embedded-postgres 18.1.0-beta.16 + PGlite for dev; dev DB reset: rm -rf data/pglite). ORM: Drizzle (drizzle-orm ^0.45.2); DB client lib: postgres ^3.4.9.
- UI: React 19 (pinned ^19.2.8 via override), Vite, Tailwind v4 (CSS-first, @theme in ui/src/index.css — no tailwind config file), shadcn-style semantic tokens, Storybook + Playwright visual baselines.
- Agent adapters run external CLIs via acpx / ACP (claude-agent-acp, codex-acp) — pnpm-patched; overrides pin @openai/codex 0.156.0 and @anthropic-ai/claude-agent-sdk 0.3.280.
- CodeMirror state/view + lezer are hard-pinned to single resolution (double copies crash the editor).
- Patched deps (patches/ dir): postgres, embedded-postgres, acpx, ACP packages, chat adapters, discordjs/ws. When adding/renaming a patched dep, keep package.json#pnpm.patchedDependencies and pnpm-workspace.yaml in sync.
- Docker: root Dockerfile + docker/ for containerized install.
