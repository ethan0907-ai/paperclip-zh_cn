import { t, useTranslation } from "@/i18n";
import { SetupWizardNavigation, SetupWizardSidebar } from "../SetupWizard";
export { SetupWizardSidebar as ChatSetupSidebar };
export function ChatSetupNavigation(props: {
  labels?: string[]; step: number; availableStep: number; disabled?: boolean; onSelect: (step: number) => void;
}) {
  const { t } = useTranslation();
  return <SetupWizardNavigation {...props} labels={props.labels ?? [t("chatSidePanels.choose_agent"), t("chatSidePanels.connect_provider"), t("chatSidePanels.try_it")]} ariaLabel={t("chatSidePanels.connection_setup_progress")} />;
}
