import { safeWorkspaceRestorePath } from "@paperclipai/shared";
import { t } from "@/i18n";

export function workspaceRestoreMarkerDetail(input: {
  result: Record<string, unknown> | null | undefined;
  savedPlan: boolean;
  hasResponse: boolean;
}): string {
  const parts = [input.savedPlan
    ? t("taskThread.workspace_restore_plan_saved")
    : t("taskThread.workspace_restore_failed_detail")];
  parts.push(t("taskThread.workspace_files_need_recovery"));
  if (!input.hasResponse && input.result?.finalResponseRecorded === false) {
    parts.push(t("taskThread.no_final_response_recorded"));
  }
  const relativePath = safeWorkspaceRestorePath(input.result?.workspaceRestorePath);
  if (relativePath) parts.push(t("taskThread.affected_path", { path: relativePath }));
  return parts.join(" ");
}
