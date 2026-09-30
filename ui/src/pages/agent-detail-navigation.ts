import { t as translate } from "@/i18n";
import { auditSectionHref, type AuditSection } from "./audit/audit-navigation";

export type AgentDetailView =
  | "overview"
  | "instructions"
  | "skills"
  | "runtime"
  | "secrets"
  | "tools"
  | "channels"
  | "permissions"
  | "api-keys"
  | "revisions"
  | "run-detail";

export type AgentLocalDetailView = Exclude<AgentDetailView, "run-detail">;

export const AGENT_DETAIL_NAVIGATION: ReadonlyArray<{
  label: string;
  labelKey: string;
  items: ReadonlyArray<{ value: AgentLocalDetailView; label: string; labelKey: string }>;
}> = [
  {
    label: "Agent",
    labelKey: "agents.detail.nav.agent",
    items: [
      { value: "overview", label: "Overview", labelKey: "agents.detail.nav.overview" },
      { value: "instructions", label: "Instructions", labelKey: "agents.detail.nav.instructions" },
      { value: "skills", label: "Skills", labelKey: "agents.detail.nav.skills" },
    ],
  },
  {
    label: "Runtime",
    labelKey: "agents.detail.nav.runtime",
    items: [
      { value: "runtime", label: "Harness / Runtime", labelKey: "agents.detail.nav.harnessRuntime" },
      { value: "secrets", label: "Secrets", labelKey: "agents.detail.nav.secrets" },
      { value: "tools", label: "Tools", labelKey: "agents.detail.nav.tools" },
      { value: "channels", label: "Channels", labelKey: "agents.detail.nav.channels" },
    ],
  },
  {
    label: "Governance",
    labelKey: "agents.detail.nav.governance",
    items: [
      { value: "permissions", label: "Permissions / Trust", labelKey: "agents.detail.nav.permissions" },
      { value: "api-keys", label: "API Keys", labelKey: "agents.detail.nav.apiKeys" },
      { value: "revisions", label: "Revisions", labelKey: "agents.detail.nav.revisions" },
    ],
  },
] as const;

export function parseAgentDetailView(value: string | null): AgentLocalDetailView {
  if (value === "instructions" || value === "prompts") return "instructions";
  if (value === "skills") return "skills";
  if (value === "runtime" || value === "configure" || value === "configuration") return "runtime";
  if (value === "secrets") return "secrets";
  if (value === "tools") return "tools";
  if (value === "channels") return "channels";
  if (value === "permissions" || value === "trust") return "permissions";
  if (value === "api-keys" || value === "keys") return "api-keys";
  if (value === "revisions" || value === "history") return "revisions";
  return "overview";
}

export function translateAgentDetailViewLabel(view: AgentLocalDetailView): string {
  const item = AGENT_DETAIL_NAVIGATION.flatMap((section) => section.items).find((i) => i.value === view);
  if (view === "secrets" && !item) return translate("agents.detail.secretsAndVariables");
  return item ? translate(item.labelKey) : "";
}

export function agentDetailHref(agentRef: string, view: AgentLocalDetailView = "overview") {
  return `/agents/${agentRef}/${view}`;
}

export function agentLegacyAuditSection(value: string | null): AuditSection | null {
  if (value === "runs") return "runs";
  if (value === "audit" || value === "activity") return "activity";
  if (value === "cost" || value === "costs") return "costs";
  if (value === "budget" || value === "budgets") return "budgets";
  return null;
}

export function agentScopedAuditHref(agentId: string, section: AuditSection) {
  return auditSectionHref(section, {
    mode: section === "activity" ? "agents" : undefined,
    agentId,
  });
}
