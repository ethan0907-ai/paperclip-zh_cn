import { afterEach, describe, expect, it } from "vitest";
import { i18n } from "@/i18n";
import en from "@/i18n/locales/en.json";
import { pluginDescriptionDisplay, pluginNameDisplay } from "./plugin-display";

afterEach(() => { void i18n.changeLanguage("en"); });

describe("bundled plugin display", () => {
  it.each(Object.entries(en.bundledPlugins))("localizes %s and restores English", (key, messages) => {
    const packageName = `@paperclipai/${key}`;
    void i18n.changeLanguage("zh-CN");
    expect(pluginNameDisplay(packageName, messages.name)).toMatch(/[\u4e00-\u9fff]/);
    expect(pluginDescriptionDisplay(packageName, messages.description)).toMatch(/[\u4e00-\u9fff]/);
    void i18n.changeLanguage("en");
    expect(pluginNameDisplay(packageName, messages.name)).toBe(messages.name);
    expect(pluginDescriptionDisplay(packageName, messages.description)).toBe(messages.description);
  });

  it("preserves brand names and falls back for unknown plugins", () => {
    void i18n.changeLanguage("zh-CN");
    expect(pluginNameDisplay("@paperclipai/plugin-cloudflare-sandbox")).toBe("Cloudflare 沙箱提供方");
    for (const packageName of ["@acme/plugin-modal", "@paperclipai/plugin-unknown"]) {
      expect(pluginNameDisplay(packageName, "Custom plugin")).toBe("Custom plugin");
      expect(pluginDescriptionDisplay(packageName, "Custom description")).toBe("Custom description");
      expect(pluginNameDisplay(packageName)).toBe(packageName);
      expect(pluginDescriptionDisplay(packageName)).toBe("");
    }
  });
});
