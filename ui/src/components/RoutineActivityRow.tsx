import { i18n, t, useTranslation } from "@/i18n";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { ActivityEvent } from "@paperclipai/shared";
import { cn } from "@/lib/utils";

export type RoutineActivityEvent = Pick<ActivityEvent, "id" | "action" | "details" | "createdAt">;

function formatTime(value: string | Date): string {
  try {
    return new Date(value).toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit" });
  } catch {
    return String(value);
  }
}

function summarizeEvent(event: RoutineActivityEvent): string {
  const details = event.details;
  if (event.action === "routine.webhook_test_received") return t("routineActivity.connection_working_no_run_or_task_created");
  if (event.action === "routine.webhook_test_rejected") return t("routineActivity.update_the_key_in_your_app_and_resend");
  if (event.action === "routine.webhook_received") return t("routineActivity.authentication_passed");
  if (event.action === "routine.webhook_rejected") return t("routineActivity.check_the_key_in_your_sending_app");
  if (!details) return "";
  if (typeof details.changeSummary === "string") return details.changeSummary;
  if (event.action === "routine.run_triggered") return `${details.source === "webhook" ? "Webhook" : details.source === "schedule" ? t("routineActivity.schedule") : t("routineActivity.manual")} · ${routineActivityStatusLabel(String(details.status ?? ""))}`;
  return Object.entries(details).filter(([key]) => !/id$/i.test(key)).slice(0, 3)
    .map(([key, value]) => `${key.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ").toLowerCase()}: ${formatDetailValue(value)}`)
    .join(" · ");
}

function routineActivityStatusLabel(status: string): string {
  switch (status) {
    case "issue_created": return t("routineActivity.task_created");
    case "received": return t("routineActivity.received");
    case "coalesced": return t("routineActivity.coalesced");
    case "skipped": return t("routineActivity.skipped");
    case "completed": return t("routineActivity.completed");
    case "failed": return t("routineActivity.failed");
    default: return status.replaceAll("_", " ");
  }
}

function formatDetailValue(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.length === 0 ? "[]" : value.map(formatDetailValue).join(", ");
  try {
    return JSON.stringify(value);
  } catch {
    return "[unserializable]";
  }
}

const actionLabels: Record<string, string> = {
  get "routine.webhook_test_received"() { return t("routineActivity.connection_test_passed"); },
  get "routine.webhook_test_rejected"() { return t("routineActivity.connection_test_rejected"); },
  get "routine.webhook_received"() { return t("routineActivity.webhook_event_received"); },
  get "routine.webhook_rejected"() { return t("routineActivity.webhook_authentication_failed"); },
  get "routine.created"() { return t("routineActivity.routine_created"); }, get "routine.updated"() { return t("routineActivity.routine_updated"); },
  get "routine.trigger_created"() { return t("routineActivity.trigger_added"); }, get "routine.trigger_updated"() { return t("routineActivity.trigger_updated"); },
  get "routine.trigger_deleted"() { return t("routineActivity.trigger_removed"); }, get "routine.trigger_removed"() { return t("routineActivity.trigger_removed"); }, get "routine.trigger_restored"() { return t("routineActivity.trigger_restored"); }, get "routine.trigger_setup_finished"() { return t("routineActivity.webhook_setup_finished"); }, get "routine.trigger_secret_rotated"() { return t("routineActivity.webhook_key_replaced"); },
  get "routine.run_triggered"() { return t("routineActivity.routine_started"); }, get "routine.run_created"() { return t("routineActivity.run_created"); },
};
export function routineActivityActionLabel(action: string) {
  return actionLabels[action] ?? action.replace(/^routine[._]/, "").replaceAll("_", " ").replaceAll(".", " ").replace(/^./, (char) => char.toUpperCase());
}

/** Activity log row with an expandable JSON payload (§3.7). */
export function RoutineActivityRow({ event }: { event: RoutineActivityEvent }) {
  useTranslation();
  const [expanded, setExpanded] = useState(false);
  const hasPayload = event.details != null && Object.keys(event.details).length > 0;

  return (
    <div className="border-b border-border/60 last:border-b-0">
      <button
        type="button"
        disabled={!hasPayload}
        aria-expanded={hasPayload ? expanded : undefined}
        onClick={() => setExpanded((value) => !value)}
        className={cn(
          "flex min-w-0 w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs whitespace-nowrap",
          hasPayload ? "hover:bg-accent/30" : "cursor-default",
        )}
      >
        <span className="w-16 shrink-0 whitespace-nowrap font-mono tabular-nums text-muted-foreground">
          {formatTime(event.createdAt)}
        </span>
        <span title={event.action} className="min-w-0 max-w-1/2 shrink-0 truncate font-medium text-foreground">
          {routineActivityActionLabel(event.action)}
        </span>
        <span title={summarizeEvent(event)} className="min-w-0 flex-1 truncate text-muted-foreground">
          {summarizeEvent(event)}
        </span>
        {hasPayload ? (
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
              expanded && "rotate-90",
            )}
          />
        ) : null}
      </button>
      {expanded && hasPayload ? (
        <pre className="mx-2 mb-2 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs text-foreground">
          {JSON.stringify(event.details, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
