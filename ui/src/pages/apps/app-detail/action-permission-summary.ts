import type { ToolCatalogEntry } from "@paperclipai/shared";
import { t } from "@/i18n";

export type ActionPermissionSummary = {
  allowedCount: number;
  askFirstCount: number;
  offCount: number;
};

export function summarizeActionPermissions(
  entries: ToolCatalogEntry[],
  enabledIds: Set<string>,
  askFirstIds: Set<string>,
): ActionPermissionSummary {
  let allowedCount = 0;
  let askFirstCount = 0;
  let offCount = 0;

  for (const entry of entries) {
    if (!enabledIds.has(entry.id)) {
      offCount += 1;
    } else if (askFirstIds.has(entry.id)) {
      askFirstCount += 1;
    } else {
      allowedCount += 1;
    }
  }

  return { allowedCount, askFirstCount, offCount };
}

export function formatActionPermissionSummary(summary: ActionPermissionSummary): string {
  return [
    t("appTestPanel.summaryAllowed", { count: summary.allowedCount }),
    t("appTestPanel.summaryAskFirst", { count: summary.askFirstCount }),
    t("appTestPanel.summaryOff", { count: summary.offCount }),
  ].join(" · ");
}
