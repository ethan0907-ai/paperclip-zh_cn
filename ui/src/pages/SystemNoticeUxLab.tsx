import { t, useTranslation } from "@/i18n";
// token-extraction: allowlisted — intentional one-off decoration (DECISION-SHEET.md B1
// user ruling). The bg-[...gradient...] / shadow-[...] literals in this demo/UX-lab page
// are deliberate one-off decoration, reverted from --gradient-extract-*/--shadow-extract-*
// tokens; the file is on the check-token-gates allowlist in ui/src/index.css.
import type { ReactNode } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SystemNotice } from "@/components/SystemNotice";
import { systemNoticeFixtures } from "@/fixtures/systemNoticeFixtures";
import { cn } from "@/lib/utils";
import {
  CircleDashed,
  FlaskConical,
  Layers,
  ListChecks,
  Sparkles,
} from "lucide-react";

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
        "rounded-(--rad-28) border border-border/70 bg-background/85 p-4 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-5",
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

function FixtureFrame({ caption, children }: { caption: string; children: ReactNode }) {
  useTranslation();
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-(length:--text-micro) font-semibold uppercase tracking-(--tracking-eyebrow) text-muted-foreground">
        <CircleDashed className="h-3.5 w-3.5" />
        {caption}
      </div>
      {children}
    </div>
  );
}

function MockUserBubble({
  authorName,
  body,
  alignEnd,
}: {
  authorName: string;
  body: string;
  alignEnd?: boolean;
}) {
  useTranslation();
  return (
    <div className={cn("flex items-start gap-2.5", alignEnd && "justify-end")}>
      {!alignEnd ? (
        <Avatar size="sm" className="shrink-0">
          <AvatarFallback>{authorName.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      ) : null}
      <div className={cn("flex min-w-0 max-w-(--pct-85) flex-col", alignEnd && "items-end")}>
        <div
          className={cn(
            "mb-1 px-1 text-sm font-medium text-foreground",
            alignEnd ? "text-right" : "text-left",
          )}
        >
          {authorName}
        </div>
        <div className="min-w-0 max-w-full rounded-2xl bg-muted px-4 py-2.5 text-sm leading-6 text-foreground">
          {body}
        </div>
      </div>
      {alignEnd ? (
        <Avatar size="sm" className="shrink-0">
          <AvatarFallback>{authorName.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      ) : null}
    </div>
  );
}

function MockAgentBubble({ agentName, body }: { agentName: string; body: string }) {
  useTranslation();
  return (
    <div className="flex items-start gap-2.5">
      <Avatar size="sm" className="shrink-0">
        <AvatarFallback>{agentName.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 max-w-(--pct-85) flex-col">
        <div className="mb-1 px-1 text-sm font-medium text-foreground">{agentName}</div>
        <div className="min-w-0 max-w-full rounded-2xl border border-border/70 bg-background px-4 py-2.5 text-sm leading-6 text-foreground">
          {body}
        </div>
      </div>
    </div>
  );
}

const checklist = [
  "uxLabs.one_container_per_system_notice_no_nested_chat_bubble",
  "uxLabs.tone_communicated_by_icon_label_never_color_alone",
  "uxLabs.operational_evidence_hidden_behind_details_expanded_only_on_demand",
  "uxLabs.issue_agent_and_run_metadata_render_as_typed_link_rows_not_raw_markdown",
  "uxLabs.hierarchy_visibly_distinct_from_user_right_aligned_and_agent_left_aligned_bubbles",
];

export function SystemNoticeUxLab() {
  const { t } = useTranslation();
  const fixtureById = new Map(systemNoticeFixtures.map((f) => [f.id, {
    ...f,
    caption: t(`uxLabs.notice_fixture_${f.id}`),
    label: t(`uxLabs.notice_tone_${f.tone}`),
  }] as const));

  const warningCollapsed = fixtureById.get("warning-collapsed")!;
  const warningExpanded = fixtureById.get("warning-expanded")!;
  const dangerCollapsed = fixtureById.get("danger-collapsed")!;
  const dangerExpanded = fixtureById.get("danger-expanded")!;
  const neutralCollapsed = fixtureById.get("neutral-collapsed")!;
  const neutralExpanded = fixtureById.get("neutral-expanded")!;
  const warningNoDetails = fixtureById.get("warning-no-details")!;

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-(--rad-32) border border-border/70 bg-[linear-gradient(135deg,rgba(245,158,11,0.10),transparent_28%),linear-gradient(180deg,rgba(8,145,178,0.08),transparent_44%),var(--background)] shadow-[0_30px_80px_rgba(15,23,42,0.10)]">
        <div className="grid gap-6 lg:grid-cols-(--gtc-39)">
          <div className="p-6 sm:p-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/[0.08] px-3 py-1 text-(length:--text-nano) font-semibold uppercase tracking-(--tracking-caps) text-amber-700 dark:text-amber-300">
              <FlaskConical className="h-3.5 w-3.5" />{t("uxLabs.system_notice_lab")}</div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">{t("uxLabs.first_class_system_notice_treatment")}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{t("uxLabs.replaces_the_current_pattern_where_a_paperclip_authored_warning_renders_inside_a_user_style_chat_bubble_the_notice_is_one_container_system_styled_with_hidden_by_default_operational_metadata_tone_is_conveyed_by_icon_label_and_color_together_so_it_stays_accessible")}</p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full px-3 py-1 text-(length:--text-nano) uppercase tracking-(--tracking-caps)">{t("uxLabs.pap_3525_plan")}</Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-(length:--text-nano) uppercase tracking-(--tracking-caps)">{t("uxLabs.phase_1_ux")}</Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-(length:--text-nano) uppercase tracking-(--tracking-caps)">{t("uxLabs.tones_warning_danger_neutral")}</Badge>
            </div>
          </div>

          <aside className="border-t border-border/60 bg-background/70 p-6 lg:border-l lg:border-t-0">
            <div className="mb-4 flex items-center gap-2 text-(length:--text-micro) font-semibold uppercase tracking-(--tracking-caps) text-muted-foreground">
              <ListChecks className="h-4 w-4 text-amber-700 dark:text-amber-300" />{t("uxLabs.what_this_lab_proves")}</div>
            <div className="space-y-3">
              {checklist.map((line) => (
                <div
                  key={line}
                  className="rounded-2xl border border-border/70 bg-background/85 px-4 py-3 text-sm text-muted-foreground"
                >
                  {t(line)}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>

      <LabSection
        id="tones"
        eyebrow={t("uxLabs.tone_matrix")}
        title={t("uxLabs.three_tones_two_states")}
        description={t("uxLabs.each_tone_pairs_a_unique_icon_and_tone_label_so_the_notice_is_recognizable_without_color_collapsed_is_the_default_the_details_affordance_reveals_operational_metadata_only_when_reviewers_ask_for_it")}
        accentClassName="bg-[linear-gradient(180deg,rgba(245,158,11,0.05),transparent_28%),var(--background)]"
      >
        <div className="space-y-5">
          <FixtureFrame caption={warningCollapsed.caption}>
            <SystemNotice {...warningCollapsed} />
          </FixtureFrame>
          <FixtureFrame caption={warningExpanded.caption}>
            <SystemNotice {...warningExpanded} />
          </FixtureFrame>
          <FixtureFrame caption={dangerCollapsed.caption}>
            <SystemNotice {...dangerCollapsed} />
          </FixtureFrame>
          <FixtureFrame caption={dangerExpanded.caption}>
            <SystemNotice {...dangerExpanded} />
          </FixtureFrame>
          <FixtureFrame caption={neutralCollapsed.caption}>
            <SystemNotice {...neutralCollapsed} />
          </FixtureFrame>
          <FixtureFrame caption={neutralExpanded.caption}>
            <SystemNotice {...neutralExpanded} />
          </FixtureFrame>
          <FixtureFrame caption={warningNoDetails.caption}>
            <SystemNotice {...warningNoDetails} />
          </FixtureFrame>
        </div>
      </LabSection>

      <LabSection
        id="hierarchy"
        eyebrow={t("uxLabs.hierarchy_in_thread")}
        title={t("uxLabs.distinct_from_user_and_agent_comments")}
        description={t("uxLabs.side_by_side_with_adjacent_comment_types_so_reviewers_can_confirm_the_system_row_reads_as_a_system_row_full_width_no_avatar_gutter_no_chat_bubble_while_user_and_agent_comments_keep_their_existing_rounded_bubbles")}
        accentClassName="bg-[linear-gradient(180deg,rgba(8,145,178,0.05),transparent_28%),var(--background)]"
      >
        <div className="space-y-4 rounded-2xl border border-border/70 bg-background/70 p-4">
          <MockUserBubble
            authorName="Riley Board"
            body={t("uxLabs.why_does_this_issue_keep_waking_back_up_without_a_clear_next_step")}
            alignEnd
          />
          <MockAgentBubble
            agentName="CodexCoder"
            body={t("uxLabs.the_previous_run_completed_without_picking_a_disposition_i_ll_wait_for_the_new_system_notice_to_surface_so_the_recovery_owner_is_unambiguous")}
          />
          <SystemNotice
            tone="danger"
            label={t("uxLabs.system_alert")}
            source={{ label: "Paperclip", href: "/PAP/agents" }}
            timestamp="2026-05-04T16:48:00.000Z"
            body={t("uxLabs.paperclip_could_not_resolve_this_issue_s_missing_disposition_automatically_the_source_assignment_is_unchanged_and_a_board_decision_is_required")}
            metadata={[
              {
                title: t("uxLabs.recovery_owner"),
                rows: [
                  {
                    kind: "issue",
                    label: t("uxLabs.recovery_issue"),
                    identifier: "PAP-3440",
                    href: "/PAP/issues/PAP-3440",
                    title: t("uxLabs.successful_run_handoff_missing_disposition"),
                  },
                  {
                    kind: "agent",
                    label: t("uxLabs.owner"),
                    name: "CTO",
                    href: "/PAP/agents/cto",
                  },
                ],
              },
              {
                title: t("uxLabs.run_evidence"),
                rows: [
                  {
                    kind: "run",
                    label: t("uxLabs.source_run"),
                    runId: "9cdba892-c7ca-4d93-8604-4843873b127c",
                    href: "/PAP/agents/codexcoder/runs/9cdba892-c7ca-4d93-8604-4843873b127c",
                    status: "succeeded",
                  },
                ],
              },
            ]}
          />
          <MockUserBubble
            authorName="Riley Board"
            body={t("uxLabs.thanks_assigning_the_recovery_owner_now")}
            alignEnd
          />
        </div>
      </LabSection>

      <div className="grid gap-5 xl:grid-cols-2">
        <LabSection
          eyebrow={t("uxLabs.before")}
          title={t("uxLabs.today_s_nested_treatment")}
          description={t("uxLabs.the_same_content_rendered_through_the_existing_user_bubble_warning_callout_path_two_containers_same_gray_background_as_user_comments_and_the_warning_icon_is_forced_inside_a_chat_row")}
          accentClassName="bg-[linear-gradient(180deg,rgba(244,63,94,0.05),transparent_28%),var(--background)]"
        >
          <div className="space-y-3 rounded-2xl border border-border/70 bg-background/70 p-4">
            <div className="flex items-start gap-2.5">
              <Avatar size="sm" className="shrink-0">
                <AvatarFallback>YO</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 max-w-(--pct-85) flex-col">
                <div className="mb-1 px-1 text-sm font-medium text-foreground">{t("uxLabs.you")}</div>
                <div className="min-w-0 max-w-full rounded-2xl bg-muted px-4 py-2.5 text-sm leading-6 text-foreground">
                  <div className="rounded-md border border-red-500/35 bg-red-500/10 px-3 py-2.5 text-sm text-red-950 dark:text-red-100">
                    <div className="flex items-start gap-2">
                      <Sparkles className="mt-1 h-4 w-4 shrink-0 text-red-600 dark:text-red-300" />
                      <div className="min-w-0">
                        <p className="m-0 font-semibold">{t("uxLabs.successful_run_handoff_missing")}</p>
                        <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-(length:--text-compact) leading-5">
                          <li>{t("uxLabs.source_issue_pap_3440")}</li>
                          <li>{t("uxLabs.source_run_9cdba892_c7ca_4d93_8604_4843873b127c")}</li>
                          <li>{t("uxLabs.recovery_run_61fdb79b_8012_4676_ac71_2971830e126a")}</li>
                          <li>{t("uxLabs.status_before_in_progress")}</li>
                          <li>{t("uxLabs.normalized_cause_run_completed_without_disposition")}</li>
                          <li>{t("uxLabs.recovery_owner_cto")}</li>
                          <li>{t("uxLabs.suggested_action_reassign_to_recovery_agent")}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="px-1 text-xs text-muted-foreground">{t("uxLabs.author_reads_as")}{" "}<span className="font-medium text-foreground">{t("uxLabs.you")}</span>{" "}{t("uxLabs.even_though_the_author_is_the_paperclip_system_two_containers_stack_the_warning_inside_a_user_style_bubble_and_operational_evidence_is_always_visible")}</p>
          </div>
        </LabSection>

        <LabSection
          eyebrow={t("uxLabs.after")}
          title={t("uxLabs.system_notice_replacement")}
          description={t("uxLabs.one_container_system_authored_label_hidden_details_the_chat_surface_keeps_user_and_agent_bubbles_unchanged")}
          accentClassName="bg-[linear-gradient(180deg,rgba(16,185,129,0.05),transparent_28%),var(--background)]"
        >
          <div className="space-y-3 rounded-2xl border border-border/70 bg-background/70 p-4">
            <SystemNotice {...dangerCollapsed} />
            <p className="px-1 text-xs text-muted-foreground">{t("uxLabs.same_content_the_visible_body_is_one_short_system_sentence_reviewers_expand")}{" "}
              <span className="font-medium text-foreground">{t("uxLabs.details")}</span>{" "}{t("uxLabs.only_when_they_need_run_evidence_tone_is_reinforced_by_the_octagon_icon_and_the_system_alert_label_not_just_red")}</p>
          </div>
        </LabSection>
      </div>

      <Card className="gap-4 border-border/70 bg-background/85 py-0">
        <CardHeader className="px-5 pt-5 pb-0">
          <div className="flex items-center gap-2 text-(length:--text-micro) font-semibold uppercase tracking-(--tracking-caps) text-muted-foreground">
            <Layers className="h-4 w-4 text-amber-700 dark:text-amber-300" />{t("uxLabs.implementation_notes")}</div>
          <CardTitle className="text-lg">{t("uxLabs.handoff_to_engineering")}</CardTitle>
          <CardDescription>{t("uxLabs.what_the_phase_4_ui_implementation_should_preserve_from_this_design")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-5 pb-5 pt-0 text-sm text-muted-foreground">
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
            <div className="mb-1 font-medium text-foreground">{t("uxLabs.component")}</div>{t("uxLabs.use")}{" "}<code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{`<SystemNotice />`}</code>{" "}{t("uxLabs.from")}{" "}<code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">@/components/SystemNotice</code>{t("uxLabs.it_accepts")}{" "}<code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">tone</code>,{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">label</code>,{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">body</code>,{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">metadata</code>{t("uxLabs.and_20616e64")}{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">detailsDefaultOpen</code>.
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
            <div className="mb-1 font-medium text-foreground">{t("uxLabs.routing_in_issuechatthread")}</div>{t("uxLabs.comments_where")}{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">authorType === &quot;system&quot;</code>{" "}{t("uxLabs.or")}{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">presentation.kind === &quot;system_notice&quot;</code>{" "}{t("uxLabs.should_render_as_a_systemnotice_row_at_full_content_width_never_inside_an")}{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">IssueChatUserMessage</code>{" "}{t("uxLabs.or_assistant_bubble")}</div>
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
            <div className="mb-1 font-medium text-foreground">{t("uxLabs.accessibility")}</div>{t("uxLabs.the_details_button_has")}{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">aria-expanded</code>{" "}{t("uxLabs.and")}{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">aria-controls</code>{" "}{t("uxLabs.wired_to_the_panel_id_the_container_exposes")}{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">role=&quot;status&quot;</code>{" "}{t("uxLabs.and_an")}{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">aria-label</code>{" "}{t("uxLabs.equal_to_the_visible_tone_label_so_screen_readers_announce_tone_with_text")}</div>
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
            <div className="mb-1 font-medium text-foreground">{t("uxLabs.legacy_fallback")}</div>{t("uxLabs.existing_comments_without")}{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">presentation</code>{" "}{t("uxLabs.keep_rendering_through_the_current")}{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">SuccessfulRunHandoffCommentCallout</code>{" "}{t("uxLabs.string_detector_the_new_contract_is_opt_in_for_the_system_generators_in_phase_5")}</div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SystemNoticeUxLab;
