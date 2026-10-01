import { useTranslation } from "@/i18n";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import type { ChatEndpointSetupState } from "@paperclipai/shared";
import { agentsApi } from "@/api/agents";
import {
  chatEndpointsApi,
  type ChatEndpoint,
  type ChatEndpointResource,
} from "@/api/chatEndpoints";
import {
  githubChatApi,
  type GitHubConfigurationRecord,
  type GitHubIdentity,
  type GitHubVerification,
} from "@/api/githubChat";
import { AgentSelect } from "@/components/AgentMultiSelect";
import { GitHubAgentTrustWarning } from "@/components/GitHubAgentTrustWarning";
import { GitHubSetupPrompt } from "./GitHubSetupPrompt";
import {
  SetupWizardNavigation,
  SetupWizardFooter,
} from "@/components/SetupWizard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/context/ToastContext";
import { useCompany } from "@/context/CompanyContext";
import { useBreadcrumbs } from "@/context/BreadcrumbContext";
import { useNavigate, useSearchParams, Link } from "@/lib/router";
import { copyTextToClipboard } from "@/lib/clipboard";
import {
  GitHubAccessEditor,
  GitHubPolicyEditor,
  GitHubToggle,
  githubSelectClass,
} from "./GitHubBotConfiguration";

const steps = [
  "appsGithubSetup.chooseAgent",
  "appsGithubSetup.connectApp",
  "appsGithubSetup.installApp",
  "appsGithubSetup.selectRepos",
  "appsGithubSetup.verifyTools",
  "appsGithubSetup.connectAccount",
  "appsGithubSetup.configure",
  "appsGithubSetup.tryIt",
];
const stages: NonNullable<ChatEndpointSetupState["github"]>["stage"][] = [
  "connect",
  "connect",
  "install",
  "repositories",
  "verify",
  "identity",
  "behavior",
  "test",
];
export function GitHubChatSetup() {
  const { t, i18n } = useTranslation();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [secretCopy, setSecretCopy] = useState<"idle" | "copied" | "failed">("idle");
  const identityOnly = params.get("stage") === "identity";
  const reconnecting = params.get("reconnect") === "1";
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const [endpoint, setEndpoint] = useState<ChatEndpoint | null>(null);
  const [agentId, setAgentId] = useState(params.get("agentId") ?? "");
  const [step, setStep] = useState(0);
  const [availableStep, setAvailableStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("Paperclip Review");
  const [existing, setExisting] = useState(reconnecting);
  const [credentials, setCredentials] = useState({
    appId: "",
    privateKey: "",
    webhookSecret: "",
  });
  const [registration, setRegistration] = useState<Awaited<
    ReturnType<typeof githubChatApi.registration>
  > | null>(null);
  const [resources, setResources] = useState<ChatEndpointResource[]>([]);
  const [record, setRecord] = useState<GitHubConfigurationRecord | null>(null);
  const [verification, setVerification] = useState<GitHubVerification | null>(
    null,
  );
  const [personalConnectionId, setPersonalConnectionId] = useState("");
  const [identity, setIdentity] = useState<GitHubIdentity | null>(null);
  const [copied, setCopied] = useState(false);
  const resume = params.get("resume");
  const agents = useQuery({
    queryKey: ["github-setup-agents", selectedCompanyId],
    queryFn: () => agentsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId && !identityOnly,
  });
  const current = useQuery({
    queryKey: ["github-setup", resume],
    queryFn: () => chatEndpointsApi.get(resume!),
    enabled: !!resume,
    refetchInterval: 3000,
    refetchIntervalInBackground: false,
  });
  const accounts = useQuery({
    queryKey: ["github-personal-connections", endpoint?.id],
    queryFn: () => githubChatApi.personalConnections(endpoint!.id),
    enabled: !!endpoint && step === 5,
  });
  const test = useQuery({
    queryKey: ["github-test-status", endpoint?.id],
    queryFn: () => chatEndpointsApi.setupTestStatus(endpoint!.id),
    enabled: !!endpoint && step === 7,
    refetchInterval: 3000,
  });
  const selectedAgent = agents.data?.find((agent) => agent.id === agentId);
  useEffect(() => {
    setBreadcrumbs([
      { label: t("appsGithubSetup.connectors"), href: "/apps" },
      { label: t("appsGithubSetup.connectBot") },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, t]);
  useEffect(() => {
    if (!current.data) return;
    setEndpoint(current.data);
    setAgentId(current.data.assignedAgentId);
    if (availableStep === 0) {
      const next = identityOnly
        ? 5
        : reconnecting
          ? 1
          : current.data.setup?.github?.stage
            ? Math.max(1, stages.indexOf(current.data.setup.github.stage))
            : current.data.status === "active"
              ? 6
              : 1;
      setStep(next);
      setAvailableStep(next);
      if (identityOnly) return;
      void Promise.all([
        chatEndpointsApi.listResources(current.data.id),
        githubChatApi.configuration(current.data.id),
      ])
        .then(([resources, config]) => {
          setResources(resources);
          setRecord(config);
        })
        .catch((error) =>
          setError(
            error instanceof Error ? error.message : "appsGithubSetup.resumeError",
          ),
        );
    }
  }, [current.data, availableStep, params]);
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "appsGithubSetup.saveError",
      );
    } finally {
      setBusy(false);
    }
  }
  async function go(next: number, bot = endpoint) {
    if (bot && next > 0)
      setEndpoint(await githubChatApi.progress(bot.id, stages[next]!));
    setStep(next);
    setAvailableStep((value) => Math.max(value, next));
  }
  async function saveConfiguration() {
    if (!endpoint || !record) return;
    const saved = await githubChatApi.save(
      endpoint.id,
      record.revision,
      record.configuration,
    );
    setRecord(saved);
  }
  const exit = () =>
    void run(async () => {
      if (step === 6) await saveConfiguration();
      if (endpoint && step > 0 && !identityOnly)
        await githubChatApi.progress(endpoint.id, stages[step]!);
      navigate("/apps");
    });
  const footer = (
    label: string,
    action: () => Promise<void>,
    disabled = false,
    extra?: React.ReactNode,
  ) => (
    <SetupWizardFooter onSaveExit={exit}>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {step > 0 && !identityOnly && (
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => setStep(step - 1)}
          >
            {t("appsGithubSetup.back")}
          </Button>
        )}
        {extra}
        <Button disabled={busy || disabled} onClick={() => void run(action)}>
          {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
          {label}
        </Button>
      </div>
    </SetupWizardFooter>
  );
  const publicHttps = !!endpoint?.setup?.webhookUrl?.startsWith("https://");
  const mention = `@${endpoint?.botUsername?.replace(/\[bot\]$/, "") ?? "your-bot"} review this pull request`;
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6">
      <SetupWizardNavigation
        labels={identityOnly ? [t("appsGithubSetup.connectAccount")] : steps.map((label) => t(label))}
        step={identityOnly ? 0 : step}
        availableStep={identityOnly ? 0 : availableStep}
        onSelect={identityOnly ? () => {} : setStep}
        disabled={busy}
        takeover
      />
      <div>
        <p className="text-xs text-muted-foreground">
          {identityOnly
            ? t("appsGithubSetup.accountLinking")
            : t("appsGithubSetup.step", { step: step + 1, total: steps.length })}
        </p>
        <h1 className="mt-2 text-2xl font-semibold">{t(steps[step])}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("appsGithubSetup.taskDescription")}
        </p>
      </div>
      {(error || current.error || agents.error) && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm"
        >
          {error ? (error.startsWith("appsGithubSetup.") ? t(error) : error) : t("appsGithubSetup.loadError")}
        </p>
      )}
      {step === 0 && (
        <>
          <GitHubSetupPrompt />
          <p className="text-sm">
            {t("appsGithubSetup.assignment")}
          </p>
          {endpoint ? (
            <Input
              aria-label={t("appsGithubSetup.assigned")}
              value={
                endpoint.assignedAgentName ?? selectedAgent?.name ?? agentId
              }
              readOnly
            />
          ) : (
            <AgentSelect
              agents={(agents.data ?? []).filter(
                (agent) => !["terminated", "archived"].includes(agent.status),
              )}
              value={agentId}
              onChange={setAgentId}
              placeholder={t("appsGithubSetup.choose")}
              emptyMessage={t("appsGithubSetup.noAgents")}
            />
          )}
          <GitHubAgentTrustWarning agent={selectedAgent} />
          {footer(
            t("appsGithubSetup.continue"),
            async () => {
              const bot =
                endpoint ??
                (await chatEndpointsApi.create(selectedCompanyId!, {
                  provider: "github",
                  assignedAgentId: agentId,
                }));
              setEndpoint(bot);
              setParams(
                { provider: "github", resume: bot.id },
                { replace: true },
              );
              setRecord(await githubChatApi.configuration(bot.id));
              await go(1, bot);
            },
            !agentId || !selectedCompanyId,
          )}
        </>
      )}
      {step === 1 && endpoint && (
        <>
          {!publicHttps && (
            <div
              role="alert"
              className="rounded-lg border border-(--status-task-todo)/30 bg-(--status-task-todo)/10 p-4 text-sm"
            >
              {t("appsGithubSetup.https")} {" "}
              <a className="underline" href="https://docs.paperclip.ing/reference/deploy/https/" target="_blank" rel="noreferrer">{t("appsGithubSetup.httpsHelp")}</a>
            </div>
          )}
          <p className="text-sm">
            {t("appsGithubSetup.dedicated", { agent: selectedAgent?.name ?? endpoint.assignedAgentName })}
          </p>
          {reconnecting && (
            <p className="text-sm text-muted-foreground">
              {t("appsGithubSetup.reconnectDescription")}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              variant={!existing ? "default" : "outline"}
              onClick={() => setExisting(false)}
            >
              {t("appsGithubSetup.createApp")}
            </Button>
            <Button
              variant={existing ? "default" : "outline"}
              onClick={() => setExisting(true)}
            >
              {t("appsGithubSetup.existingApp")}
            </Button>
          </div>
          {existing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="github-app-id">{t("appsGithubSetup.appId")}</Label>
                <Input
                  id="github-app-id"
                  value={credentials.appId}
                  onChange={(e) =>
                    setCredentials({ ...credentials, appId: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {t("appsGithubSetup.findId")}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="github-private-key">{t("appsGithubSetup.privateKey")}</Label>
                <Textarea
                  id="github-private-key"
                  autoComplete="off"
                  value={credentials.privateKey}
                  onChange={(e) =>
                    setCredentials({
                      ...credentials,
                      privateKey: e.target.value,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {t("appsGithubSetup.pem")}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="github-webhook-secret">{t("appsGithubSetup.secret")}</Label>
                <Input
                  id="github-webhook-secret"
                  type="password"
                  autoComplete="off"
                  value={credentials.webhookSecret}
                  onChange={(e) =>
                    setCredentials({
                      ...credentials,
                      webhookSecret: e.target.value,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {t("appsGithubSetup.sameSecret")}
                </p>
                {!reconnecting && <div className="flex flex-wrap gap-2">
                  <Button variant="outline" disabled={busy} onClick={() => void run(async () => {
                    const generated = await chatEndpointsApi.generateSetupSecret(endpoint.id);
                    setCredentials(current => ({ ...current, webhookSecret: generated.webhookSecret }));
                    setSecretCopy("idle");
                  })}>{t("appsGithubSetup.generateSecret")}</Button>
                  {credentials.webhookSecret && <Button variant="outline" onClick={async () => {
                    try { await copyTextToClipboard(credentials.webhookSecret); setSecretCopy("copied"); }
                    catch { setSecretCopy("failed"); pushToast({ title: t("appsGithubSetup.copyFailed"), body: t("appsGithubSetup.copyManually"), tone: "error" }); }
                  }}>{secretCopy === "copied" ? t("appsGithubSetup.secretCopied") : secretCopy === "failed" ? t("appsGithubSetup.copySelect") : t("appsGithubSetup.copySecret")}</Button>}
                </div>}

              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Label htmlFor="github-app-name">{t("appsGithubSetup.appName")}</Label>
              <Input
                id="github-app-name"
                maxLength={34}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setRegistration(null);
                }}
              />
              <p className="text-xs text-muted-foreground">
                {t("appsGithubSetup.uniqueName")}
              </p>
              {registration && (
                <form
                  action={registration.registrationUrl}
                  method="POST"
                >
                  <input
                    type="hidden"
                    name="manifest"
                    value={JSON.stringify(registration.manifest)}
                  />
                  <Button type="submit">
                    {t("appsGithubSetup.createOnGithub")}
                    <ExternalLink className="ml-2 size-4" />
                  </Button>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t("appsGithubSetup.expires", { time: new Date(registration.expiresAt).toLocaleTimeString(i18n.language) })}
                  </p>
                </form>
              )}
            </div>
          )}
          <details className="rounded-lg border border-border p-4">
            <summary className="cursor-pointer text-sm">
              {t("appsGithubSetup.permissions")}
            </summary>
            <p className="mt-3 text-sm">
              {t("appsGithubSetup.permissionDetails")}
            </p>
            <p className="mt-2 break-all text-xs">
              {endpoint.setup?.webhookUrl ?? t("appsGithubSetup.webhookUnavailable")}
            </p>
            {endpoint.setup?.webhookUrl && <Button variant="outline" size="sm" className="mt-2" onClick={() => void run(async () => { await copyTextToClipboard(endpoint.setup!.webhookUrl!); pushToast({ title: t("appsGithubSetup.urlCopied"), tone: "success" }); })}>{t("appsGithubSetup.copyUrl")}</Button>}
            {registration && (
              <pre className="mt-3 overflow-auto text-xs">
                {JSON.stringify(registration.manifest, null, 2)}
              </pre>
            )}
          </details>
          {footer(
            reconnecting
              ? t("appsGithubSetup.reconnect")
              : endpoint.setup?.github?.appSlug
                ? t("appsGithubSetup.continueInstallation")
                : existing
                  ? t("appsGithubSetup.connect")
                  : t("appsGithubSetup.prepare"),
            async () => {
              if (reconnecting) {
                const saved = await chatEndpointsApi.setup(endpoint.id, {
                  action: "reconnect",
                  ...(credentials.privateKey
                    ? {
                        credentials: {
                          appId: credentials.appId || endpoint.botExternalId!,
                          privateKey: credentials.privateKey,
                        },
                      }
                    : {}),
                });
                setEndpoint(saved);
                setCredentials({
                  appId: "",
                  privateKey: "",
                  webhookSecret: "",
                });
                await go(4, saved);
              } else if (endpoint.setup?.github?.appSlug) await go(2);
              else if (existing) {
                const saved = await githubChatApi.connectApp(
                  endpoint.id,
                  credentials,
                );
                setEndpoint(saved);
                setCredentials({
                  appId: "",
                  privateKey: "",
                  webhookSecret: "",
                });
                await go(2, saved);
              } else
                setRegistration(
                  await githubChatApi.registration(endpoint.id, name),
                );
            },
            !publicHttps ||
              (existing &&
                !reconnecting &&
                (!credentials.appId ||
                  !credentials.privateKey ||
                  !credentials.webhookSecret) &&
                !endpoint.setup?.github?.appSlug),
          )}
        </>
      )}
      {step === 2 && endpoint && (
        <>
          <p className="text-sm">
            {t("appsGithubSetup.installDescription")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("appsGithubSetup.subset")}
          </p>
          {endpoint.setup?.github?.installationUrl && (
            <Button asChild>
              <a
                href={endpoint.setup.github.installationUrl}
                target="_blank"
                rel="noreferrer"
              >
                {t("appsGithubSetup.installGithub")}
                <ExternalLink className="ml-2 size-4" />
              </a>
            </Button>
          )}
          {footer(t("appsGithubSetup.installed"), async () => {
            setResources(await githubChatApi.refreshRepositories(endpoint.id));
            await go(3);
          })}
        </>
      )}
      {step === 3 && endpoint && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  setResources(
                    await githubChatApi.refreshRepositories(endpoint.id),
                  );
                  setEndpoint(await chatEndpointsApi.get(endpoint.id));
                })
              }
            >
              <RefreshCw className="mr-2 size-4" />
              {t("appsGithubSetup.refreshAccess")}
            </Button>
            <Button variant="outline" asChild>
              <a
                href={
                  endpoint.setup?.github?.managementUrl ??
                  "https://github.com/settings/installations"
                }
                target="_blank"
                rel="noreferrer"
              >
                {t("appsGithubSetup.configureAccess")}
                <ExternalLink className="ml-2 size-4" />
              </a>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("appsGithubSetup.repoList")}
          </p>
          <div className="divide-y divide-border rounded-lg border border-border">
            {resources.length === 0 && (
              <p className="p-4 text-sm">
                {t("appsGithubSetup.noRepos")}
              </p>
            )}
            {resources.map((resource) => (
              <div key={resource.id} className="p-4">
                <GitHubToggle
                  label={resource.label}
                  description={
                    resource.availability !== "available"
                      ? t("appsGithubSetup.accessUnavailable")
                      : t("appsGithubSetup.accessAvailable")
                  }
                  checked={
                    resource.enabled && resource.availability === "available"
                  }
                  onChange={(enabled) =>
                    setResources(
                      resources.map((row) =>
                        row.id === resource.id
                          ? {
                              ...row,
                              enabled:
                                enabled && row.availability === "available",
                            }
                          : row,
                      ),
                    )
                  }
                />
              </div>
            ))}
          </div>
          {footer(
            t("appsGithubSetup.saveRepos"),
            async () => {
              await chatEndpointsApi.updateResources(
                endpoint.id,
                resources.map((resource) => ({
                  id: resource.id,
                  enabled: resource.enabled,
                })),
              );
              await chatEndpointsApi.update(endpoint.id, {
                allowGroupChats: true,
              });
              const configured = await chatEndpointsApi.setup(endpoint.id, {
                action:
                  endpoint.status === "draft" || endpoint.status === "attention"
                    ? "configure"
                    : "reconnect",
              });
              setEndpoint(configured);
              await go(4, configured);
            },
            !resources.some(
              (resource) =>
                resource.enabled && resource.availability === "available",
            ),
          )}
        </>
      )}
      {step === 4 && endpoint && (
        <>
          <p className="text-sm">
            {t("appsGithubSetup.verifyDescription")}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={busy}
              onClick={() =>
                void run(async () =>
                  setVerification(await githubChatApi.verify(endpoint.id)),
                )
              }
            >
              {t("appsGithubSetup.verifyConnection")}
            </Button>
            <Button
              variant="outline"
              disabled={busy || !record}
              onClick={() =>
                void run(async () => {
                  if (!record) return;
                  setRecord(
                    await githubChatApi.save(endpoint.id, record.revision, {
                      ...record.configuration,
                      toolsEnabled: true,
                    }),
                  );
                  setVerification(await githubChatApi.verify(endpoint.id));
                })
              }
            >
              {t("appsGithubSetup.assignTools")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("appsGithubSetup.toolDescription")}
          </p>
          <div className="divide-y divide-border rounded-lg border border-border">
            {verification?.checks.map((check) => (
              <div key={check.key} className="flex gap-3 p-4">
                {check.ok ? (
                  <CheckCircle2 className="mt-1 size-4 shrink-0 text-(--status-task-done)" />
                ) : (
                  <XCircle className="mt-1 size-4 shrink-0 text-destructive" />
                )}
                <div>
                  <p className="text-sm font-medium">{check.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {check.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <GitHubAgentTrustWarning agent={selectedAgent} />
          {footer(t("appsGithubSetup.continue"), () => go(5), !verification?.ready)}
        </>
      )}
      {step === 5 && endpoint && (
        <>
          <p className="text-sm">
            {t("appsGithubSetup.personalDescription")}
          </p>
          <div className="space-y-2">
            <Label htmlFor="github-personal-account">
              {t("appsGithubSetup.yourConnection")}
            </Label>
            <select
              id="github-personal-account"
              className={githubSelectClass}
              value={personalConnectionId}
              onChange={(e) => {
                setPersonalConnectionId(e.target.value);
                setIdentity(null);
              }}
            >
              <option value="">{t("appsGithubSetup.chooseConnection")}</option>
              {accounts.data?.map((account) => (
                <option
                  key={account.connectionId}
                  value={account.connectionId}
                  disabled={!account.enabled || account.status !== "active"}
                >
                  {account.name}
                  {account.login ? ` · @${account.login}` : ""}
                  {account.status !== "active" ? t("appsGithubSetup.reconnectRequired") : ""}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              {t("appsGithubSetup.identityDescription")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={!personalConnectionId || busy}
              onClick={() =>
                void run(async () =>
                  setIdentity(
                    await githubChatApi.identity(
                      endpoint.id,
                      personalConnectionId,
                    ),
                  ),
                )
              }
            >
              {t("appsGithubSetup.verifyAccount")}
            </Button>
            <Button variant="ghost" onClick={() => void accounts.refetch()}>
              {t("appsGithubSetup.refreshConnections")}
            </Button>
            <Link className="self-center text-sm underline" to="/apps/connect?source=github">
              {t("appsGithubSetup.connectGithub")}
            </Link>
          </div>
          {accounts.error && (
            <p role="alert" className="text-sm text-destructive">
              {t("appsGithubSetup.personalLoadError")}
            </p>
          )}
          {identity && (
            <div className="rounded-lg border border-border p-4">
              <p className="font-medium">@{identity.login}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("appsGithubSetup.identity", { id: identity.githubUserId })}
              </p>
            </div>
          )}
          {footer(
            t("appsGithubSetup.confirmAccount"),
            async () => {
              await githubChatApi.identity(
                endpoint.id,
                personalConnectionId,
                identity!.githubUserId,
              );
              if (identityOnly) navigate("/apps");
              else await go(6);
            },
            !identity,
          )}
        </>
      )}
      {step === 6 && endpoint && record && (
        <>
          <GitHubAccessEditor
            endpointId={endpoint.id}
            companyId={endpoint.companyId}
            configuration={record.configuration}
            onChange={(configuration) =>
              setRecord({ ...record, configuration })
            }
          />
          <GitHubPolicyEditor
            policy={record.configuration.defaults}
            onChange={(defaults) =>
              setRecord({
                ...record,
                configuration: { ...record.configuration, defaults },
              })
            }
          />
          {footer(t("appsGithubSetup.saveBehavior"), async () => {
            await saveConfiguration();
            await go(7);
          })}
        </>
      )}
      {step === 7 && endpoint && (
        <>
          <p className="text-sm">
            {t("appsGithubSetup.testDescription", { agent: selectedAgent?.name ?? endpoint.assignedAgentName })}
          </p>
          <div className="flex items-center gap-3 rounded-lg border border-border p-4">
            <code className="min-w-0 flex-1 break-all text-sm">{mention}</code>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("appsGithubSetup.copyMention")}
              onClick={() =>
                void copyTextToClipboard(mention).then(() => setCopied(true))
              }
            >
              <Copy className="size-4" />
            </Button>
          </div>
          {copied && (
            <p role="status" className="text-xs text-muted-foreground">
              {t("appsGithubSetup.mentionCopied")}
            </p>
          )}
          <p role="status" className="text-sm">
            {test.data?.messageReceivedAt
              ? t("appsGithubSetup.received")
              : t("appsGithubSetup.waiting")}
          </p>
          <Link
            className="text-sm underline"
            to={`/apps/chat/${endpoint.id}/conversations`}
          >
            {t("appsGithubSetup.tasks")}
          </Link>
          {footer(
            t("appsGithubSetup.verifyFinish"),
            async () => {
              await chatEndpointsApi.test(endpoint.id);
              navigate(`/apps/chat/${endpoint.id}/settings`);
            },
            !test.data?.messageReceivedAt,
            <Button
              variant="outline"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await chatEndpointsApi.finishSlackSetup(endpoint.id);
                  navigate(`/apps/chat/${endpoint.id}/settings`);
                })
              }
            >
              {t("appsGithubSetup.finishWithout")}
            </Button>,
          )}
        </>
      )}
    </div>
  );
}
