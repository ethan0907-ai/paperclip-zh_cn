# Paperclip UI — Product Context

<!-- impeccable:product-schema 1 -->

This record covers the Paperclip browser control console. Its scope and product
facts were confirmed during Impeccable init on 2026-10-02. The canonical product
definition remains [doc/PRODUCT.md](../doc/PRODUCT.md), with current implementation
requirements in [doc/SPEC-implementation.md](../doc/SPEC-implementation.md).
Use those documents for detailed contracts and distinguish aspirations from
implemented capabilities. [DESIGN.md](../DESIGN.md) governs the existing interface.

## Platform

web

## Users

The primary user is a human operator acting as the board of an AI company. They
create and manage companies, define goals, organize agents, direct tasks, resolve
requests and blockers, control spending, and inspect the resulting work.

One instance can contain multiple companies. The console must make the active
company clear and keep work and actions within the correct company boundary.

## Product Purpose

Paperclip is the control plane for autonomous AI companies. The console lets a
human see what agents are doing, decide where intervention is needed, and act.
Success means one operator can run a small AI-native company end to end with
clear visibility and control, including inspectable outputs and spending.

## Positioning

Paperclip coordinates agents through companies, organizational reporting,
goals, hierarchical tasks, heartbeat runs, budgets, approvals, and audit history.
Adapters connect different agent runtimes; Paperclip coordinates their work
without requiring one execution provider.

The core operating model is task- and comment-centered. Conversational surfaces
support that model; they do not replace the company control plane.

## Operating Context

- Establish a company and goal, configure a CEO and reporting agents, set budgets,
  and direct initial work.
- Inspect task progress, agent status, runs, blockers, requests, and work products.
- Approve or reject governed actions and pause or resume work when needed.
- Inspect files, documents, previews, links, and other outputs before accepting work.
- Support local trusted use and authenticated deployments without changing the
  company, task, and agent mental model.

The existing console uses React, Vite, and React Router. Development is normally
started with `pnpm dev` from the repository root; the API serves the UI at
`http://localhost:3100`. See [doc/DEVELOPING.md](../doc/DEVELOPING.md) for runtime setup.

## Capabilities and Constraints

- Core workflows include companies, goals, projects, agents and org structure,
  tasks, runs, approvals, costs and budgets, activity history, and work products.
- Work must retain its relationship to company goals. Tasks have a single
  assignee; atomic checkout protects execution ownership.
- Company boundaries, approval gates for governed actions, budget hard stops,
  human intervention, and activity logging are durable requirements.
- Ordinary company skill work is open by default unless explicit restrictions
  are configured; platform safety checks still apply. Avoid implying that every
  operation requires board approval.
- Surface failures and conflicts with actionable explanations. Preserve drafts
  across task pause and resume, and distinguish stopping a response from pausing work.
- Present summaries and outputs before raw logs, tool calls, and transcripts.
- Use **task** in user-facing copy. Internal API and database names may use `issue`.
- Optional workflows can extend the core through plugins and adapters.

## Brand Commitments

Preserve the Paperclip name and existing product assets. Existing favicon and
application icon assets live in `ui/public/`; provider assets live in
`ui/public/brands/`.

Use consistent terminology and direct action labels. Explain what happened and
what the operator can do next. No new visual identity was selected during init.

## Evidence on Hand

- [doc/GOAL.md](../doc/GOAL.md): product vision and control-plane purpose.
- [doc/PRODUCT.md](../doc/PRODUCT.md): product concepts, principles, and boundaries.
- [doc/SPEC-implementation.md](../doc/SPEC-implementation.md): implementation contracts.
- [src/App.tsx](src/App.tsx): implemented route inventory.
- [DESIGN.md](../DESIGN.md), `ui/src/index.css`, and `ui/storybook/`: incumbent
  design guidance, tokens, and component examples.

Example goals in product documentation are illustrative, not customer results.
This init does not establish testimonials, measured outcomes, pricing, or new claims.

## Product Principles

1. Keep the company and its goals as the organizing context for work.
2. Make current state, requests, blockers, spending, and intervention visible.
3. Make outputs inspectable and work traceable through tasks and activity history.
4. Preserve human control alongside autonomous execution.
5. Keep runtime choices flexible through adapters and the core focused through extensions.

## Open Decisions

No additional audience segment, quantitative success target, or product-specific
accessibility standard was established in this init. Future work must not present
those as confirmed requirements without further evidence or user direction.
