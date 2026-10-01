import { createUuid } from "@/lib/uuid";
import { useTranslation } from "@/i18n";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, ExternalLink, HelpCircle, Loader2, Plus, Trash2 } from "lucide-react";
import { InlineBanner } from "@/components/InlineBanner";
import { ActionsSection } from "@/pages/apps/app-detail/PermissionsPanel";
import { SetupWizardFooter } from "@/components/SetupWizard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RemoteMcpManagement } from "./RemoteMcpManagement";
import { AccessStepContent, StepHeader } from "../ConnectionSetupFlow";
import type { RemoteMcpProvider } from "./providers";
import type { RemoteMcpSetupActions, RemoteMcpSetupState } from "./types";

const steps = ["access", "connect"] as const;
const selectClass = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

function FieldHelp({ label, children }: { label: string; children: ReactNode }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return <Tooltip open={open} onOpenChange={setOpen}>
    <TooltipTrigger asChild><button type="button" aria-label={t("connectionRemote.helpWith", { label })} onClick={() => setOpen(!open)} className="rounded-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><HelpCircle className="size-4" /></button></TooltipTrigger>
    <TooltipContent className="max-w-xs">{children}</TooltipContent>
  </Tooltip>;
}

/** Controlled presentation shared by provider setup, configuration imports and review stories.
 * Authentication, persistence and calls belong to the controller, never these views. */
export function RemoteMcpConnectionSetup({ provider, state: s, actions: a, agents, connectionId, fixedGrantKind, lockedAgentId, host = "page", authorizationUrl, upstreamServiceName }: {
  upstreamServiceName?: string;
  host?: "page" | "dialog";
  lockedAgentId?: string;
  authorizationUrl?: string;
  provider: RemoteMcpProvider;
  connectionId: string;
  fixedGrantKind?: RemoteMcpSetupState["grantKind"];
  state: RemoteMcpSetupState;
  actions: RemoteMcpSetupActions;
  agents: { id: string; name: string }[];
}) {
  const { t } = useTranslation();
  const uid = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(s.step);
  useEffect(() => {
    if (previousStep.current !== s.step) heading.current?.focus();
    previousStep.current = s.step;
  }, [s.step]);
  const currentStep = steps.indexOf(s.step as typeof steps[number]);
  const busy = s.connectStatus === "connecting";
  const change = (patch: Partial<RemoteMcpSetupState>) => a.edit(patch);
  const external = (purpose: Parameters<typeof a.openProvider>[0], text: string) => <Button type="button" variant="link" className="h-auto p-0 text-sm text-current underline" onClick={() => a.openProvider(purpose)}>{text}<ExternalLink className="size-3.5" aria-hidden="true" /></Button>;
  const boundary = <InlineBanner compact>
    {t("connectionRemote.toolBoundaryPrefix")}{" "}{external("manage", provider.name)}.
  </InlineBanner>;
  const footer = (children: ReactNode) => <SetupWizardFooter onSaveExit={a.saveExit} disabled={busy}>{children}</SetupWizardFooter>;

  const error = s.connectStatus === "invalid_url" ? { title: t("connectionRemote.enterAValidMCPURL"), body: t("connectionRemote.pasteTheCompleteServerURLIncludingHttpsOrHttp") }
    : s.connectStatus === "oauth_failed" ? { title: t("connectionRemote.providerCouldNotConnect", { provider: provider.name }), body: t("connectionRemote.authorizationDidNotCompleteYourSavedConnectionIsStill") }
    : s.connectStatus === "rejected" ? { title: t("connectionRemote.credentialsWereRejected"), body: t("connectionRemote.checkProviderCredentials", { provider: provider.name }) }
    : s.connectStatus === "unreachable" ? { title: t("connectionRemote.paperclipCouldNotReachThisServer"), body: t("connectionRemote.checkThatTheEndpointIsRunningAndReachableFrom") }
    : null;

  return <div className={host === "dialog" ? "min-w-0 text-foreground" : "mx-auto max-w-6xl p-4 text-foreground sm:p-8"} data-remote-mcp-provider={provider.id}>
    <StepHeader headingRef={heading} appIdentity={{ name: provider.name, logoUrl: null }}
      title={upstreamServiceName ? t("connectionRemote.connectThrough", { app: upstreamServiceName, provider: provider.name }) : s.step === "draft" ? t("connectionRemote.continueYourSetup") : s.setupComplete ? s.step === "access" ? t("connectionRemote.whoCanUseThisConnection") : s.step === "connect" ? t("connectionRemote.reconnectProvider", { provider: provider.name }) : provider.name : undefined}
      subtitle={currentStep >= 0 && !s.setupComplete ? t("connectionRemote.stepOfTwo", { step: currentStep + 1 }) : s.step === "draft" ? t("connectionRemote.setupReadyResume", { provider: provider.name }) : s.step === "permissions" ? s.identity ? t("connectionRemote.connectedAsActions", { identity: s.identity, count: s.tools.length }) : t("connectionRemote.connectedActions", { count: s.tools.length }) : t("connectionRemote.manageProviderConnection", { provider: provider.name })}
      step={currentStep >= 0 && !s.setupComplete ? "access" : "gallery"} activeIndex={currentStep} labels={[t("connectionRemote.access"), t("connectionRemote.connect")]} onCancel={busy || s.step === "management" || s.step === "permissions" || s.step === "draft" ? undefined : a.saveExit} />
    <main className="space-y-6">
        {upstreamServiceName && <InlineBanner compact>{t("connectionRemote.verifyExternalProvider", { provider: provider.name, app: upstreamServiceName })}</InlineBanner>}
        {s.notice && <p role="status" className="text-sm text-muted-foreground">{s.notice.startsWith("connectionRemote.") ? t(s.notice) : s.notice}</p>}

        {s.step === "access" && <AccessStepContent agents={agents} lockedAgentId={lockedAgentId} authKind="oauth" grantKinds={fixedGrantKind ? [fixedGrantKind] : undefined} grantKind={s.grantKind} setGrantKind={(grantKind) => { if (grantKind !== "agent") change({ grantKind }); }}
          installChoice={s.allAgents ? "all" : "specific"} setInstallChoice={(choice) => change({ allAgents: choice === "all" })}
          installAgentIds={new Set(s.agentIds)} setInstallAgentIds={(ids) => change({ agentIds: [...ids] })}
          submitLabel={s.setupComplete ? t("connectionRemote.done") : t("connectionRemote.continue")} onBack={s.setupComplete ? a.finish : a.saveExit} onContinue={s.setupComplete ? a.finish : () => a.navigate("connect")} />}
        {s.step === "permissions" && <>
          <div className="flex items-center justify-between gap-3"><h2 className="text-sm font-semibold">{t("connectionRemote.permissions")}</h2><Button variant="outline" onClick={a.finish}>{t("connectionRemote.connectionSettings")}</Button></div>
          {s.tools.some((entry) => entry.broad) && boundary}
          <ActionsSection connectionId={connectionId} appName={provider.name}
            readOnly={s.tools.filter((entry) => entry.isReadOnly)} canChange={s.tools.filter((entry) => !entry.isReadOnly)} quarantined={[]}
            enabledIds={new Set(s.tools.filter((entry) => s.permissions[entry.id] !== "off").map((entry) => entry.id))}
            askFirstIds={new Set(s.tools.filter((entry) => s.permissions[entry.id] === "ask_first").map((entry) => entry.id))}
            disabled={!s.connected} refreshPending={s.refreshing} canConfigure
            onSetPermission={(id, next) => change({ permissions: { ...s.permissions, [id]: next === "ask" ? "ask_first" : next } })}
            onReviewQuarantined={() => {}} onRefreshActions={a.refresh} />
        </>}
        <div className="mx-auto max-w-2xl space-y-6">
        {s.step === "connect" && <>
          <div className="space-y-3">
            <ol className="list-decimal space-y-2 pl-5 text-sm">{provider.instructions.map((instruction) => <li key={instruction}>{t(instruction)}</li>)}</ol>
            {external("setup", t("connectionRemote.openSetupGuide", { provider: provider.name }))}
          </div>
          {s.connectStatus === "sign_in" && provider.supportsBrowserAuth ? <>
            <div role="status"><InlineBanner title={t("connectionRemote.finishProviderSignIn", { provider: provider.name })}>
              {t("connectionRemote.completeSignInInTheProviderWindowThenReturn")}
            </InlineBanner></div>
            <p className="text-sm text-muted-foreground">{t("connectionRemote.ifAWindowDidNotOpen")} {authorizationUrl ? <a className="text-current underline" href={authorizationUrl} onClick={() => a.openProvider("sign_in")} target="_blank" rel="noopener noreferrer">{t("connectionRemote.openSignInAgain")}</a> : external("sign_in", t("connectionRemote.openSignInAgain"))}.</p>
            {footer(<><Button variant="outline" onClick={a.cancelConnect}>{t("connectionRemote.cancelSignIn")}</Button><Button disabled>{t("connectionRemote.waitingForSignIn")}</Button></>)}
          </> : <form className="space-y-6" onSubmit={(event) => { event.preventDefault(); a.connect(); }}>
            {error && <div role="alert"><InlineBanner tone="danger" title={error.title}>{error.body}</InlineBanner></div>}
            {s.connectStatus === "cancelled" && <p role="status" className="text-sm text-muted-foreground">{t("connectionRemote.connectionCancelledYourSetupDetailsArePreservedTryAgain")}</p>}
            <fieldset disabled={busy} className="min-w-0 space-y-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2"><Label htmlFor={`${uid}-url`}>{t("connectionRemote.mCPServerURL")}</Label><FieldHelp label={t("connectionRemote.mCPServerURL")}>{t(provider.urlHelp)}</FieldHelp></div>
                <Input id={`${uid}-url`} type="password" autoComplete="off" spellCheck={false} placeholder={provider.placeholder.startsWith("connectionRemote.") ? t(provider.placeholder) : provider.placeholder} value={s.url} aria-invalid={s.connectStatus === "invalid_url"} aria-describedby={`${uid}-url-help`} onChange={(event) => change({ url: event.target.value })} />
                <p id={`${uid}-url-help`} className="text-xs text-muted-foreground">{provider.urlHelp}</p>
              </div>
              <details open={s.advanced} onToggle={(event) => { if (event.currentTarget.open !== s.advanced) change({ advanced: event.currentTarget.open }); }}>
                <summary className="cursor-pointer text-sm font-medium">{t("connectionRemote.advancedAuthentication")}</summary>
                <div className="space-y-4 pt-4">
                  <p className="text-sm text-muted-foreground">{t(provider.authHelp)}</p>
                  <div className="space-y-2"><Label htmlFor={`${uid}-auth`}>{t("connectionRemote.authentication")}</Label><select id={`${uid}-auth`} className={selectClass} value={s.auth} onChange={(event) => change({ auth: event.target.value as RemoteMcpSetupState["auth"] })}>
                    {provider.supportsBrowserAuth && <option value="auto">{t("connectionRemote.automaticSignInIfRequired")}</option>}<option value="bearer">{t("connectionRemote.bearerToken")}</option><option value="headers">{t("connectionRemote.customHeaders")}</option><option value="none">{t("connectionRemote.noAdditionalAuthentication")}</option>
                  </select></div>
                  {s.auth === "bearer" && <div className="space-y-2"><div className="flex items-center gap-2"><Label htmlFor={`${uid}-token`}>{t("connectionRemote.bearerToken")}</Label><FieldHelp label={t("connectionRemote.bearerTokenLabel")}>{t("connectionRemote.pasteTheTokenOnlyWithoutTheWordBearerIt")}</FieldHelp></div><Input id={`${uid}-token`} type="password" autoComplete="off" value={s.token} onChange={(event) => change({ token: event.target.value })} /></div>}
                  {(s.auth === "bearer" || s.auth === "headers") && <div className="space-y-3">
                    <p className="text-sm font-medium">{s.auth === "bearer" ? t("connectionRemote.additionalHeaders") : t("connectionRemote.headers")}</p>
                    {s.headers.map((header, index) => <div key={header.id} className="flex flex-wrap items-end gap-2">
                      <div className="min-w-0 flex-1 space-y-2"><Label htmlFor={`${uid}-${header.id}-name`}>{t("connectionRemote.headerNumberName", { number: index + 1 })}</Label><Input id={`${uid}-${header.id}-name`} value={header.name} placeholder={provider.id === "arcade" ? "Arcade-User-ID" : t("connectionRemote.headerName")} onChange={(event) => change({ headers: s.headers.map((h) => h.id === header.id ? { ...h, name: event.target.value } : h) })} /></div>
                      <div className="min-w-0 flex-1 space-y-2"><Label htmlFor={`${uid}-${header.id}-value`}>{t("connectionRemote.headerNumberValue", { number: index + 1 })}</Label><Input id={`${uid}-${header.id}-value`} type="password" autoComplete="off" value={header.value} onChange={(event) => change({ headers: s.headers.map((h) => h.id === header.id ? { ...h, value: event.target.value } : h) })} /></div>
                      <Button type="button" variant="ghost" size="icon" aria-label={t("connectionRemote.removeHeaderNumber", { number: index + 1 })} onClick={() => change({ headers: s.headers.filter((h) => h.id !== header.id) })}><Trash2 className="size-4" /></Button>
                    </div>)}
                    <Button type="button" variant="outline" size="sm" onClick={() => change({ headers: [...s.headers, { id: createUuid(), name: "", value: "" }] })}><Plus className="size-4" />{t("connectionRemote.addHeader")}</Button>
                  </div>}
                </div>
              </details>
            </fieldset>
            {busy && <p role="status" className="flex items-center gap-2 text-sm"><Loader2 className="size-4 animate-spin motion-reduce:animate-none" />{t("connectionRemote.connectingAndDiscoveringTools")}</p>}
            {footer(<><Button type="button" variant="outline" disabled={busy} onClick={() => s.setupComplete ? a.finish() : a.navigate("access")}>{t("connectionRemote.back")}</Button><Button type="submit" disabled={busy || !s.url.trim()}>{busy ? t("connectionRemote.connecting") : error || s.connectStatus === "cancelled" ? t("connectionRemote.tryAgain") : t("connectionRemote.connect")}</Button></>)}
          </form>}
        </>}

        {s.step === "management" && <>
          {!s.connected ? <InlineBanner tone="warning" title={t("connectionRemote.disconnected")}>{t("connectionRemote.agentsCannotUseThisConnectionReconnectToRestoreAccess")}</InlineBanner> : <div className="space-y-2"><p className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4" />{s.identity ? t("connectionRemote.connectedAs", { identity: s.identity }) : t("connectionRemote.connected")}</p><p className="text-sm text-muted-foreground">{s.grantKind === "user" ? t("connectionRemote.justMe") : t("connectionRemote.anyHumanInTheOrganization")} · {t("connectionRemote.toolsCount", { count: s.tools.length })} · {s.allAgents ? t("connectionRemote.anyAgent") : t("connectionRemote.agentsWithAccess", { count: s.agentIds.length })}</p></div>}
          <div className="flex flex-wrap gap-2"><Button onClick={() => a.navigate("access")}>{t("connectionRemote.whoCanUseThisConnection")}</Button><Button variant="outline" disabled={!s.connected} onClick={() => a.navigate("permissions")}>{t("connectionRemote.permissions")}</Button></div>
          <p className="text-sm text-muted-foreground">{t("connectionRemote.refreshAfterToolChanges", { provider: provider.name })}</p>
          <Button variant="outline" disabled={!s.connected || s.refreshing} onClick={a.refresh}>{s.refreshing ? t("connectionRemote.refreshing") : t("connectionRemote.refreshTools")}</Button>
          <RemoteMcpManagement providerName={provider.name} connected={s.connected} onReconnect={a.reconnect} onManage={() => a.openProvider("manage")} onDisconnect={a.disconnect} />
        </>}
        {s.step === "draft" && <><p className="text-sm">{t("connectionRemote.yourAccessChoicesAndSetupProgressAreKeptWith")}</p><div className="flex justify-end"><Button onClick={a.resumeDraft}>{t("connectionRemote.resumeSetup")}</Button></div></>}
        </div>
    </main>
  </div>;
}
