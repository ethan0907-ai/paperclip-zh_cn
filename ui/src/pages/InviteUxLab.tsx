import { t, useTranslation } from "@/i18n";
// token-extraction: allowlisted — intentional one-off decoration (DECISION-SHEET.md B1
// user ruling). The bg-[...gradient...] / shadow-[...] literals in this demo/UX-lab page
// are deliberate one-off decoration, reverted from --gradient-extract-*/--shadow-extract-*
// tokens; the file is on the check-token-gates allowlist in ui/src/index.css.
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyPatternIcon } from "@/components/CompanyPatternIcon";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Check,
  Clock3,
  ExternalLink,
  FlaskConical,
  KeyRound,
  Link2,
  Loader2,
  MailPlus,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";

const inviteRoleOptions = [
  {
    value: "viewer",
    get label() { return t("uxLabs.viewer"); },
    get description() { return t("uxLabs.can_view_organization_work_and_follow_along"); },
    get gets() { return t("uxLabs.view_only_organization_membership"); },
  },
  {
    value: "operator",
    get label() { return t("uxLabs.operator"); },
    get description() { return t("uxLabs.recommended_for_people_who_need_to_help_run_work_without_managing_access"); },
    get gets() { return t("uxLabs.can_assign_tasks"); },
  },
  {
    value: "admin",
    get label() { return t("uxLabs.admin"); },
    get description() { return t("uxLabs.recommended_for_operators_who_need_to_invite_people_create_agents_and_approve_joins"); },
    get gets() { return t("uxLabs.can_create_agents_invite_users_assign_tasks_and_approve_join_requests"); },
  },
  {
    value: "owner",
    get label() { return t("uxLabs.owner"); },
    get description() { return t("uxLabs.full_organization_access_including_membership_management"); },
    get gets() { return t("uxLabs.everything_in_admin_plus_managing_members"); },
  },
] as const;

const inviteHistory = [
  {
    id: "invite-active",
    state: "Active",
    humanRole: "operator",
    invitedBy: "Board User 25",
    email: "board25@paperclip.local",
    createdAt: "Apr 25, 2026, 9:00 AM",
    action: "Revoke",
    relatedLabel: "Review request",
  },
  {
    id: "invite-accepted",
    state: "Accepted",
    humanRole: "viewer",
    invitedBy: "Board User 24",
    email: "board24@paperclip.local",
    createdAt: "Apr 24, 2026, 8:15 AM",
    action: "Inactive",
    relatedLabel: "—",
  },
  {
    id: "invite-revoked",
    state: "Revoked",
    humanRole: "admin",
    invitedBy: "Board User 20",
    email: "board20@paperclip.local",
    createdAt: "Apr 20, 2026, 2:45 PM",
    action: "Inactive",
    relatedLabel: "—",
  },
  {
    id: "invite-expired",
    state: "Expired",
    humanRole: "owner",
    invitedBy: "Board User 19",
    email: "board19@paperclip.local",
    createdAt: "Apr 19, 2026, 7:10 PM",
    action: "Inactive",
    relatedLabel: "—",
  },
] as const;

const fieldClassName =
  "w-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500";
const panelClassName = "border border-zinc-800 bg-zinc-950/95 p-6";

function LabSection({
  eyebrow,
  title,
  description,
  accentClassName,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  accentClassName?: string;
  children: ReactNode;
}) {
  useTranslation();
  return (
    <section
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

function StatusCard({
  icon,
  title,
  body,
  tone = "default",
}: {
  icon: ReactNode;
  title: string;
  body: string;
  tone?: "default" | "warn" | "success" | "error";
}) {
  useTranslation();
  const toneClassName = {
    default: "border-border/70 bg-background/85",
    warn: "border-amber-400/40 bg-amber-500/[0.08]",
    success: "border-emerald-400/40 bg-emerald-500/[0.08]",
    error: "border-rose-400/40 bg-rose-500/[0.08]",
  }[tone];

  return (
    <Card className={cn("rounded-(--rad-24) shadow-none", toneClassName)}>
      <CardHeader className="space-y-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-current/10 bg-background/70 text-muted-foreground">
          {icon}
        </div>
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription className="mt-2 text-sm leading-6">{body}</CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
}

function InviteLandingShell({
  left,
  right,
}: {
  left: ReactNode;
  right: ReactNode;
}) {
  useTranslation();
  return (
    <div className="overflow-hidden rounded-(--rad-28) border border-zinc-800 bg-zinc-950 shadow-[0_30px_80px_rgba(2,6,23,0.55)]">
      <div className="grid gap-px bg-zinc-800 lg:grid-cols-(--gtc-37)">
        <section className={cn(panelClassName, "space-y-6 bg-zinc-950")}>{left}</section>
        <section className={cn(panelClassName, "h-full bg-zinc-950")}>{right}</section>
      </div>
    </div>
  );
}

function InviteSummaryPanel({
  title,
  description,
  inviteMessage,
  requestedAccess,
  signedInLabel,
}: {
  title: string;
  description: string;
  inviteMessage?: string;
  requestedAccess: string;
  signedInLabel?: string;
}) {
  const { t, i18n } = useTranslation();
  return (
    <>
      <div className="flex items-start gap-4">
        <CompanyPatternIcon
          companyName="Acme Robotics"
          logoUrl="/api/invites/pcp_invite_test/logo"
          className="h-16 w-16 rounded-none border border-zinc-800"
        />
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-(--tracking-caps) text-zinc-500">{t("uxLabs.you_ve_been_invited_to_join_paperclip")}</p>
          <h3 className="mt-2 text-2xl font-semibold text-zinc-100">{title}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-300">{description}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <MetaCard label={t("uxLabs.organization")} value="Acme Robotics" />
        <MetaCard label={t("uxLabs.invited_by")} value="Board User" />
        <MetaCard label={t("uxLabs.requested_access")} value={requestedAccess} />
        <MetaCard label={t("uxLabs.invite_expires")} value={new Date("2027-03-07T12:00:00").toLocaleDateString(i18n.language, { year: "numeric", month: "short", day: "numeric" })} />
      </div>

      {inviteMessage ? (
        <div className="border border-amber-500/40 bg-amber-500/10 p-4">
          <div className="text-xs uppercase tracking-(--tracking-caps) text-amber-200/80">{t("uxLabs.message_from_inviter")}</div>
          <p className="mt-2 text-sm leading-6 text-amber-50">{inviteMessage}</p>
        </div>
      ) : null}

      {signedInLabel ? (
        <div className="border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-50">{t("uxLabs.signed_in_as")}{" "}<span className="font-medium">{signedInLabel}</span>.
        </div>
      ) : null}
    </>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  useTranslation();
  return (
    <div className="border border-zinc-800 p-3">
      <div className="text-xs uppercase tracking-(--tracking-caps) text-zinc-500">{label}</div>
      <div className="mt-1 text-sm text-zinc-100">{value}</div>
    </div>
  );
}

function InlineAuthPreview({
  mode,
  feedback,
  working,
}: {
  mode: "sign_up" | "sign_in";
  feedback?: { tone: "info" | "error"; text: string };
  working?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-zinc-100">
          {mode === "sign_up" ? t("uxLabs.create_your_account") : t("uxLabs.sign_in_to_continue")}
        </h3>
        <p className="mt-1 text-sm text-zinc-400">
          {mode === "sign_up"
            ? t("uxLabs.start_with_a_paperclip_account_after_that_you_ll_come_right_back_here_to_accept_the_invite_for_acme_robotics")
            : t("uxLabs.use_the_paperclip_account_that_already_matches_this_invite_if_you_do_not_have_one_yet_switch_back_to_create_account")}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          className={cn(
            "flex-1 border px-3 py-2 text-sm transition-colors",
            mode === "sign_up"
              ? "border-zinc-100 bg-zinc-100 text-zinc-950"
              : "border-zinc-800 text-zinc-300 hover:border-zinc-600",
          )}
        >{t("uxLabs.create_account")}</button>
        <button
          type="button"
          className={cn(
            "flex-1 border px-3 py-2 text-sm transition-colors",
            mode === "sign_in"
              ? "border-zinc-100 bg-zinc-100 text-zinc-950"
              : "border-zinc-800 text-zinc-300 hover:border-zinc-600",
          )}
        >{t("uxLabs.i_already_have_an_account")}</button>
      </div>

      <form className="space-y-4">
        {mode === "sign_up" ? (
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-400">{t("uxLabs.name")}</span>
            <input name="name" className={fieldClassName} defaultValue="Jane Example" readOnly />
          </label>
        ) : null}
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-400">{t("uxLabs.email")}</span>
          <input name="email" type="email" className={fieldClassName} defaultValue="jane@example.com" readOnly />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-400">{t("uxLabs.password")}</span>
          <input name="password" type="password" className={fieldClassName} defaultValue="supersecret" readOnly />
        </label>
        {feedback ? (
          <p className={cn("text-xs", feedback.tone === "info" ? "text-amber-300" : "text-red-400")}>
            {feedback.text}
          </p>
        ) : null}
        <Button type="button" className="w-full rounded-none" disabled={working}>
          {working ? t("uxLabs.working_672e2e2e") : mode === "sign_in" ? t("uxLabs.sign_in_and_continue") : t("uxLabs.create_account_and_continue")}
        </Button>
      </form>

      <p className="text-xs leading-5 text-zinc-500">
        {mode === "sign_up"
          ? t("uxLabs.already_signed_up_before_use_the_existing_account_option_instead_so_the_invite_lands_on_the_right_paperclip_user")
          : t("uxLabs.no_account_yet_switch_back_to_create_account_so_you_can_accept_the_invite_with_a_new_login")}
      </p>
    </div>
  );
}

function AgentRequestPreview() {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-zinc-100">{t("uxLabs.submit_agent_details")}</h3>
        <p className="mt-1 text-sm text-zinc-400">{t("uxLabs.this_invite_will_create_an_approval_request_for_a_new_agent_in_acme_robotics")}</p>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block text-zinc-400">{t("uxLabs.agent_name")}</span>
        <input className={fieldClassName} defaultValue="Acme Ops Agent" readOnly />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-zinc-400">{t("uxLabs.adapter_type")}</span>
        <select className={fieldClassName} defaultValue="codex_local" disabled>
          <option value="codex_local">Codex</option>
          <option value="claude_local">Claude Code</option>
          <option value="cursor">Cursor</option>
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-zinc-400">{t("uxLabs.capabilities")}</span>
        <textarea
          className={fieldClassName}
          rows={4}
          defaultValue={t("uxLabs.reviews_invites_triages_requests_and_keeps_the_board_queue_moving")}
          readOnly
        />
      </label>
      <Button type="button" className="w-full rounded-none">{t("uxLabs.submit_request")}</Button>
    </div>
  );
}

function AcceptInvitePreview({
  autoAccept,
  isCurrentMember,
  error,
}: {
  autoAccept?: boolean;
  isCurrentMember?: boolean;
  error?: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-zinc-100">{t("uxLabs.accept_organization_invite")}</h3>
        <p className="mt-1 text-sm text-zinc-400">
          {autoAccept
            ? t("uxLabs.granting_your_access_to_acme_robotics")
            : isCurrentMember
              ? t("uxLabs.this_account_already_belongs_to_acme_robotics")
              : t("uxLabs.this_will_grant_or_complete_your_access_to_acme_robotics")}
        </p>
      </div>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
      {autoAccept ? (
        <div className="text-sm text-zinc-400">{t("uxLabs.submitting_request")}</div>
      ) : (
        <Button type="button" className="w-full rounded-none" disabled={isCurrentMember}>{t("uxLabs.accept_invite")}</Button>
      )}
    </div>
  );
}

function InviteResultPreview({
  title,
  description,
  claimSecret,
  onboardingTextUrl,
  joinedNow = false,
}: {
  title: string;
  description: string;
  claimSecret?: string;
  onboardingTextUrl?: string;
  joinedNow?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-md border border-zinc-800 bg-zinc-950 p-6 text-zinc-100">
      <div className="flex items-center gap-3">
        <CompanyPatternIcon
          companyName="Acme Robotics"
          logoUrl="/api/invites/pcp_invite_test/logo"
          className="h-12 w-12 rounded-none border border-zinc-800"
        />
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <div className="mt-4 space-y-3">
        <p className="text-sm text-zinc-400">{description}</p>
        {joinedNow ? (
          <Button type="button" className="w-full rounded-none">{t("uxLabs.open_board")}</Button>
        ) : (
          <>
            <div className="border border-zinc-800 p-3">
              <p className="mb-1 text-xs text-zinc-500">{t("uxLabs.approval_page")}</p>
              <a className="text-sm text-zinc-200 underline underline-offset-2" href="/company/settings/members">{t("uxLabs.settings_members")}</a>
            </div>
            <p className="text-xs text-zinc-500">{t("uxLabs.refresh_this_page_after_you_ve_been_approved_you_ll_be_redirected_automatically")}</p>
          </>
        )}
        {claimSecret ? (
          <div className="space-y-1 border border-zinc-800 p-3 text-xs text-zinc-400">
            <div className="text-zinc-200">{t("uxLabs.claim_secret")}</div>
            <div className="font-mono break-all">{claimSecret}</div>
            <div className="font-mono break-all">POST /api/agents/claim-api-key</div>
          </div>
        ) : null}
        {onboardingTextUrl ? (
          <div className="text-xs text-zinc-400">{t("uxLabs.onboarding")}{" "}<span className="font-mono break-all">{onboardingTextUrl}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AuthScreenPreview({ mode, error }: { mode: "sign_in" | "sign_up"; error?: string }) {
  const { t } = useTranslation();
  return (
    <div className="overflow-hidden rounded-(--rad-28) border border-border/70 bg-background shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
      <div className="grid gap-px bg-border/60 md:grid-cols-2">
        <div className="flex min-h-(--sz-420px) flex-col justify-center bg-background px-8 py-10">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Paperclip</span>
            </div>
            <h3 className="text-xl font-semibold">
              {mode === "sign_in" ? t("uxLabs.sign_in_to_paperclip") : t("uxLabs.create_your_paperclip_account")}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "sign_in"
                ? t("uxLabs.use_your_email_and_password_to_access_this_instance")
                : t("uxLabs.create_an_account_for_this_instance_email_confirmation_is_not_required_in_v1")}
            </p>
            <div className="mt-6 space-y-4">
              {mode === "sign_up" ? (
                <label className="block">
                  <span className="mb-1 block text-xs text-muted-foreground">{t("uxLabs.name")}</span>
                  <input
                    className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
                    defaultValue="Jane Example"
                    readOnly
                  />
                </label>
              ) : null}
              <label className="block">
                <span className="mb-1 block text-xs text-muted-foreground">{t("uxLabs.email")}</span>
                <input
                  className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
                  defaultValue="jane@example.com"
                  readOnly
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-muted-foreground">{t("uxLabs.password")}</span>
                <input
                  className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
                  defaultValue="supersecret"
                  readOnly
                />
              </label>
              {error ? <p className="text-xs text-destructive">{error}</p> : null}
              <Button type="button" className="w-full">
                {mode === "sign_in" ? t("uxLabs.sign_in") : t("uxLabs.create_account_6f756e74")}
              </Button>
            </div>
            <div className="mt-5 text-sm text-muted-foreground">
              {mode === "sign_in" ? t("uxLabs.need_an_account") : t("uxLabs.already_have_an_account")}{" "}
              <span className="font-medium text-foreground underline underline-offset-2">
                {mode === "sign_in" ? t("uxLabs.create_one") : t("uxLabs.sign_in_6e20696e")}
              </span>
            </div>
          </div>
        </div>
        <div className="hidden min-h-(--sz-420px) items-center justify-center bg-[radial-gradient(circle_at_top,rgba(8,145,178,0.18),transparent_48%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,1))] px-8 py-10 md:flex">
          <div className="max-w-sm space-y-4 text-zinc-200">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/[0.08] px-3 py-1 text-(length:--text-nano) uppercase tracking-(--tracking-caps) text-cyan-200">{t("uxLabs.auth_preview")}</div>
            <div className="text-2xl font-semibold">{t("uxLabs.side_by_side_signup_styling_review")}</div>
            <p className="text-sm leading-6 text-zinc-400">{t("uxLabs.this_frame_mirrors_the_production_auth_surface_so_spacing_label_density_button_treatments_and_desktop_composition_are_easy_to_compare")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompanyInvitesPreview() {
  const { t, i18n } = useTranslation();
  return (
    <div className="grid gap-5 xl:grid-cols-(--gtc-38)">
      <Card className="rounded-(--rad-28) shadow-none">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MailPlus className="h-4 w-4" />{t("uxLabs.organization_invites")}</div>
          <div>
            <CardTitle>{t("uxLabs.create_invite")}</CardTitle>
            <CardDescription className="mt-2">{t("uxLabs.generate_a_human_invite_link_and_choose_the_default_access_it_should_request")}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">{t("uxLabs.choose_a_role")}</legend>
            <div className="rounded-2xl border border-border">
              {inviteRoleOptions.map((option, index) => (
                <label
                  key={option.value}
                  className={cn("flex cursor-default gap-3 px-4 py-4", index > 0 && "border-t border-border")}
                >
                  <input
                    type="radio"
                    readOnly
                    checked={option.value === "operator"}
                    className="mt-1 h-4 w-4 border-border text-foreground"
                  />
                  <span className="min-w-0 space-y-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{option.label}</span>
                      {option.value === "operator" ? (
                        <Badge variant="outline" className="border-border text-muted-foreground">{t("uxLabs.default")}</Badge>
                      ) : null}
                    </span>
                    <span className="block max-w-2xl text-sm text-muted-foreground">{option.description}</span>
                    <span className="block text-sm text-foreground">{option.gets}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground">{t("uxLabs.each_invite_link_is_single_use_human_invitees_get_the_selected_role_immediately_after_sign_in_agent_invites_still_create_a_join_request_for_approval")}</div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button">{t("uxLabs.create_invite")}</Button>
            <span className="text-sm text-muted-foreground">{t("uxLabs.invite_history_below_keeps_the_audit_trail")}</span>
          </div>

          <div className="space-y-3 rounded-2xl border border-border px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium">{t("uxLabs.latest_invite_link")}</div>
                <div className="text-sm text-muted-foreground">{t("uxLabs.this_url_includes_the_current_paperclip_domain_returned_by_the_server")}</div>
              </div>
              <div className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
                <Check className="h-3.5 w-3.5" />{t("uxLabs.copied")}</div>
            </div>
            <button
              type="button"
              className="w-full rounded-md border border-border bg-muted/60 px-3 py-2 text-left text-sm break-all"
            >
              https://paperclip.local/invite/new-token
            </button>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline">
                <ExternalLink className="h-4 w-4" />{t("uxLabs.open_invite")}</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-(--rad-28) shadow-none">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>{t("uxLabs.invite_history")}</CardTitle>
              <CardDescription className="mt-2">{t("uxLabs.review_invite_status_role_inviter_and_any_linked_join_request")}</CardDescription>
            </div>
            <a href="/inbox/requests" className="text-sm underline underline-offset-4">{t("uxLabs.open_join_request_queue")}</a>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 font-medium text-muted-foreground">{t("uxLabs.state")}</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground">{t("uxLabs.role")}</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground">{t("uxLabs.invited_by")}</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground">{t("uxLabs.created")}</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground">{t("uxLabs.join_request")}</th>
                  <th className="px-5 py-3 text-right font-medium text-muted-foreground">{t("uxLabs.action")}</th>
                </tr>
              </thead>
              <tbody>
                {inviteHistory.map((invite) => (
                  <tr key={invite.id} className="border-b border-border last:border-b-0">
                    <td className="px-5 py-3 align-top">
                      <Badge variant="outline" className="border-border text-muted-foreground">
                        {t(`uxLabs.invite_state_${invite.state}`)}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 align-top">{inviteRoleOptions.find((option) => option.value === invite.humanRole)?.label ?? invite.humanRole}</td>
                    <td className="px-5 py-3 align-top">
                      <div>{invite.invitedBy}</div>
                      <div className="text-xs text-muted-foreground">{invite.email}</div>
                    </td>
                    <td className="px-5 py-3 align-top text-muted-foreground">{new Date(invite.createdAt).toLocaleString(i18n.language)}</td>
                    <td className="px-5 py-3 align-top">
                      {invite.relatedLabel === "Review request" ? (
                        <a href="/inbox/requests" className="underline underline-offset-4">
                          {t("uxLabs.review_request")}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">{invite.relatedLabel}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right align-top">
                      {invite.action === "Revoke" ? (
                        <Button type="button" size="sm" variant="outline">
                          {t("uxLabs.revoke")}
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">{t("uxLabs.inactive")}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-border p-4">
              <div className="text-sm font-medium">{t("uxLabs.empty_history_state")}</div>
              <div className="mt-2 text-sm text-muted-foreground">{t("uxLabs.no_invites_have_been_created_for_this_organization_yet")}</div>
            </div>
            <div className="rounded-2xl border border-rose-400/40 bg-rose-500/[0.07] p-4">
              <div className="text-sm font-medium text-foreground">{t("uxLabs.permission_error")}</div>
              <div className="mt-2 text-sm text-muted-foreground">{t("uxLabs.you_do_not_have_permission_to_manage_organization_invites")}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function InviteUxLab() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-(--rad-32) border border-border/70 bg-[linear-gradient(135deg,rgba(8,145,178,0.10),transparent_28%),linear-gradient(180deg,rgba(245,158,11,0.10),transparent_44%),var(--background)] shadow-[0_30px_80px_rgba(15,23,42,0.10)]">
        <div className="grid gap-6 lg:grid-cols-(--gtc-39)">
          <div className="p-6 sm:p-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/[0.08] px-3 py-1 text-(length:--text-nano) font-semibold uppercase tracking-(--tracking-caps) text-cyan-700 dark:text-cyan-300">
              <FlaskConical className="h-3.5 w-3.5" />{t("uxLabs.invite_ux_lab")}</div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">{t("uxLabs.invite_and_signup_ux_review_surface")}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{t("uxLabs.this_page_collects_the_current_invite_landing_signup_approval_result_and_organization_invite_management_states_in_one_place_so_styling_changes_can_be_reviewed_without_recreating_each_backend_condition_by_hand")}</p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full px-3 py-1 text-(length:--text-nano) uppercase tracking-(--tracking-caps)">
                /tests/ux/invites
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-(length:--text-nano) uppercase tracking-(--tracking-caps)">{t("uxLabs.signup_invite_states")}</Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-(length:--text-nano) uppercase tracking-(--tracking-caps)">{t("uxLabs.fixture_backed_preview")}</Badge>
            </div>
          </div>

          <aside className="border-t border-border/60 bg-background/70 p-6 lg:border-l lg:border-t-0">
            <div className="mb-4 text-(length:--text-micro) font-semibold uppercase tracking-(--tracking-caps) text-muted-foreground">{t("uxLabs.covered_states")}</div>
            <div className="space-y-3">
              {[
                t("uxLabs.invite_loading_access_check_missing_token_and_unavailable_states"),
                t("uxLabs.inline_account_creation_and_sign_in_variants_including_feedback_error_copy"),
                t("uxLabs.human_accept_agent_request_and_auto_accept_transitions"),
                t("uxLabs.pending_approval_joined_now_claim_secret_and_onboarding_result_screens"),
                t("uxLabs.organization_invite_creation_copied_link_history_empty_and_permission_error_states"),
              ].map((highlight) => (
                <div
                  key={highlight}
                  className="rounded-2xl border border-border/70 bg-background/85 px-4 py-3 text-sm text-muted-foreground"
                >
                  {highlight}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>

      <LabSection
        eyebrow={t("uxLabs.top_level_states")}
        title={t("uxLabs.landing_state_coverage")}
        description={t("uxLabs.small_cards_for_the_fast_return_invite_states_that_do_not_render_the_full_split_screen_layout")}
        accentClassName="bg-[linear-gradient(180deg,rgba(59,130,246,0.05),transparent_30%),var(--background)]"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatusCard
            icon={<Loader2 className="h-4 w-4 animate-spin" />}
            title={t("uxLabs.loading_invite")}
            body={t("uxLabs.shown_while_invite_summary_deployment_mode_or_auth_session_data_is_still_loading")}
          />
          <StatusCard
            icon={<Clock3 className="h-4 w-4" />}
            title={t("uxLabs.checking_your_access")}
            body={t("uxLabs.shown_after_sign_in_while_the_app_verifies_whether_the_current_user_already_belongs_to_the_invited_organization")}
          />
          <StatusCard
            icon={<KeyRound className="h-4 w-4" />}
            title={t("uxLabs.invalid_invite_token")}
            body={t("uxLabs.the_token_is_missing_entirely_so_the_page_short_circuits_before_any_invite_lookup")}
            tone="error"
          />
          <StatusCard
            icon={<Link2 className="h-4 w-4" />}
            title={t("uxLabs.invite_not_available")}
            body={t("uxLabs.used_for_expired_revoked_already_consumed_or_otherwise_missing_invites")}
            tone="warn"
          />
          <StatusCard
            icon={<ShieldCheck className="h-4 w-4" />}
            title={t("uxLabs.bootstrap_complete")}
            body={t("uxLabs.result_screen_for_bootstrap_ceo_invites_after_setup_has_been_accepted_successfully")}
            tone="success"
          />
          <StatusCard
            icon={<ArrowRight className="h-4 w-4" />}
            title={t("uxLabs.auto_accept_in_progress")}
            body={t("uxLabs.signed_in_human_users_skip_the_extra_button_click_and_move_straight_into_join_submission")}
          />
          <StatusCard
            icon={<Users className="h-4 w-4" />}
            title={t("uxLabs.already_a_member")}
            body={t("uxLabs.acceptance_stays_disabled_and_the_page_redirects_into_the_organization_once_membership_is_confirmed")}
          />
          <StatusCard
            icon={<UserPlus className="h-4 w-4" />}
            title={t("uxLabs.invite_result_surfaces")}
            body={t("uxLabs.both_pending_approval_and_joined_now_confirmations_are_included_below_with_claim_and_onboarding_extras")}
            tone="success"
          />
        </div>
      </LabSection>

      <LabSection
        eyebrow={t("uxLabs.invite_landing")}
        title={t("uxLabs.split_screen_invite_flows")}
        description={t("uxLabs.these_frames_mirror_the_production_invite_surface_closely_enough_to_review_spacing_hierarchy_and_control_states_while_keeping_data_fixture_driven")}
        accentClassName="bg-[linear-gradient(180deg,rgba(234,179,8,0.06),transparent_28%),var(--background)]"
      >
        <div className="space-y-5">
          <InviteLandingShell
            left={
              <InviteSummaryPanel
                title={t("uxLabs.join_acme_robotics")}
                description={t("uxLabs.create_your_paperclip_account_first_if_you_already_have_one_switch_to_sign_in_and_continue_the_invite_with_the_same_email")}
                inviteMessage={t("uxLabs.welcome_aboard")}
                requestedAccess={t("uxLabs.operator")}
              />
            }
            right={<InlineAuthPreview mode="sign_up" />}
          />

          <InviteLandingShell
            left={
              <InviteSummaryPanel
                title={t("uxLabs.join_acme_robotics")}
                description={t("uxLabs.create_your_paperclip_account_first_if_you_already_have_one_switch_to_sign_in_and_continue_the_invite_with_the_same_email")}
                inviteMessage={t("uxLabs.welcome_aboard")}
                requestedAccess={t("uxLabs.operator")}
              />
            }
            right={
              <InlineAuthPreview
                mode="sign_in"
                feedback={{
                  tone: "info",
                  text: t("uxLabs.an_account_already_exists_for_jane_example_com_sign_in_below_to_continue_with_this_invite"),
                }}
              />
            }
          />

          <InviteLandingShell
            left={
              <InviteSummaryPanel
                title={t("uxLabs.join_acme_robotics")}
                description={t("uxLabs.your_account_is_ready_review_the_invite_details_then_accept_it_to_continue")}
                inviteMessage={t("uxLabs.welcome_aboard")}
                requestedAccess={t("uxLabs.operator")}
                signedInLabel="Jane Example"
              />
            }
            right={<AcceptInvitePreview autoAccept />}
          />

          <InviteLandingShell
            left={
              <InviteSummaryPanel
                title={t("uxLabs.join_acme_robotics")}
                description={t("uxLabs.review_the_invite_details_then_submit_the_agent_information_below_to_start_the_join_request")}
                requestedAccess={t("uxLabs.agent_join_request")}
              />
            }
            right={<AgentRequestPreview />}
          />

          <InviteLandingShell
            left={
              <InviteSummaryPanel
                title={t("uxLabs.join_acme_robotics")}
                description={t("uxLabs.your_account_is_ready_review_the_invite_details_then_accept_it_to_continue")}
                requestedAccess={t("uxLabs.operator")}
                signedInLabel="Jane Example"
              />
            }
            right={<AcceptInvitePreview error={t("uxLabs.this_account_already_belongs_to_the_organization")} isCurrentMember />}
          />
        </div>
      </LabSection>

      <LabSection
        eyebrow={t("uxLabs.result_states")}
        title={t("uxLabs.approval_and_completion_screens")}
        description={t("uxLabs.these_are_the_post_submit_states_returned_from_invite_acceptance_including_optional_claim_and_onboarding_metadata")}
        accentClassName="bg-[linear-gradient(180deg,rgba(16,185,129,0.06),transparent_30%),var(--background)]"
      >
        <div className="grid gap-5 xl:grid-cols-3">
          <InviteResultPreview
            title={t("uxLabs.request_to_join_acme_robotics")}
            description={t("uxLabs.board_user_must_approve_your_request_to_join")}
            claimSecret="pcp_claim_secret_demo"
            onboardingTextUrl="/api/invites/pcp_invite_test/onboarding.txt"
          />
          <InviteResultPreview
            title={t("uxLabs.you_joined_the_organization")}
            description={t("uxLabs.your_account_already_matched_the_approved_invite_so_the_board_can_be_opened_immediately")}
            joinedNow
          />
          <InviteResultPreview
            title={t("uxLabs.request_to_join_acme_robotics")}
            description={t("uxLabs.ask_them_to_visit_settings_members_to_approve_your_request")}
          />
        </div>
      </LabSection>

      <LabSection
        eyebrow={t("uxLabs.standalone_auth")}
        title={t("uxLabs.auth_page_states")}
        description={t("uxLabs.the_general_auth_page_uses_a_different_composition_from_invite_landing_these_previews_keep_both_sign_in_and_sign_up_variants_visible")}
        accentClassName="bg-[linear-gradient(180deg,rgba(168,85,247,0.06),transparent_28%),var(--background)]"
      >
        <div className="space-y-5">
          <AuthScreenPreview mode="sign_in" error={t("uxLabs.invalid_email_or_password")} />
          <AuthScreenPreview mode="sign_up" />
        </div>
      </LabSection>

      <LabSection
        eyebrow={t("uxLabs.settings")}
        title={t("uxLabs.organization_invite_management")}
        description={t("uxLabs.this_section_captures_the_board_side_invite_creation_flow_copied_link_state_audit_table_and_the_edge_states_that_are_otherwise_tedious_to_stage")}
        accentClassName="bg-[linear-gradient(180deg,rgba(244,114,182,0.06),transparent_28%),var(--background)]"
      >
        <CompanyInvitesPreview />
      </LabSection>
    </div>
  );
}
