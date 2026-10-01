import { t, useTranslation } from "@/i18n";
import type { ReactNode } from "react";
import { ResponsibleUserDenialNotice } from "@/components/ResponsibleUserDenialNotice";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

/**
 * UX lab for PAP-12462 (P7): run "on behalf of {user}" surfacing + responsible-user
 * denial copy. Renders before/after of both surfaces with real design tokens so the
 * states can be captured for UX review. Route: /ux-lab/responsible-user-denial
 */

function LabSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  useTranslation();
  return (
    <section className="rounded-2xl border border-border/70 bg-background/85 p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">{children}</div>
    </section>
  );
}

function BeforeAfter({ label, children }: { label: string; children: ReactNode }) {
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

/** A faithful copy of a run ledger row header (see IssueRunLedger.tsx). */
function RunLedgerRow({
  onBehalfOf,
  denial,
}: {
  onBehalfOf?: string | null;
  denial?: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <article className="space-y-1.5 rounded-lg border border-border/60 px-3 py-2 text-xs text-muted-foreground">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-medium text-foreground">{t("uxLabs.run")}</span>
        <span className="min-w-0 max-w-full truncate font-mono text-foreground">a1b2c3d4</span>
        <span>{t("uxLabs.by_codexcoder")}</span>
        {onBehalfOf ? (
          <span className="min-w-0 max-w-full truncate text-muted-foreground">{t("uxLabs.on_behalf_of")}{" "}<span className="text-foreground">{onBehalfOf}</span>
          </span>
        ) : null}
        <span className="rounded-md border border-border px-1.5 py-0.5 text-(length:--text-micro) capitalize text-muted-foreground">
          {denial ? t("uxLabs.failed") : t("uxLabs.succeeded")}
        </span>
        <span className="ml-auto shrink-0">{t("uxLabs.2m_ago")}</span>
      </div>
      <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
        <div className="min-w-0">
          <span className="text-foreground">{t("uxLabs.elapsed")}</span>{" "}{t("uxLabs.1m_4s")}</div>
        <div className="min-w-0">
          <span className="text-foreground">{t("uxLabs.last_useful_action")}</span>{" "}{t("uxLabs.2m_ago")}</div>
        <div className="min-w-0">
          <span className="text-foreground">{t("uxLabs.stop")}</span> {denial ? t("uxLabs.denied") : t("uxLabs.completed")}
        </div>
      </div>
      {denial}
    </article>
  );
}

/** A faithful copy of the run-detail header identity block (see AgentDetail.tsx RunDetail). */
function RunDetailHeader({ onBehalfOf, denial }: { onBehalfOf?: string | null; denial?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-foreground">{t("uxLabs.run_a1b2c3d4")}</span>
        <span className="rounded-md border border-border px-1.5 py-0.5 text-(length:--text-micro) capitalize text-muted-foreground">
          {denial ? t("uxLabs.failed") : t("uxLabs.succeeded")}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 font-mono text-(length:--text-micro) text-muted-foreground">
        <span className="rounded bg-muted px-1.5 py-0.5 text-(length:--text-nano) font-medium uppercase tracking-wide">
          codex local
        </span>
        <span>anthropic/claude-opus-4-8</span>
      </div>
      {onBehalfOf ? (
        <div className="text-xs text-muted-foreground">{t("uxLabs.on_behalf_of_66206f66")}{" "}<span className="text-foreground">{onBehalfOf}</span>
        </div>
      ) : null}
      {denial}
    </div>
  );
}

export function ResponsibleUserDenialUxLab() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-muted/20 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <div className="text-(length:--text-micro) font-semibold uppercase tracking-(--tracking-caps) text-muted-foreground">
            PAP-12462 · P7
          </div>
          <h1 className="mt-1 text-xl font-semibold text-foreground">{t("uxLabs.run_on_behalf_of_surfacing_denial_copy")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("uxLabs.before_after_of_the_two_run_surfaces_and_the_four_denial_related_states")}</p>
        </header>

        <LabSection
          title={t("uxLabs.1_run_identity_on_behalf_of_user")}
          description={t("uxLabs.a_run_acting_for_a_human_now_names_that_user_on_both_the_issue_run_ledger_and_the_run_detail_header")}
        >
          <BeforeAfter label={t("uxLabs.before_run_ledger")}>
            <RunLedgerRow />
          </BeforeAfter>
          <BeforeAfter label={t("uxLabs.after_run_ledger")}>
            <RunLedgerRow onBehalfOf="Ada Lovelace" />
          </BeforeAfter>
          <BeforeAfter label={t("uxLabs.before_run_detail")}>
            <RunDetailHeader />
          </BeforeAfter>
          <BeforeAfter label={t("uxLabs.after_run_detail")}>
            <RunDetailHeader onBehalfOf="Ada Lovelace" />
          </BeforeAfter>
        </LabSection>

        <LabSection
          title={t("uxLabs.2_denial_state_responsible_user_not_authorized")}
          description={t("uxLabs.the_agent_is_allowed_but_the_user_the_run_acts_for_is_not_distinct_from_a_plain_agent_lacks_permission_failure")}
        >
          <BeforeAfter label={t("uxLabs.before_generic_failure_text")}>
            <div className="text-xs">
              <span className="text-red-600 dark:text-red-400">{t("uxLabs.forbidden_action_not_permitted")}</span>
              <span className="ml-1 text-muted-foreground">(RESPONSIBLE_USER_UNAUTHORIZED)</span>
            </div>
          </BeforeAfter>
          <BeforeAfter label={t("uxLabs.after_actionable_denial_copy")}>
            <ResponsibleUserDenialNotice
              code="RESPONSIBLE_USER_UNAUTHORIZED"
              userName="Ada Lovelace"
            />
          </BeforeAfter>
        </LabSection>

        <LabSection
          title={t("uxLabs.3_denial_state_agent_lacks_permission_unchanged")}
          description={t("uxLabs.a_denial_that_is_not_a_responsible_user_code_keeps_the_existing_generic_error_copy_no_responsible_user_notice")}
        >
          <BeforeAfter label={t("uxLabs.agent_lacks_permission_failure")}>
            <div className="text-xs">
              <span className="text-red-600 dark:text-red-400">{t("uxLabs.forbidden_agent_is_not_permitted_to_perform_this_action")}</span>
              <span className="ml-1 text-muted-foreground">(deny_missing_membership)</span>
            </div>
          </BeforeAfter>
          <BeforeAfter label={t("uxLabs.no_responsible_user_notice_rendered")}>
            <div className="text-xs text-muted-foreground">{t("uxLabs.responsible_user_denial_notice_intentionally_absent_for_non_responsible_user_codes")}</div>
          </BeforeAfter>
        </LabSection>

        <LabSection
          title={t("uxLabs.4_denial_state_responsible_user_unavailable")}
          description={t("uxLabs.the_user_this_run_acts_for_was_removed_or_deactivated_steers_the_agent_to_mark_work_blocked")}
        >
          <BeforeAfter label={t("uxLabs.before_generic_failure_text")}>
            <div className="text-xs">
              <span className="text-red-600 dark:text-red-400">{t("uxLabs.forbidden_responsible_user_unavailable")}</span>
              <span className="ml-1 text-muted-foreground">(RESPONSIBLE_USER_UNAVAILABLE)</span>
            </div>
          </BeforeAfter>
          <BeforeAfter label={t("uxLabs.after_actionable_denial_copy")}>
            <ResponsibleUserDenialNotice
              code="RESPONSIBLE_USER_UNAVAILABLE"
              userName="Grace Hopper"
            />
          </BeforeAfter>
        </LabSection>

        <LabSection
          title={t("uxLabs.in_context_denial_inside_a_failed_run_ledger_row")}
          description={t("uxLabs.how_the_notice_reads_within_a_run_row_on_the_issue_timeline")}
        >
          <BeforeAfter label={t("uxLabs.unauthorized")}>
            <RunLedgerRow
              onBehalfOf="Ada Lovelace"
              denial={
                <ResponsibleUserDenialNotice
                  code="RESPONSIBLE_USER_UNAUTHORIZED"
                  userName="Ada Lovelace"
                />
              }
            />
          </BeforeAfter>
          <BeforeAfter label={t("uxLabs.unavailable")}>
            <RunLedgerRow
              onBehalfOf="Grace Hopper"
              denial={
                <ResponsibleUserDenialNotice
                  code="RESPONSIBLE_USER_UNAVAILABLE"
                  userName="Grace Hopper"
                />
              }
            />
          </BeforeAfter>
        </LabSection>

        <p className={cn("text-center text-(length:--text-micro) text-muted-foreground")}>{t("uxLabs.copy_is_sourced_from_the_shared")}{" "}<code>describeResponsibleUserDenial</code>{" "}{t("uxLabs.contract")}</p>
      </div>
    </div>
  );
}
