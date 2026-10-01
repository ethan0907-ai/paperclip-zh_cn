import { i18n, t, useTranslation } from "@/i18n";
import { useEffect, useState } from "react";
import { Clock3, RefreshCw, Save, Trash2, Webhook, Zap } from "lucide-react";
import type { RoutineTrigger } from "@paperclipai/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScheduleEditor } from "./ScheduleEditor";
import { buildRoutineTriggerPatch } from "../lib/routine-trigger-patch";
import { describeCron } from "../lib/cron-readable";

const signingModes = ["app_webhook", "bearer", "hmac_sha256", "github_hmac", "none"];
const SIGNING_MODES_WITHOUT_REPLAY_WINDOW = new Set(["app_webhook", "bearer", "github_hmac", "fireflies_hmac", "none"]);

export function routineSigningModeLabel(mode: string): string {
  switch (mode) {
    case "app_webhook": return t("routineEntrypoints.signed_app");
    case "bearer": return t("routineEntrypoints.bearer_token");
    case "hmac_sha256": return "HMAC-SHA256";
    case "github_hmac": return t("routineEntrypoints.github_signature");
    case "fireflies_hmac": return t("routineEntrypoints.legacy_signature");
    case "none": return t("routineEntrypoints.no_authentication");
    default: return mode;
  }
}

function getLocalTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

/**
 * Single trigger card with its own field-edit + save state (§3.2). Extracted
 * from the previous inline `TriggerEditor` in `RoutineDetail.tsx` — same logic.
 */
export function RoutineTriggerCard({
  trigger,
  onSave,
  onRotate,
  onDelete,
  disabled,
}: {
  trigger: RoutineTrigger;
  onSave: (id: string, patch: Record<string, unknown>) => void;
  onRotate: (id: string) => void;
  onDelete: (id: string) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState({
    label: trigger.label ?? "",
    cronExpression: trigger.cronExpression ?? "",
    signingMode: trigger.signingMode ?? "bearer",
    replayWindowSec: String(trigger.replayWindowSec ?? 300),
  });

  useEffect(() => {
    setDraft({
      label: trigger.label ?? "",
      cronExpression: trigger.cronExpression ?? "",
      signingMode: trigger.signingMode ?? "bearer",
      replayWindowSec: String(trigger.replayWindowSec ?? 300),
    });
  }, [trigger]);

  const KindIcon =
    trigger.kind === "schedule" ? Clock3 : trigger.kind === "webhook" ? Webhook : Zap;
  const humanCron = trigger.kind === "schedule" ? describeCron(draft.cronExpression) : null;
  const lastResultFailed = /fail|error/i.test(trigger.lastResult ?? "");
  const lastResultLabel = trigger.lastResult?.startsWith("Created execution issue ")
    ? t("routineEntrypoints.task_created")
    : trigger.lastResult;
  const kindLabel = trigger.kind === "schedule" ? t("routineEntrypoints.schedule") : trigger.kind === "webhook" ? "Webhook" : "API";

  return (
    <form
      aria-label={t("routineEntrypoints.trigger_label", { label: trigger.label ?? kindLabel })}
      className="space-y-4 rounded-lg border border-border p-4"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium">
            <KindIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{trigger.label ?? kindLabel}</span>
          </div>
          {humanCron ? (
            <p id={`cron-readable-${trigger.id}`} className="text-xs text-muted-foreground">
              {humanCron}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {trigger.lastResult ? (
            <Badge variant={lastResultFailed ? "destructive" : "secondary"}>
              {lastResultLabel}
            </Badge>
          ) : null}
          <span className="text-xs text-muted-foreground">
            {trigger.kind === "schedule" && trigger.nextRunAt
              ? t("routineEntrypoints.next_at", { time: new Date(trigger.nextRunAt).toLocaleString(i18n.language) })
              : trigger.kind === "webhook"
                ? "Webhook"
                : "API"}
          </span>
        </div>
      </div>

      {trigger.kind === "webhook" && trigger.webhookUrl && (
        <div className="space-y-1.5">
          <Label htmlFor={`webhook-url-${trigger.id}`} className="text-xs">{t("routineEntrypoints.webhook_url")}</Label>
          <Input id={`webhook-url-${trigger.id}`} value={trigger.webhookUrl} readOnly onFocus={(event) => event.target.select()} />
          <p className="text-xs text-muted-foreground">{t("routineEntrypoints.send_a_post_request_with_content_type_application_json_keep_this_url_private_when_signing_is_disabled")}</p>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">{t("routineEntrypoints.label")}</Label>
          <Input
            value={draft.label}
            disabled={disabled}
            onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))}
          />
        </div>
        {trigger.kind === "schedule" && (
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs">{t("routineEntrypoints.schedule")}</Label>
            <ScheduleEditor
              value={draft.cronExpression}
              onChange={(cronExpression) =>
                setDraft((current) => ({ ...current, cronExpression }))
              }
            />
          </div>
        )}
        {trigger.kind === "webhook" && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("routineEntrypoints.signing_mode")}</Label>
              <Select
                value={draft.signingMode}
                onValueChange={(signingMode) =>
                  setDraft((current) => ({ ...current, signingMode }))
                }
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {signingModes.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {routineSigningModeLabel(mode)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!SIGNING_MODES_WITHOUT_REPLAY_WINDOW.has(draft.signingMode) && (
              <div className="space-y-1.5">
                <Label className="text-xs">{t("routineEntrypoints.replay_window_seconds")}</Label>
                <Input
                  value={draft.replayWindowSec}
                  disabled={disabled}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, replayWindowSec: event.target.value }))
                  }
                />
              </div>
            )}
          </>
        )}
      </div>

      {!disabled && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="mr-auto text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(trigger.id)}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />{t("routineEntrypoints.delete")}</Button>
          {trigger.kind === "webhook" && (
            <Button variant="outline" size="sm" onClick={() => onRotate(trigger.id)}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />{t("routineEntrypoints.rotate_secret")}</Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onSave(trigger.id, buildRoutineTriggerPatch(trigger, draft, getLocalTimezone()))
            }
          >
            <Save className="mr-1.5 h-3.5 w-3.5" />{t("routineEntrypoints.save_trigger")}</Button>
        </div>
      )}
    </form>
  );
}
