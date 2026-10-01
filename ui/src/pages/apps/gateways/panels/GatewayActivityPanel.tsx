import { useTranslation } from "@/i18n";
import { useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ToolMcpGatewayWithTokens, ToolRedactedValueSummary } from "@paperclipai/shared";
import { toolsApi, type ToolAuditOutcome, type ToolGatewayActivityEvent } from "@/api/tools";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { queryKeys } from "@/lib/queryKeys";
import { ErrorState, RelativeTime } from "@/pages/tools/shared";

const PAGE_SIZE = 25;
const INVOCATION_STATUS_KEYS: Record<string, string> = {"pending":"appsGatewayFinal.pending","authorized":"appsGatewayFinal.authorized","denied":"appsGatewayFinal.denied","awaiting_approval":"appsGatewayFinal.awaitingApproval","executing":"appsGatewayFinal.executing","succeeded":"appsGatewayFinal.succeeded","failed":"appsGatewayFinal.failed","cancelled":"appsGatewayFinal.cancelled","timed_out":"appsGatewayFinal.timedOut","rate_limited":"appsGatewayFinal.rateLimited"};
const POLICY_DECISION_KEYS: Record<string, string> = {"allow":"appsGatewayFinal.allow","deny":"appsGatewayFinal.deny","require_approval":"appsGatewayFinal.requireApproval","rate_limited":"appsGatewayFinal.rateLimited","defer_runtime":"appsGatewayFinal.deferRuntime"};

const OUTCOME_META: Record<ToolAuditOutcome, { label: string; status: string }> = {
  allowed: { label: "appsGatewayFinal.allowed", status: "allowed" },
  blocked: { label: "appsGatewayFinal.blocked", status: "denied" },
  asked_first: { label: "appsGatewayFinal.askedFirst", status: "require-approval" },
  waiting: { label: "appsGatewayFinal.waiting", status: "deferred" },
  failed: { label: "appsGatewayFinal.failed", status: "failed" },
  unknown: { label: "appsGatewayFinal.recorded", status: "unchecked" },
};

function detailString(details: Record<string, unknown> | null, key: string): string | null {
  const value = details?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function formatSummary(summary: ToolRedactedValueSummary | null | undefined): string | null {
  if (!summary?.summary) return null;
  try {
    return JSON.stringify(JSON.parse(summary.summary), null, 2);
  } catch {
    return summary.summary;
  }
}

function summaryFromDetails(
  details: Record<string, unknown> | null,
  key: "argumentsSummary" | "resultSummary",
): ToolRedactedValueSummary | null {
  const value = details?.[key];
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const summary = (value as Record<string, unknown>).summary;
  return typeof summary === "string" ? { summary } : null;
}

function durationLabel(event: ToolGatewayActivityEvent): string | null {
  const started = event.invocation?.startedAt ? new Date(event.invocation.startedAt).getTime() : Number.NaN;
  const completed = event.invocation?.completedAt ? new Date(event.invocation.completedAt).getTime() : Number.NaN;
  if (!Number.isFinite(started) || !Number.isFinite(completed) || completed < started) return null;
  return `${completed - started} ms`;
}

function Fact({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-3 py-1">
      <dt className="w-28 shrink-0 text-muted-foreground">{label}</dt>
      <dd className={mono ? "min-w-0 break-all font-mono text-(length:--text-micro) text-foreground" : "min-w-0 text-foreground"}>
        {value}
      </dd>
    </div>
  );
}

function ActivityRow({ event }: { event: ToolGatewayActivityEvent }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const outcome = OUTCOME_META[event.normalizedOutcome] ?? OUTCOME_META.unknown;
  const actor = event.agentDisplayName ?? t("appsGatewayFinal.client");
  const app = event.appDisplayName ?? event.connectionDisplayName ?? event.applicationDisplayName ?? t("appsGatewayFinal.app");
  const tool = event.toolDisplayName ?? event.invocation?.toolName ?? t("appsGatewayFinal.toolCall");
  const rawTool = event.invocation?.toolName ?? detailString(event.details, "tool") ?? detailString(event.details, "toolName");
  const reason = detailString(event.details, "reasonCode");
  const argumentsText = formatSummary(
    event.invocation?.argumentsSummary ?? summaryFromDetails(event.details, "argumentsSummary"),
  );
  const resultText = formatSummary(
    event.invocation?.resultSummary ?? summaryFromDetails(event.details, "resultSummary"),
  );
  const duration = durationLabel(event);

  return (
    <li className="text-sm">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-start gap-2.5 px-4 py-3 text-left hover:bg-accent/50"
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-foreground">
            <span className="font-medium">{actor}</span> {t("appsGatewayFinal.used")} <span className="font-medium">{tool}</span> {t("appsGatewayFinal.in")} {app}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2 whitespace-nowrap">
          <StatusBadge status={outcome.status} label={t(outcome.label)} />
          <span className="text-xs text-muted-foreground">
            · <RelativeTime value={event.createdAt} />
          </span>
        </span>
      </button>

      {open ? (
        <div className="border-t border-border bg-muted/30 px-4 py-3 pl-10 text-xs">
          <dl>
            {rawTool ? <Fact label={t("appsGatewayFinal.tool")} value={rawTool} mono /> : null}
            {event.invocation?.status ? <Fact label={t("appsGatewayFinal.callStatus")} value={INVOCATION_STATUS_KEYS[event.invocation.status] ? t(INVOCATION_STATUS_KEYS[event.invocation.status]) : event.invocation.status} /> : null}
            {event.invocation?.policyDecision ? <Fact label={t("appsGatewayFinal.decision")} value={POLICY_DECISION_KEYS[event.invocation.policyDecision] ? t(POLICY_DECISION_KEYS[event.invocation.policyDecision]) : event.invocation.policyDecision} /> : null}
            {reason ? <Fact label={t("appsGatewayFinal.reason")} value={reason} mono /> : null}
            {duration ? <Fact label={t("appsGatewayFinal.duration")} value={duration} /> : null}
            {event.invocation?.id ? <Fact label={t("appsGatewayFinal.invocationId")} value={event.invocation.id} mono /> : null}
            {event.invocation?.errorCode ? <Fact label={t("appsGatewayFinal.errorCode")} value={event.invocation.errorCode} mono /> : null}
            {event.invocation?.errorMessage ? <Fact label={t("appsGatewayFinal.error")} value={event.invocation.errorMessage} /> : null}
          </dl>
          {argumentsText ? (
            <div className="mt-2 space-y-1">
              <div className="text-muted-foreground">{t("appsGatewayFinal.arguments")}</div>
              <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-md border border-border bg-background p-3 font-mono text-xs text-foreground">
                {argumentsText}
              </pre>
            </div>
          ) : null}
          {resultText ? (
            <div className="mt-3 space-y-1">
              <div className="text-muted-foreground">{t("appsGatewayFinal.result")}</div>
              <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-md border border-border bg-background p-3 font-mono text-xs text-foreground">
                {resultText}
              </pre>
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export function GatewayActivityPanel({
  companyId,
  gateway,
}: {
  companyId: string;
  gateway: ToolMcpGatewayWithTokens;
}) {
  const { t } = useTranslation();
  const activityQuery = useInfiniteQuery({
    queryKey: queryKeys.tools.activity(companyId, { gateway: gateway.id, window: "30d" }),
    queryFn: ({ pageParam }) =>
      toolsApi.listActivity(companyId, {
        gateway: gateway.id,
        window: "30d",
        limit: PAGE_SIZE,
        cursor: pageParam ?? undefined,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const events = useMemo(
    () => activityQuery.data?.pages.flatMap((page) => page.events) ?? [],
    [activityQuery.data],
  );

  if (activityQuery.isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }
  if (activityQuery.isError) {
    return <ErrorState error={activityQuery.error} onRetry={() => activityQuery.refetch()} />;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {t("appsGatewayFinal.activityIntro")}
      </p>
      {events.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {t("appsGatewayFinal.noCalls")}
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {events.map((event) => <ActivityRow key={event.id} event={event} />)}
        </ul>
      )}
      {activityQuery.hasNextPage ? (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => activityQuery.fetchNextPage()}
            disabled={activityQuery.isFetchingNextPage}
          >
            {activityQuery.isFetchingNextPage ? t("appsGatewayFinal.loading") : t("appsGatewayFinal.loadMore")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
