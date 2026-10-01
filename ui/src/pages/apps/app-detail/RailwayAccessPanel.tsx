import { useTranslation } from "@/i18n";
import { useEffect, useId, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ConfigureRailwaySsh, ConnectionGrantsResponse, RailwaySshSetup, ToolConnection } from "@paperclipai/shared";
import { toolsApi } from "@/api/tools";
import { queryKeys } from "@/lib/queryKeys";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function RailwayAccessPanel({ connection, grants }: { connection: ToolConnection; grants?: ConnectionGrantsResponse }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const id = useId();
  const setup = connection.config?.railwaySsh as RailwaySshSetup | null | undefined;
  const owned = (grants?.grants ?? []).filter((grant) => grant.kind !== "user" || grant.subjectUserId === grants?.currentUserId);
  const eligible = owned.filter((grant) => grant.status === "active");
  const [selectedGrant, setSelectedGrant] = useState("");
  const [knownHosts, setKnownHosts] = useState(setup?.knownHosts ?? "");
  useEffect(() => { setKnownHosts(setup?.knownHosts ?? ""); }, [setup?.knownHosts]);
  const grantId = setup?.grantId ?? (selectedGrant || eligible[0]?.id);
  const canConfigure = grants?.capabilities.canConfigure && connection.status === "active" && eligible.some((grant) => grant.id === grantId);
  const canRemove = grants?.capabilities.canConfigure && owned.some((grant) => grant.id === setup?.grantId);
  const mutation = useMutation({
    mutationFn: (input: ConfigureRailwaySsh) => toolsApi.configureRailwaySsh(connection.id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tools.connection(connection.id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.tools.connectionGrants(connection.id) });
    },
  });
  return <section className="space-y-4" aria-labelledby={`${id}-title`}>
    <div className="space-y-2">
      <h2 id={`${id}-title`} className="text-lg font-semibold">{t("appsReviewSetup.railwayOperations")}</h2>
      <p className="text-sm text-muted-foreground">
        {typeof connection.config?.railwayApiMessage === "string" ? connection.config?.railwayApiMessage : t("appsReviewSetup.refreshActionsAfterConnectingToCheckServiceLogAnd")}
      </p>
    </div>
    <div className="space-y-2">
      <h3 className="font-medium">{t("appsReviewSetup.containerAccess")}</h3>
      <p className="text-sm text-muted-foreground">{t("appsReviewSetup.toAllowPaperclipDirectSSHAccessToRailwayContainers")} <a className="underline" href="https://docs.railway.com/cli/ssh" target="_blank" rel="noreferrer">{t("appsReviewSetup.railwaySSHDocumentation")}</a></p>
    </div>
    {!canConfigure && <p className="text-sm text-muted-foreground">{t("appsReviewSetup.theConnectionManagerAndAuthorizationOwnerCanConfigureContainer")}</p>}
    {(canConfigure || canRemove) && grantId && <>
      {!setup && eligible.length > 1 && <div className="space-y-2">
        <Label htmlFor={`${id}-grant`}>{t("appsReviewSetup.authorization")}</Label>
        <select id={`${id}-grant`} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={grantId} onChange={(event) => setSelectedGrant(event.target.value)}>
          {eligible.map((grant) => <option key={grant.id} value={grant.id}>{grant.kind === "organization" ? t("appsReviewSetup.sharedAccount") : grant.kind === "user" ? t("appsReviewSetup.myAccount") : t("appsReviewSetup.agentAccount")}</option>)}
        </select>
      </div>}
      {!setup && <Button variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate({ action: "prepare", grantId })}>{t("appsReviewSetup.generateSSHKeyPair")}</Button>}
      {setup && <>
        <div className="space-y-2">
          <Label htmlFor={`${id}-public`}>{t("appsReviewSetup.publicKey")}</Label>
          <Textarea id={`${id}-public`} readOnly value={setup.publicKey} className="font-mono text-xs" />
          <p className="text-sm text-muted-foreground">{t("appsReviewSetup.registerThisPublicKeyInTheRailwayAccountUsed")} <a className="underline" href="https://docs.railway.com/cli/ssh#manage-ssh-keys" target="_blank" rel="noreferrer">{t("appsReviewSetup.railwayKeySetup")}</a></p>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${id}-host`}>{t("appsReviewSetup.verifiedRailwayHostKey")}</Label>
          <Textarea id={`${id}-host`} value={knownHosts} onChange={(event) => setKnownHosts(event.target.value)} placeholder="ssh.railway.com ssh-ed25519 …" className="font-mono text-xs" />
          <p className="text-sm text-muted-foreground">{t("appsReviewSetup.pasteTheSshRailwayComLineFromAKnown")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={!canConfigure || mutation.isPending || !knownHosts.trim()} onClick={() => mutation.mutate({ action: "enable", grantId, knownHosts })}>{setup.enabled ? t("appsReviewSetup.updateTrustedHostKey") : t("appsReviewSetup.enableContainerAccess")}</Button>
          <Button variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate({ action: "remove", grantId })}>{t("appsReviewSetup.removeContainerKey")}</Button>
        </div>
        <p className="text-sm text-muted-foreground">{setup.enabled ? t("appsReviewSetup.containerAccessIsEnabledForThisAuthorization") : t("appsReviewSetup.registerThePublicKeyAndVerifyTheHostKey")} {t("appsReviewSetup.removingTheKeyStopsNewPaperclipConnectionsAlsoRemove")}</p>
      </>}
    </>}
    {mutation.isError && <p role="alert" className="text-sm text-destructive">{mutation.error instanceof Error ? mutation.error.message : t("appsReviewSetup.containerAccessCouldNotBeUpdated")}</p>}
  </section>;
}
