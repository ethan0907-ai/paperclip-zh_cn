# UI 翻译交接文档

## 调度机制（2026-07-22 建立）
- 批次执行由外部串行调度器 `scripts/i18n/batch-scheduler.sh` 驱动，每批启动独立 `pi -p --session-id i18n-batch-<date>-<n>-<pid>` 进程（无 -c/-r/--fork，不复用会话）。
- 批次任务书：`doc/plans/translation-batch-prompt.txt`。每批只做"下一批唯一范围"（15–25 条），完成后整体重写本文件（≤1000 字），调度器据 本文件 md5 + git 变更 验证进展；无进展/失败/达上限即停。
- 自动压缩已在本项目关闭（`.pi/settings.json`：`compaction.enabled=false`）。停止边界以"完成一个小范围"为准，不依赖上下文用量。
- 当前进度基线：`en.json` 与 `zh-CN.json` 键集一致（各 743 keys，无缺 key）；磁盘上已有大量未提交翻译改动，全部保留。

## 本批次完成项
- 建立了会话轮换与调度机制（本文件上一节）。

## 未完成项
- 翻译剩余组件（见下方下一批范围起逐步推进）。

## 验证结果
- `ui/src/i18n/locales/en.json` 与 `zh-CN.json` 键集一致性脚本检查：通过（743/743，缺 0，identical 1）。
- typecheck/token-gates 自上次记录后未重新运行（本批未改动产品代码）。

## 下一批唯一范围
**仅** `ui/src/pages/AgentToolsTab.tsx`：
1. 用 grep 定位该文件中未走 `t()` 的硬编码英文用户可见字符串（含子组件）。
2. 翻译其中 15–25 条；命名空间沿用 `agentTools.*`（若组件已用其他前缀则沿用现有前缀）。
3. 在 en.json / zh-CN.json 同步新增 key。

## 约束提醒
1. 只使用 pnpm；不提交、不推送
2. 只同步 en.json / zh-CN.json，不动其他语言
3. 暂不修改测试文件、快照、fixture（测试适配问题只记录）
4. 每次批次结束更新本交接文档（整体重写，≤1000 字）
5. 使用 context-mode（ctx_execute 等）过滤输出，不整文件读入大语言包
6. 子组件各自调用 useTranslation；动态 key 用映射对象；HTML 用 dangerouslySetInnerHTML

## 技术笔记
- i18n 入口：`ui/src/i18n/index.ts`；locale 文件在 `ui/src/i18n/locales/`
- 键集一致性检查：对两个 json 做 flatten 后 diff 键集
- 调度器日志：`doc/plans/.translation-batch-scheduler.log`；批次输出：`doc/plans/.translation-runs/`

## 历史进度（保留摘要）
- 已完成：导航翻译（labelKey）、AgentDetail 全家桶（~520+ 键）、RunDetail、LogViewer、ExecutionWorkspaceDetail、IssueDetail、Routines、ScheduleEditor、Inbox、NewIssueDialog、CompanySwitcher、Workspaces、WhatNeedsMe、Auth、NotFound、BoardClaim、CliAuth、AgentChat、AgentActionButtons 等（详见 git 未提交改动）
- 已知未处理：AgentDetail.production.tsx（仅测试引用，可选）；大文件（CaseDetail、BoardChat、AgentToolsTab 等）按区域逐批处理
