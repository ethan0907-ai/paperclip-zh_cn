import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import contextGuard, { OUTPUT_LIMIT, contextLimits, shouldWrapUp } from "./context-guard.mjs";

assert.equal(shouldWrapUp(37999, 19), false);
assert.equal(shouldWrapUp(38000, 1), true);
assert.equal(shouldWrapUp(0, 20), true);
assert.equal(shouldWrapUp(79999, 39, 272000), false);
assert.equal(shouldWrapUp(80000, 1, 272000), true);
assert.equal(shouldWrapUp(0, 40, 272000), true);
assert.equal(contextLimits(131071).stopTokens, 48000);
assert.equal(contextLimits(131072).stopTokens, 100000);
const handlers = new Map();
const messages = [];
const pi = {
  on: (name, handler) => handlers.set(name, handler),
  sendUserMessage: (...args) => messages.push(args),
  getAllTools: () => ["read", "bash", "edit", "write", "ctx_execute", "hindsight_reflect"]
    .map((name) => ({ name })),
  setActiveTools: (names) => {
    assert.deepEqual(names, ["read", "bash", "edit", "write", "ctx_execute"]);
  },
};
contextGuard(pi);
handlers.get("session_start")();
const source = "A".repeat(12000) + "\nEND";
const output = handlers.get("tool_result")({ content: [{ type: "text", text: source }] });
const text = output.content[0].text;
assert.ok(text.length < OUTPUT_LIMIT);
assert.ok(text.endsWith("END"));
const saved = text.match(/Full result saved at (.+?)\. Query/)[1];
assert.equal(fs.readFileSync(saved, "utf8"), source);
fs.rmSync(path.dirname(saved), { recursive: true });
assert.equal(handlers.get("tool_result")({ content: [{ type: "text", text: "short" }] }), undefined);
let aborted = false;
const ctx = { getContextUsage: () => ({ tokens: 39000 }), abort: () => { aborted = true; } };
handlers.get("turn_end")({}, ctx);
handlers.get("turn_end")({}, ctx);
assert.equal(messages.length, 1);
assert.equal(messages[0][1].deliverAs, "steer");
ctx.getContextUsage = () => ({ tokens: 48000 });
handlers.get("turn_end")({}, ctx);
assert.equal(aborted, true);
messages.length = 0;
aborted = false;
contextGuard(pi);
// Model metadata is the fallback when usage does not report the window.
ctx.model = { contextWindow: 272000 };
ctx.getContextUsage = () => ({ tokens: 79999 });
handlers.get("turn_end")({}, ctx);
assert.equal(messages.length, 0);
assert.equal(aborted, false);
ctx.getContextUsage = () => ({ tokens: 80000, contextWindow: 272000 });
handlers.get("turn_end")({}, ctx);
handlers.get("turn_end")({}, ctx);
assert.equal(messages.length, 1);
ctx.getContextUsage = () => ({ tokens: 100000, contextWindow: 272000 });
handlers.get("turn_end")({}, ctx);
assert.equal(aborted, true);
messages.length = 0;
aborted = false;
contextGuard(pi);
ctx.getContextUsage = () => ({ tokens: 0, contextWindow: 272000 });
for (let turn = 0; turn < 39; turn++) handlers.get("turn_end")({}, ctx);
assert.equal(messages.length, 0);
handlers.get("turn_end")({}, ctx);
assert.equal(messages.length, 1);
for (let turn = 40; turn < 55; turn++) handlers.get("turn_end")({}, ctx);
assert.equal(aborted, true);
console.log("Context guard check passed: output cap, small/large windows, metadata fallback, wrap-up once, token/turn abort.");
