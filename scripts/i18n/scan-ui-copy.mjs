#!/usr/bin/env node
// Read-only inventory: candidates need review; protocol values and user data stay unchanged.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
// Reuse the parser already installed for Vite's React plugin; no new dependency.
const reactRequire = createRequire(createRequire(resolve(root, "ui/package.json")).resolve("@vitejs/plugin-react"));
const { parse } = createRequire(reactRequire.resolve("@babel/core"))("@babel/parser");
const excluded = /(?:\.(?:test|spec|stories)\.|\/(?:__tests__|__snapshots__|fixtures?|test|tests|storybook)\/)/i;
const copyFields = /^(?:title|subtitle|label|description|body|footnote|caption|placeholder|aria-label|ariaLabel|alt|tooltip|emptyMessage|emptyHint|message|errorMessage|helperText|help|confirmLabel|cancelLabel)$/;
const english = /[A-Za-z]{2}/;

export function candidates(source, filename = "example.tsx", references = []) {
  const tree = parse(source, { sourceType: "unambiguous", plugins: filename.endsWith("tsx") ? ["typescript", "jsx"] : ["typescript"] });
  const found = new Map();
  function add(node, text, kind) {
    text = text.replace(/\s+/g, " ").trim();
    if (text && english.test(text.replace(/\{\{expression\}\}/g, "")) &&
        !/^[a-z][\w-]*(?:\.[\w-]+)+$/.test(text)) found.set(node.start, { line: node.loc.start.line, text, kind });
  }
  function rendered(node, kind) {
    if (!node) return;
    if (node.type === "StringLiteral") add(node, node.value, kind);
    else if (node.type === "TemplateLiteral") {
      add(node, node.quasis.map((q, i) => q.value.cooked + (i < node.expressions.length ? "{{expression}}" : "")).join(""), kind);
    } else if (node.type === "JSXExpressionContainer") rendered(node.expression, kind);
    else if (node.type === "ConditionalExpression") {
      rendered(node.consequent, kind);
      rendered(node.alternate, kind);
    } else if (node.type === "LogicalExpression") rendered(node.right, kind);
    else if (node.type === "BinaryExpression" && node.operator === "+") {
      rendered(node.left, kind);
      rendered(node.right, kind);
    }
  }
  function visit(node, parent) {
    if (!node || typeof node !== "object") return;
    if (node.type === "JSXText") add(node, node.value, "jsx");
    if (node.type === "JSXAttribute" && copyFields.test(node.name.name)) rendered(node.value, "attribute");
    if (node.type === "JSXExpressionContainer" && parent?.type !== "JSXAttribute") rendered(node.expression, "expression");
    if (node.type === "ObjectProperty" && !node.computed && copyFields.test(node.key.name ?? node.key.value)) rendered(node.value, "copy-field");
    if (node.type === "AssignmentPattern" && node.left.type === "Identifier" && copyFields.test(node.left.name)) rendered(node.right, "copy-default");
    if (node.type === "JSXAttribute" && node.name.name === "i18nKey" && node.value?.type === "StringLiteral") references.push({
      key: node.value.value, line: node.loc.start.line,
      plural: parent?.type === "JSXOpeningElement" && parent.attributes.some((attr) => attr.name?.name === "count"),
    });
    if (node.type === "CallExpression" && node.callee.type === "Identifier" && /^(?:setError|setFormError|alert|confirm)$/.test(node.callee.name)) rendered(node.arguments[0], "feedback");
    if (node.type === "CallExpression" && (node.callee.type === "Identifier" && node.callee.name === "t" ||
        node.callee.type === "MemberExpression" && node.callee.object.name === "i18n" && node.callee.property.name === "t") &&
        node.arguments[0]?.type === "StringLiteral") references.push({
          key: node.arguments[0].value, line: node.loc.start.line,
          plural: node.arguments[1]?.type === "ObjectExpression" && node.arguments[1].properties.some((p) => (p.key?.name ?? p.key?.value) === "count"),
        });
    for (const [key, value] of Object.entries(node)) {
      if (["loc", "tokens", "comments", "extra"].includes(key)) continue;
      if (Array.isArray(value)) value.forEach((child) => visit(child, node));
      else if (value && typeof value === "object" && value.type) visit(value, node);
    }
  }
  visit(tree);
  return [...found.values()];
}

function selfTest() {
  const result = candidates(`const status = "running"; const x = <><p>Hello world {name}</p><input placeholder="Your name" className="text-sm"/><p>{ok ? "Saved" : "Save failed"}</p><p>{t("already.translated")}</p></>;`);
  assert.deepEqual(result.map((x) => x.text), ["Hello world", "Your name", "Saved", "Save failed"]);
  assert.equal(candidates('const help = { label: "Execution engine", value: "acp" };')[0].text, "Execution engine");
  assert.deepEqual(candidates('const help = { body: "More details", footnote: "Keep existing data" }; function X({ emptyHint = "No entries" }) { return <X ariaLabel="Choose an entry" />; }').map((x) => x.text), ["More details", "Keep existing data", "No entries", "Choose an entry"]);
  assert.equal(candidates('const key = { label: "appTestPanel.allowed" };').length, 0);
  assert.equal(candidates('const view = <p>{`${name}`}</p>;').length, 0);
  assert(excluded.test("ui/src/pages/X.test.tsx"));
  assert(!excluded.test("ui/src/pages/apps/app-detail/TestPanel.tsx"));
  const references = [];
  candidates('const text = t("items", { count: 2 });', "example.ts", references);
  assert.equal(references[0].plural, true);
  const richReferences = [];
  candidates('<Trans i18nKey="items" count={2} />', "example.tsx", richReferences);
  assert.equal(richReferences[0].key, "items");
  assert.equal(richReferences[0].plural, true);
  console.log("Copy inventory self-check passed: JSX, attributes, conditional text, copy fields, test exclusion.");
}

function inventory() {
  const paths = execFileSync("rg", ["--files", "ui/src"], { cwd: root, encoding: "utf8" }).trim().split("\n")
    .filter((p) => /\.[tj]sx?$/.test(p) && !excluded.test(p) && !p.includes("/i18n/"));
  const files = [], errors = [], references = [];
  for (const path of paths) {
    try {
      const source = readFileSync(resolve(root, path), "utf8"), keys = [];
      const items = candidates(source, path, keys);
      if (/from\s+["'][^"']*(?:i18n|react-i18next)["']/.test(source)) references.push(...keys.map((key) => ({ path, ...key })));
      if (items.length) files.push({ path, count: items.length, items, surface: /DesignGuide|UxLab|Preview|demo/i.test(path) ? "演示/预览，后置复核" : "产品候选" });
    } catch (error) { errors.push({ path, message: error.message }); }
  }
  files.sort((a, b) => b.count - a.count || a.path.localeCompare(b.path));
  return { scannedFiles: paths.length, candidateCount: files.reduce((sum, f) => sum + f.count, 0), candidateFiles: files.length, errors, files, references };
}

if (process.argv.includes("--self-test")) selfTest();
else {
  const report = inventory();
  if (process.argv.includes("--check-keys")) {
    const en = JSON.parse(readFileSync(resolve(root, "ui/src/i18n/locales/en.json"), "utf8"));
    const lookup = (key) => key.split(".").reduce((node, name) => node?.[name], en);
    const missing = report.references.filter(({ key, plural }) => typeof lookup(key) !== "string" &&
      !(plural && typeof lookup(`${key}_one`) === "string" && typeof lookup(`${key}_other`) === "string"));
    for (const ref of missing) console.error(`${ref.path}:${ref.line}: missing literal translation key ${ref.key}`);
    console.log(`Checked ${report.references.length} literal translation references; ${missing.length} missing keys. Dynamic keys need manual review.`);
    if (missing.length) process.exitCode = 1;
  } else if (process.argv.includes("--json")) console.log(JSON.stringify(report, null, 2));
  else if (process.argv.includes("--markdown")) {
    console.log(`扫描 ${report.scannedFiles} 个产品源文件，${report.candidateFiles} 个文件有 ${report.candidateCount} 处英文候选。解析失败：${report.errors.length}。`);
    console.log("\n此清单是候选索引，包含专名/技术示例，并非待翻译总数。还需复核动态映射、外部组件和运行时错误；候选为零不能单独作为 ALL_DONE 证据。测试、快照、fixture、stories 已排除。TestPanel 是产品页面，仍在范围内。\n");
    console.log("| 文件 | 候选数 | 范围 |\n|---|---:|---|");
    for (const f of report.files) console.log(`| \`${f.path}\` | ${f.count} | ${f.surface} |`);
    for (const e of report.errors) console.log(`\n解析失败：\`${e.path}\` — ${e.message.replace(/\n/g, " ")}`);
  } else {
    console.log(`Scanned ${report.scannedFiles} files; ${report.candidateCount} candidates in ${report.candidateFiles} files; ${report.errors.length} parse errors.`);
    for (const f of report.files.slice(0, 25)) console.log(`${f.count}\t${f.path}`);
    for (const e of report.errors) console.error(`${e.path}: ${e.message}`);
  }
  if (report.errors.length) process.exitCode = 1;
}
