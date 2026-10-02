import { afterEach, expect, it } from "vitest";
import { APP_DEFINITIONS, getAppStoreDefinition } from "@paperclipai/shared";
import { i18n } from "@/i18n";
import zh from "@/i18n/locales/zh-CN.json";
import { appDefinitionDescription, appDefinitionName } from "./app-definition-display";

afterEach(() => { i18n.changeLanguage("en"); });

it("localizes catalog descriptions while preserving names and custom descriptions", () => {
  i18n.changeLanguage("zh-CN");
  expect(Object.keys(zh.appDescriptions).sort()).toEqual(APP_DEFINITIONS.map((entry) => entry.slug).sort());
  for (const entry of APP_DEFINITIONS) {
    const { slug } = entry;
    const description = zh.appDescriptions[slug as keyof typeof zh.appDescriptions];
    expect(appDefinitionDescription(entry), slug).toBe(description);
    expect(description, slug).not.toBe(entry.description);
    expect(appDefinitionName(entry), slug).toBe(entry.name);
    expect(appDefinitionDescription({ ...entry, description: "My custom description" })).toBe("My custom description");
  }
  const openai = getAppStoreDefinition("openai")!;
  expect(appDefinitionDescription({ ...openai, slug: "custom-server", description: "Custom MCP server" })).toBe("Custom MCP server");
  expect(appDefinitionDescription(null)).toBe("");
  i18n.changeLanguage("en");
  expect(appDefinitionDescription(openai)).toBe(openai.description);
});
