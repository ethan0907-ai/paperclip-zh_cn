# Paperclip — Core

Control plane for AI-agent companies: orchestrates teams of AI agents (OpenClaw, Claude Code, Codex, Cursor, …) toward business goals. Node.js server + React UI.

- Read first (in order): doc/GOAL.md, doc/PRODUCT.md, doc/SPEC-implementation.md, doc/DEVELOPING.md, doc/DATABASE.md. AGENTS.md is the contributor contract (repo rules, verification, PR template).
- DESIGN.md is the source of truth for all ui/ design decisions (token-only visual values).
- Repo map:
  - server/ — Express REST API (/api base), orchestration services, routes, middleware, realtime
  - ui/ — React 19 + Vite + Tailwind v4 board UI; Storybook for verification
  - packages/db/ — Drizzle schema, migrations, embedded Postgres (PGlite in dev)
  - packages/shared/ — shared types, constants, validators, API path constants, telemetry
  - packages/adapters/ — agent adapter implementations (claude-local, codex-local, cursor-*, hermes, openclaw-gateway, pi-local, …)
  - packages/adapter-utils/ — shared adapter utilities (acpx engine)
  - packages/plugins/ — plugin system + SDK
  - packages/skills-catalog/, packages/teams-catalog/ — app-shipped catalogs
  - cli/ — paperclipai CLI package
  - skills/ — Paperclip runtime/operational skills
  - doc/ — product/ops docs; new plan docs go in doc/plans/YYYY-MM-DD-slug.md

Invariants (do not break):
- Company scoping: every domain entity scoped to a company; enforced in routes/services. Exception: announcement dismissals (instance-wide user prefs) — still validate company membership.
- Single-assignee task model; atomic issue checkout; approval gates for governed actions; budget hard-stop auto-pause; activity log for mutations.
- Contract sync: schema/API changes must update packages/db + packages/shared + server + ui API clients together.
- Three distinct data paths — do not confuse (match by file path, not by word):
  - Telemetry (first-party events, opt-out, ships to Paperclip endpoint): packages/shared/src/telemetry/ — strict review + privacy review + update generated contract + telemetry/README.md in same PR.
  - Observability (OpenTelemetry/OTLP, no-op until operator sets endpoint): server/src/instrumentation.ts, packages/adapter-utils/src/duplex-observability.ts.
  - Run log (local heartbeat_run_events table): packages/db/src/schema/heartbeat_run_events.ts, appendRunEvent in server/src/services/heartbeat.ts.
- Auth: board = full-control operator context; agents use bearer API keys (agent_api_keys, hashed); agent keys must not cross companies. Errors: 400/401/403/404/409/422/500.

Related memories: commands: `mem:tech_stack`, `mem:suggested_commands`, `mem:conventions`, `mem:task_completion`; UI rules: `mem:ui/core`.
