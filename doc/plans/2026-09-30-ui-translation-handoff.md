# UI 中文翻译交接

## 本批恢复：BATCH_BLOCKED

本进程按要求仅核对上一批阻塞，不开始新翻译范围。磁盘状态为准，保留所有已有未提交改动；没有改产品代码、测试或其他文件，本批没有翻译进展。

## 阻塞与代码核对

`ui/src/pages/AgentToolsTab.tsx` 对应区域确实使用组件内 `t(...)` 输出 `agentTools.installedApps` 与 `agentTools.effectiveAccess`，因此切换语言后的显示由现有 i18n 流程处理；这不是需要通过改产品代码修正的问题。`ui/src/pages/AgentToolsTab.test.tsx` 仍断言英文 `Effective access`、`Installed apps` 等，既有 `/tmp/agent-tools-vitest.log` 摘要显示该文件 7 项中 6 项失败、1 项通过，至少包含上述旧英文断言不匹配。测试文件修改明确禁止，故此阻塞无法在本任务约束内修复；没有擅自让产品继续显示英文，也没有伪报完成。

## 文件与验证

- 本批唯一写入：`doc/plans/2026-09-30-ui-translation-handoff.md`。
- `git status --short` 显示既有多处页面、语言包、脚本及文档改动；均保留，未覆盖或回滚。
- 本批未运行测试、typecheck 或 `pnpm check:token-gates`：当前阻塞属于被禁止修改的旧测试断言，不能声称验证通过。交接中引用的是已存在日志的筛选摘要，不是本批重跑结果。
- 外部调度器仍需独立检查 en/zh-CN 重复 key、键集一致性与 token gates；本批未执行，也不声称通过。

## 未解决及后续

阻塞仅能由授权后适配过时的测试断言（或相应测试策略调整）解决；本批不能编辑测试，因此状态为 BATCH_BLOCKED。产品 UI 中文化仍未整体完成，禁止报告 ALL_DONE。解除阻塞后，下一批唯一产品代码范围仍为 `ui/src/pages/CaseDetail.tsx` 中交接此前指定的最前一个独立 Dialog，仅处理局部 3–6 条文案并同步 en/zh-CN；本批未进入该范围。