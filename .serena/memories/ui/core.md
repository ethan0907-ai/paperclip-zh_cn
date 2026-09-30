# UI (ui/) Core

React 19 + Vite + Tailwind v4 (CSS-first tokens in ui/src/index.css via @theme; no tailwind config file). Storybook is the verification surface (it documents the system, does not define it). DESIGN.md at repo root governs all design decisions.

Token tiers in ui/src/index.css: semantic (shadcn set, OKLCH, light/dark), brand (agent gradients --agent-1a/1b..10a/10b, status hues --status-task-*/--status-agent-*), domain (--chip-match-*, doc-annotation highlights, motion/typography). Match existing token values before minting new ones.

Rules: one component per job (variants = props); no raw hex/px/arbitrary values in components — add a token instead; vertical rhythm = one gap per container, never margin+gap on siblings; status states map to one semantic status token set used identically everywhere; machine values (IDs, costs, tokens, timestamps) use monospace token + shared formatting helpers; form/wizard footers: Save & exit left, primary action right, in ONE shared row, step owns its whole footer; no toast for state already visible on screen; paused task/subtree shows amber takeover replacing composer.
