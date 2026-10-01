import { t } from "@/i18n";
/** Redacted presentation contracts shared with the production API. */
import type { AiProvider, AiAuthMethod, AiManagedConnectionSummary, AiConnectionBinding } from "@paperclipai/shared";
export type { AiProvider, AiAuthMethod, AiConnectionBinding } from "@paperclipai/shared";
export type AiConnectionStatus = AiManagedConnectionSummary["status"];

export const AI_PROVIDERS: Record<
  AiProvider,
  { name: string; subscriptionName?: string; logo?: string }
> = {
  anthropic: {
    name: "Claude",
    get subscriptionName() { return t("aiConnectionsRestUi.text59"); },
    logo: "/brands/claude-color.svg",
  },
  openai: {
    name: "OpenAI",
    get subscriptionName() { return t("aiConnectionsRestUi.text60"); },
    logo: "/brands/codex-color.svg",
  },
  openrouter: { name: "OpenRouter", logo: "/brands/apps/openrouter.svg" },
  xai: {
    name: "Grok",
    get subscriptionName() { return t("aiConnectionsRestUi.text61"); },
    logo: "/brands/adapters/grok.svg",
  },
};

export type AiConnectionSummary = Omit<AiManagedConnectionSummary, "isDefault"> & { isDefault?: boolean };

export interface AiConnectionRequirement {
  companyId: string;
  provider: AiProvider;
  method?: AiAuthMethod;
}

export const AI_CONNECTION_STATUS: Record<AiConnectionStatus, string> = {
  get connected() { return t("aiConnectionsRestUi.text62"); },
  get needs_attention() { return t("aiConnectionsRestUi.text63"); },
  get expired() { return t("companyAccessUi.inviteStates.expired"); },
  get revoked() { return t("aiConnectionsRestUi.revoked"); },
};

export function aiMethodLabel(provider: AiProvider, method: AiAuthMethod) {
  return method === "subscription"
    ? (AI_PROVIDERS[provider].subscriptionName ?? t("aiConnectionsRestUi.text66"))
    : t("adapterConfig.aPIKey");
}

export function matchesAiRequirement(
  connection: AiConnectionSummary,
  requirement: AiConnectionRequirement,
) {
  return (
    connection.companyId === requirement.companyId &&
    connection.provider === requirement.provider &&
    (requirement.method === undefined || connection.method === requirement.method)
  );
}

export function personalAiDefault(
  connections: AiConnectionSummary[],
  requirement: AiConnectionRequirement,
  userId: string,
) {
  // Never choose another account because the declared default is unhealthy.
  return connections.find(
    (connection) =>
      matchesAiRequirement(connection, { ...requirement, method: undefined }) &&
      connection.ownership === "personal" &&
      connection.ownerUserId === userId &&
      connection.isDefault,
  );
}

export function aiConnectionProblem(connection?: AiConnectionSummary) {
  if (!connection)
    return t("aiConnectionsRestUi.text68");
  return (
    connection.unavailableReason ??
    (connection.status === "connected"
      ? null
      : t("aiConnectionsRestUi.reconnectStatus", { status: AI_CONNECTION_STATUS[connection.status] }))
  );
}

export function bindingProblem(
  binding: AiConnectionBinding,
  requirement: AiConnectionRequirement,
  connections: AiConnectionSummary[],
  userId: string,
  _agentId: string,
) {
  if (
    binding.provider !== requirement.provider ||
    (binding.mode !== "responsible_user" && requirement.method !== undefined && binding.method !== requirement.method)
  )
    return t("aiConnectionsRestUi.text69");
  if (binding.mode === "responsible_user")
    return aiConnectionProblem(
      personalAiDefault(connections, requirement, userId),
    );
  const connection = connections.find(
    (item) =>
      item.id === binding.connectionId &&
      item.grantId === binding.grantId &&
      item.method === binding.method &&
      matchesAiRequirement(item, requirement),
  );
  if (!connection)
    return t("aiConnectionsRestUi.text70");
  if (binding.mode === "shared" && connection.ownership !== "shared")
    return t("aiConnectionsRestUi.text71");
  if (
    binding.mode === "delegated" &&
    (connection.ownership !== "personal" ||
      connection.ownerUserId !== userId)
  )
    return t("aiConnectionsRestUi.text72");
  return aiConnectionProblem(connection);
}
