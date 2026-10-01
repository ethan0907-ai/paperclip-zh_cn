import { createUuid } from "@/lib/uuid";
import { i18n, useTranslation } from "@/i18n";
import { ChatSetupNavigation } from "@/components/chat/ChatSetupNavigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  AlertTriangle,
  Mail,
} from "lucide-react";
import { useCompany } from "@/context/CompanyContext";
import { useNavigate, useSearchParams, Link } from "@/lib/router";
import { agentsApi } from "@/api/agents";
import { issuesApi } from "@/api/issues";
import { projectsApi } from "@/api/projects";
import { toolsApi } from "@/api/tools";
import { emailApi } from "@/api/email";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioCardGroup } from "@/components/ui/radio-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AgentIcon } from "@/components/AgentIconPicker";
import { SearchableSelect } from "@/components/SearchableSelect";
import { AccessStep } from "@/features/connections/ConnectionSetupFlow";
import { TrustPresetSection } from "@/components/TrustPresetSection";
import { EmailSafetyNotice } from "@/components/EmailSafetyNotice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getTrustPreset,
  getLowTrustBoundary,
  lowTrustBoundaryHasScope,
} from "@/lib/trust-policy-ui";
import { queryKeys } from "@/lib/queryKeys";
import type {
  AgentPermissions,
  EmailEndpointSummary,
} from "@paperclipai/shared";
const EMAIL_STATUS_KEYS: Record<string, string> = {
  active: "appsEmail.statusActive",
  draft: "appsEmail.statusDraft",
  paused: "appsEmail.statusPaused",
  disabled: "appsEmail.statusDisabled",
  archived: "appsEmail.statusArchived",
  error: "appsEmail.statusError",
};

const selectClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

export function EmailEndpointSetup() {
  const { t } = useTranslation();
  const { selectedCompanyId } = useCompany();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const cache = useQueryClient();
  const companyId = selectedCompanyId ?? "";
  const [connectionId, setConnectionId] = useState(
    params.get("connectionId") ?? "",
  );
  const [step, setStep] = useState(params.get("connectionId") ? 3 : 0);
  const [agentId, setAgentId] = useState(params.get("agentId") ?? "");
  const [grantKind, setGrantKind] = useState<"user" | "organization" | "agent">(
    "user",
  );
  const [agentAccess, setAgentAccess] = useState<"specific" | "all">(
    "specific",
  );
  const [agentIds, setAgentIds] = useState<Set<string>>(
    new Set(params.get("agentId") ? [params.get("agentId")!] : []),
  );
  const [apiKey, setApiKey] = useState("");
  const [requestId] = useState(() => createUuid());
  const [addressMode, setAddressMode] = useState("new");
  const [inboxId, setInboxId] = useState("");
  const [username, setUsername] = useState("");
  const [domain, setDomain] = useState("agentmail.to");
  const [mode, setMode] = useState<"websocket" | "webhook">("websocket");
  const [trustOpen, setTrustOpen] = useState(false);
  const [permissions, setPermissions] = useState<Partial<AgentPermissions>>({});
  const agents = useQuery({
    queryKey: queryKeys.agents.list(companyId),
    queryFn: () => agentsApi.list(companyId),
    enabled: !!companyId,
  });
  const projects = useQuery({
    queryKey: queryKeys.projects.list(companyId),
    queryFn: () => projectsApi.list(companyId),
    enabled: !!companyId && trustOpen,
  });
  const boundaryIssues = useQuery({
    queryKey: ["email-boundary-issues", companyId],
    queryFn: () => issuesApi.list(companyId),
    enabled: !!companyId && trustOpen,
  });
  const chosen = agents.data?.find((a) => a.id === agentId);
  const lowTrust = getTrustPreset(chosen?.permissions) === "low_trust_review";
  const scoped = lowTrustBoundaryHasScope(
    getLowTrustBoundary(chosen?.permissions),
  );
  const inspected = useQuery({
    queryKey: ["email-credential-inspect", companyId, connectionId],
    queryFn: () => emailApi.inspectSaved(companyId, connectionId),
    enabled: !!companyId && !!connectionId && step >= 3,
    retry: false,
  });
  const inboxes = useQuery({
    queryKey: ["email-inboxes", companyId],
    queryFn: () => emailApi.list(companyId),
    enabled: !!companyId,
  });
  const scopedKey = inspected.data?.scope.scope_type === "inbox";
  useEffect(() => {
    if (scopedKey) {
      setAddressMode("existing");
      setInboxId(inspected.data?.inboxes[0]?.inbox_id ?? "");
    }
  }, [scopedKey, inspected.data]);
  const connect = useMutation({
    mutationFn: () =>
      emailApi.connect(companyId, {
        apiKey,
        grantKind: grantKind === "organization" ? "organization" : "user",
        allAgents: agentAccess === "all",
        agentIds: [...agentIds],
        idempotencyKey: requestId,
      }),
    onSuccess: (result) => {
      setApiKey("");
      setConnectionId(result.id);
      setStep(2);
      void cache.invalidateQueries({
        queryKey: queryKeys.tools.connections(companyId),
      });
    },
  });
  const agentDetail = useQuery({
    queryKey: queryKeys.agents.detail(agentId),
    queryFn: () => agentsApi.get(agentId),
    enabled: !!agentId && trustOpen,
  });
  const trust = useMutation({
    mutationFn: () =>
      agentsApi.updatePermissions(
        agentId,
        {
          ...permissions,
          canCreateAgents: permissions.canCreateAgents ?? false,
          canCreateSkills: permissions.canCreateSkills ?? true,
          canAssignTasks: agentDetail.data?.access?.canAssignTasks ?? false,
        },
        companyId,
      ),
    onSuccess: () => {
      setTrustOpen(false);
      void cache.invalidateQueries({
        queryKey: queryKeys.agents.list(companyId),
      });
    },
  });
  const setup = useMutation({
    mutationFn: () =>
      emailApi.setup(companyId, {
        assignedAgentId: agentId,
        credentialConnectionId: connectionId,
        ...(addressMode === "existing" ? { inboxId } : { username, domain }),
        receiveMode: mode,
        idempotencyKey: requestId,
      }),
    onSuccess: () => {
      void cache.invalidateQueries({ queryKey: ["email-inboxes", companyId] });
      void cache.invalidateQueries({
        queryKey: queryKeys.tools.connectionInstalls(connectionId),
      });
      setStep(6);
    },
  });
  const address =
    addressMode === "existing" ? inboxId : `${username}@${domain}`;
  const labels =
    step < 3
      ? [t("appsEmail.access"), t("appsEmail.aPIKey"), t("appsEmail.connected")]
      : [t("appsEmail.agent"), t("appsEmail.emailAddress"), t("appsEmail.review")];
  const current = step < 3 ? step : Math.min(step - 3, 2);
  const error = connect.error ?? setup.error ?? inspected.error ?? agents.error;
  const trustNotice = chosen && (
    <div
      className="space-y-3 rounded-lg border border-border bg-muted/30 p-4"
      role={lowTrust && scoped ? "note" : "alert"}
    >
      <p className="flex items-center gap-2 text-sm font-medium">
        {lowTrust && scoped ? (
          <Check className="size-4" />
        ) : (
          <AlertTriangle className="size-4 text-(--status-agent-paused)" />
        )}
        {lowTrust
          ? scoped
            ? t("appsEmail.lowTrustReviewConfigured")
            : t("appsEmail.lowTrustNeedsAWorkBoundary")
          : t("appsEmail.agentNotLowTrust", { agent: chosen.name })}
      </p>
      <p className="text-sm text-muted-foreground">
        {lowTrust
          ? t("appsEmail.emailTasksStayInsideTheConfiguredProjectOrRoot")
          : t("appsEmail.emailCanContainMaliciousInstructionsWeRecommendLowTrust")}
      </p>
      <p className="text-xs text-muted-foreground">{t("appsEmail.lowTrustExecutionAlsoRequiresIsolatedWorkspacesAndAn")}</p>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          setPermissions(chosen.permissions);
          setTrustOpen(true);
        }}
      >
        {lowTrust ? t("appsEmail.reviewTrustSettings") : t("appsEmail.configureLowTrust")}
      </Button>
    </div>
  );
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">
          {step < 3
            ? t("appsEmail.connectAgentMail")
            : step === 6
              ? t("appsEmail.yourAgentsEmailIsReady")
              : t("appsEmail.giveAnAgentAnEmailAddress")}
        </h1>
        <Button
          variant="ghost"
          onClick={() =>
            navigate(
              connectionId ? `/apps/${connectionId}/permissions` : "/apps",
            )
          }
        >
          {step === 6 ? t("appsEmail.close") : t("appsEmail.cancel")}
        </Button>
      </header>
      <ChatSetupNavigation
        labels={labels}
        step={current}
        availableStep={current}
        disabled={connect.isPending || setup.isPending || step === 2 || step === 6}
        onSelect={(index) => setStep(step < 3 ? index : index + 3)}
      />
      {step === 0 && (
        <AccessStep
          companyId={companyId}
          authKind="api_key"
          grantKinds={["user", "organization"]}
          grantKind={grantKind}
          setGrantKind={setGrantKind}
          installChoice={agentAccess}
          setInstallChoice={setAgentAccess}
          installAgentIds={agentIds}
          setInstallAgentIds={setAgentIds}
          onBack={() => navigate("/apps")}
          onContinue={() => setStep(1)}
          submitLabel={t("appsEmail.continue")}
        />
      )}
      {step === 1 && (
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            connect.mutate();
          }}
        >
          <section className="space-y-4 rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold">
              {t("appsEmail.addYourAgentMailAPIKey")}
            </h2>
            <Label htmlFor="email-api-key">{t("appsEmail.aPIKey")}</Label>
            <Input
              id="email-api-key"
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={t("appsEmail.pasteYourAgentMailAPIKey")}
            />
            <a
              href="https://console.agentmail.to"
              target="_blank"
              rel="noreferrer"
              className="text-sm underline"
            >
              {t("appsEmail.getAKeyInAgentMail")}
            </a>
          </section>
          <div className="flex justify-between">
            <Button type="button" variant="ghost" onClick={() => setStep(0)}>
              {t("appsEmail.back")}
            </Button>
            <Button disabled={!apiKey.trim() || connect.isPending}>
              {connect.isPending ? t("appsEmail.connecting") : t("appsEmail.connectAgentMail")}
            </Button>
          </div>
        </form>
      )}
      {step === 2 && (
        <section className="space-y-5 rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold">{t("appsEmail.agentMailIsConnected")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("appsEmail.nextGiveAnAgentAnEmailAddressFromPermissions")}
          </p>
          <div className="flex justify-end">
            <Button
              onClick={() => navigate(`/apps/${connectionId}/permissions`)}
            >
              {t("appsEmail.openPermissions")} <ArrowRight className="size-4" />
            </Button>
          </div>
        </section>
      )}
      {step === 3 && (
        <>
          <section className="space-y-4 rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold">
              {t("appsEmail.whoShouldHandleThisInbox")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("appsEmail.incomingEmailWillCreateTasksAssignedToThisAgent")}
            </p>
            <Label>{t("appsEmail.agent")}</Label>
            <SearchableSelect
              value={agentId}
              placeholder={t("appsEmail.chooseAnAgent")}
              searchPlaceholder={t("appsEmail.searchAllAgents")}
              emptyMessage={t("appsEmail.noAgentsFound")}
              groups={[
                {
                  id: "agents",
                  options: (agents.data ?? [])
                    .filter(
                      (a) =>
                        !["terminated", "pending_approval"].includes(a.status),
                    )
                    .map((a) => ({
                      key: a.id,
                      value: a.id,
                      label: a.name,
                      icon: a.icon,
                    })),
                },
              ]}
              onValueChange={(id, option) => {
                setAgentId(id);
                setUsername(
                  option.label
                    .toLowerCase()
                    .replace(/[^a-z0-9._-]+/g, "-")
                    .slice(0, 64),
                );
              }}
              renderValue={(option) =>
                option && (
                  <span className="flex items-center gap-2">
                    <Avatar size="sm">
                      <AvatarFallback>
                        <AgentIcon icon={String(option.icon ?? "bot")} />
                      </AvatarFallback>
                    </Avatar>
                    {option.label}
                  </span>
                )
              }
            />
            <p className="text-xs text-muted-foreground">
              {t("appsEmail.activatingThisInboxAlsoAddsTheAgentToThis")}
            </p>
          </section>
          {trustNotice}
        </>
      )}
      {step === 4 && (
        <>
          <section className="space-y-5 rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold">
              {t("appsEmail.chooseAgentEmail", { agent: chosen?.name })}
            </h2>
            <RadioCardGroup
              ariaLabel={t("appsEmail.emailAddressSource")}
              value={addressMode}
              onValueChange={setAddressMode}
              options={[
                {
                  value: "new",
                  title: t("appsEmail.createANewAddress"),
                  disabled: scopedKey,
                },
                { value: "existing", title: t("appsEmail.useAnExistingInbox") },
              ]}
            />
            {addressMode === "new" ? (
              <div className="space-y-2">
                <Label htmlFor="email-name">{t("appsEmail.emailAddress")}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="email-name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  />
                  <span className="text-sm text-muted-foreground">
                    @{domain}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="email-existing">{t("appsEmail.availableInbox")}</Label>
                <select
                  id="email-existing"
                  className={selectClass}
                  value={inboxId}
                  onChange={(e) => setInboxId(e.target.value)}
                >
                  <option value="">{t("appsEmail.chooseAnInbox")}</option>
                  {inspected.data?.inboxes.map((i) => (
                    <option
                      key={i.inbox_id}
                      disabled={inboxes.data?.some(
                        (e) =>
                          e.address === i.inbox_id && e.status !== "archived",
                      )}
                      value={i.inbox_id}
                    >
                      {i.inbox_id}
                      {inboxes.data?.some((e) => e.address === i.inbox_id)
                        ? t("appsEmail.alreadyAssigned")
                        : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <details className="border-t border-border pt-4">
              <summary className="cursor-pointer text-sm text-muted-foreground">
                {t("appsEmail.advancedOptions")}
              </summary>
              <div className="space-y-4 pt-4">
                {addressMode === "new" && (
                  <>
                    <Label htmlFor="email-domain">{t("appsEmail.domain")}</Label>
                    <select
                      id="email-domain"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className={selectClass}
                    >
                      <option>agentmail.to</option>
                      {inspected.data?.domains
                        .filter((d) => d.status === "VERIFIED")
                        .map((d) => (
                          <option key={d.domain_id}>{d.domain}</option>
                        ))}
                    </select>
                    <a
                      className="text-sm underline"
                      href="https://docs.agentmail.to/custom-domains"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t("appsEmail.setUpACustomDomainInAgentMail")}
                    </a>
                  </>
                )}
                <Label htmlFor="email-mode">{t("appsEmail.receiving")}</Label>
                <select
                  id="email-mode"
                  value={mode}
                  onChange={(e) => setMode(e.target.value as typeof mode)}
                  className={selectClass}
                >
                  <option value="websocket">
                    {t("appsEmail.liveConnectionWorksLocally")}
                  </option>
                  <option value="webhook">
                    {t("appsEmail.webhookRequiresPublicHTTPS")}
                  </option>
                </select>
              </div>
            </details>
          </section>
          <EmailSafetyNotice />
        </>
      )}
      {step === 5 && (
        <>
          <EmailSafetyNotice />
          {trustNotice}
          <section className="space-y-4 rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold">
              {t("appsEmail.readyToStartReceivingEmail")}
            </h2>
            <p className="text-lg font-semibold">{address}</p>
            <p className="text-sm">
              {t("appsEmail.assignedToAgent", { agent: chosen?.name })} ·{" "}
              {mode === "websocket" ? t("appsEmail.liveConnection") : t("appsEmail.signedWebhook")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("appsEmail.newConversationsCreateTasksRepliesStayInTheSame")}
            </p>
          </section>
        </>
      )}
      {step === 6 && (
        <section className="space-y-5 rounded-xl border border-border p-6">
          <p className="flex items-center gap-2 text-sm">
            <Check className="size-4" />
            {t("appsEmail.receivingForAgent", { agent: chosen?.name })}
          </p>
          <p className="text-lg font-semibold">{setup.data?.address}</p>
          <EmailSafetyNotice />
          <Button onClick={() => navigate(`/apps/${connectionId}/permissions`)}>
            {t("appsEmail.backToPermissions")}
          </Button>
        </section>
      )}
      {step >= 3 && step <= 5 && (
        <div className="flex justify-between border-t border-border pt-5">
          <Button
            variant="ghost"
            onClick={() =>
              step === 3
                ? navigate(`/apps/${connectionId}/permissions`)
                : setStep(step - 1)
            }
          >
            <ArrowLeft className="size-4" />
            {t("appsEmail.back")}
          </Button>
          <Button
            disabled={
              !chosen ||
              (lowTrust && !scoped) ||
              (step >= 4 &&
                (!inspected.data ||
                  (addressMode === "existing"
                    ? !inboxId
                    : !/^[a-z0-9][a-z0-9._-]*$/.test(username)))) ||
              setup.isPending
            }
            onClick={() => (step === 5 ? setup.mutate() : setStep(step + 1))}
          >
            {setup.isPending
              ? t("appsEmail.activating")
              : step === 5
                ? addressMode === "new"
                  ? t("appsEmail.createEmailAddress")
                  : t("appsEmail.connectEmailAddress")
                : step === 4
                  ? t("appsEmail.reviewEmailAddress")
                  : t("appsEmail.continue")}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      )}
      <Dialog open={trustOpen} onOpenChange={setTrustOpen}>
        <DialogContent className="max-h-screen overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("appsEmail.agentTrustSettings", { agent: chosen?.name })}</DialogTitle>
            <DialogDescription>
              {t("appsEmail.changesApplyToAllOfThisAgentsWorkUse")}
            </DialogDescription>
          </DialogHeader>
          <TrustPresetSection
            permissions={permissions}
            onChange={setPermissions}
            companyId={companyId}
            projectCandidates={(projects.data ?? []).map((p) => ({
              id: p.id,
              label: p.name,
            }))}
            issueCandidates={(boundaryIssues.data ?? []).map((issue) => ({
              id: issue.id,
              label: `${issue.identifier} · ${issue.title}`,
            }))}
            allowSingleIssue={false}
            candidatesLoading={projects.isPending || boundaryIssues.isPending}
          />
          <p className="text-xs text-muted-foreground">
            {t("appsEmail.lowTrustLimitsPaperclipAccessItDoesNotSandbox")}
          </p>
          {(trust.error || projects.error || boundaryIssues.error) && (
            <p role="alert" className="text-sm text-destructive">
              {(trust.error ?? projects.error ?? boundaryIssues.error)?.message}
            </p>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTrustOpen(false)}>
              {t("appsEmail.cancel")}
            </Button>
            <Button
              disabled={
                trust.isPending ||
                agentDetail.isPending ||
                !!agentDetail.error ||
                (getTrustPreset(permissions) === "low_trust_review" &&
                  !lowTrustBoundaryHasScope(getLowTrustBoundary(permissions)))
              }
              onClick={() => trust.mutate()}
            >
              {t("appsEmail.saveTrustSettings")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function EmailConnectionInboxes({
  companyId,
  connectionId,
  canConfigure,
}: {
  companyId: string;
  connectionId: string;
  canConfigure: boolean;
}) {
  const { t } = useTranslation();
  const query = useQuery({
    queryKey: ["email-inboxes", companyId],
    queryFn: () => emailApi.list(companyId),
    refetchInterval: 10_000,
  });
  const connections = useQuery({
    queryKey: queryKeys.tools.connections(companyId),
    queryFn: () => toolsApi.listConnections(companyId),
  });
  const children = new Set(
    connections.data?.connections
      .filter((c) => c.config?.credentialConnectionId === connectionId)
      .map((c) => c.id),
  );
  const inboxes =
    query.data?.filter(
      (i) => i.connectionId === connectionId || children.has(i.connectionId),
    ) ?? [];
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border p-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">
            {t("appsEmail.giveAnAgentAnEmailAddress")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("appsEmail.eachEmailConversationBecomesATask")}
          </p>
        </div>
        {canConfigure && (
          <Button asChild size="lg">
            <Link
              to={`/apps/chat/connect?provider=agentmail&connectionId=${connectionId}`}
            >
              {t("appsEmail.giveAnAgentAnEmailAddress")}
            </Link>
          </Button>
        )}
      </div>
      {inboxes.map((i) => (
        <div
          key={i.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4"
        >
          <Link
            className="text-sm underline"
            to={`/apps/chat/${i.id}/settings`}
          >
            {i.address}
          </Link>
          <span className="text-xs text-muted-foreground">
            {i.lastError ??
              (EMAIL_STATUS_KEYS[i.status] ? t(EMAIL_STATUS_KEYS[i.status]) : i.status)}
          </span>
        </div>
      ))}
      {!!inboxes.length && <EmailSafetyNotice />}
      {query.error && (
        <p role="alert" className="text-sm text-destructive">
          {query.error.message}
        </p>
      )}
    </section>
  );
}
export function EmailEndpointSettings({
  endpointId,
  companyId,
}: {
  endpointId: string;
  companyId: string;
}) {
  const { t } = useTranslation();
  const cache = useQueryClient();
  const query = useQuery({
    queryKey: ["email-inboxes", companyId],
    queryFn: () => emailApi.list(companyId),
    refetchInterval: 10_000,
  });
  const inbox = query.data?.find(
    (row: EmailEndpointSummary) => row.id === endpointId,
  );
  const [removed, setRemoved] = useState(false);
  const [replacementKey, setReplacementKey] = useState("");
  const [receiveMode, setReceiveMode] = useState<"websocket" | "webhook" | "">(
    "",
  );
  const reconnect = useMutation({
    mutationFn: () =>
      emailApi.reconnect(
        endpointId,
        replacementKey,
        receiveMode || inbox!.receiveMode,
      ),
    onSuccess: () => {
      setReplacementKey("");
    },
    onSettled: () => {
      void cache.invalidateQueries({ queryKey: ["email-inboxes", companyId] });
    },
  });
  const control = useMutation({
    mutationFn: (action: "pause" | "resume" | "remove") =>
      emailApi.control(endpointId, action),
    onSuccess: (result) => {
      setRemoved(result.status === "archived");
      void cache.invalidateQueries({ queryKey: ["email-inboxes", companyId] });
    },
  });
  if (removed)
    return <p>{t("appsEmail.inboxDisconnectedEmailHistoryRemainsInItsTasks")}</p>;
  if (!inbox)
    return (
      <p role={query.error ? "alert" : undefined}>
        {query.error?.message ?? t("appsEmail.loadingEmailInbox")}
      </p>
    );
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-xl font-bold">{inbox.address}</h1>
      <p className="text-sm text-muted-foreground">
        {EMAIL_STATUS_KEYS[inbox.status] ? t(EMAIL_STATUS_KEYS[inbox.status]) : inbox.status} ·{" "}
        {inbox.receiveMode === "websocket" ? t("appsEmail.liveConnection") : t("appsEmail.webhook")}
      </p>
      <p className="text-sm text-muted-foreground">
        {t("appsEmail.lastMailCheck", { time: inbox.lastSyncAt ? new Date(inbox.lastSyncAt).toLocaleString(i18n.language) : t("appsEmail.notCheckedYet") })}
      </p>
      <p className="text-sm">
        {t("appsEmail.eachEmailConversationIsATaskTaskCommentsStay")}
      </p>
      {inbox.lastError && (
        <p role="alert" className="text-sm text-destructive">
          {inbox.lastError}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          variant="outline"
          disabled={control.isPending}
          onClick={() =>
            control.mutate(inbox.status === "active" ? "pause" : "resume")
          }
        >
          {inbox.status === "active" ? t("appsEmail.pause") : t("appsEmail.resume")}
        </Button>
        <Button
          variant="outline"
          disabled={control.isPending}
          onClick={() => control.mutate("remove")}
        >
          {t("appsEmail.disconnectInbox")}
        </Button>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email-reconnect-key">
          {t("appsEmail.reconnectThisInboxWithANewAPIKey")}
        </Label>
        <Input
          id="email-reconnect-key"
          type="password"
          autoComplete="off"
          value={replacementKey}
          onChange={(e) => setReplacementKey(e.target.value)}
        />
        <Label htmlFor="email-reconnect-mode">{t("appsEmail.receivingMode")}</Label>
        <select
          id="email-reconnect-mode"
          className={selectClass}
          value={receiveMode || inbox.receiveMode}
          onChange={(e) =>
            setReceiveMode(e.target.value as "websocket" | "webhook")
          }
        >
          <option value="websocket">{t("appsEmail.liveConnection")}</option>
          <option value="webhook">{t("appsEmail.webhook")}</option>
        </select>
        <Button
          variant="outline"
          disabled={!replacementKey || reconnect.isPending}
          onClick={() => reconnect.mutate()}
        >
          {t("appsEmail.reconnectInbox")}
        </Button>
      </div>
      {reconnect.error && (
        <p role="alert" className="text-sm text-destructive">
          {reconnect.error.message}
        </p>
      )}
      {control.error && (
        <p role="alert" className="text-sm text-destructive">
          {control.error.message}
        </p>
      )}
    </div>
  );
}
