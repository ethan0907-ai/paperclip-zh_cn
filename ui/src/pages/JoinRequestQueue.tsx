import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus2 } from "lucide-react";
import { accessApi } from "@/api/access";
import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useBreadcrumbs } from "@/context/BreadcrumbContext";
import { useCompany } from "@/context/CompanyContext";
import { useToast } from "@/context/ToastContext";
import { queryKeys } from "@/lib/queryKeys";

export function JoinRequestQueue() {
  const { t, i18n } = useTranslation();
  const displayValue = (value: string, keys: Record<string, string>) => keys[value] ? t(`inboxRest.${keys[value]}`) : value;
  const { selectedCompany, selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<"pending_approval" | "approved" | "rejected">("pending_approval");
  const [requestType, setRequestType] = useState<"all" | "human" | "agent">("all");

  useEffect(() => {
    setBreadcrumbs([
      { label: selectedCompany?.name ?? t("inboxRest.organization"), href: "/dashboard" },
      { label: t("inboxRest.inbox"), href: "/inbox" },
      { label: t("inboxRest.joinRequests2") },
    ]);
  }, [selectedCompany?.name, setBreadcrumbs, t]);

  const requestsQuery = useQuery({
    queryKey: queryKeys.access.joinRequests(selectedCompanyId ?? "", `${status}:${requestType}`),
    queryFn: () =>
      accessApi.listJoinRequests(
        selectedCompanyId!,
        status,
        requestType === "all" ? undefined : requestType,
      ),
    enabled: !!selectedCompanyId,
  });

  const approveMutation = useMutation({
    mutationFn: (requestId: string) => accessApi.approveJoinRequest(selectedCompanyId!, requestId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.access.joinRequests(selectedCompanyId!, `${status}:${requestType}`) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.access.companyMembers(selectedCompanyId!) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.access.companyUserDirectory(selectedCompanyId!) });
      pushToast({ title: t("inboxRest.joinRequestApproved"), tone: "success" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId: string) => accessApi.rejectJoinRequest(selectedCompanyId!, requestId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.access.joinRequests(selectedCompanyId!, `${status}:${requestType}`) });
      pushToast({ title: t("inboxRest.joinRequestRejected"), tone: "success" });
    },
  });

  if (!selectedCompanyId) {
    return <div className="text-sm text-muted-foreground">{t("inboxRest.selectAnOrganizationToReviewJoinRequests")}</div>;
  }

  if (requestsQuery.isLoading) {
    return <div className="text-sm text-muted-foreground">{t("inboxRest.loadingJoinRequests")}</div>;
  }

  if (requestsQuery.error) {
    const message =
      requestsQuery.error instanceof ApiError && requestsQuery.error.status === 403
        ? t("inboxRest.youDoNotHavePermissionToReviewJoinRequests")
        : requestsQuery.error instanceof Error
          ? requestsQuery.error.message
          : t("inboxRest.failedToLoadJoinRequests");
    return <div className="text-sm text-destructive">{message}</div>;
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <UserPlus2 className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">{t("inboxRest.joinRequestQueue")}</h1>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          {t("inboxRest.reviewHumanAndAgentJoinRequestsOutsideTheMixed")}
        </p>
      </div>

      <Card className="flex-row flex-wrap gap-3 p-4">
        <label className="space-y-2 text-sm">
          <span className="font-medium">{t("inboxRest.status")}</span>
          <select
            className="rounded-md border border-border bg-background px-3 py-2"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as "pending_approval" | "approved" | "rejected")
            }
          >
            <option value="pending_approval">{t("inboxRest.pendingApproval")}</option>
            <option value="approved">{t("inboxRest.approved")}</option>
            <option value="rejected">{t("inboxRest.rejected")}</option>
          </select>
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium">{t("inboxRest.requestType")}</span>
          <select
            className="rounded-md border border-border bg-background px-3 py-2"
            value={requestType}
            onChange={(event) =>
              setRequestType(event.target.value as "all" | "human" | "agent")
            }
          >
            <option value="all">{t("inboxRest.all")}</option>
            <option value="human">{t("inboxRest.human")}</option>
            <option value="agent">{t("inboxRest.agent")}</option>
          </select>
        </label>
      </Card>

      <div className="space-y-4">
        {(requestsQuery.data ?? []).length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
            {t("inboxRest.noJoinRequestsMatchTheCurrentFilters")}
          </div>
        ) : (
          requestsQuery.data!.map((request) => (
            <Card key={request.id} className="block p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={request.status === "pending_approval" ? "secondary" : request.status === "approved" ? "outline" : "destructive"}>
                      {displayValue(request.status, { pending_approval: "pendingApproval", approved: "approved", rejected: "rejected" })}
                    </Badge>
                    <Badge variant="outline">{displayValue(request.requestType, { human: "human", agent: "agent" })}</Badge>
                    {request.adapterType ? <Badge variant="outline">{request.adapterType}</Badge> : null}
                  </div>
                  <div>
                    <div className="text-base font-medium">
                      {request.requestType === "human"
                        ? request.requesterUser?.name || request.requestEmailSnapshot || request.requestingUserId || t("inboxRest.unknownHumanRequester")
                        : request.agentName || t("inboxRest.unknownAgentRequester")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {request.requestType === "human"
                        ? request.requesterUser?.email || request.requestEmailSnapshot || request.requestingUserId
                        : request.capabilities || request.requestIp}
                    </div>
                  </div>
                </div>

                {request.status === "pending_approval" ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => rejectMutation.mutate(request.id)}
                      disabled={rejectMutation.isPending}
                    >
                      {t("inboxRest.reject")}
                    </Button>
                    <Button
                      onClick={() => approveMutation.mutate(request.id)}
                      disabled={approveMutation.isPending}
                    >
                      {t("inboxRest.approve")}
                    </Button>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
                <div className="rounded-lg border border-border bg-background px-3 py-2">
                  <div className="text-xs font-medium uppercase tracking-wide">{t("inboxRest.inviteContext")}</div>
                  <div className="mt-2">
                    {request.invite
                      ? `${t("inboxRest.inviteTypes", { type: displayValue(request.invite.allowedJoinTypes, { human: "human", agent: "agent", both: "both" }) })}${request.invite.humanRole ? t("inboxRest.inviteRole", { role: displayValue(request.invite.humanRole, { member: "member", admin: "admin" }) }) : ""}`
                      : t("inboxRest.inviteMetadataUnavailable")}
                  </div>
                  {request.invite?.inviteMessage ? (
                    <div className="mt-2 text-foreground">{request.invite.inviteMessage}</div>
                  ) : null}
                </div>
                <div className="rounded-lg border border-border bg-background px-3 py-2">
                  <div className="text-xs font-medium uppercase tracking-wide">{t("inboxRest.requestDetails")}</div>
                  <div className="mt-2">{t("inboxRest.submittedAt", { time: new Date(request.createdAt).toLocaleString(i18n.language) })}</div>
                  <div>{t("inboxRest.sourceIp", { ip: request.requestIp })}</div>
                  {request.requestType === "agent" && request.capabilities ? <div>{request.capabilities}</div> : null}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
