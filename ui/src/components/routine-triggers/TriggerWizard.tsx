import { t, useTranslation } from "@/i18n";
import { useCallback, useEffect, useState } from "react";
import {
  CalendarClock,
  Check,
  CheckCircle2,
  AlertCircle,
  Globe,
  GitBranch,
  Radio,
  Webhook,
} from "lucide-react";
import {
  SetupWizardNavigation,
  SetupWizardFooter,
} from "@/components/SetupWizard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBreadcrumbs } from "@/context/BreadcrumbContext";
import { cn } from "@/lib/utils";
import { AgentInstructions, CopyField } from "./WebhookFields";
import { WebhookUrlWarning } from "./WebhookUrlWarning";

export type TriggerDraft = {
  kind: "choose" | "schedule" | "webhook";
  step: number;
  availableStep: number;
  sender: "custom" | "github";
  /** Retained when resuming webhooks created before generic signed-app support. */
  signingMode?: "bearer" | "app_webhook" | "fireflies_hmac";
  frequency: string;
  time: string;
  weekday: string;
  timezone: string;
  created: boolean;
};
export const defaultTriggerDraft: TriggerDraft = {
  kind: "choose",
  step: 0,
  availableStep: 0,
  sender: "custom",
  frequency: "weekdays",
  time: "09:00",
  weekday: "Monday",
  timezone: "America/Chicago",
  created: false,
};
export function webhookAgentInstructions(
  sender: TriggerDraft["sender"],
  routineTitle: string,
  webhookUrl: string,
  webhookSecret: string,
  setupPending = true,
  signingMode: TriggerDraft["signingMode"] = "app_webhook",
) {
  const common = [
    `Connect the sending app to the Paperclip routine ${JSON.stringify(routineTitle)}.`,
    `Webhook URL: ${webhookUrl}`,
    "Send an HTTP POST request with a JSON object as the body (not an array or string).",
    "Content-Type: application/json",
  ];
  const auth =
    sender === "github"
      ? [
          "In GitHub, open your repository → Settings → Webhooks → Add webhook.",
          "Use the webhook URL above as Payload URL and select application/json as Content type.",
          `Secret: ${webhookSecret}`,
          "Paste this value into GitHub’s Secret field. GitHub signs requests with X-Hub-Signature-256; do not use Bearer authentication.",
          "Select the events that should start this routine, enable the webhook, and save.",
          "To check the connection, open Recent Deliveries and redeliver an event.",
        ]
      : [
          `Secret key: ${webhookSecret}`,
          ...(signingMode === "bearer" ? [] : [
            `If the app asks for a signing secret, paste the secret key above. Paperclip accepts HMAC-SHA256 over the exact request body in ${signingMode === "fireflies_hmac" ? "X-Hub-Signature" : "X-Hub-Signature or X-Hub-Signature-256"}, formatted sha256=<hex digest>.`,
          ]),
          ...(signingMode === "fireflies_hmac" ? [] : [
            `For apps with custom headers, use Authorization: Bearer ${webhookSecret}`,
          ]),
          "Subscribe only to the events that should start this routine. Public services need a publicly reachable HTTPS URL.",
          "In the sending app, add a webhook using this URL, POST method, JSON body, and headers, then save it.",
          "Send a unique Idempotency-Key header for each event and reuse it on retries, so retrying a setup test after activation cannot start the routine.",
          'Example JSON body: {"event":"deployment.completed","environment":"production"}',
          "To check the connection, send a test event from the app or perform the action that triggers a delivery.",
        ];
  return [
    ...common,
    ...auth,
    "Open Check connection in Paperclip to see whether the event arrived and authentication passed.",
    ...(setupPending
      ? [
          "During setup, deliveries only test the connection. They do not start the routine or create a task.",
          "Finish setup in Paperclip to enable this webhook for future events. Test events are not replayed.",
        ]
      : [
          "This webhook is enabled. Deliveries can start the routine and create tasks.",
        ]),
    "Store the key securely; do not put it in source control or logs.",
  ].join("\n");
}
export function describeSchedule(draft: TriggerDraft) {
  const frequency = draft.frequency === "daily" ? t("routineTriggers.every_day") : draft.frequency === "weekly" ? t("routineTriggers.every_weekday_selected", { day: triggerWeekdayLabel(draft.weekday) }) : t("routineTriggers.every_weekday");
  return t("routineTriggers.schedule_at", { frequency, time: draft.time });
}
export function triggerWeekdayLabel(day: string) {
  switch (day) {
    case "Monday": return t("routineTriggers.monday");
    case "Tuesday": return t("routineTriggers.tuesday");
    case "Wednesday": return t("routineTriggers.wednesday");
    case "Thursday": return t("routineTriggers.thursday");
    case "Friday": return t("routineTriggers.friday");
    case "Saturday": return t("routineTriggers.saturday");
    case "Sunday": return t("routineTriggers.sunday");
    default: return day;
  }
}
export function RoutineTriggerWizard({
  initialDraft,
  onSaveExit,
  onFinish,
  onCreateWebhook,
  onRotateKey,
  routineTitle,
  routineId,
  routineActive = true,
  webhookUrl = "",
  webhookSecret = "",
  checkResult = "waiting",
}: {
  initialDraft: TriggerDraft;
  routineTitle: string;
  routineId: string;
  routineActive?: boolean;
  webhookUrl?: string;
  webhookSecret?: string;
  onCreateWebhook?: (draft: TriggerDraft) => Promise<void>;
  onRotateKey?: () => Promise<void>;
  onSaveExit: (draft: TriggerDraft) => void | Promise<void>;
  onFinish: (draft: TriggerDraft) => void | Promise<void>;
  checkResult?: "waiting" | "received" | "rejected" | "no_event";
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(initialDraft);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState("");
  const { setBreadcrumbs } = useBreadcrumbs();
  const perform = useCallback(
    async (action: () => void | Promise<void>) => {
      if (busy) return;
      setBusy(true);
      setSaveError("");
      try {
        await action();
      } catch (error) {
        setSaveError(
          error instanceof Error
            ? error.message
            : t("routineTriggers.could_not_save"),
        );
      } finally {
        setBusy(false);
      }
    },
    [busy, t],
  );
  const saveAndExit = useCallback(() => {
    void perform(() => onSaveExit(draft));
  }, [draft, onSaveExit, perform]);
  useEffect(() => {
    setBreadcrumbs([
      {
        label: routineTitle,
        href: `/routines/${routineId}/triggers`,
        onClick: (event) => {
          if (
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
          )
            return;
          event.preventDefault();
          saveAndExit();
        },
      },
      { label: t("routineTriggers.add_trigger") },
    ]);
  }, [saveAndExit, setBreadcrumbs, routineTitle, routineId, t]);
  const schedule = draft.kind === "schedule";
  const github = draft.sender === "github";
  const labels = schedule
    ? [t("routineTriggers.choose_trigger"), t("routineTriggers.set_schedule"), t("routineTriggers.review_schedule")]
    : [t("routineTriggers.choose_trigger"), t("routineTriggers.connect_your_app"), t("routineTriggers.check_connection")];
  function patch(values: Partial<TriggerDraft>) {
    setDraft((current) => ({ ...current, ...values }));
  }
  function advance() {
    void perform(async () => {
      if (draft.kind === "webhook" && draft.step === 0 && !draft.created)
        await onCreateWebhook?.(draft);
      const step = draft.step + 1;
      patch({
        step,
        availableStep: Math.max(draft.availableStep, step),
        created:
          draft.created || (draft.kind === "webhook" && draft.step === 0),
      });
    });
  }
  const title =
    draft.step === 0
      ? t("routineTriggers.when_should_this_routine_run")
      : schedule
        ? draft.step === 1
          ? t("routineTriggers.set_a_schedule")
          : t("routineTriggers.review_your_schedule")
        : draft.step === 1
          ? t(github ? "routineTriggers.connect_github" : "routineTriggers.connect_your_app")
          : t("routineTriggers.check_your_connection");
  const subtitle =
    draft.step === 0
      ? t("routineTriggers.choose_start", { title: routineTitle })
      : schedule
        ? draft.step === 1
          ? t("routineTriggers.choose_when_paperclip_should_start_this_routine_automatically")
          : t("routineTriggers.this_schedule_starts_the_routine_automatically_you_can_pause_or_change_it_later")
        : draft.step === 1
          ? t("routineTriggers.copy_these_details_into_the_sending_app_then_save_its_webhook_settings")
          : t("routineTriggers.test_that_events_arrive_and_authentication_works_this_won_t_start_the_routine");
  const selectClass =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
  const goBack = (
    <Button variant="outline" onClick={() => patch({ step: draft.step - 1 })}>{t("routineTriggers.back")}</Button>
  );
  return (
    <div className="min-w-0 w-full max-w-2xl space-y-6">
      <SetupWizardNavigation
        takeover
        disabled={busy}
        ariaLabel={t("routineTriggers.trigger_setup_progress")}
        labels={labels}
        step={draft.step}
        availableStep={draft.availableStep}
        onSelect={(step) => patch({ step })}
      />
      <fieldset disabled={busy} className="min-w-0 space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {!schedule && draft.step > 0 && <WebhookUrlWarning url={webhookUrl} />}
        {draft.step === 0 && (
          <fieldset className="space-y-3">
            <legend className="sr-only">{t("routineTriggers.trigger_type")}</legend>
            {(
              [
                {
                  kind: "schedule",
                  label: t("routineTriggers.on_a_schedule"),
                  detail: t("routineTriggers.every_day_on_weekdays_or_once_a_week"),
                  Icon: CalendarClock,
                },
                {
                  kind: "webhook",
                  label: t("routineTriggers.when_another_app_sends_a_webhook"),
                  detail:
                    t("routineTriggers.when_something_happens_in_github_another_app_or_a_script"),
                  Icon: Webhook,
                },
              ] as const
            ).map(({ kind, label, detail, Icon }) => (
              <label
                key={kind}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-md border p-4 focus-within:ring-2 focus-within:ring-ring",
                  draft.kind === kind
                    ? "border-primary bg-accent/30"
                    : "border-border hover:bg-accent/20",
                )}
              >
                <input
                  type="radio"
                  name="trigger-kind"
                  checked={draft.kind === kind}
                  disabled={draft.created && kind !== draft.kind}
                  onChange={() =>
                    patch({
                      kind,
                      availableStep:
                        kind === draft.kind ? draft.availableStep : 0,
                    })
                  }
                  className="sr-only"
                />
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1">
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {detail}
                  </span>
                </span>
                {draft.kind === kind && <Check className="h-4 w-4" />}
              </label>
            ))}
          </fieldset>
        )}
        {schedule && draft.step === 1 && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="repeat">{t("routineTriggers.repeat")}</Label>
                <select
                  id="repeat"
                  className={selectClass}
                  value={draft.frequency}
                  onChange={(event) => patch({ frequency: event.target.value })}
                >
                  <option value="daily">{t("routineTriggers.every_day")}</option>
                  <option value="weekdays">{t("routineTriggers.weekdays_monday_friday")}</option>
                  <option value="weekly">{t("routineTriggers.every_week")}</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="run-time">{t("routineTriggers.time")}</Label>
                <Input
                  id="run-time"
                  type="time"
                  value={draft.time}
                  onChange={(event) => patch({ time: event.target.value })}
                />
              </div>
            </div>
            {draft.frequency === "weekly" && (
              <div className="space-y-2">
                <Label htmlFor="run-day">{t("routineTriggers.day")}</Label>
                <select
                  id="run-day"
                  className={selectClass}
                  value={draft.weekday}
                  onChange={(event) => patch({ weekday: event.target.value })}
                >
                  {[
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday",
                  ].map((day) => (
                    <option key={day} value={day}>{triggerWeekdayLabel(day)}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="timezone">{t("routineTriggers.time_zone")}</Label>
              <select
                id="timezone"
                className={selectClass}
                value={draft.timezone}
                onChange={(event) => patch({ timezone: event.target.value })}
              >
                {Array.from(
                  new Set([
                    draft.timezone,
                    "America/Chicago",
                    "America/New_York",
                    "America/Los_Angeles",
                    "Europe/London",
                    "UTC",
                  ]),
                ).map((zone) => (
                  <option key={zone}>{zone}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">{t("routineTriggers.the_time_follows_this_zone_including_daylight_saving_changes")}</p>
            </div>
          </div>
        )}
        {schedule && draft.step === 2 && (
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-md bg-muted/40 p-4">
              <CalendarClock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{describeSchedule(draft)}</p>
                <p className="text-xs text-muted-foreground">
                  {draft.timezone}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{t("routineTriggers.each_scheduled_run_creates_a_task_for_the_routine_s_assigned_agent_any_existing_webhook_triggers_will_continue_to_work")}</p>
          </div>
        )}
        {draft.step === 0 && draft.kind === "webhook" && (
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium">{t("routineTriggers.what_s_sending_the_webhook")}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  {
                    sender: "custom",
                    label: t("routineTriggers.another_app_or_script"),
                    Icon: Globe,
                  },
                  { sender: "github", label: "GitHub", Icon: GitBranch },
                ] as const
              ).map(({ sender, label, Icon }) => (
                <label
                  key={sender}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-md border p-3 focus-within:ring-2 focus-within:ring-ring",
                    draft.sender === sender
                      ? "border-primary bg-accent/30"
                      : "border-border",
                    draft.created && "cursor-default",
                  )}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="sender"
                    checked={draft.sender === sender}
                    disabled={draft.created}
                    onChange={() => patch({ sender })}
                  />
                  <Icon className="h-4 w-4" />
                  <span className="flex-1 text-sm">{label}</span>
                  {draft.sender === sender && <Check className="h-4 w-4" />}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        {draft.kind === "webhook" && draft.step === 0 && (
          <p className="text-sm text-muted-foreground">{t("routineTriggers.public_services_need_a_publicly_reachable_https_webhook_url")}</p>
        )}
        {!schedule && draft.step === 1 && (
          <div className="space-y-5">
            {webhookSecret && (
              <AgentInstructions
                value={webhookAgentInstructions(
                  draft.sender,
                  routineTitle,
                  webhookUrl,
                  webhookSecret,
                  true,
                  draft.signingMode,
                )}
              />
            )}
            <CopyField
              label={github ? t("routineTriggers.payload_url") : t("routineTriggers.webhook_url")}
              value={webhookUrl}
            />
            {!github && draft.signingMode !== "bearer" && (
              <p className="text-sm text-muted-foreground">{t("routineTriggers.paste_this_key_into_your_app_s_signing_secret_field")}{draft.signingMode !== "fireflies_hmac" && <>
                  {" "}{t("routineTriggers.if_your_app_uses_custom_headers_instead_set_authorization_to_bearer_followed_by_a_space_and_this_key")}</>}
              </p>
            )}
            {webhookSecret ? (
              <CopyField
                label={github ? t("routineTriggers.secret") : draft.signingMode === "bearer" ? t("routineTriggers.authorization_header_value") : t("routineTriggers.secret_key")}
                value={!github && draft.signingMode === "bearer" ? `Bearer ${webhookSecret}` : webhookSecret}
              />
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{t("routineTriggers.the_key_is_hidden_after_leaving_setup_if_you_haven_t_saved_it_in_your_app_generate_a_replacement")}</p>
                <Button
                  variant="outline"
                  onClick={() => void perform(() => onRotateKey?.())}
                >{t("routineTriggers.generate_new_key")}</Button>
              </div>
            )}
          </div>
        )}
        {!schedule && draft.step === 2 && (
          <div className="space-y-5">
            <div className="space-y-1 rounded-md border border-border p-4">
              <p className="text-sm font-medium">{t("routineTriggers.connection_test_only")}</p>
              <p className="text-sm text-muted-foreground">{t("routineTriggers.events_received_during_setup_won_t_start_the_routine_or_create_tasks")}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("routineTriggers.send_an_event_from")}{" "}{github ? "GitHub" : t("routineTriggers.your_app")}
              </p>
              <p className="text-sm text-muted-foreground">
                {github
                  ? t("routineTriggers.open_this_webhook_in_your_repository_settings_under_recent_deliveries_choose_redeliver_on_an_event")
                  : t("routineTriggers.look_for_send_test_in_your_app_s_webhook_settings_if_it_doesn_t_have_one_do_the_action_that_should_trigger_the_webhook_for_example_complete_a_deployment")}
              </p>
              <p className="text-xs text-muted-foreground">{t("routineTriggers.keep_this_page_open_to_see_the_test_result")}</p>
            </div>
            <div
              role="status"
              className="flex items-start gap-3 rounded-md bg-muted/40 p-4"
            >
              {checkResult === "received" ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-(--status-task-done)" />
              ) : checkResult === "rejected" ? (
                <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
              ) : (
                <Radio className="h-5 w-5 shrink-0 text-muted-foreground" />
              )}
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {checkResult === "received"
                    ? t("routineTriggers.test_event_received_connection_working")
                    : checkResult === "rejected"
                      ? t("routineTriggers.event_arrived_but_the_key_was_rejected")
                      : checkResult === "no_event"
                        ? t("routineTriggers.no_event_received_yet")
                        : t("routineTriggers.waiting_for_an_event_from_your_app")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {checkResult === "received"
                    ? t("routineTriggers.authentication_passed_no_routine_run_or_task_was_created")
                    : checkResult === "rejected"
                      ? t("routineTriggers.go_back_to_connect_your_app_update_the_key_in_your_sending_app_and_resend_no_task_was_created")
                      : t("routineTriggers.waiting_to_verify_delivery_and_authentication_the_routine_is_not_running")}
                </p>
              </div>
            </div>
            <details>
              <summary className="cursor-pointer text-xs text-muted-foreground">{t("routineTriggers.troubleshoot_delivery")}</summary>
              <div className="space-y-3 pt-3">
                <p className="text-xs text-muted-foreground">{t("routineTriggers.check_that_the_webhook_is_enabled_in_your_sending_app_and_that_its_url_matches_scripts_must_send_post_with_a_json_body")}</p>
                <CopyField label={t("routineTriggers.webhook_url")} value={webhookUrl} />
              </div>
            </details>
          </div>
        )}
        {!schedule && draft.step === 2 && (
          <p className="text-xs text-muted-foreground">
            {routineActive
              ? t("routineTriggers.finish_setup_to_enable_this_webhook_future_events_will_start_the_routine_this_test_event_won_t_be_replayed")
              : t("routineTriggers.finish_setup_to_save_this_webhook_the_routine_is_paused_enable_its_automatic_triggers_when_you_re_ready_this_test_event_won_t_be_replayed")}
          </p>
        )}
        {schedule && draft.step === 2 && !routineActive && (
          <p className="text-sm text-muted-foreground">{t("routineTriggers.the_routine_is_paused_enable_its_automatic_triggers_when_you_re_ready_to_use_this_schedule")}</p>
        )}
        {saveError && (
          <p role="alert" className="text-sm text-destructive">
            {saveError}
          </p>
        )}
        <SetupWizardFooter onSaveExit={saveAndExit}>
          {draft.step > 0 && goBack}
          {draft.step === 0 ? (
            <Button disabled={draft.kind === "choose"} onClick={advance}>{t("routineTriggers.continue")}</Button>
          ) : schedule ? (
            draft.step === 1 ? (
              <Button disabled={!draft.time} onClick={advance}>{t("routineTriggers.review_schedule")}</Button>
            ) : (
              <Button onClick={() => void perform(() => onFinish(draft))}>{t("routineTriggers.add_schedule")}</Button>
            )
          ) : draft.step === 1 ? (
            <Button onClick={advance}>{t("routineTriggers.check_connection")}</Button>
          ) : (
            <Button onClick={() => void perform(() => onFinish(draft))}>
              {checkResult === "received"
                ? t("routineTriggers.finish_setup")
                : t("routineTriggers.finish_without_checking")}
            </Button>
          )}
        </SetupWizardFooter>
      </fieldset>
    </div>
  );
}
