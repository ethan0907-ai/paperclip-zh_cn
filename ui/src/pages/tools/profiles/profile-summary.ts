import { t } from "@/i18n";
import type { ToolProfileStatus, ToolProfileSummary, ToolProfileWithDetails } from "@paperclipai/shared";

/**
 * Prosumer copy for the access-profile index (PAP-10997, AP1). Reads the
 * server-computed `summary` and renders the friendly "Allows" / "Assigned to"
 * lines the table shows. Vocabulary gate: nothing here says
 * binding/entry/selector/priority — only "tools", "apps", "agents".
 */

function plural(n: number, one: string): string {
  return t(`toolsProfilesUi.${one}Count`, { count: n });
}

/** "9 tools · 3 apps" / "All tools" / "All except 2 tools". */
export function allowsLabel(summary: ToolProfileSummary): string {
  if (summary.accessMode === "all_except") {
    return summary.excludedToolCount === 0
      ? t("toolsProfilesUi.allTools")
      : t("toolsProfilesUi.allExceptTools", { count: summary.excludedToolCount });
  }
  const parts = [plural(summary.allowedToolCount, "tool")];
  if (summary.allowedApplicationCount > 0) {
    parts.push(plural(summary.allowedApplicationCount, "app"));
  }
  return parts.join(" · ");
}

export interface AssignedLabel {
  text: string;
  /** A profile with no assignment has no effect — the index shows a quiet hint. */
  unassigned: boolean;
}

/** "Organization default" / "2 agents" / "Not assigned yet". */
export function assignedLabel(summary: ToolProfileSummary): AssignedLabel {
  if (summary.isCompanyDefault) return { text: t("toolsProfilesUi.organizationDefault"), unassigned: false };
  if (summary.appliesToAgentCount > 0) {
    return { text: plural(summary.appliesToAgentCount, "agent"), unassigned: false };
  }
  if (summary.assignmentCount > 0) {
    return { text: plural(summary.assignmentCount, "assignment"), unassigned: false };
  }
  return { text: t("toolsProfilesUi.notAssignedYet"), unassigned: true };
}

export const STATUS_LABEL: Record<ToolProfileStatus, string> = {
  get draft() { return t("toolsProfilesUi.draft"); },
  get active() { return t("toolsProfilesUi.active"); },
  get disabled() { return t("toolsProfilesUi.off"); },
  get archived() { return t("toolsProfilesUi.archived"); },
};

export function isDraft(profile: Pick<ToolProfileWithDetails, "status">): boolean {
  return profile.status === "draft";
}
