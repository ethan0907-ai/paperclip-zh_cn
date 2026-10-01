import { t, useTranslation } from "@/i18n";
import { useState } from "react";
import { AiConnectionPicker } from "./AiConnectionPicker";
import { LocalProviderLoginInstructions, ProviderApiKeyCard } from "@/components/AdapterLoginChrome";
import type {
  AiConnectionBinding,
  AiConnectionRequirement,
  AiConnectionSummary,
} from "./model";

const requirement: AiConnectionRequirement = {
  companyId: "design-example",
  provider: "anthropic",
  method: "subscription",
};
const account: AiConnectionSummary = {
  ...requirement,
  method: "subscription",
  id: "example",
  grantId: "example-grant",
  get name() { return t("designGuide.myClaudeSubscription"); },
  ownership: "personal",
  ownerUserId: "example-user",
  get ownerName() { return t("designGuide.you"); },
  status: "connected",
  isDefault: true,
};

export function AiConnectionDesignExamples() {
  const { t } = useTranslation();
  const [binding, setBinding] = useState<AiConnectionBinding>({
    provider: "anthropic",
    method: "subscription",
    mode: "responsible_user",
  });
  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <p className="text-sm text-muted-foreground">{t("aiConnectionsRestUi.text1")}</p>
      <p className="text-sm text-muted-foreground">{t("aiConnectionsRestUi.text2")}</p>
      <AiConnectionPicker
        requirement={requirement}
        connections={[account]}
        value={binding}
        currentUserId="example-user"
        agentId="example-agent"
        agentName="Nova"
        onChange={setBinding}
        readOnly
        onConnect={() => {}}
      />
      <ProviderApiKeyCard
        providerName="OpenAI"
        value=""
        disabled
        onChange={() => {}}
        onSubmit={() => {}}
        placeholder={t("aiConnectionsRestUi.text3")}
      />
      <LocalProviderLoginInstructions
        adapterType="claude_local"
        login={{ isolated: true, preparing: false, status: "sign_in_required", error: null,
          command: "CLAUDE_CONFIG_DIR='/example/connection-login' claude auth login", retry: () => {} }}
      />
    </div>
  );
}
