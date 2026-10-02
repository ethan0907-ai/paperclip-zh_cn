import { afterEach, describe, expect, it } from "vitest";
import { i18n } from "@/i18n";
import { resolveSkillNameText, resolveSkillSummaryText, sanitizeSkillSummaryText } from "./company-skill-summary";

afterEach(() => { void i18n.changeLanguage("en"); });

describe("company skill summary text", () => {
  it("drops stray YAML block scalar markers without rewriting other markdown", () => {
    expect(sanitizeSkillSummaryText(">")).toBeNull();
    expect(sanitizeSkillSummaryText("|")).toBeNull();
    expect(sanitizeSkillSummaryText("- Helpful summary")).toBe("- Helpful summary");
    expect(sanitizeSkillSummaryText("# Helpful summary")).toBe("# Helpful summary");
  });

  it("falls back to the skill key when requested and the summary is empty", () => {
    expect(resolveSkillSummaryText({
      name: "Humanizer",
      key: "content/humanizer",
      description: ">",
    }, { fallbackKey: true })).toBe("content/humanizer");

    expect(resolveSkillSummaryText({
      name: "humanizer",
      key: "humanizer",
      description: "|",
    }, { fallbackKey: true })).toBe("humanizer");
  });

  it("falls back from a stale tagline to a real description", () => {
    expect(resolveSkillSummaryText({
      tagline: ">",
      description: "Cleans up rough AI prose.",
      key: "content/humanizer",
      name: "Humanizer",
    })).toBe("Cleans up rough AI prose.");
  });

  it.each([
    ["paperclip", "Paperclip 任务协作", "通过 Paperclip 控制平台 API"],
    ["first-task", "首个任务引导", "当任务描述中使用 /first-task"],
    ["paperclip-board", "Paperclip 董事会管理", "通过聊天以董事会成员身份"],
    ["paperclip-converting-plans-to-tasks", "计划转任务", "将 Paperclip 计划转化"],
    ["paperclip-create-agent", "创建代理", "按照治理规则"],
    ["para-memory-files", "PARA 文件记忆", "使用基于文件的 PARA 记忆系统"],
  ])("localizes bundled %s and follows locale changes", (name, translatedName, summaryStart) => {
    const skill = { key: `paperclipai/paperclip/${name}`, name, sourceBadge: "paperclip", description: "Original summary" };
    void i18n.changeLanguage("zh-CN");
    expect(resolveSkillNameText(skill)).toBe(translatedName);
    expect(resolveSkillSummaryText(skill)).toMatch(new RegExp(`^${summaryStart}`));
    expect(skill.key).toBe(`paperclipai/paperclip/${name}`);
    void i18n.changeLanguage("en");
    expect(resolveSkillNameText(skill)).toBe(name);
    expect(resolveSkillSummaryText(skill)).toMatch(/[A-Za-z]/);
    expect(resolveSkillSummaryText(skill)).not.toMatch(/[\u4e00-\u9fff]/);
  });

  it("preserves custom skills and unknown bundled skills", () => {
    void i18n.changeLanguage("zh-CN");
    for (const skill of [
      { key: "acme/paperclip", name: "paperclip", sourceBadge: "local", tagline: "Custom summary" },
      { key: "paperclipai/paperclip/new-skill", name: "New skill", sourceBadge: "paperclip", tagline: "Custom summary" },
    ]) {
      expect(resolveSkillNameText(skill)).toBe(skill.name);
      expect(resolveSkillSummaryText(skill)).toBe("Custom summary");
    }
    expect(resolveSkillSummaryText({ key: "new-skill", sourceBadge: "paperclip" }, { fallbackKey: true })).toBe("new-skill");
  });
});
