import { t } from "@/i18n";

const QUOTA_LABEL_KEYS: Record<string, string> = {
  "Current session": "currentSession",
  "Current week (all models)": "currentWeekAll",
  "Current week (Sonnet only)": "currentWeekSonnet",
  "Current week (Opus only)": "currentWeekOpus",
  "Extra usage": "extraUsage",
  "5h limit": "fiveHourLimit",
  "Weekly limit": "weeklyLimit",
  Credits: "credits",
};

export function quotaWindowDisplayLabel(label: string): string {
  const key = QUOTA_LABEL_KEYS[label];
  if (key) return t(`costsUi.quotaLabels.${key}`);
  const separator = label.lastIndexOf(" · ");
  if (separator >= 0) {
    const suffix = label.slice(separator + 3);
    const suffixKey = QUOTA_LABEL_KEYS[suffix];
    if (suffixKey) return `${label.slice(0, separator)} · ${t(`costsUi.quotaLabels.${suffixKey}`)}`;
  }
  return label;
}

export function quotaWindowDetailLabel(detail: string): string {
  if (detail === "Extra usage not enabled") return t("costsUi.extraUsageDisabled");
  if (detail === "Extra usage not enabled • /extra-usage to enable") return t("costsUi.extraUsageCommand");
  if (detail === "Monthly extra usage pool") return t("costsUi.monthlyExtraUsage");
  return detail;
}

export function quotaWindowValueLabel(value: string): string {
  if (value === "Not enabled") return t("costsUi.notEnabled");
  if (value === "N/A") return t("costsUi.notAvailable");
  const remaining = /^(\$[\d,.]+) remaining$/.exec(value);
  return remaining ? t("costsUi.creditRemaining", { amount: remaining[1] }) : value;
}
