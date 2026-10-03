import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/i18n";
import { chatEndpointsApi } from "../../api/chatEndpoints";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useRoutineDetail } from "./context";

export function TelegramDelivery() {
  const { t } = useTranslation();
  const { companyId, editDraft, setEditDraft } = useRoutineDetail();
  const recipients = useQuery({
    queryKey: ["routine-telegram-recipients", companyId],
    queryFn: async () => {
      const endpoints = (await chatEndpointsApi.list(companyId))
        .filter((endpoint) => endpoint.provider === "telegram" && endpoint.status === "active");
      return (await Promise.all(endpoints.map(async (endpoint) =>
        (await chatEndpointsApi.listConversations(endpoint.id))
          .filter((conversation) => ["active", "waiting", "completed"].includes(conversation.state))
          .map((conversation) => ({
            endpointId: endpoint.id, conversationId: conversation.id,
            label: `${endpoint.botLabel ?? endpoint.botUsername ?? endpoint.assignedAgentName} · ${conversation.externalLabel}`,
          })),
      ))).flat();
    },
  });
  const current = editDraft.telegramDelivery;
  const selected = current ? `${current.endpointId}/${current.conversationId}` : "none";
  return (
    <div className="space-y-3">
      <label id="routine-telegram-label" className="text-sm font-medium">{t("routineTelegram.label")}</label>
      <p className="text-sm text-muted-foreground">{t("routineTelegram.help")}</p>
      <Select value={selected} disabled={recipients.isPending || recipients.isError} onValueChange={(value) => {
        const recipient = recipients.data?.find((item) => `${item.endpointId}/${item.conversationId}` === value);
        setEditDraft((draft) => ({ ...draft, telegramDelivery: recipient
          ? { endpointId: recipient.endpointId, conversationId: recipient.conversationId } : null }));
      }}>
        <SelectTrigger aria-labelledby="routine-telegram-label" className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{t("routineTelegram.disabled")}</SelectItem>
          {current && !recipients.data?.some((item) => `${item.endpointId}/${item.conversationId}` === selected)
            && <SelectItem value={selected}>{t("routineTelegram.unavailable")}</SelectItem>}
          {recipients.data?.map((item) => <SelectItem key={`${item.endpointId}/${item.conversationId}`} value={`${item.endpointId}/${item.conversationId}`}>{item.label}</SelectItem>)}
        </SelectContent>
      </Select>
      {recipients.isPending && <p className="text-sm text-muted-foreground">{t("routineTelegram.loading")}</p>}
      {recipients.isError && <div role="alert" className="space-y-2">
        <p className="text-sm text-destructive">{t("routineTelegram.loadError")}</p>
        <Button variant="outline" size="sm" onClick={() => void recipients.refetch()}>{t("routineTelegram.retry")}</Button>
      </div>}
      {!recipients.isPending && !recipients.isError && recipients.data?.length === 0
        && <p className="text-sm text-muted-foreground">{t("routineTelegram.empty")}</p>}
    </div>
  );
}
