# Conventions

- Repo plan docs: doc/plans/YYYY-MM-DD-slug.md (unless a Paperclip issue asks for a plan — then update the issue's plan doc instead).
- Strategic docs (doc/SPEC.md, doc/SPEC-implementation.md): additive updates only, keep aligned; never replace wholesale unless asked.
- PRs MUST use every section of .github/PULL_REQUEST_TEMPLATE.md: Thinking Path, What Changed, Verification, Risks, Model Used (exact model ID; "None — human-authored" if human), Checklist.
- New API endpoints: company access checks + actor permission enforcement (board vs agent) + activity log entry for mutations + consistent HTTP error codes.
- UI copy: canonical term is "task" (never "issue"/"ticket" in user-facing copy). Buttons name the action; errors say what happened + what to do; empty states say what to do first.
- UI visuals: tokens are the ONLY source of visual values (ui/src/index.css, single root; no parallel ui/src/tokens/, no hex/raw px/arbitrary Tailwind values in components; Tailwind palette classes are debt, not to be added). Runtime-tunable tokens must live in a NON-@theme-inline block.
- Generated artifacts/deliverables: upload via skills/paperclip/scripts/paperclip-upload-artifact.sh + artifact work product; never leave a deliverable reachable only via local path. See doc/AGENT-ARTIFACTS.md.
- Telemetry changes: update generated contract packages/shared/src/telemetry/generated/paperclip-telemetry.ts + telemetry/README.md in same PR; requires privacy review.
- Design language conflicts: change DESIGN.md first (with review) or change the code.
