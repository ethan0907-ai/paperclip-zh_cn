import type { Resource } from "i18next";

import { validateLocaleMessages } from "./locale-validation";

export const DEFAULT_LOCALE = "zh-CN" as const;

const localeModules = import.meta.glob("./locales/*.json", {
  eager: true,
  import: "default",
}) as Record<string, unknown>;

export const localeMessages = Object.fromEntries(
  Object.entries(localeModules).map(([path, messages]) => {
    const locale = path.match(/\/([A-Za-z0-9_-]+)\.json$/)?.[1];
    if (!locale) {
      throw new Error(`Invalid locale file path: ${path}`);
    }
    return [locale, messages];
  }),
);

if (!(DEFAULT_LOCALE in localeMessages)) {
  throw new Error(`Missing default locale messages for ${DEFAULT_LOCALE}`);
}

for (const [locale, messages] of Object.entries(localeMessages)) {
  // Only the default locale must be complete (exact key match with English).
  // Other locales may omit keys — i18next falls back to English — so we only
  // validate the keys they DO provide.
  try {
    const errors = validateLocaleMessages(messages, localeMessages["en"], {
      strict: locale === DEFAULT_LOCALE,
    });
    if (errors.length > 0) {
      throw new Error(`Invalid ${locale} locale messages:\n${errors.join("\n")}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid ${locale} locale messages: ${message}`);
  }
}
export const supportedLocales = Object.keys(localeMessages);

export const i18nextResources: Resource = Object.fromEntries(
  Object.entries(localeMessages).map(([locale, messages]) => [locale, { translation: messages }]),
) as Resource;

export type SupportedLocale = keyof typeof localeMessages;
