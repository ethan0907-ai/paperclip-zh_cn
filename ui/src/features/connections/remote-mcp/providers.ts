/** Presentation metadata only. Each provider will have its own catalog entry and connection. */
export type RemoteMcpProviderId = "zapier" | "arcade" | "composio" | "executor";

export interface RemoteMcpProvider {
  id: RemoteMcpProviderId;
  name: string;
  description: string;
  instructions: string[];
  setupUrl: string;
  dashboardUrl: string;
  defaultUrl: string;
  placeholder: string;
  urlHelp: string;
  authHelp: string;
  supportsBrowserAuth: boolean;
}

export const remoteMcpProviders: Record<RemoteMcpProviderId, RemoteMcpProvider> = {
  zapier: {
    id: "zapier", name: "Zapier", supportsBrowserAuth: false,
    description: "connectionRemote.useTheAppsAndActionsOnYourZapierMCP",
    instructions: ["connectionRemote.createAnMCPServerInZapierAndChooseOther", "connectionRemote.connectYourAppsAndSelectTheActionsToExpose", "connectionRemote.openConnectGenerateATokenAndCopyTheFull"],
    setupUrl: "https://docs.zapier.com/mcp/get-started/connect/other",
    dashboardUrl: "https://mcp.zapier.com",
    defaultUrl: "", placeholder: "connectionRemote.pasteTheFullURLFromZapier",
    urlHelp: "connectionRemote.theFullServerURLCanContainASecretToken",
    authHelp: "connectionRemote.forASeparateTokenUseHttpsMcpZapierCom",
  },
  arcade: {
    id: "arcade", name: "Arcade", supportsBrowserAuth: true,
    description: "connectionRemote.useTheToolsExposedByYourArcadeGateway",
    instructions: ["connectionRemote.createAGatewayInArcadeAndSelectItsTools", "connectionRemote.chooseItsUserSourceAndCopyTheGatewayURL", "connectionRemote.pasteTheURLHereThenSignInWhenPrompted"],
    setupUrl: "https://docs.arcade.dev/en/operate/governance/mcp-gateways",
    dashboardUrl: "https://app.arcade.dev",
    defaultUrl: "", placeholder: "https://api.arcade.dev/mcp/your-gateway",
    urlHelp: "connectionRemote.copyTheMCPGatewayURLFromArcadeAppAuthorization",
    authHelp: "connectionRemote.forArcadeHeadersUseAnAPIKeyAsThe",
  },
  composio: {
    id: "composio", name: "Composio", supportsBrowserAuth: true,
    description: "connectionRemote.discoverAndUseYourAppsThroughComposioConnect",
    instructions: ["connectionRemote.connectToComposioAndSignInWithYourAccount", "connectionRemote.connectUnderlyingAppsInComposioWhenPrompted"],
    setupUrl: "https://docs.composio.dev/docs/composio-connect",
    dashboardUrl: "https://dashboard.composio.dev",
    defaultUrl: "https://connect.composio.dev/mcp", placeholder: "https://connect.composio.dev/mcp",
    urlHelp: "connectionRemote.composioConnectIsPrefilledForAnExternallyConfiguredSession",
    authHelp: "connectionRemote.sessionURLsAndHeadersComeFromYourExternalComposio",
  },
  executor: {
    id: "executor", name: "Executor", supportsBrowserAuth: true,
    description: "connectionRemote.runToolsThroughYourExecutorWorkspace",
    instructions: ["connectionRemote.connectYourAppsAndConfigureActionPoliciesInExecutor", "connectionRemote.openIntegrationsAndCopyTheURLUnderConnectAn", "connectionRemote.pasteItHereAndSignInWhenPrompted"],
    setupUrl: "https://executor.sh/docs/mcp-proxy",
    dashboardUrl: "https://executor.sh",
    defaultUrl: "", placeholder: "connectionRemote.pasteYourExecutorWorkspaceMCPURL",
    urlHelp: "connectionRemote.useTheHostedWorkspaceURLOrASelfHosted",
    authHelp: "connectionRemote.keepAnyOptionsInTheCopiedURLIfUsing",
  },
};
