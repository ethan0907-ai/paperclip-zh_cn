import { useEffect } from "react";
import { useTranslation } from "@/i18n";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { NewAgentSetup } from "../components/new-agent/NewAgentSetup";

export function NewAgent() {
  const { t } = useTranslation();
  const { setBreadcrumbs } = useBreadcrumbs();
  useEffect(() => {
    setBreadcrumbs([
      { label: t("agents.breadcrumb"), href: "/agents" },
      { label: t("sidebarPickersUi.text34") },
    ]);
  }, [setBreadcrumbs, t]);
  return <NewAgentSetup />;
}
