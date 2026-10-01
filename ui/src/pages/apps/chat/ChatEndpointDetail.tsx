import { t, useTranslation } from "@/i18n";
import { SlackToolsSettings, SlackSearchAccess } from "./SlackToolSettings";
import { defaultSlackAppName } from "./slack-app-name";
import { ChatCommunicationInstructions } from "./ChatCommunicationInstructions";
import { SlackAvatarSettings } from "./SlackAvatarStep";
import { agentsApi } from "@/api/agents";
import { agentAvatarUrl } from "@/lib/agent-avatar-url";
import { resolveAgentAppearance } from "@paperclipai/shared";
import { GitHubBotManagement, GitHubReviews } from "./GitHubBotManagement";
import { EmailEndpointSettings } from "./EmailEndpointSetup";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  Check,
  Activity as ActivityIcon,
  Copy,
  ExternalLink,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Trash2,
  Unlink,
} from "lucide-react";
import {
  chatEndpointsApi,
  type ChatActivityItem,
  type ChatEndpoint,
  type ChatEndpointResource,
  type ChatProvider,
} from "@/api/chatEndpoints";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { AppLogo } from "../AppLogo";
import { StatusBadge } from "@/components/StatusBadge";
import { useBreadcrumbs } from "@/context/BreadcrumbContext";
import { useToast } from "@/context/ToastContext";
import { formatDateTime } from "@/lib/utils";
import { queryKeys } from "@/lib/queryKeys";
import { copyTextToClipboard } from "@/lib/clipboard";
import { Link, Navigate, useNavigate, useParams } from "@/lib/router";

const tabs = ["settings", "access", "reviews", "conversations", "activity"] as const;
type ChatTab = (typeof tabs)[number];
const tabItems = tabs.map((value) => ({
  value,
  label: `appsChatDetail.${value}`,
}));
const providerNames: Record<ChatProvider, string> = {
  agentmail: "AgentMail",
  slack: "Slack",
  github: "GitHub",
  discord: "Discord",
  "microsoft-teams": "Microsoft Teams",
  telegram: "Telegram",
  "imessage-photon": "iMessage Photon",
};

const providerLifecycleGuidance: Record<
  ChatProvider,
  { reconnect: string; remove: string }
> = {
  agentmail: { reconnect: "appsChatDetail.reconnectTheSameEmailInbox", remove: "appsChatDetail.disconnectEmailAndRetainTaskHistory" },
  slack: {
    reconnect:
      "appsChatDetail.reconnectVerifiesOrReplacesCredentialsForThisSameSlack",
    remove:
      "appsChatDetail.paperclipArchivesTheEndpointStopsNewIngressAndRetires",
  },
  github: {
    reconnect:
      "appsChatDetail.reconnectVerifiesThisSameAppAndInstallationThenUpdates",
    remove:
      "appsChatDetail.paperclipArchivesTheEndpointStopsNewIngressAndRetiresLabel",
  },
  discord: {
    reconnect:
      "appsChatDetail.reconnectVerifiesThisSameDiscordApplicationAndServerInstallation",
    remove:
      "appsChatDetail.paperclipArchivesTheEndpointStopsItsPaperclipGatewayConnection",
  },
  "microsoft-teams": {
    reconnect:
      "appsChatDetail.reconnectVerifiesThisSameMicrosoftAppTenantAndBot",
    remove:
      "appsChatDetail.paperclipArchivesTheEndpointStopsNewIngressAndRetiresLabelLabel",
  },
  "imessage-photon": {
    reconnect: "appsChatDetail.reconnectVerifiesTheSamePhotonProjectAndLineAllocation",
    remove: "appsChatDetail.disconnectArchivesThisChannelAndRemovesItsSavedSecret",
  },
  telegram: {
    reconnect:
      "appsChatDetail.reconnectVerifiesThisSameBotFatherBotAndAutomaticallyRefreshes",
    remove:
      "appsChatDetail.paperclipArchivesTheEndpointAndQueuesDurableRemovalOf",
  },
};

const activityKindLabels: Record<ChatActivityItem["kind"], string> = {
  delivery: "appsChatDetail.inboundDelivery",
  publication: "appsChatDetail.outboundPublication",
  action: "appsChatDetail.providerAction",
  health: "appsChatDetail.connectionHealth",
  repair: "appsChatDetail.connectionRepair",
};

const replayableFailureStates = new Set(["failed"]);
const fileTransferPhaseLabels: Record<string, string> = {
  consent_pending: "appsDetailStatus.consent_pending",
  consent_sending: "appsDetailStatus.consent_sending",
  consent_unknown: "appsDetailStatus.consent_unknown",
  awaiting_consent: "appsDetailStatus.awaiting_consent",
  upload_pending: "appsDetailStatus.upload_pending",
  uploading: "appsDetailStatus.uploading",
  upload_unknown: "appsDetailStatus.upload_unknown",
  file_info_pending: "appsDetailStatus.file_info_pending",
  file_info_sending: "appsDetailStatus.file_info_sending",
  file_info_unknown: "appsDetailStatus.file_info_unknown",
  delivered: "appsDetailStatus.delivered",
  declined: "appsDetailStatus.declined",
  expired: "appsDetailStatus.expired",
  cancelled: "appsDetailStatus.cancelled",
  conflict: "appsDetailStatus.conflict",
};
const resourceTypeLabels: Record<string, string> = {
  channel: "appsDetailStatus.channel",
  direct_message: "appsDetailStatus.direct_message",
  group_chat: "appsDetailStatus.group_chat",
  group: "appsDetailStatus.group",
  repository: "appsDetailStatus.repository",
};
// Provider callbacks do not necessarily emit a Board activity event. Refresh
// only mounted operational views, and stop polling when the browser is hidden.
const liveChatQueryOptions = {
  staleTime: 0,
  refetchInterval: 5_000,
  refetchIntervalInBackground: false,
} as const;

export function isReplayEligible(item: ChatActivityItem): boolean {
  if (
    item.fileTransfer ||
    !item.replayable ||
    !replayableFailureStates.has(item.status)
  ) {
    return false;
  }
  if (item.kind === "delivery") return item.status === "failed";
  return item.kind === "publication";
}

export function activityResolutionActions(item: ChatActivityItem) {
  const offered = item.resolutionActions ?? [];
  if (!item.fileTransfer) return offered;
  if (
    item.kind !== "publication" ||
    !Number.isSafeInteger(item.fileTransfer.version) ||
    item.fileTransfer.version < 1
  )
    return [];
  if (
    ![
      "consent_unknown",
      "upload_unknown",
      "file_info_unknown",
      "conflict",
    ].includes(item.fileTransfer.phase)
  )
    return [];
  // Only the file-info stage can use ordinary visible-delivery resolution.
  // Earlier consent/upload evidence must not be fabricated by these buttons.
  return item.fileTransfer.phase === "file_info_unknown"
    ? offered
    : offered.filter((action) => action === "cancel");
}

export function activityResolutionDescription(item: ChatActivityItem): string {
  const phase = item.fileTransfer?.phase;
  if (phase === "file_info_unknown")
    return t("appsChatDetail.theFileUploadWasConfirmedButItsTeamsNotification");
  if (phase === "consent_unknown")
    return t("appsChatDetail.theConsentCardMayHaveReachedTeamsFileDelivery");
  if (phase)
    return t("appsChatDetail.theFileMayAlreadyExistInOneDriveCancellingStops");
  return t("appsChatDetail.paperclipLostConfirmationAfterSendingCheckTheProviderConversation");
}

export function isResolutionEligible(item: ChatActivityItem): boolean {
  return (
    (item.kind === "publication" || item.kind === "action") &&
    item.status === "delivery_unknown" &&
    activityResolutionActions(item).length > 0
  );
}

export function isIndividuallyToggleableResource(
  provider: ChatProvider,
  resourceType: string,
): boolean {
  return !(
    provider === "microsoft-teams" &&
    (resourceType === "direct_message" || resourceType === "group_chat")
  );
}

function activityDetailLabel(item: ChatActivityItem): string {
  return replayableFailureStates.has(item.status) ? t("appsChatDetail.reason") : t("appsChatDetail.details");
}

export function connectionHealthPresentation(
  endpoint: Pick<ChatEndpoint, "status" | "healthMessage" | "lastError">,
) {
  // Health events outlive pause/removal. They are history, not lifecycle state.
  const lifecycleMessages = {
    draft: "appsChatDetail.connectionSetupIsIncomplete",
    verifying: "appsChatDetail.connectionVerificationIsInProgress",
    paused: "appsChatDetail.connectionIsPausedResumeItToReceiveNewMessages",
    attention: "appsChatDetail.connectionNeedsAttention",
    revoked: "appsChatDetail.connectionAccessIsRevokedReconnectToVerifyAccess",
    archived: "appsChatDetail.connectionHasBeenRemovedFromPaperclip",
  };
  const lifecycleMessage =
    endpoint.status === "active" ? null : lifecycleMessages[endpoint.status];
  return {
    message: lifecycleMessage ? t(lifecycleMessage) : endpoint.healthMessage ?? null,
    previousHealth: lifecycleMessage ? (endpoint.healthMessage ?? null) : null,
    error: endpoint.lastError ?? null,
    errorLabel: ["active", "attention", "revoked"].includes(endpoint.status)
      ? t("appsChatDetail.reason")
      : t("appsChatDetail.lastReportedError"),
  };
}

export function ChatEndpointDetail() {
  const { t } = useTranslation();
  const { endpointId = "", tab = "settings" } = useParams<{
    endpointId: string;
    tab?: string;
  }>();
  const activeTab = tabs.includes(tab as ChatTab) ? (tab as ChatTab) : null;
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbs();
  const endpointQuery = useQuery({
    queryKey: queryKeys.chatEndpoints.detail(endpointId),
    queryFn: () => chatEndpointsApi.get(endpointId),
    enabled: Boolean(endpointId && activeTab),
    ...liveChatQueryOptions,
    refetchInterval:
      activeTab === "activity" || activeTab === "conversations"
        ? liveChatQueryOptions.refetchInterval
        : false,
  });
  const endpoint = endpointQuery.data;
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!endpoint || !activeTab) return;
    setBreadcrumbs([
      { label: t("appsChatDetail.connectors"), href: "/apps" },
      {
        label: `${endpoint.assignedAgentName} · ${providerNames[endpoint.provider]}`,
        href: `/apps/chat/${endpoint.id}/settings`,
      },
      {
        label:
          t(tabItems.find((item) => item.value === activeTab)?.label ?? "appsChatDetail.settings"),
      },
    ]);
    return () => setBreadcrumbs([]);
  }, [activeTab, endpoint, setBreadcrumbs, t]);

  if (!activeTab)
    return <Navigate replace to={`/apps/chat/${endpointId}/settings`} />;
  if (endpointQuery.isLoading)
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t("appsChatDetail.loadingConnection")}
      </div>
    );
  if (endpointQuery.isError || !endpoint)
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">
          {t("appsChatDetail.thisChatConnectionCouldNotBeLoaded")}
        </p>
        <Button variant="outline" onClick={() => endpointQuery.refetch()}>
          {t("appsChatDetail.tryAgain")}
        </Button>
      </div>
    );
  if (endpoint.provider === "agentmail") return <EmailEndpointSettings endpointId={endpoint.id} companyId={endpoint.companyId} />;
  const setupIncomplete =
    endpoint.setup?.step !== "complete" &&
    ["draft", "verifying", "attention", "revoked"].includes(endpoint.status);

  return (
    <div className="max-w-5xl space-y-6 pb-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">
            {t("appsChatDetail.agentProvider", { agent: endpoint.assignedAgentName, provider: providerNames[endpoint.provider] })}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {endpoint.providerAccountLabel ?? t("appsChatDetail.chatConnection")}
          </p>
          {endpoint.provider === "imessage-photon" && endpoint.botExternalId && endpoint.photonAllocation !== "shared" && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span>{endpoint.botExternalId}</span>
              <Button variant="ghost" size="sm" aria-label={t("appsChatDetail.copyDedicatedNumber")} onClick={async () => {
                try { await copyTextToClipboard(endpoint.botExternalId!); setCopyStatus("appsChatDetail.numberCopied"); }
                catch { setCopyStatus("appsChatDetail.couldNotCopyTheNumberSelectAndCopyIt"); }
              }}><Copy className="size-4" />{t("appsChatDetail.copyNumber")}</Button>
              <span role="status" className="text-muted-foreground">{copyStatus ? t(copyStatus) : null}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {setupIncomplete ? (
            <Button
              variant="outline"
              onClick={() =>
                navigate(
                  `/apps/chat/connect?provider=${endpoint.provider}&purpose=chat&resume=${endpoint.id}`,
                )
              }
            >
              {t("appsChatDetail.continueSetup")}
            </Button>
          ) : null}
          {endpoint.status !== "active" && <StatusBadge status={endpoint.status} />}
        </div>
      </header>
      {activeTab === "settings" && (
        <>
{endpoint.provider === "github" && <GitHubBotManagement endpoint={endpoint} view="settings" />}
{endpoint.provider !== "github" && <Settings endpointId={endpoint.id} endpoint={endpoint} />}
</>
      )}
      {activeTab === "reviews" && endpoint.provider === "github" && <GitHubReviews endpointId={endpoint.id} />}
{activeTab === "access" && endpoint.provider === "github" && <GitHubBotManagement endpoint={endpoint} view="access" />}
{activeTab === "access" && endpoint.provider !== "github" && (
        <Access
          endpointId={endpoint.id}
          allowUnlinked={endpoint.allowUnlinkedPeople}
          endpoint={endpoint}
        />
      )}
      {activeTab === "conversations" && (
        <Conversations endpointId={endpoint.id} provider={endpoint.provider} />
      )}
      {activeTab === "activity" && (
        <Activity endpointId={endpoint.id} endpoint={endpoint} />
      )}
    </div>
  );
}

function Settings({
  endpointId,
  endpoint,
}: {
  endpointId: string;
  endpoint: Awaited<ReturnType<typeof chatEndpointsApi.get>>;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [messageCopied, setMessageCopied] = useState(false);
  const avatarAgent = useQuery({
    queryKey: queryKeys.agents.detail(endpoint.assignedAgentId),
    queryFn: () => agentsApi.get(endpoint.assignedAgentId, endpoint.companyId),
    enabled: endpoint.provider === "slack",
  });
  const mentionMessage = `@${(endpoint.botUsername ?? endpoint.botLabel ?? endpoint.assignedAgentName).replace(/^@/, "")} you there?`;
  const resourcesQuery = useQuery({
    queryKey: queryKeys.chatEndpoints.resources(endpointId),
    queryFn: () => chatEndpointsApi.listResources(endpointId),
  });
  const saveResources = useMutation({
    mutationFn: (resource: Pick<ChatEndpointResource, "id" | "enabled">) =>
      chatEndpointsApi.updateResources(endpointId, [resource]),
    onSuccess: (resources) =>
      queryClient.setQueryData(
        queryKeys.chatEndpoints.resources(endpointId),
        resources,
      ),
    onError: (error) =>
      pushToast({
        title: t("appsChatDetail.couldntUpdateDestination"),
        body: error instanceof Error ? error.message : t("appsChatDetail.tryAgainLabel"),
        tone: "error",
      }),
  });
  const updateEndpoint = useMutation({
    mutationFn: chatEndpointsApi.update.bind(null, endpointId),
    onSuccess: (next) =>
      queryClient.setQueryData(
        queryKeys.chatEndpoints.detail(endpointId),
        next,
      ),
    onError: (error) =>
      pushToast({
        title: t("appsChatDetail.couldntUpdateSettings"),
        body: error instanceof Error ? error.message : t("appsChatDetail.tryAgainLabel"),
        tone: "error",
      }),
  });
  const resources = resourcesQuery.data ?? [];
  const destinationResources = resources.filter((resource) =>
    isIndividuallyToggleableResource(endpoint.provider, resource.type),
  );
  const toggleResource = (resource: ChatEndpointResource, enabled: boolean) =>
    // A cached inventory must not overwrite another operator's unrelated edits.
    saveResources.mutate({ id: resource.id, enabled });
  return (
    <section className="max-w-3xl space-y-7">
      {endpoint.provider === "imessage-photon" && <p className="text-sm text-muted-foreground">{endpoint.photonAllocation === "shared" ? t("appsChatDetail.sharedPhotonProjectDirectMessagesOnlyEnrollSendersIn") : t("appsChatDetail.enableEachGroupIndividuallyAgentRepliesAreVisibleTo")}</p>}
      {endpoint.provider === "slack" && (
        <div className="space-y-2 text-sm">
          <h2 className="text-lg font-semibold">{t("appsChatDetail.chatInSlack")}</h2>
          <p>{t("appsChatDetail.inviteTheBotToAChannelThenMentionIt")}</p>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
            <code>{mentionMessage}</code>
            <Button size="icon" variant="ghost" aria-label={messageCopied ? t("appsChatDetail.messageCopied") : t("appsChatDetail.copyMessage")} onClick={() => {
              void copyTextToClipboard(mentionMessage).then(() => setMessageCopied(true), () => pushToast({ title: t("appsChatDetail.couldntCopyTheMessage"), body: t("appsChatDetail.selectAndCopyItManually"), tone: "error" }));
            }}>{messageCopied ? <Check className="size-4" /> : <Copy className="size-4" />}</Button>
          </div>
        </div>
      )}
      {endpoint.provider === "slack" && (
        avatarAgent.isPending ? <p role="status" className="text-sm text-muted-foreground">{t("appsChatDetail.loadingAgentAvatar")}</p>
          : avatarAgent.isError ? <p role="alert" className="text-sm text-destructive">{t("appsChatDetail.couldntLoadTheAgentsAvatar")} <button className="underline" onClick={() => void avatarAgent.refetch()}>{t("appsChatDetail.tryAgain")}</button></p>
          : <SlackAvatarSettings
              agentName={avatarAgent.data?.name ?? endpoint.assignedAgentName}
              appName={endpoint.setup?.slackApp?.appName ?? defaultSlackAppName(avatarAgent.data?.name ?? endpoint.assignedAgentName)}
              avatarUrl={agentAvatarUrl(resolveAgentAppearance(avatarAgent.data?.appearance, endpoint.assignedAgentId), 512, 1, "rest")}
            />
      )}
      {endpoint.provider === "slack" && <SlackToolsSettings companyId={endpoint.companyId} endpointId={endpointId} connectionId={endpoint.connectionId} />}
      {endpoint.provider === "slack" && <ChatCommunicationInstructions
        key={endpoint.id}
        value={endpoint.communicationInstructions ?? ""}
        onSave={async (communicationInstructions) => {
          const next = await chatEndpointsApi.update(endpointId, { communicationInstructions });
          queryClient.setQueryData(queryKeys.chatEndpoints.detail(endpointId), next);
        }}
      />}
      {endpoint.provider === "telegram" && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">{t("appsChatDetail.telegramGroupCommand")}</h2>
          <div className="rounded-lg border border-border p-3 text-sm">
            <code>
              /task@
              {endpoint.botUsername?.replace(/^@/, "") ?? "bot_username"}{" "}
              &lt;request&gt;
            </code>
            <p className="mt-2 text-muted-foreground">
              {t("appsChatDetail.telegramsDefaultPrivacyModeDoesNotDeliverOrdinaryMentions")}
            </p>
          </div>
        </div>
      )}
      <div>
        <h2 className="text-lg font-semibold">{t("appsChatDetail.whereThisAgentCanWork")}</h2>
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">{endpoint.provider === "slack" ? t("appsChatDetail.allowedChannels") : t("appsChatDetail.destinations")}</h3>
        {resourcesQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">{t("appsChatDetail.loadingDestinations")}</p>
        ) : destinationResources.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            {t("appsChatDetail.noProviderDestinationsHaveBeenDiscoveredYet")}
          </p>
        ) : (
          <div className="divide-y divide-border border-y border-border">
            {destinationResources.map((resource) => (
              <div key={resource.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {resource.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {resource.availability === "available"
                      ? (resource.detail ?? (resourceTypeLabels[resource.type] ? t(resourceTypeLabels[resource.type]) : resource.type))
                      : t("appsChatDetail.unavailableAtTheProvider")}
                  </p>
                  {resource.participants?.length ? <p className="mt-1 break-words text-xs text-muted-foreground">{t("appsChatDetail.participants")} {resource.participants.join(", ")}</p> : null}
                </div>
                <ToggleSwitch
                  aria-label={t("appsChatDetail.enableResource", { resource: resource.label })}
                  checked={resource.enabled}
                  disabled={
                    endpoint.photonAllocation === "shared" ||
                    resource.availability !== "available" ||
                    saveResources.isPending
                  }
                  onCheckedChange={(enabled) =>
                    toggleResource(resource, enabled)
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>
      {endpoint.provider !== "github" && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">{t("appsChatDetail.privateConversations")}</h3>
          <SettingToggle
            label={t("appsChatDetail.allowDirectMessages")}
            detail={
              endpoint.provider === "discord"
                ? t("appsChatDetail.peopleMustAlsoEnableDirectMessagesInTheirShared")
                : t("appsChatDetail.peopleCanStartOrContinueATaskInA")
            }
            checked={endpoint.allowDirectMessages ?? false}
            pending={updateEndpoint.isPending}
            onChange={(allowDirectMessages) =>
              updateEndpoint.mutate({ allowDirectMessages })
            }
          />
          {endpoint.provider === "microsoft-teams" && (
            <SettingToggle
              label={t("appsChatDetail.allowGroupChats")}
              detail={t("appsChatDetail.theBotMayParticipateInGroupChatsWhereIt")}
              checked={endpoint.allowGroupChats ?? false}
              pending={updateEndpoint.isPending}
              onChange={(allowGroupChats) =>
                updateEndpoint.mutate({ allowGroupChats })
              }
            />
          )}
        </div>
      )}
    </section>
  );
}

function SettingToggle({
  label,
  detail,
  checked,
  pending,
  onChange,
}: {
  label: string;
  detail: string;
  checked: boolean;
  pending: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 border-y border-border py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
      <ToggleSwitch
        aria-label={label}
        checked={checked}
        disabled={pending}
        onCheckedChange={onChange}
      />
    </div>
  );
}

function Access({
  endpointId,
  allowUnlinked,
  endpoint,
}: {
  endpointId: string;
  allowUnlinked: boolean;
  endpoint: ChatEndpoint;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [confirmationUrl, setConfirmationUrl] = useState<string | null>(null);
  const [joinCommandCopied, setJoinCommandCopied] = useState(false);
  const joinCommand = `${endpoint.setup?.slackApp?.command ?? endpoint.setup?.command ?? "/paperclip"} connect`;
  const linksQuery = useQuery({
    queryKey: queryKeys.chatEndpoints.principals(endpointId),
    queryFn: () => chatEndpointsApi.listPrincipals(endpointId),
  });
  const updatePolicy = useMutation({
    mutationFn: (value: boolean) =>
      chatEndpointsApi.update(endpointId, { allowUnlinkedPeople: value }),
    onSuccess: (next) =>
      queryClient.setQueryData(
        queryKeys.chatEndpoints.detail(endpointId),
        next,
      ),
    onError: (error) => pushToast({ title: t("appsChatDetail.couldntUpdateAccess"), body: error instanceof Error ? error.message : t("appsChatDetail.tryAgainLabel"), tone: "error" }),
  });
  const createIntent = useMutation({
    mutationFn: (principalId: string) =>
      chatEndpointsApi.createLinkIntent(endpointId, principalId),
    onSuccess: ({ confirmationUrl }) => {
      setConfirmationUrl(
        new URL(confirmationUrl, window.location.origin).toString(),
      );
      pushToast({
        title: t("appsChatDetail.privateIdentityLinkURLCreated"),
        body: t("appsChatDetail.sendItOnlyToThePersonWhoseProviderIdentity"),
        tone: "success",
      });
    },
    onError: (error) =>
      pushToast({
        title: t("appsChatDetail.couldntCreateIdentityLink"),
        body: error instanceof Error ? error.message : t("appsChatDetail.tryAgainLabel"),
        tone: "error",
      }),
  });
  const revoke = useMutation({
    mutationFn: (principalId: string) =>
      chatEndpointsApi.revokeLink(endpointId, principalId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.chatEndpoints.principals(endpointId),
      }),
  });
  const links = linksQuery.data ?? [];
  return (
    <section className="max-w-3xl space-y-7">
      <div>
        <h2 className="text-lg font-semibold">{t("appsChatDetail.externalIdentityAccess")}</h2>
      </div>
      {endpoint.provider === "slack" && <SlackSearchAccess companyId={endpoint.companyId} endpointId={endpointId} />}
      {endpoint.provider === "slack" && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">{t("appsChatDetail.inviteOthersToConnectTheirSlackAccounts")}</h3>
          <ol className="list-decimal space-y-3 pl-5 text-sm">
            <li>
              {t("appsChatDetail.askThemToSendThisCommandInYourSlack")}
              <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                <code>{joinCommand}</code>
                <Button size="sm" variant="ghost" onClick={() => {
                  void copyTextToClipboard(joinCommand).then(() => setJoinCommandCopied(true), () => pushToast({ title: t("appsChatDetail.couldntCopyTheCommand"), body: t("appsChatDetail.selectAndCopyItManually"), tone: "error" }));
                }}><Copy className="size-4" />{joinCommandCopied ? t("appsChatDetail.copied") : t("appsChatDetail.copyCommand")}</Button>
              </div>
            </li>
            <li>{t("appsChatDetail.openThePrivateLinkFromTheBotSignInto")}</li>
            <li>{t("appsChatDetail.ifTheyArentAMemberOfThisOrganizationChoose")} <strong>{t("appsChatDetail.requestAccess")}</strong>{t("appsChatDetail.anAdminMustApproveTheirRequestBeforeTheyCan")}</li>
          </ol>
          <p className="text-sm text-muted-foreground">{t("appsChatDetail.eachPersonLinksTheirOwnAccountAndUsesTheir")}</p>
        </div>
      )}
      <SettingToggle
        label={t("appsChatDetail.allowUnlinkedPeople")}
        detail={t("appsChatDetail.theyAreRestrictedGuestsTheirTasksRunOnlyWith")}
        checked={allowUnlinked}
        pending={updatePolicy.isPending}
        onChange={(value) => updatePolicy.mutate(value)}
      />
      {confirmationUrl && (
        <div className="space-y-2 border-y border-border py-3">
          <p className="text-sm font-medium">{t("appsChatDetail.privateConfirmationLink")}</p>
          <p className="break-all text-xs text-muted-foreground">
            {confirmationUrl}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              void copyTextToClipboard(confirmationUrl).then(
                () =>
                  pushToast({
                    title: t("appsChatDetail.confirmationLinkCopied"),
                    tone: "success",
                  }),
                () =>
                  pushToast({
                    title: t("appsChatDetail.couldntCopyTheLink"),
                    body: t("appsChatDetail.selectAndCopyItManually"),
                    tone: "error",
                  }),
              );
            }}
          >
            <Copy />
            {t("appsChatDetail.copyLink")}
          </Button>
        </div>
      )}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">{t("appsChatDetail.identityLinks")}</h3>
        {links.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            {t("appsChatDetail.externalPeopleAppearHereAfterTheyMessageTheAgent")}
          </p>
        ) : (
          <div className="divide-y divide-border border-y border-border">
            {links.map((link) => (
              <div
                key={link.id}
                className="flex flex-wrap items-center gap-3 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{link.externalLabel}</p>
                  <p className="text-xs text-muted-foreground">
                    {link.paperclipUserLabel
                      ? t("appsChatDetail.linkedTo", { user: link.paperclipUserLabel })
                      : (link.externalDetail ?? t("appsChatDetail.notLinked"))}
                  </p>
                </div>
                {link.status === "linked" ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={revoke.isPending}
                    onClick={() => revoke.mutate(link.principalId)}
                  >
                    <Unlink />
                    {t("appsChatDetail.revoke")}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={createIntent.isPending}
                    onClick={() => createIntent.mutate(link.principalId)}
                  >
                    {t("appsChatDetail.createPrivateLink")}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Conversations({
  endpointId,
  provider,
}: {
  endpointId: string;
  provider: ChatProvider;
}) {
  const { t } = useTranslation();
  const query = useQuery({
    queryKey: queryKeys.chatEndpoints.conversations(endpointId),
    queryFn: () => chatEndpointsApi.listConversations(endpointId),
    ...liveChatQueryOptions,
  });
  const rows = query.data ?? [];
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{t("appsChatDetail.conversations")}</h2>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          {t("appsChatDetail.noConversationsYetAddressTheAgentInAnEnabled")}
        </p>
      ) : (
        <ul aria-label={t("appsChatDetail.conversations")} className="divide-y divide-border overflow-x-auto border-y border-border">
          {rows.map((row) => (
            <li key={row.id} className="flex min-w-xl items-center gap-3 px-2 py-3 text-sm transition-colors hover:bg-accent/50">
              <AppLogo name={providerNames[provider]} brandKey={provider} compact className="size-5! rounded-sm bg-transparent" />
              <div className="flex min-w-0 max-w-56 items-center gap-2">
                <span className="truncate font-medium" title={row.externalLabel}>{row.externalLabel}</span>
                {row.externalUrl && <a href={row.externalUrl} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline">{t("appsChatDetail.openProvider", { provider: providerNames[provider] })}<ExternalLink className="size-3" /></a>}
              </div>
              <span aria-hidden="true" className="text-muted-foreground">·</span>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="truncate" title={row.issueTitle ?? undefined}>{row.issueTitle ?? t("appsChatDetail.waitingForTask")}</span>
                {row.issueId && <Link to={`/issues/${row.issueId}`} className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline">{t("appsChatDetail.openTask")}<ExternalLink className="size-3" /></Link>}
              </div>
              <span className="hidden shrink-0 text-xs text-muted-foreground xl:inline">{row.issueIdentifier}</span>
              {row.state !== "active" && <StatusBadge status={row.state} />}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Activity({
  endpointId,
  endpoint,
}: {
  endpointId: string;
  endpoint: Awaited<ReturnType<typeof chatEndpointsApi.get>>;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [removeOpen, setRemoveOpen] = useState(false);
  const [resolutionItem, setResolutionItem] = useState<ChatActivityItem | null>(
    null,
  );
  const [cursors, setCursors] = useState<Array<string | undefined>>([undefined]);
  const cursor = cursors[cursors.length - 1];
  useEffect(() => setCursors([undefined]), [endpointId]);
  const query = useQuery({
    queryKey: [...queryKeys.chatEndpoints.activity(endpointId), cursor ?? null],
    queryFn: () => chatEndpointsApi.listActivityPage(endpointId, cursor),
    ...liveChatQueryOptions,
    refetchInterval: cursor ? false : liveChatQueryOptions.refetchInterval,
  });
  const replay = useMutation({
    mutationFn: (item: ChatActivityItem) =>
      item.kind === "publication"
        ? chatEndpointsApi.replayPublication(endpointId, item.id)
        : chatEndpointsApi.replayDelivery(endpointId, item.id),
    onSuccess: async (_result, item) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.chatEndpoints.activity(endpointId),
      });
      pushToast({
        title: t("appsChatDetail.queuedReplay", { kind: item.kind === "publication" ? t("appsChatDetail.publication") : t("appsChatDetail.delivery") }),
        tone: "success",
      });
    },
    onError: (error) =>
      pushToast({
        title: t("appsChatDetail.couldntReplayActivity"),
        body: error instanceof Error ? error.message : t("appsChatDetail.tryAgainLabel"),
        tone: "error",
      }),
  });
  const resolveActivity = useMutation({
    mutationFn: (input: {
      item: ChatActivityItem;
      action: "mark_delivered" | "retry_anyway" | "cancel";
    }) => {
      if (input.item.kind === "publication") {
        return chatEndpointsApi.resolvePublication(
          endpointId,
          input.item.id,
          input.action,
          input.item.fileTransfer
            ? {
                phase: input.item.fileTransfer.phase,
                version: input.item.fileTransfer.version,
              }
            : undefined,
        );
      }
      return chatEndpointsApi.resolveAction(
        endpointId,
        input.item.id,
        input.action,
      );
    },
    onSuccess: async (_result, input) => {
      setResolutionItem(null);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.chatEndpoints.activity(endpointId),
      });
      pushToast({
        title:
          input.item.actionType === "slash_task_start" &&
          input.action === "retry_anyway"
            ? t("appsChatDetail.taskStartRetried")
            : input.item.actionType === "slash_task_start"
              ? t("appsChatDetail.taskStartCancelled")
              : input.item.actionType === "provider_effect" &&
                  input.action === "mark_delivered"
                ? t("appsChatDetail.providerReplyMarkedDelivered")
                : input.item.actionType === "provider_effect" &&
                    input.action === "retry_anyway"
                  ? t("appsChatDetail.providerReplyRetried")
                  : input.item.actionType === "provider_effect"
                    ? t("appsChatDetail.providerReplyCancelled")
                    : input.action === "mark_delivered"
                      ? t("appsChatDetail.publicationMarkedDelivered")
                      : input.action === "retry_anyway"
                        ? t("appsChatDetail.publicationQueuedForRetry")
                        : t("appsChatDetail.publicationCancelled"),
        tone: "success",
      });
    },
    onError: (error) =>
      pushToast({
        title: t("appsChatDetail.couldntResolveActivity"),
        body: error instanceof Error ? error.message : t("appsChatDetail.tryAgainLabel"),
        tone: "error",
      }),
  });
  const lifecycle = useMutation({
    mutationFn: (action: "pause" | "resume" | "remove") =>
      chatEndpointsApi.setup(endpointId, { action }),
    onSuccess: async (next, action) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.chatEndpoints.list(next.companyId),
      });
      if (action === "remove") {
        navigate("/apps");
        return;
      }
      queryClient.setQueryData(
        queryKeys.chatEndpoints.detail(endpointId),
        next,
      );
      pushToast({
        title: action === "pause" ? t("appsChatDetail.connectionPaused") : t("appsChatDetail.connectionResumed"),
        tone: "success",
      });
    },
    onError: (error) =>
      pushToast({
        title: t("appsChatDetail.couldntUpdateConnection"),
        body: error instanceof Error ? error.message : t("appsChatDetail.tryAgainLabel"),
        tone: "error",
      }),
  });
  const rows = query.data?.items ?? [];
  const { status } = endpoint;
  const health = connectionHealthPresentation(endpoint);
  const lifecycleAction = lifecycle.variables;
  const callbackSurfaceRows = endpoint.setup?.callbackSurfaces
    ? ([
        [t("appsChatDetail.eventsAPI"), endpoint.setup.callbackSurfaces.events],
        [t("appsChatDetail.interactivity"), endpoint.setup.callbackSurfaces.interactivity],
        [t("appsChatDetail.slashCommand"), endpoint.setup.callbackSurfaces.slashCommands],
      ] as const)
    : [];
  return (
    <section className="space-y-5">
      <h2 className="text-lg font-semibold">{t("appsChatDetail.connectionActivity")}</h2>
      {((status !== "active" && health.message) || health.error) && (
        <div
          className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${status === "attention" || status === "revoked" ? "border-destructive/40 bg-destructive/5 text-destructive" : "border-border bg-muted/30 text-foreground"}`}
        >
          {(status === "attention" || status === "revoked") && (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <div>
            {health.message && <p>{health.message}</p>}
            {health.previousHealth && (
              <p className="mt-1 text-xs opacity-80">
                <span className="font-medium">{t("appsChatDetail.lastReportedHealth")}</span>{" "}
                {health.previousHealth}
              </p>
            )}
            {health.error && (
              <p className="mt-1 text-xs opacity-80">
                <span className="font-medium">{health.errorLabel}:</span>{" "}
                {health.error}
              </p>
            )}
          </div>
        </div>
      )}
      <details className="group rounded-lg border border-border">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-medium chat-connection-health-summary">
          <span>{t("appsChatDetail.connectionHealthAndControls")}</span>
          <span className="flex items-center gap-2">
            {endpoint.setup?.callbacksNeedUpdate && <span className="text-xs text-(--status-task-blocked)">{t("appsChatDetail.callbackURLsNeedAttention")}</span>}
            <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
          </span>
        </summary>
        <div className="space-y-5 border-t border-border p-4">
      {endpoint.provider === "slack" && callbackSurfaceRows.length > 0 && (
        <div
          className="space-y-3 text-sm"
        >
          <p className="font-medium">{t("appsChatDetail.slackCallbackHealth")}</p>
          <p className="text-xs text-muted-foreground">
            {endpoint.setup?.callbacksNeedUpdate
              ? t("appsChatDetail.slackCallbackURLsNeedAnUpdateSaveTheCurrent")
              : t("appsChatDetail.paperclipRecordsEachCallbackSurfaceIndependentlyAfterSlackSuccessfully")}
          </p>
          <div className="divide-y divide-border border-y border-border">
            {callbackSurfaceRows.map(([label, surface]) => (
              <div key={label} className="flex flex-wrap items-center justify-between gap-3 py-2">
                <p className="text-xs font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">
                  {surface.status === "current"
                    ? t("appsChatDetail.current")
                    : surface.status === "stale"
                      ? t("appsChatDetail.staleURL")
                      : t("appsChatDetail.notObserved")}
                </p>
                {surface.observedAt && (
                  <p className="text-xs text-muted-foreground">
                    {t("appsChatDetail.lastObserved")}{" "}
                    <time
                      dateTime={surface.observedAt}
                      title={surface.observedAt}
                      className="font-mono"
                    >
                      {formatDateTime(surface.observedAt, { includeSeconds: true })}
                    </time>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {status !== "archived" && (
        <div className="space-y-3 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            {status === "active" && (
              <Button
                variant="outline"
                disabled={lifecycle.isPending}
                onClick={() => lifecycle.mutate("pause")}
              >
                {lifecycle.isPending && lifecycleAction === "pause" ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Pause />
                )}
                {t("appsChatDetail.pause")}
              </Button>
            )}
            {status === "paused" && (
              <Button
                variant="outline"
                disabled={lifecycle.isPending}
                onClick={() => lifecycle.mutate("resume")}
              >
                {lifecycle.isPending && lifecycleAction === "resume" ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Play />
                )}
                {t("appsChatDetail.resume")}
              </Button>
            )}
            {[
              "active",
              "paused",
              "attention",
              "revoked",
              "draft",
              "verifying",
            ].includes(status) && (
              <Button
                variant="outline"
                disabled={lifecycle.isPending}
                onClick={() =>
                  navigate(
                    `/apps/chat/connect?provider=${endpoint.provider}&purpose=chat&resume=${endpoint.id}${status === "draft" || status === "verifying" ? "" : "&reconnect=1"}`,
                  )
                }
              >
                <RefreshCw />
                {status === "draft" || status === "verifying"
                  ? t("appsChatDetail.finishSetup")
                  : t("appsChatDetail.reconnect")}
              </Button>
            )}
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive"
              disabled={lifecycle.isPending}
              onClick={() => setRemoveOpen(true)}
            >
              <Trash2 />
              {t("appsChatDetail.removeConnection")}
            </Button>
          </div>
          {status !== "draft" && status !== "verifying" && (
            <p className="text-xs text-muted-foreground">
              {t(providerLifecycleGuidance[endpoint.provider].reconnect)}
            </p>
          )}
        </div>
      )}
        </div>
      </details>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">
          {t("appsChatDetail.recentActivity")}
        </h3>
        <div className="divide-y divide-border border-y border-border">
          {query.isLoading && (
            <div className="flex items-center gap-2 py-5 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("appsChatDetail.loadingActivity")}
            </div>
          )}
          {query.isError && (
            <div className="flex flex-wrap items-center justify-between gap-3 py-4">
              <p className="text-sm text-destructive" role="alert">
                {t("appsChatDetail.connectionActivityCouldNotBeLoaded")}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => query.refetch()}
              >
                {t("appsChatDetail.tryAgain")}
              </Button>
            </div>
          )}
          {!query.isLoading &&
            !query.isError &&
            rows.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 px-2 py-3 transition-colors hover:bg-accent/50"
              >
                <span className="mt-0.5 text-muted-foreground" aria-hidden="true">
                  {item.kind === "delivery" ? <ArrowDownLeft className="size-4" /> : item.kind === "publication" ? <ArrowUpRight className="size-4" /> : <ActivityIcon className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="min-w-0 flex-1 text-sm font-medium">{item.summary}</p>
                    <StatusBadge status={item.status} />
                    <time dateTime={item.createdAt} title={item.createdAt} className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {formatDateTime(item.createdAt, { includeSeconds: true })}
                    </time>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{t(activityKindLabels[item.kind])}</p>
                  {item.fileTransfer && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.fileTransfer.filename} —{" "}
                      {fileTransferPhaseLabels[item.fileTransfer.phase] ? t(fileTransferPhaseLabels[item.fileTransfer.phase]) : item.fileTransfer.phase}
                    </p>
                  )}
                  {item.detail && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {activityDetailLabel(item)}:
                      </span>{" "}
                      {item.detail}
                    </p>
                  )}
                </div>
                {isReplayEligible(item) && (
                  <Button
                    size="sm"
                    variant="outline"
                    aria-label={t("appsChatDetail.replayFailed", { kind: t(activityKindLabels[item.kind]) })}
                    disabled={replay.isPending}
                    onClick={() => replay.mutate(item)}
                  >
                    {replay.isPending && replay.variables?.id === item.id ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <RefreshCw />
                    )}
                    {t("appsChatDetail.replay")}
                  </Button>
                )}
                {isResolutionEligible(item) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setResolutionItem(item)}
                  >
                    {t("appsChatDetail.resolve")}
                  </Button>
                )}
              </div>
            ))}
          {!query.isLoading && !query.isError && rows.length === 0 && (
            <p className="py-5 text-sm text-muted-foreground">
              {t("appsChatDetail.noConnectionActivityYet")}
            </p>
          )}
        </div>
      </div>
      <nav aria-label={t("appsChatDetail.activityPagination")} className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">{t("appsChatDetail.page", { page: cursors.length })}</span>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" disabled={cursors.length === 1 || query.isFetching} onClick={() => setCursors((pages) => pages.slice(0, -1))}>{t("appsChatDetail.previous")}</Button>
          <Button size="sm" variant="outline" disabled={!query.data?.nextCursor || query.isFetching || query.isError} onClick={() => { if (query.data?.nextCursor) setCursors((pages) => [...pages, query.data.nextCursor!]); }}>{t("appsChatDetail.next")}</Button>
        </div>
      </nav>
      <AlertDialog
        open={resolutionItem !== null}
        onOpenChange={(open) => !open && setResolutionItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {resolutionItem?.actionType === "slash_task_start"
                ? t("appsChatDetail.resolveUnconfirmedTaskStart")
                : resolutionItem?.actionType === "provider_effect"
                  ? t("appsChatDetail.resolveUnconfirmedProviderReply")
                  : t("appsChatDetail.resolveUnconfirmedDelivery")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {resolutionItem?.actionType === "slash_task_start"
                ? t("appsChatDetail.paperclipLostConfirmationAfterAskingSlackToStartThe")
                : resolutionItem?.actionType === "provider_effect"
                  ? t("appsChatDetail.paperclipLostConfirmationAfterSendingThisProviderReplyCheck")
                  : resolutionItem
                    ? activityResolutionDescription(resolutionItem)
                    : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:flex-wrap">
            <AlertDialogCancel disabled={resolveActivity.isPending}>
              {t("appsChatDetail.keepUnresolved")}
            </AlertDialogCancel>
            {resolutionItem &&
              activityResolutionActions(resolutionItem).includes("cancel") && (
                <Button
                  variant="outline"
                  disabled={resolveActivity.isPending}
                  onClick={() =>
                    resolutionItem &&
                    resolveActivity.mutate({
                      item: resolutionItem,
                      action: "cancel",
                    })
                  }
                >
                  {resolutionItem.actionType === "slash_task_start"
                    ? t("appsChatDetail.cancelTaskStart")
                    : resolutionItem.actionType === "provider_effect"
                      ? t("appsChatDetail.cancelProviderReply")
                      : resolutionItem.fileTransfer
                        ? t("appsChatDetail.cancelFileTransfer")
                        : t("appsChatDetail.cancelPublication")}
                </Button>
              )}
            {resolutionItem &&
              activityResolutionActions(resolutionItem).includes(
                "retry_anyway",
              ) && (
                <Button
                  variant="outline"
                  disabled={resolveActivity.isPending}
                  onClick={() =>
                    resolutionItem &&
                    resolveActivity.mutate({
                      item: resolutionItem,
                      action: "retry_anyway",
                    })
                  }
                >
                  {resolutionItem.fileTransfer
                    ? t("appsChatDetail.retryFileNotification")
                    : t("appsChatDetail.retryAnyway")}
                </Button>
              )}
            {resolutionItem &&
              activityResolutionActions(resolutionItem).includes(
                "mark_delivered",
              ) && (
                <AlertDialogAction
                  disabled={resolveActivity.isPending}
                  onClick={(event) => {
                    event.preventDefault();
                    if (resolutionItem) {
                      resolveActivity.mutate({
                        item: resolutionItem,
                        action: "mark_delivered",
                      });
                    }
                  }}
                >
                  {t("appsChatDetail.markDelivered")}
                </AlertDialogAction>
              )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("appsChatDetail.removeThisConnection")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("appsChatDetail.removeDescription", { agent: endpoint.assignedAgentName, provider: providerNames[endpoint.provider] })}{" "}
              {t(providerLifecycleGuidance[endpoint.provider].remove)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("appsChatDetail.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={lifecycle.isPending}
              onClick={() => lifecycle.mutate("remove")}
            >
              {lifecycle.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {t("appsChatDetail.removeConnection")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
