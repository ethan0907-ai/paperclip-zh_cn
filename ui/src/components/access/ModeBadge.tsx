import { t, useTranslation } from "@/i18n";
import type { DeploymentExposure, DeploymentMode } from "@paperclipai/shared";
import { Badge } from "@/components/ui/badge";

export function ModeBadge({
  deploymentMode,
  deploymentExposure,
}: {
  deploymentMode?: DeploymentMode;
  deploymentExposure?: DeploymentExposure;
}) {
  const { t } = useTranslation();
  if (!deploymentMode) return null;

  const label =
    deploymentMode === "local_trusted"
      ? t("companyAccessUi.localTrusted")
      : t("companyAccessUi.authenticatedMode", { exposure: t(`companyAccessUi.exposures.${deploymentExposure ?? "private"}`, { defaultValue: deploymentExposure ?? "private" }) });

  return <Badge variant="outline">{label}</Badge>;
}
