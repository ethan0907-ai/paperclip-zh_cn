import { t, useTranslation } from "@/i18n";
import { Button } from "@/components/ui/button";

export function AiConnectionLegacyNotice({
  onAdopt,
  readOnly = false,
}: {
  onAdopt: () => void;
  readOnly?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <h3 className="text-sm font-semibold">{t("aiConnectionsRestUi.text73")}</h3>
      <p className="text-sm text-muted-foreground">{t("aiConnectionsRestUi.text74")}</p>
      {!readOnly && (
        <Button variant="outline" className="self-start" onClick={onAdopt}>{t("aiConnectionsRestUi.text75")}</Button>
      )}
    </div>
  );
}
