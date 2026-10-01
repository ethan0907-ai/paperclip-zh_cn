import { t } from "@/i18n";

const PLUGIN_STATUS_KEYS: Record<string, string> = {
  installed: "pluginManager.statusInstalled",
  ready: "pluginManager.statusReady",
  disabled: "pluginManager.statusDisabled",
  error: "pluginManager.statusError",
  upgrade_pending: "pluginManager.statusUpgradePending",
  uninstalled: "pluginManager.statusUninstalled",
};

export function pluginStatusDisplay(status: string): string {
  return PLUGIN_STATUS_KEYS[status] ? t(PLUGIN_STATUS_KEYS[status]) : status;
}
