import { t, useTranslation } from "@/i18n";
import type { ReactNode } from "react";
import { ISSUE_WRITE_DENIAL_CODES } from "@paperclipai/shared";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { CommentAttributionChip } from "@/components/CommentAttributionChip";
import { IssueFieldChangeReceipt } from "@/components/IssueFieldChangeReceipt";
import { IssueWriteDenialNotice } from "@/components/IssueWriteDenialNotice";
import { Identity } from "@/components/Identity";
import { cn } from "@/lib/utils";

/**
 * UX lab for the three surfaces that make open
 * cross-issue collaboration legible — the "for {user}" attribution chip, the
 * field-edit audit receipt in the activity stream, and actionable denial copy.
 *
 * Route: /ux-lab/cross-issue-collaboration. Public (no session) so the states
 * can be captured for UX review without seeding a live thread.
 */

function LabSection({
  index,
  title,
  description,
  children,
  columns = 2,
}: {
  index: string;
  title: string;
  description: string;
  children: ReactNode;
  columns?: 1 | 2;
}) {
  useTranslation();
  return (
    <section className="rounded-2xl border border-border/70 bg-background/85 p-5 shadow-sm">
      <div className="mb-4">
        <div className="text-(length:--text-micro) font-semibold uppercase tracking-(--tracking-caps) text-muted-foreground">
          {index}
        </div>
        <h2 className="mt-1 text-base font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className={cn("grid gap-4", columns === 2 && "lg:grid-cols-2")}>{children}</div>
    </section>
  );
}

function Frame({ label, children }: { label: string; children: ReactNode }) {
  useTranslation();
  return (
    <div className="space-y-2">
      <div className="text-(length:--text-micro) font-semibold uppercase tracking-(--tracking-caps) text-muted-foreground">
        {label}
      </div>
      <Card className="block border-border/60 p-3">{children}</Card>
    </div>
  );
}

/** A faithful copy of an agent comment bubble header + body (IssueChatThread.tsx). */
function AgentCommentBubble({
  authorName,
  onBehalfOf,
  body,
}: {
  authorName: string;
  onBehalfOf?: string | null;
  body: string;
}) {
  useTranslation();
  return (
    <div className="flex flex-col items-start py-1.5">
      <div className="mb-1 flex items-center gap-1.5 px-1">
        <span className="flex size-5 shrink-0 items-center justify-center text-muted-foreground">
          <Avatar size="sm" className="size-5">
            <AvatarFallback className="text-(length:--text-nano)">
              {authorName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </span>
        <span className="text-sm font-medium text-foreground">{authorName}</span>
        {onBehalfOf ? (
          <CommentAttributionChip agentName={authorName} userName={onBehalfOf} />
        ) : null}
      </div>
      <div className="min-w-0 max-w-(--pct-85) break-words border border-border bg-card px-3 py-2 text-sm text-foreground [border-radius:14px_14px_14px_4px]">
        {body}
      </div>
    </div>
  );
}

/** A faithful copy of an activity row in the issue run ledger (IssueDetail.tsx). */
function ActivityRow({
  actorName,
  verb,
  children,
}: {
  actorName: string;
  verb: string;
  children?: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-1.5 rounded-lg border border-border/60 px-3 py-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <Identity name={actorName} size="sm" />
        <span>{verb}</span>
        <span className="ml-auto shrink-0">{t("uxLabs.2m_ago")}</span>
      </div>
      {children}
    </div>
  );
}

const AGENT_NAMES = new Map([
  ["3108ef8e-5ed0-41d9-b561-6b41c41b8545", "ClaudeCoder"],
  ["6670e11b-91d3-4429-82e0-436b88b51808", "UXDesigner"],
]);

export function CrossIssueCollaborationUxLab() {
  const { t } = useTranslation();
  const resolveAgentLabel = (id: string) => AGENT_NAMES.get(id) ?? null;
  const resolveUserLabel = (id: string) => (id === "user-dotta" ? "Dotta" : null);

  return (
    <div className="min-h-screen bg-muted/20 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <div className="text-(length:--text-micro) font-semibold uppercase tracking-(--tracking-caps) text-muted-foreground">{t("uxLabs.open_cross_task_collaboration")}</div>
          <h1 className="mt-1 text-xl font-semibold text-foreground">{t("uxLabs.open_cross_task_collaboration_attribution_audit_and_denial_copy")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("uxLabs.agents_may_now_write_to_any_task_they_can_read_these_are_the_three_surfaces_that_keep_that_legible_whose_authority_a_comment_rode_what_an_edit_changed_and_when_a_write_is_refused_which_boundary_fired_and_what_to_do_instead")}</p>
        </header>

        <LabSection
          index={t("uxLabs.1_attribution_chip_plan_3a")}
          title={t("uxLabs.fable_for_dotta_on_a_cross_task_agent_comment")}
          description={t("uxLabs.an_agent_commenting_on_a_task_it_is_not_assigned_to_names_the_responsible_user_whose_authority_it_rode_the_assignee_s_own_comments_stay_unchipped_that_is_the_ordinary_case_and_chipping_every_bubble_would_be_noise")}
        >
          <Frame label={t("uxLabs.assignee_s_own_comment_no_chip")}>
            <AgentCommentBubble
              authorName="CodexCoder"
              body={t("uxLabs.rebased_onto_master_and_re_ran_the_containment_suite_all_green")}
            />
          </Frame>
          <Frame label={t("uxLabs.cross_task_comment_chipped")}>
            <AgentCommentBubble
              authorName="Fable"
              onBehalfOf="Dotta"
              body={t("uxLabs.dotta_asked_me_to_flag_that_the_retry_window_here_overlaps_task_482_worth_a_look_before_you_close_this")}
            />
          </Frame>
          <Frame label={t("uxLabs.responsible_user_not_in_the_loaded_directory")}>
            <AgentCommentBubble
              authorName="Fable"
              onBehalfOf={t("uxLabs.the_responsible_user")}
              body={t("uxLabs.falls_back_to_a_generic_label_rather_than_printing_a_raw_user_id")}
            />
          </Frame>
          <Frame label={t("uxLabs.long_user_name_truncates_in_the_chip")}>
            <AgentCommentBubble
              authorName="Fable"
              onBehalfOf="Alexandra Konstantinopoulos-Whitfield"
              body={t("uxLabs.the_chip_caps_its_width_and_truncates_the_tooltip_carries_the_full_name")}
            />
          </Frame>
        </LabSection>

        <LabSection
          index={t("uxLabs.2_field_edit_audit_receipt_plan_3b")}
          title={t("uxLabs.every_patch_says_who_changed_what_and_under_which_authorization")}
          description={t("uxLabs.required_for_agent_and_board_edits_alike_before_after_per_field_the_responsible_user_behind_the_write_and_the_authorization_reason_that_let_it_through")}
        >
          <Frame label={t("uxLabs.cross_task_agent_edit")}>
            <ActivityRow actorName="Fable" verb={t("uxLabs.changed_the_status_from_todo_to_in_progress")}>
              <IssueFieldChangeReceipt
                event={{
                  action: "issue.updated",
                  responsibleUserId: "user-dotta",
                  details: {
                    authorizationReason: "allow_visible_issue_write",
                    changes: {
                      status: { from: "todo", to: "in_progress" },
                      priority: { from: "medium", to: "high" },
                    },
                  },
                }}
                resolveAgentLabel={resolveAgentLabel}
                resolveUserLabel={resolveUserLabel}
              />
            </ActivityRow>
          </Frame>
          <Frame label={t("uxLabs.board_human_edit_audited_the_same_way")}>
            <ActivityRow actorName="Dotta" verb={t("uxLabs.updated_the_issue")}>
              <IssueFieldChangeReceipt
                event={{
                  action: "issue.updated",
                  responsibleUserId: "user-dotta",
                  details: {
                    authorizationReason: "allow_board_actor",
                    changes: {
                      assigneeAgentId: {
                        from: "3108ef8e-5ed0-41d9-b561-6b41c41b8545",
                        to: "6670e11b-91d3-4429-82e0-436b88b51808",
                      },
                      description: { from: t("uxLabs.old_brief"), to: t("uxLabs.new_brief"), updated: true },
                    },
                  },
                }}
                resolveAgentLabel={resolveAgentLabel}
                resolveUserLabel={resolveUserLabel}
              />
            </ActivityRow>
          </Frame>
          <Frame label={t("uxLabs.reassignment_blockers_and_work_mode_in_one_write")}>
            <ActivityRow actorName="CTO" verb={t("uxLabs.updated_the_issue")}>
              <IssueFieldChangeReceipt
                event={{
                  action: "issue.updated",
                  responsibleUserId: "user-dotta",
                  details: {
                    authorizationReason: "allow_visible_issue_write",
                    changes: {
                      blockedByIssueIds: { from: [], to: ["TASK-491", "TASK-492"] },
                      workMode: { from: "planning", to: "standard" },
                      assigneeAgentId: {
                        from: null,
                        to: "3108ef8e-5ed0-41d9-b561-6b41c41b8545",
                      },
                    },
                  },
                }}
                resolveAgentLabel={resolveAgentLabel}
                resolveUserLabel={resolveUserLabel}
              />
            </ActivityRow>
          </Frame>
          <Frame label={t("uxLabs.older_activity_row_no_receipt_renders_unchanged")}>
            <ActivityRow actorName="CodexCoder" verb={t("uxLabs.checked_out_the_issue")} />
          </Frame>
        </LabSection>

        <LabSection
          index={t("uxLabs.3_actionable_denial_copy_plan_6")}
          title={t("uxLabs.every_wall_names_the_boundary_who_can_act_and_the_sanctioned_path")}
          description={t("uxLabs.a_real_incident_burned_a_full_detour_discovering_a_workaround_behind_an_opaque_403_these_are_all_the_ways_an_issue_write_can_now_be_refused_the_same_copy_the_api_error_body_carries")}
          columns={1}
        >
          <Frame label={t("uxLabs.before_what_the_incident_actually_saw")}>
            <div className="text-xs">
              <span className="text-red-600 dark:text-red-400">{t("uxLabs.403_forbidden_issue_is_outside_this_actor_s_authorization_boundary")}</span>
              <p className="mt-1 text-muted-foreground">{t("uxLabs.no_boundary_named_nobody_named_no_path_forward_the_workaround_create_a_child_issue_had_to_be_discovered_by_trial_and_error")}</p>
            </div>
          </Frame>
          {ISSUE_WRITE_DENIAL_CODES.map((code) => (
            <Frame key={code} label={t("uxLabs.after_code", { code })}>
              <IssueWriteDenialNotice
                code={code}
                context={{
                  actorLabel: "Fable",
                  assigneeLabel: "CodexCoder",
                  responsibleUserName: "Dotta",
                  issueIdentifier: "TASK-482",
                  cap: 20,
                  count: 21,
                }}
              />
            </Frame>
          ))}
        </LabSection>
      </div>
    </div>
  );
}

export default CrossIssueCollaborationUxLab;
