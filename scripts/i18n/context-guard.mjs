import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const OUTPUT_LIMIT = 4000;
export function contextLimits(contextWindow = 65536) {
  return contextWindow >= 131072
    ? { wrapTokens: 80000, stopTokens: 100000, wrapTurns: 40, stopTurns: 55 }
    : { wrapTokens: 38000, stopTokens: 48000, wrapTurns: 20, stopTurns: 35 };
}
export function shouldWrapUp(tokens, turns, contextWindow) {
  const limits = contextLimits(contextWindow);
  return tokens >= limits.wrapTokens || turns >= limits.wrapTurns;
}

// Explicitly loaded only by this scheduler, not installed globally.
export default function contextGuard(pi) {
  let turns = 0;
  let wrapping = false;
  let outputDirectory;
  let serial = 0;
  pi.on("session_start", () => {
    const tools = pi.getAllTools().filter((tool) =>
      ["read", "bash", "edit", "write"].includes(tool.name) ||
      /^ctx_(execute|execute_file|batch_execute|search)$/.test(tool.name) ||
      /context.mode.*(execute|execute_file|batch_execute|search)$/.test(tool.name),
    ).map((tool) => tool.name);
    pi.setActiveTools(tools);
    console.error("CONTEXT_GUARD_TOOLS: " + tools.join(", "));
  });
  pi.on("tool_result", (event) => {
    const text = event.content.filter((part) => part.type === "text")
      .map((part) => part.text).join("\n");
    if (text.length <= OUTPUT_LIMIT) return;
    outputDirectory ??= fs.mkdtempSync(path.join(os.tmpdir(), "pi-i18n-output-"));
    const saved = path.join(outputDirectory, String(++serial) + ".txt");
    fs.writeFileSync(saved, text);
    return {
      content: [{
        type: "text",
        text: text.slice(0, 2800) + "\n[OUTPUT LIMITED: " + text.length +
          " characters. Full result saved at " + saved +
          ". Query only relevant lines; do not reread the whole file.]\n" + text.slice(-600),
      }],
    };
  });
  pi.on("turn_end", (_event, ctx) => {
    turns++;
    const usage = ctx.getContextUsage();
    const contextWindow = usage?.contextWindow ?? ctx.model?.contextWindow;
    const tokens = usage?.tokens ?? 0;
    const limits = contextLimits(contextWindow);
    if (tokens >= limits.stopTokens || turns >= limits.stopTurns) {
      console.error("CONTEXT_GUARD_STOP: input=" + tokens + "; turns=" + turns);
      ctx.abort();
      return;
    }
    if (!wrapping && shouldWrapUp(tokens, turns, contextWindow)) {
      wrapping = true;
      pi.sendUserMessage(
        "上下文保护已触发。立即停止搜索和扩展范围，只检查当前已改文件是否完整。" +
        "若已完成一个小批，保存简短交接并输出 BATCH_COMPLETE；" +
        "若未完成，保存具体未完成项并输出 BATCH_BLOCKED。" +
        "不得读取大文件、全量 diff 或运行额外全仓库检查。结束本会话。",
        { deliverAs: "steer" },
      );
    }
  });
}
