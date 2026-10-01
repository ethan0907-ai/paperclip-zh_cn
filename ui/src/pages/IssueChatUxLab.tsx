import { t, useTranslation } from "@/i18n";
// token-extraction: allowlisted — intentional one-off decoration (DECISION-SHEET.md B1
// user ruling). The bg-[...gradient...] / shadow-[...] literals in this demo/UX-lab page
// are deliberate one-off decoration, reverted from --gradient-extract-*/--shadow-extract-*
// tokens; the file is on the check-token-gates allowlist in ui/src/index.css.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IssueChatThread } from "../components/IssueChatThread";
import {
  issueChatUxAgentMap,
  issueChatUxFeedbackVotes,
  issueChatUxLinkedRuns,
  issueChatUxLiveComments,
  issueChatUxLiveEvents,
  issueChatUxLiveRuns,
  issueChatUxMentions,
  issueChatUxReassignOptions,
  issueChatUxReviewComments,
  issueChatUxReviewEvents,
  issueChatUxSubmittingComments,
  issueChatUxTranscriptsByRunId,
} from "../fixtures/issueChatUxFixtures";
import { cn } from "../lib/utils";
import { Bot, Brain, FlaskConical, Loader2, MessagesSquare, Route, Sparkles, WandSparkles } from "lucide-react";

const noop = async () => {};

const highlights = [
  "uxLabs.running_assistant_replies_with_streamed_text_reasoning_tool_cards_and_background_status_notes",
  "uxLabs.historical_issue_events_and_linked_runs_rendered_inline_with_the_chat_timeline",
  "uxLabs.queued_user_messages_settled_assistant_comments_and_feedback_controls",
  "uxLabs.submitting_pending_message_bubble_with_sending_label_and_reduced_opacity",
  "uxLabs.empty_and_disabled_composer_states_without_relying_on_live_backend_data",
];

function LabSection({
  id,
  eyebrow,
  title,
  description,
  accentClassName,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  accentClassName?: string;
  children: ReactNode;
}) {
  useTranslation();
  return (
    <section
      id={id}
      className={cn(
        "rounded-(--rad-28) border border-border/70 bg-background/80 p-4 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-5",
        accentClassName,
      )}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-(length:--text-micro) font-semibold uppercase tracking-(--tracking-caps) text-muted-foreground">
            {eyebrow}
          </div>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

const DEMO_REASONING_LINES = [
  "uxLabs.analyzing_the_user_s_request_about_the_animation_smoothness",
  "uxLabs.the_current_implementation_unmounts_the_old_span_instantly_causing_a_flash",
  "uxLabs.looking_at_the_css_keyframes_for_cot_line_slide_up",
  "uxLabs.we_need_a_paired_exit_animation_so_the_old_line_slides_out_while_the_new_one_slides_in",
  "uxLabs.implementing_a_two_span_ticker_exiting_line_goes_up_and_out_entering_line_comes_up_from_below",
  "uxLabs.testing_the_280ms_cubic_bezier_transition_timing",
];

function RotatingReasoningDemo({ intervalMs = 2200 }: { intervalMs?: number }) {
  useTranslation();
  const [index, setIndex] = useState(0);
  const prevRef = useRef(DEMO_REASONING_LINES[0]);
  const [ticker, setTicker] = useState<{
    key: number;
    current: string;
    exiting: string | null;
  }>({ key: 0, current: DEMO_REASONING_LINES[0], exiting: null });

  useEffect(() => {
    // Respect reduced motion (also makes the visual suite deterministic —
    // it captures with reducedMotion: "reduce").
    if (typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % DEMO_REASONING_LINES.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  const currentLine = DEMO_REASONING_LINES[index];

  useEffect(() => {
    if (currentLine !== prevRef.current) {
      const prev = prevRef.current;
      prevRef.current = currentLine;
      setTicker((t) => ({ key: t.key + 1, current: currentLine, exiting: prev }));
    }
  }, [currentLine]);

  return (
    <div className="flex gap-2 px-1">
      <div className="flex flex-col items-center pt-0.5">
        <Brain className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
      </div>
      <div className="relative h-5 min-w-0 flex-1 overflow-hidden">
        {ticker.exiting !== null && (
          <span
            key={`out-${ticker.key}`}
            className="cot-line-exit absolute inset-x-0 truncate text-(length:--text-compact) italic leading-5 text-muted-foreground/70"
            onAnimationEnd={() => setTicker((t) => ({ ...t, exiting: null }))}
          >
            {t(ticker.exiting)}
          </span>
        )}
        <span
          key={`in-${ticker.key}`}
          className={cn(
            "absolute inset-x-0 truncate text-(length:--text-compact) italic leading-5 text-muted-foreground/70",
            ticker.key > 0 && "cot-line-enter",
          )}
        >
          {t(ticker.current)}
        </span>
      </div>
    </div>
  );
}

export function IssueChatUxLab() {
  const { t } = useTranslation();
  const [showComposer, setShowComposer] = useState(true);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-(--rad-32) border border-border/70 bg-[linear-gradient(135deg,rgba(8,145,178,0.10),transparent_28%),linear-gradient(180deg,rgba(245,158,11,0.10),transparent_44%),var(--background)] shadow-[0_30px_80px_rgba(15,23,42,0.10)]">
        <div className="grid gap-6 lg:grid-cols-(--gtc-39)">
          <div className="p-6 sm:p-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/[0.08] px-3 py-1 text-(length:--text-nano) font-semibold uppercase tracking-(--tracking-caps) text-cyan-700 dark:text-cyan-300">
              <FlaskConical className="h-3.5 w-3.5" />{t("uxLabs.chat_ux_lab")}</div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">{t("uxLabs.issue_chat_review_surface")}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{t("uxLabs.this_page_exercises_the_real_assistant_ui_issue_chat_with_fixture_backed_messages_use_it_to_review_spacing_chronology_running_states_tool_rendering_activity_rows_queueing_and_composer_behavior_without_needing_a_live_issue_in_progress")}</p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full px-3 py-1 text-(length:--text-nano) uppercase tracking-(--tracking-caps)">
                /tests/ux/chat
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-(length:--text-nano) uppercase tracking-(--tracking-caps)">{t("uxLabs.assistant_ui_thread")}</Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-(length:--text-nano) uppercase tracking-(--tracking-caps)">{t("uxLabs.fixture_backed_live_run")}</Badge>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => setShowComposer((value) => !value)}>
                {showComposer ? t("uxLabs.hide_composer_in_primary_preview") : t("uxLabs.show_composer_in_primary_preview")}
              </Button>
              <a
                href="#live-execution"
                className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <Route className="h-3.5 w-3.5" />{t("uxLabs.jump_to_live_execution_preview")}</a>
            </div>
          </div>

          <aside className="border-t border-border/60 bg-background/70 p-6 lg:border-l lg:border-t-0">
            <div className="mb-4 flex items-center gap-2 text-(length:--text-micro) font-semibold uppercase tracking-(--tracking-caps) text-muted-foreground">
              <WandSparkles className="h-4 w-4 text-cyan-700 dark:text-cyan-300" />{t("uxLabs.covered_states")}</div>
            <div className="space-y-3">
              {highlights.map((highlight) => (
                <div
                  key={highlight}
                  className="rounded-2xl border border-border/70 bg-background/85 px-4 py-3 text-sm text-muted-foreground"
                >
                  {t(highlight)}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>

      <LabSection
        id="rotating-text"
        eyebrow={t("uxLabs.animation_demo")}
        title={t("uxLabs.rotating_reasoning_text")}
        description={t("uxLabs.isolated_ticker_that_cycles_sample_reasoning_lines_on_a_timer_the_outgoing_line_slides_up_and_fades_out_while_the_incoming_line_slides_up_from_below_runs_in_a_loop_so_you_can_tune_timing_and_easing_without_needing_a_live_stream")}
        accentClassName="bg-[linear-gradient(180deg,rgba(168,85,247,0.06),transparent_28%),var(--background)]"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-accent/10 p-4">
            <div className="mb-2 text-(length:--text-nano) font-semibold uppercase tracking-(--tracking-caps) text-muted-foreground">{t("uxLabs.default_interval_2_2s")}</div>
            <RotatingReasoningDemo />
          </div>
          <div className="rounded-xl border border-border/60 bg-accent/10 p-4">
            <div className="mb-2 text-(length:--text-nano) font-semibold uppercase tracking-(--tracking-caps) text-muted-foreground">{t("uxLabs.fast_interval_1s_stress_test")}</div>
            <RotatingReasoningDemo intervalMs={1000} />
          </div>
        </div>
      </LabSection>

      <LabSection
        id="working-tokens"
        eyebrow={t("uxLabs.status_tokens")}
        title={t("uxLabs.working_worked_header_verb")}
        description={t("uxLabs.the_working_token_uses_the_shimmer_text_gradient_sweep_to_signal_an_active_run_once_the_run_completes_it_becomes_the_static_worked_token")}
        accentClassName="bg-[linear-gradient(180deg,rgba(16,185,129,0.06),transparent_28%),var(--background)]"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-accent/10 p-4">
            <div className="mb-3 text-(length:--text-nano) font-semibold uppercase tracking-(--tracking-caps) text-muted-foreground">{t("uxLabs.active_run_shimmer")}</div>
            <div className="flex items-center gap-2.5 rounded-lg px-1 py-2">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                <span className="shimmer-text">{t("uxLabs.working")}</span>
              </span>
              <span className="text-xs text-muted-foreground/60">{t("uxLabs.for_12s")}</span>
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-accent/10 p-4">
            <div className="mb-3 text-(length:--text-nano) font-semibold uppercase tracking-(--tracking-caps) text-muted-foreground">{t("uxLabs.completed_run_static")}</div>
            <div className="flex items-center gap-2.5 rounded-lg px-1 py-2">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/70" />
                </span>{t("uxLabs.worked")}</span>
              <span className="text-xs text-muted-foreground/60">{t("uxLabs.for_1_min_24s")}</span>
            </div>
          </div>
        </div>
      </LabSection>

      <LabSection
        id="live-execution"
        eyebrow={t("uxLabs.primary_preview")}
        title={t("uxLabs.live_execution_thread")}
        description={t("uxLabs.shows_the_fully_active_state_timeline_events_historical_run_marker_a_running_assistant_reply_with_reasoning_and_tools_and_a_queued_follow_up_from_the_user")}
        accentClassName="bg-[linear-gradient(180deg,rgba(6,182,212,0.05),transparent_28%),var(--background)]"
      >
        <IssueChatThread
          comments={issueChatUxLiveComments}
          linkedRuns={issueChatUxLinkedRuns.slice(0, 1)}
          timelineEvents={issueChatUxLiveEvents}
          liveRuns={issueChatUxLiveRuns}
          issueStatus="todo"
          agentMap={issueChatUxAgentMap}
          currentUserId="user-1"
          onAdd={noop}
          onVote={noop}
          onCancelRun={noop}
          onInterruptQueued={noop}
          draftKey="issue-chat-ux-lab-primary"
          enableReassign
          reassignOptions={issueChatUxReassignOptions}
          currentAssigneeValue="agent:agent-1"
          suggestedAssigneeValue="agent:agent-2"
          mentions={issueChatUxMentions}
          showComposer={showComposer}
          enableLiveTranscriptPolling={false}
          transcriptsByRunId={issueChatUxTranscriptsByRunId}
          hasOutputForRun={(runId) => issueChatUxTranscriptsByRunId.has(runId)}
        />
      </LabSection>

      <LabSection
        eyebrow={t("uxLabs.submitting_state")}
        title={t("uxLabs.pending_message_bubble")}
        description={t("uxLabs.when_a_user_sends_a_message_the_bubble_briefly_shows_a_sending_label_at_reduced_opacity_until_the_server_confirms_receipt_this_preview_renders_that_transient_state")}
        accentClassName="bg-[linear-gradient(180deg,rgba(59,130,246,0.06),transparent_28%),var(--background)]"
      >
        <IssueChatThread
          comments={issueChatUxSubmittingComments}
          linkedRuns={[]}
          timelineEvents={[]}
          issueStatus="in_progress"
          agentMap={issueChatUxAgentMap}
          currentUserId="user-1"
          onAdd={noop}
          draftKey="issue-chat-ux-lab-submitting"
          showComposer={false}
          enableLiveTranscriptPolling={false}
        />
      </LabSection>

      <div className="grid gap-6 xl:grid-cols-2">
        <LabSection
          eyebrow={t("uxLabs.settled_review")}
          title={t("uxLabs.durable_comments_and_feedback")}
          description={t("uxLabs.shows_the_post_run_state_assistant_comment_feedback_controls_historical_run_context_and_timeline_reassignment_without_any_active_stream")}
          accentClassName="bg-[linear-gradient(180deg,rgba(168,85,247,0.05),transparent_26%),var(--background)]"
        >
          <IssueChatThread
            comments={issueChatUxReviewComments}
            linkedRuns={issueChatUxLinkedRuns.slice(1)}
            timelineEvents={issueChatUxReviewEvents}
            feedbackVotes={issueChatUxFeedbackVotes}
            feedbackTermsUrl="/feedback-terms"
            issueStatus="in_review"
            agentMap={issueChatUxAgentMap}
            currentUserId="user-1"
            onAdd={noop}
            onVote={noop}
            draftKey="issue-chat-ux-lab-review"
            showComposer={false}
            enableLiveTranscriptPolling={false}
          />
        </LabSection>

        <div className="space-y-6">
          <LabSection
            eyebrow={t("uxLabs.empty_thread")}
            title={t("uxLabs.empty_state_and_disabled_composer")}
            description={t("uxLabs.keeps_the_message_area_visible_even_when_there_is_no_thread_yet_and_replaces_the_composer_with_an_explicit_warning_when_replies_are_blocked")}
            accentClassName="bg-[linear-gradient(180deg,rgba(245,158,11,0.08),transparent_26%),var(--background)]"
          >
            <IssueChatThread
              comments={[]}
              linkedRuns={[]}
              timelineEvents={[]}
              issueStatus="done"
              agentMap={issueChatUxAgentMap}
              currentUserId="user-1"
              onAdd={noop}
              composerDisabledReason={t("uxLabs.this_workspace_is_closed_so_new_chat_replies_are_disabled_until_the_issue_is_reopened")}
              draftKey="issue-chat-ux-lab-empty"
              enableLiveTranscriptPolling={false}
            />
          </LabSection>

          <Card className="gap-4 border-border/70 bg-background/85 py-0">
            <CardHeader className="px-5 pt-5 pb-0">
              <div className="flex items-center gap-2 text-(length:--text-micro) font-semibold uppercase tracking-(--tracking-caps) text-muted-foreground">
                <MessagesSquare className="h-4 w-4 text-cyan-700 dark:text-cyan-300" />{t("uxLabs.review_checklist")}</div>
              <CardTitle className="text-lg">{t("uxLabs.what_to_evaluate_on_this_page")}</CardTitle>
              <CardDescription>{t("uxLabs.this_route_should_be_the_fastest_way_to_inspect_the_chat_system_before_or_after_tweaks")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-5 pb-5 pt-0 text-sm text-muted-foreground">
              <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
                <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
                  <Bot className="h-4 w-4 text-cyan-700 dark:text-cyan-300" />{t("uxLabs.message_hierarchy")}</div>{t("uxLabs.check_that_user_assistant_and_system_rows_scan_differently_without_feeling_like_separate_products")}</div>
              <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
                <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
                  <Sparkles className="h-4 w-4 text-cyan-700 dark:text-cyan-300" />{t("uxLabs.stream_polish")}</div>{t("uxLabs.watch_the_live_preview_for_reasoning_density_tool_expansion_behavior_and_queued_follow_up_readability")}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
