import { t } from "@/i18n";
import { formatDateTime } from "./utils";

type RetryAwareRun = {
  status: string;
  retryOfRunId?: string | null;
  scheduledRetryAt?: string | Date | null;
  scheduledRetryAttempt?: number | null;
  scheduledRetryReason?: string | null;
  retryExhaustedReason?: string | null;
};

export type RunRetryStateSummary = {
  kind: "scheduled" | "exhausted" | "attempted";
  badgeLabel: string;
  tone: string;
  detail: string | null;
  secondary: string | null;
  retryOfRunId: string | null;
};

const RETRY_REASON_LABELS: Record<string, string> = {
  get transient_failure() { return t("agentDetailHelpUi.transientFailure"); },
  get missing_issue_comment() { return t("agentDetailHelpUi.missingIssueComment"); },
  get process_lost() { return t("agentDetailHelpUi.processLost"); },
  get assignment_recovery() { return t("agentDetailHelpUi.assignmentRecovery"); },
  get issue_continuation_needed() { return t("agentDetailHelpUi.continuationNeeded"); },
  get max_turns_continuation() { return t("agentDetailHelpUi.maxTurnContinuation"); },
};

function readNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function joinFragments(parts: Array<string | null>) {
  const filtered = parts.filter((part): part is string => Boolean(part));
  return filtered.length > 0 ? filtered.join(" · ") : null;
}

export function formatRetryReason(reason: string | null | undefined) {
  const normalized = readNonEmptyString(reason);
  if (!normalized) return null;
  return RETRY_REASON_LABELS[normalized] ?? normalized.replace(/_/g, " ");
}

export function describeRunRetryState(run: RetryAwareRun): RunRetryStateSummary | null {
  const attempt =
    typeof run.scheduledRetryAttempt === "number" && Number.isFinite(run.scheduledRetryAttempt) && run.scheduledRetryAttempt > 0
      ? run.scheduledRetryAttempt
      : null;
  const attemptLabel = attempt ? t("agentDetailHelpUi.attempt", { count: attempt }) : null;
  const reasonLabel = formatRetryReason(run.scheduledRetryReason);
  const retryOfRunId = readNonEmptyString(run.retryOfRunId);
  const exhaustedReason = readNonEmptyString(run.retryExhaustedReason);
  const dueAt = run.scheduledRetryAt ? formatDateTime(run.scheduledRetryAt) : null;
  const isMaxTurnContinuation = run.scheduledRetryReason === "max_turns_continuation";
  const hasRetryMetadata =
    Boolean(retryOfRunId)
    || Boolean(reasonLabel)
    || Boolean(dueAt)
    || Boolean(attemptLabel)
    || Boolean(exhaustedReason);

  if (!hasRetryMetadata) return null;

  if (run.status === "scheduled_retry") {
    return {
      kind: "scheduled",
      badgeLabel: isMaxTurnContinuation ? t("agentDetailHelpUi.continuationScheduled") : t("agentDetailHelpUi.retryScheduled"),
      tone: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
      detail: joinFragments([attemptLabel, reasonLabel]),
      secondary: dueAt
        ? t("agentDetailHelpUi.due", { label: isMaxTurnContinuation ? t("agentDetailHelpUi.nextContinuation") : t("agentDetailHelpUi.nextRetry"), time: dueAt })
        : t("agentDetailHelpUi.pending", { label: isMaxTurnContinuation ? t("agentDetailHelpUi.nextContinuation") : t("agentDetailHelpUi.nextRetry") }),
      retryOfRunId,
    };
  }

  if (exhaustedReason) {
    return {
      kind: "exhausted",
      badgeLabel: isMaxTurnContinuation ? t("agentDetailHelpUi.continuationExhausted") : t("agentDetailHelpUi.retryExhausted"),
      tone: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      detail: joinFragments([attemptLabel, reasonLabel, t("agentDetailHelpUi.automaticRetriesExhausted")]),
      secondary: exhaustedReason.includes("Manual intervention required")
        ? exhaustedReason
        : t("agentDetailHelpUi.manualIntervention", { reason: exhaustedReason }),
      retryOfRunId,
    };
  }

  return {
    kind: "attempted",
    badgeLabel: isMaxTurnContinuation ? t("agentDetailHelpUi.continuedRun") : t("agentDetailHelpUi.retriedRun"),
    tone: "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300",
    detail: joinFragments([attemptLabel, reasonLabel]),
    secondary: null,
    retryOfRunId,
  };
}
