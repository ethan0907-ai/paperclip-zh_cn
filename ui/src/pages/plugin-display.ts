import { t } from "@/i18n";

export function pluginNameDisplay(packageName: string, displayName?: string | null): string {
  return t(`bundledPlugins.${packageName.replace(/^@paperclipai\//, "")}.name`, { defaultValue: displayName ?? packageName });
}

export function pluginDescriptionDisplay(packageName: string, description?: string | null): string {
  return t(`bundledPlugins.${packageName.replace(/^@paperclipai\//, "")}.description`, { defaultValue: description ?? "" });
}

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
