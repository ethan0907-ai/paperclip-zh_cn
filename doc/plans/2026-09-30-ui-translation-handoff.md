# Parallel translation handoff

## 2026-10-01 执行规则（当前生效）

用户已批准：沿用已有 i18next，先建立全量候选清单，再按完整组件/功能块批量补齐中文；本文件是唯一进度与记忆文档，禁止每批覆盖固定规则、清单和历史。现有未提交修改必须保留，不提交、不推送、不切分支。

- 范围：ui/src 的 pages、components、adapters、features，以及 lib/hooks/context/plugins 中实际显示给用户的固定文案。两个 UI 版本（普通页面与 .production）都要检查。设计/预览/UX lab 后置复核，不默认视为已完成。
- 排除：测试、spec、快照、fixture、stories。TestPanel.tsx 等产品的连接测试面板仍在范围内。保留协议枚举、配置键、URL/路径、代码示例、品牌/产品/模型名和用户/代理生成内容。
- 优先级：公共组件和配置表单 → 主要业务页 → Apps/连接/技能/流水线/设置 → 演示页与长尾。每批完整组件或独立功能块约 50–100 条；大模块分区，可按上下文缩小，不为凑数扩大范围。
- 代码：复用 @/i18n 的 useTranslation，组件外使用导出 t；显示标签在渲染时计算，避免切换语言后仍保留旧值。保留 API 值，动态数量、人名等用插值；en/zh-CN 同步新增键，其余语言不动。
- 并行：按文件隔离，语言包按键合并，主目录变动时停止合并；worker 只写本批简短报告，由主流程追加到本文件。禁止同时启动两个调度器或让独立编辑器写同一批文件。
- 每轮静态检查：JSON 重复键/键集、插值、静态词库引用、UI typecheck、token gates。测试文件不翻译。2026-10-01 用户最新明确要求跳过构建、测试和语言切换核查；不再运行这些项目，也不将未执行项记为通过。此前已执行结果保留为历史记录。
- 完成标准：候选扫描只辅助定位；复核动态映射、错误提示、日期/数量与语言切换，并为保留英文的项说明理由。候选为零或单页完成均不能直接报告 ALL_DONE。

### 当前完成状态（2026-10-01 21:02）

本轮剩余固定 UI 中文文案补齐工作已完成，三路 worker 的稳定词库全部合入，当前没有待合并批次。en/zh-CN 各17411叶键、键集一致；测试/spec/fixture/stories/snapshot文件未修改，API值、协议、用户内容、品牌及外部门户精确菜单保留。UI typecheck、静态翻译键、JSON重复键、token gates与diff检查通过。按用户要求跳过构建、测试和浏览器语言切换核查；不声称这些运行验证通过。没有提交、推送或创建PR，修改留在工作区。

恢复入口：先读本节与文档末尾最新批次，再运行 `node scripts/i18n/scan-ui-copy.mjs`；需要某文件的具体候选，用 `--json` 输出并由 Python 按路径筛选，避免读取整个词库/清单。使用 pnpm。Hindsight 服务本轮连接失败，本地文档仍是进度依据。

### 本轮所有权

主流程：清单/脚本/词库合并/统一验证及公共时间/状态显示；三路 worker 持续按模块推进：配置/密钥/技能页、任务属性/交互/恢复/聊天组件、连接流程/Apps 页。worker 新词库按模块暂存 /private/tmp/paperclip-i18n-<module>-{en,zh}.json，完成后由主流程即时合入 en.json/zh-CN.json。未合并的临时词库不等于已完成。本会话总执行位上限 4（含主流程），已用满。

### 已有进度基线

9 月 30 日 `6d3260e81` 建立主要中文支持，10 月 1 日 `dce4e1a7b`、`c7ddda345` 继续补齐。启动时词库各 1214 叶子键，键集一致且没有重复键。CompanySkills 两版、Routines.production、InviteLanding、SummarySlotCard 有未提交翻译，保留。此前记载的英文断言失败仍未处理；不声称全仓测试/构建通过。上轮正则扫描约 4869 个候选不是剩余总数，本轮改用既有 Babel parser 分析 JSX/属性/条件文本/文案字段，覆盖更完整。

## 合并类型检查失败恢复（2026-10-01）

已恢复 `parallel-50c798db-c087-475b-9b60-cc63172071bc` 两名 worker 的翻译到主目录：CompanySkills.production.tsx 三处文案复用已有键；SummarySlotCard.tsx 摘要状态、暂停/失败提示、生成按钮、更新时间与版本选择等文案使用 summarySlot 键，两份语言包同步新增 25 个叶子键。恢复前确认这四个文件与 worker 索引基线一致，保留其他未提交修改；原始隔离副本、merged 副本及日志仍保留。未重启 Pi。

类型检查停止原因是 SummarySlotCard.tsx 的工作任务链接前，翻译替换将 JSX 空格表达式 `{" "}` 留成未闭合的 `{`。恢复时补回空格表达式，未改变生成逻辑、动态任务标题或链接。

验证：pnpm -C ui typecheck、pnpm check:token-gates、两份语言包严格重复键与叶子键集一致性检查均通过。由 ui 目录运行 pnpm exec vitest run src/components/SummarySlotCard.status.test.tsx src/components/SummarySlotCard.test.tsx，结果为 7 通过、9 失败；失败断言查找英文摘要文案/版本标签，而实际渲染已为中文。未修改测试、快照或 fixture；未运行全仓 typecheck/test/build。首次从仓库根指定 ui 配置的测试命令因 setup 文件解析到错误目录而未执行用例，已改为 ui 目录运行并获得上述结果。

下一批唯一产品范围：CompanySkills.production.tsx 中仍未翻译的 DISCOVERY_SORT_LABELS 五个英文排序标签及两处渲染（恢复前已检查，后续执行时核对局部现状）。不要重复本次恢复的摘要状态区域或 DiscoveryGrid 三处文案。以前记录保留，恢复状态以本节为准。

## ui/src/pages/CompanySkills.production.tsx
# Paperclip UI 中文翻译交接

## 本批完成：CompanySkills CategoryNav

本隔离批次只处理 `ui/src/pages/CompanySkills.production.tsx` 的 `CategoryNav`（980–1021 行），未改 SkillCard、DiscoveryGrid 其它区域或其它产品文件。为导航添加了无障碍名称，复用现有 `companySkills.browseByCategory` 翻译键；该键在 en/zh-CN 已有对应翻译，无需新增语言键。原有“全部”标签继续使用 `companySkills.tabAll`。分类 slug 与数量是动态数据，保留原样；该区域不存在其它固定空类别/默认状态提示。

## 文件与验证

- `ui/src/pages/CompanySkills.production.tsx`：CategoryNav 的 nav 增加 `aria-label={t("companySkills.browseByCategory")}`，复用组件现有 `useTranslation`。
- `ui/src/i18n/locales/en.json`、`ui/src/i18n/locales/zh-CN.json`：未修改；批量提取确认 `browseByCategory` 键已存在，分别为 “Browse by category” / “按类别浏览”。
- 限定路径的 `git status --short` 显示产品文件为 staged 新增、交接为 AM，其余两个许可语言包没有改动；隔离基线状态原样保留。开始时限定路径 `git diff` 仅包含交接的既有差异；本次产品编辑为工作区更改。
- 未运行测试、token gates、类型检查或构建：本隔离批次明确由外部调度器统一验证。重复键检查及 en/zh-CN 键集一致性也待外部执行。不声称这些检查已通过。

## 下一批唯一范围

建议下一批定位 `ui/src/pages/CompanySkills.production.tsx` 中紧邻 CategoryNav 之后、排除已完成 SkillCard 的 DiscoveryGrid 独立筛选/空状态 JSX 区域。仅翻译该区域直接渲染的固定文案，复用已有键优先；不回到 CategoryNav，不扫描整页，也不将测试作为下一范围。本交接不判断全项目翻译是否完成。

Merged verification: locale parity, token gates and UI typecheck passed.

## 全量候选清单（2026-10-01 初始快照）

<!-- UI-COPY-INVENTORY:BEGIN -->
扫描 1087 个产品源文件，593 个文件有 13598 处英文候选。解析失败：0。

此清单是候选索引，包含专名/技术示例，并非待翻译总数。还需复核动态映射、外部组件和运行时错误；候选为零不能单独作为 ALL_DONE 证据。测试、快照、fixture、stories 已排除。TestPanel 是产品页面，仍在范围内。

| 文件 | 候选数 | 范围 |
|---|---:|---|
| `ui/src/pages/DesignGuide.tsx` | 496 | 演示/预览，后置复核 |
| `ui/src/pages/Secrets.tsx` | 394 | 产品候选 |
| `ui/src/pages/CompanySkills.production.tsx` | 350 | 产品候选 |
| `ui/src/pages/Pipelines.tsx` | 309 | 产品候选 |
| `ui/src/pages/CompanySkills.tsx` | 300 | 产品候选 |
| `ui/src/pages/apps/chat/ChatEndpointSetup.tsx` | 298 | 产品候选 |
| `ui/src/features/connections/ConnectionSetupFlow.tsx` | 227 | 产品候选 |
| `ui/src/pages/PipelineSettings.tsx` | 223 | 产品候选 |
| `ui/src/pages/SkillStudio.tsx` | 218 | 产品候选 |
| `ui/src/pages/AgentDetail.production.tsx` | 212 | 产品候选 |
| `ui/src/components/IssueThreadInteractionCard.tsx` | 199 | 产品候选 |
| `ui/src/pages/TeamCatalog.tsx` | 164 | 产品候选 |
| `ui/src/pages/CompanyEnvironments.tsx` | 151 | 产品候选 |
| `ui/src/pages/IssueDetail.tsx` | 139 | 产品候选 |
| `ui/src/pages/InviteUxLab.tsx` | 137 | 演示/预览，后置复核 |
| `ui/src/pages/apps/chat/ChatEndpointDetail.tsx` | 131 | 产品候选 |
| `ui/src/pages/apps/app-detail/TestPanel.tsx` | 130 | 产品候选 |
| `ui/src/pages/tools/ProfilesTab.tsx` | 121 | 产品候选 |
| `ui/src/pages/AgentDetail.tsx` | 117 | 产品候选 |
| `ui/src/components/IssueRecoveryActionCard.tsx` | 116 | 产品候选 |
| `ui/src/components/RunnerInspector.tsx` | 116 | 产品候选 |
| `ui/src/components/IssueChatThread.tsx` | 115 | 产品候选 |
| `ui/src/components/NewIssueDialog.tsx` | 95 | 产品候选 |
| `ui/src/pages/CompanyImport.tsx` | 93 | 产品候选 |
| `ui/src/pages/tools/profiles/ProfileDetail.tsx` | 87 | 产品候选 |
| `ui/src/components/RoutineHistoryTab.tsx` | 84 | 产品候选 |
| `ui/src/pages/LegacyInbox.tsx` | 83 | 产品候选 |
| `ui/src/components/OnboardingWizard.tsx` | 82 | 产品候选 |
| `ui/src/pages/apps/chat/EmailEndpointSetup.tsx` | 82 | 产品候选 |
| `ui/src/pages/PluginSettings.tsx` | 79 | 产品候选 |
| `ui/src/pages/SystemNoticeUxLab.tsx` | 78 | 演示/预览，后置复核 |
| `ui/src/components/ProjectProperties.tsx` | 77 | 产品候选 |
| `ui/src/pages/InstanceExperimentalSettings.tsx` | 77 | 产品候选 |
| `ui/src/pages/skills/ImportSkillsFromProjectDialog.tsx` | 76 | 产品候选 |
| `ui/src/pages/AdapterManager.tsx` | 75 | 产品候选 |
| `ui/src/pages/secrets/ImportFromVaultDialog.tsx` | 74 | 产品候选 |
| `ui/src/components/task-chat/TaskChatCompactInteractionCard.tsx` | 73 | 产品候选 |
| `ui/src/pages/apps/chat/GitHubChatSetup.tsx` | 73 | 产品候选 |
| `ui/src/pages/audit/AuditFeed.tsx` | 72 | 产品候选 |
| `ui/src/components/routine-sections/editable-sections.production.tsx` | 70 | 产品候选 |
| `ui/src/pages/apps/chat/GitHubBotConfiguration.tsx` | 70 | 产品候选 |
| `ui/src/pages/apps/Browse.tsx` | 69 | 产品候选 |
| `ui/src/components/new-agent/NewAgentSetup.tsx` | 68 | 产品候选 |
| `ui/src/pages/Routines.tsx` | 67 | 产品候选 |
| `ui/src/pages/CompanyAccess.tsx` | 65 | 产品候选 |
| `ui/src/pages/Costs.production.tsx` | 65 | 产品候选 |
| `ui/src/pages/PluginManager.tsx` | 65 | 产品候选 |
| `ui/src/features/connections/remote-mcp/RemoteMcpConnectionSetup.tsx` | 64 | 产品候选 |
| `ui/src/components/IssueDocumentsSection.tsx` | 63 | 产品候选 |
| `ui/src/components/IssuesList.tsx` | 62 | 产品候选 |
| `ui/src/components/IssueRunLedger.tsx` | 61 | 产品候选 |
| `ui/src/components/LegacyIssuesList.tsx` | 60 | 产品候选 |
| `ui/src/pages/Cases.tsx` | 60 | 产品候选 |
| `ui/src/pages/tools/GatewaysTab.tsx` | 60 | 产品候选 |
| `ui/src/components/IssueBlockedNotice.tsx` | 58 | 产品候选 |
| `ui/src/pages/apps/Connections.tsx` | 58 | 产品候选 |
| `ui/src/pages/StatusCards/StatusCardDetailDrawer.tsx` | 58 | 产品候选 |
| `ui/src/pages/audit/AuditFeed.production.tsx` | 57 | 产品候选 |
| `ui/src/pages/Inbox.tsx` | 57 | 产品候选 |
| `ui/src/pages/tools/AuditTab.tsx` | 56 | 产品候选 |
| `ui/src/pages/tools/SmokeLabTab.tsx` | 55 | 产品候选 |
| `ui/src/components/routine-triggers/TriggerWizard.tsx` | 54 | 产品候选 |
| `ui/src/pages/tools/connection-dialogs.tsx` | 54 | 产品候选 |
| `ui/src/pages/ResponsibleUserDenialUxLab.tsx` | 53 | 演示/预览，后置复核 |
| `ui/src/components/transcript/RunTranscriptView.tsx` | 52 | 产品候选 |
| `ui/src/pages/apps/gateways/panels/TokensPanel.tsx` | 52 | 产品候选 |
| `ui/src/components/chat/ExternallyConnectedTaskBanner.tsx` | 51 | 产品候选 |
| `ui/src/components/routine-sections/editable-sections.tsx` | 50 | 产品候选 |
| `ui/src/components/task-chat/task-chat-attachments.ts` | 50 | 产品候选 |
| `ui/src/components/routine-triggers/RoutineTriggers.tsx` | 49 | 产品候选 |
| `ui/src/components/access/InvitesSection.tsx` | 46 | 产品候选 |
| `ui/src/components/FileViewerSheet.tsx` | 46 | 产品候选 |
| `ui/src/pages/apps/app-detail/AdvancedPanel.tsx` | 46 | 产品候选 |
| `ui/src/pages/BootstrapSetupUxLab.tsx` | 45 | 演示/预览，后置复核 |
| `ui/src/pages/InstanceGeneralSettings.tsx` | 45 | 产品候选 |
| `ui/src/pages/Search.tsx` | 45 | 产品候选 |
| `ui/src/pages/secrets/proposal-review.tsx` | 45 | 产品候选 |
| `ui/src/components/folders/FolderControls.tsx` | 43 | 产品候选 |
| `ui/src/components/RoutineVariablesEditor.tsx` | 43 | 产品候选 |
| `ui/src/lib/workspace-access-state.ts` | 43 | 产品候选 |
| `ui/src/components/folders/SkillFolderTree.tsx` | 42 | 产品候选 |
| `ui/src/components/task-chat/ComposerRunSettingsPicker.tsx` | 42 | 产品候选 |
| `ui/src/pages/apps/app-detail/IdentitiesSection.tsx` | 42 | 产品候选 |
| `ui/src/pages/RoutineDetail.tsx` | 42 | 产品候选 |
| `ui/src/pages/secrets/UserSecretDefinitionsTab.tsx` | 42 | 产品候选 |
| `ui/src/pages/CompanyExport.tsx` | 41 | 产品候选 |
| `ui/src/components/ExecutionWorkspaceCloseDialog.tsx` | 39 | 产品候选 |
| `ui/src/pages/apps/AppDetail.tsx` | 38 | 产品候选 |
| `ui/src/pages/apps/chat/GitHubBotManagement.tsx` | 38 | 产品候选 |
| `ui/src/pages/RoutineDetail.production.tsx` | 38 | 产品候选 |
| `ui/src/components/artifacts/RichArtifactCards.tsx` | 37 | 产品候选 |
| `ui/src/pages/apps/chat/SlackToolSettings.tsx` | 37 | 产品候选 |
| `ui/src/pages/IssueChatUxLab.tsx` | 37 | 演示/预览，后置复核 |
| `ui/src/components/task-chat/TaskChatProtocolCard.tsx` | 36 | 产品候选 |
| `ui/src/pages/tools/profiles/ProfileWizard.tsx` | 36 | 产品候选 |
| `ui/src/components/task-chat/TaskChatComposer.tsx` | 35 | 产品候选 |
| `ui/src/pages/apps/chat/SlackAvatarStep.tsx` | 35 | 产品候选 |
| `ui/src/adapters/adapter-display-registry.ts` | 34 | 产品候选 |
| `ui/src/components/AttentionQueueRow.tsx` | 34 | 产品候选 |
| `ui/src/components/KeyboardShortcutsCheatsheet.tsx` | 34 | 产品候选 |
| `ui/src/pages/tools/profiles/ProfilesIndex.tsx` | 34 | 产品候选 |
| `ui/src/components/BudgetPolicyCard.tsx` | 33 | 产品候选 |
| `ui/src/components/environment-variables-editor/Row.tsx` | 33 | 产品候选 |
| `ui/src/components/FrontmatterPanel.tsx` | 33 | 产品候选 |
| `ui/src/features/connections/ConnectionIntentInteractionBody.tsx` | 33 | 产品候选 |
| `ui/src/pages/apps/gateways/panels/OverviewPanel.tsx` | 33 | 产品候选 |
| `ui/src/pages/StatusCards/StatusCardTile.tsx` | 33 | 产品候选 |
| `ui/src/pages/Timeline.tsx` | 33 | 产品候选 |
| `ui/src/adapters/openclaw-gateway/config-fields.tsx` | 32 | 产品候选 |
| `ui/src/components/TrustPresetSection.tsx` | 32 | 产品候选 |
| `ui/src/pages/apps/app-detail/PermissionsPanel.tsx` | 32 | 产品候选 |
| `ui/src/pages/StatusCards/StatusCardSettingsForm.tsx` | 32 | 产品候选 |
| `ui/src/components/IssueFiltersPopover.tsx` | 31 | 产品候选 |
| `ui/src/components/WorkspaceServiceControlBar.tsx` | 31 | 产品候选 |
| `ui/src/pages/Agents.production.tsx` | 31 | 产品候选 |
| `ui/src/pages/Routines.production.tsx` | 31 | 产品候选 |
| `ui/src/pages/tools/profiles/WizardToolsStep.tsx` | 31 | 产品候选 |
| `ui/src/components/CommentThread.tsx` | 30 | 产品候选 |
| `ui/src/components/task-chat/TaskChatProtocolActivityRow.tsx` | 30 | 产品候选 |
| `ui/src/pages/apps/gateways/ConnectClientDialog.tsx` | 30 | 产品候选 |
| `ui/src/pages/apps/gateways/GatewaysList.tsx` | 30 | 产品候选 |
| `ui/src/pages/tools/PasteConfigTab.tsx` | 30 | 产品候选 |
| `ui/src/components/DecisionCard.tsx` | 29 | 产品候选 |
| `ui/src/components/SecretBindingPicker.tsx` | 29 | 产品候选 |
| `ui/src/pages/CliAuth.tsx` | 29 | 产品候选 |
| `ui/src/pages/UserProfile.tsx` | 29 | 产品候选 |
| `ui/src/pages/JoinRequestQueue.tsx` | 28 | 产品候选 |
| `ui/src/pages/apps/app-detail/SetupPanel.tsx` | 27 | 产品候选 |
| `ui/src/pages/audit/AuditRuns.tsx` | 27 | 产品候选 |
| `ui/src/components/AgentBubbleActionRow.tsx` | 26 | 产品候选 |
| `ui/src/pages/agent-skills/AgentSkillsTab.tsx` | 26 | 产品候选 |
| `ui/src/pages/DecisionQueuePage.tsx` | 26 | 产品候选 |
| `ui/src/components/BuiltInBundlePanel.tsx` | 25 | 产品候选 |
| `ui/src/components/WorkspaceFileBrowser.tsx` | 25 | 产品候选 |
| `ui/src/components/RoutineList.tsx` | 24 | 产品候选 |
| `ui/src/components/skill-studio/AgentsUsingSkillDialog.tsx` | 24 | 产品候选 |
| `ui/src/pages/apps/app-detail/RailwayAccessPanel.tsx` | 24 | 产品候选 |
| `ui/src/pages/apps/chat/ChatIdentityConfirm.tsx` | 24 | 产品候选 |
| `ui/src/pages/apps/chat/PhotonConnectStep.tsx` | 24 | 产品候选 |
| `ui/src/pages/ExecutionWorkspaceDetail.tsx` | 24 | 产品候选 |
| `ui/src/components/ArtifactsPanel.tsx` | 23 | 产品候选 |
| `ui/src/components/BootstrapPendingPage.tsx` | 23 | 产品候选 |
| `ui/src/components/IssueWorkspaceCard.tsx` | 23 | 产品候选 |
| `ui/src/components/ScheduleEditor.tsx` | 23 | 产品候选 |
| `ui/src/components/DecisionTriageStrip.tsx` | 22 | 产品候选 |
| `ui/src/pages/apps/gateways/panels/GatewayActivityPanel.tsx` | 22 | 产品候选 |
| `ui/src/pages/CompanySettings.tsx` | 22 | 产品候选 |
| `ui/src/pages/CrossIssueCollaborationUxLab.tsx` | 22 | 演示/预览，后置复核 |
| `ui/src/components/AgentConfigForm.tsx` | 21 | 产品候选 |
| `ui/src/components/IssueAttachmentsSection.tsx` | 21 | 产品候选 |
| `ui/src/components/new-agent/AgentBasicsDialog.tsx` | 21 | 产品候选 |
| `ui/src/components/OutputFeedbackButtons.tsx` | 21 | 产品候选 |
| `ui/src/components/ProviderQuotaCard.tsx` | 21 | 产品候选 |
| `ui/src/components/RoutineRunVariablesDialog.tsx` | 21 | 产品候选 |
| `ui/src/components/SidebarAgents.production.tsx` | 21 | 产品候选 |
| `ui/src/components/SidebarAgents.tsx` | 21 | 产品候选 |
| `ui/src/components/task-chat/QuestionForm.tsx` | 21 | 产品候选 |
| `ui/src/components/TaskChatThread.tsx` | 21 | 产品候选 |
| `ui/src/pages/Agents.tsx` | 21 | 产品候选 |
| `ui/src/pages/apps/chat/SlackIdentityStep.tsx` | 21 | 产品候选 |
| `ui/src/components/CaseRevisionRail.tsx` | 20 | 产品候选 |
| `ui/src/components/CommandPalette.tsx` | 20 | 产品候选 |
| `ui/src/components/PipelineItemBodyDocument.tsx` | 20 | 产品候选 |
| `ui/src/components/ResourceStatusChip.tsx` | 20 | 产品候选 |
| `ui/src/components/SidebarRecentTasks.tsx` | 20 | 产品候选 |
| `ui/src/components/task-chat/RunnerGoalWidget.tsx` | 20 | 产品候选 |
| `ui/src/components/TaskTreeControls.tsx` | 20 | 产品候选 |
| `ui/src/pages/RunTranscriptUxLab.tsx` | 20 | 演示/预览，后置复核 |
| `ui/src/components/actions/ActionCard.tsx` | 19 | 产品候选 |
| `ui/src/components/ApprovalPayload.tsx` | 19 | 产品候选 |
| `ui/src/components/DocumentAnnotationPanel.tsx` | 19 | 产品候选 |
| `ui/src/components/EmailMessageCard.tsx` | 19 | 产品候选 |
| `ui/src/components/RoutineSaveBar.tsx` | 19 | 产品候选 |
| `ui/src/components/task-detail/TaskDetailRelationsPanel.tsx` | 19 | 产品候选 |
| `ui/src/lib/attention.ts` | 19 | 产品候选 |
| `ui/src/pages/apps/gateways/panels/GatewayAdvancedPanel.tsx` | 19 | 产品候选 |
| `ui/src/pages/BoardChat.tsx` | 19 | 产品候选 |
| `ui/src/components/DispositionRecoveryNotice.tsx` | 18 | 产品候选 |
| `ui/src/components/IssuePlanDecompositionsSection.tsx` | 18 | 产品候选 |
| `ui/src/components/JsonSchemaForm.tsx` | 18 | 产品候选 |
| `ui/src/components/task-chat/task-chat-states.ts` | 18 | 产品候选 |
| `ui/src/components/task-side-panel/TaskAttachmentPanel.tsx` | 18 | 产品候选 |
| `ui/src/lib/search-query-parser.ts` | 18 | 产品候选 |
| `ui/src/pages/ProfileSettings.tsx` | 18 | 产品候选 |
| `ui/src/adapters/gemini-local/config-fields.tsx` | 17 | 产品候选 |
| `ui/src/components/AdapterLoginChrome.tsx` | 17 | 产品候选 |
| `ui/src/components/InboxAgentPolicyControl.tsx` | 17 | 产品候选 |
| `ui/src/components/RoutineOverview.tsx` | 17 | 产品候选 |
| `ui/src/components/task-chat/RichWorkProductCard.tsx` | 17 | 产品候选 |
| `ui/src/pages/apps/AppNotConnected.tsx` | 17 | 产品候选 |
| `ui/src/pages/Auth.tsx` | 17 | 产品候选 |
| `ui/src/components/ActivityFeed.tsx` | 16 | 产品候选 |
| `ui/src/components/AgentActionButtons.tsx` | 16 | 产品候选 |
| `ui/src/components/AgentMultiSelect.tsx` | 16 | 产品候选 |
| `ui/src/components/AgentSecretAccessEditor.tsx` | 16 | 产品候选 |
| `ui/src/components/ai-connections/AiConnectionAuth.tsx` | 16 | 产品候选 |
| `ui/src/components/DecisionsToolbar.tsx` | 16 | 产品候选 |
| `ui/src/components/new-agent/AgentProviderConnection.tsx` | 16 | 产品候选 |
| `ui/src/components/WorkspaceRuntimeControls.tsx` | 16 | 产品候选 |
| `ui/src/lib/status-card-state.ts` | 16 | 产品候选 |
| `ui/src/pages/apps/gateways/NewGatewayDialog.tsx` | 16 | 产品候选 |
| `ui/src/pages/BoardClaim.tsx` | 16 | 产品候选 |
| `ui/src/pages/Companies.tsx` | 16 | 产品候选 |
| `ui/src/pages/secrets/SetMyUserSecretDialog.tsx` | 16 | 产品候选 |
| `ui/src/pages/TaskChatLab.tsx` | 16 | 产品候选 |
| `ui/src/pages/tools/shared.tsx` | 16 | 产品候选 |
| `ui/src/components/DevRestartBanner.tsx` | 15 | 产品候选 |
| `ui/src/components/IssueColumns.tsx` | 15 | 产品候选 |
| `ui/src/components/IssueScheduledRetryCard.tsx` | 15 | 产品候选 |
| `ui/src/components/OnboardingChat.tsx` | 15 | 产品候选 |
| `ui/src/components/RepositoryEditor.tsx` | 15 | 产品候选 |
| `ui/src/components/SidebarCompanyMenu.production.tsx` | 15 | 产品候选 |
| `ui/src/components/SidebarCompanyMenu.tsx` | 15 | 产品候选 |
| `ui/src/pages/tools/smoke-lab-matrix.ts` | 15 | 产品候选 |
| `ui/src/components/AgentChatPicker.tsx` | 14 | 产品候选 |
| `ui/src/components/CompanySettingsSidebar.production.tsx` | 14 | 产品候选 |
| `ui/src/components/CompanySettingsSidebar.tsx` | 14 | 产品候选 |
| `ui/src/components/interrupt-handoff/InterruptHandoffViews.tsx` | 14 | 产品候选 |
| `ui/src/components/SidebarAccountMenu.production.tsx` | 14 | 产品候选 |
| `ui/src/components/skill-studio/ForkSkillDialog.tsx` | 14 | 产品候选 |
| `ui/src/components/task-chat/task-chat-fixtures.ts` | 14 | 产品候选 |
| `ui/src/pages/apps/gateways/panels/AppsToolsPanel.tsx` | 14 | 产品候选 |
| `ui/src/components/ai-connections/AiConnectionPicker.tsx` | 13 | 产品候选 |
| `ui/src/components/BillerSpendCard.tsx` | 13 | 产品候选 |
| `ui/src/components/environment-variables-editor/CreateSecretPopover.tsx` | 13 | 产品候选 |
| `ui/src/components/new-agent/ExternalAgentInviteDialog.tsx` | 13 | 产品候选 |
| `ui/src/components/routine-triggers/WebhookFields.tsx` | 13 | 产品候选 |
| `ui/src/components/RoutineSubSidebar.tsx` | 13 | 产品候选 |
| `ui/src/components/RoutineTriggerCard.tsx` | 13 | 产品候选 |
| `ui/src/pages/agent-detail-navigation.ts` | 13 | 产品候选 |
| `ui/src/pages/apps/ReviewQueueCard.tsx` | 13 | 产品候选 |
| `ui/src/pages/CaseDetail.tsx` | 13 | 产品候选 |
| `ui/src/pages/secrets/MyUserSecretsTab.tsx` | 13 | 产品候选 |
| `ui/src/pages/StatusCards/index.tsx` | 13 | 产品候选 |
| `ui/src/adapters/codex-local/config-fields.tsx` | 12 | 产品候选 |
| `ui/src/components/BuiltInAgentGate.tsx` | 12 | 产品候选 |
| `ui/src/components/ConfigureBuiltInAgentModal.tsx` | 12 | 产品候选 |
| `ui/src/components/environment-variables-editor/index.tsx` | 12 | 产品候选 |
| `ui/src/components/environment-variables-editor/SecretPicker.tsx` | 12 | 产品候选 |
| `ui/src/components/InteractionGovernancePanel.tsx` | 12 | 产品候选 |
| `ui/src/components/MarkdownEditor.tsx` | 12 | 产品候选 |
| `ui/src/components/MemberMultiSelect.tsx` | 12 | 产品候选 |
| `ui/src/components/onboarding/SavedProviderKeySelect.tsx` | 12 | 产品候选 |
| `ui/src/components/PipelineStageHistoryPanel.tsx` | 12 | 产品候选 |
| `ui/src/components/routine-triggers/WebhookUrlWarning.tsx` | 12 | 产品候选 |
| `ui/src/components/RuntimeTestCard.tsx` | 12 | 产品候选 |
| `ui/src/components/search/SearchFilterBar.tsx` | 12 | 产品候选 |
| `ui/src/components/search/ZeroResultsRecovery.tsx` | 12 | 产品候选 |
| `ui/src/components/SourceResolvedFoldCallout.tsx` | 12 | 产品候选 |
| `ui/src/components/task-side-panel/TaskSidePanel.tsx` | 12 | 产品候选 |
| `ui/src/components/task-side-panel/TaskSkillPanel.tsx` | 12 | 产品候选 |
| `ui/src/connect-flow-preview-main.tsx` | 12 | 演示/预览，后置复核 |
| `ui/src/context/LiveUpdatesProvider.tsx` | 12 | 产品候选 |
| `ui/src/lib/issue-output.ts` | 12 | 产品候选 |
| `ui/src/pages/apps/gateways/GatewayDetail.tsx` | 12 | 产品候选 |
| `ui/src/pages/IssueChatLongThreadPerf.tsx` | 12 | 产品候选 |
| `ui/src/pages/ProjectWorkspaceDetail.tsx` | 12 | 产品候选 |
| `ui/src/pages/tools/ToolsAccess.tsx` | 12 | 产品候选 |
| `ui/src/components/access/CompanySettingsNav.tsx` | 11 | 产品候选 |
| `ui/src/components/ActivityCharts.tsx` | 11 | 产品候选 |
| `ui/src/components/AgentProperties.tsx` | 11 | 产品候选 |
| `ui/src/components/ai-connections/AiConnectionAccountControls.tsx` | 11 | 产品候选 |
| `ui/src/components/DocumentDiffModal.tsx` | 11 | 产品候选 |
| `ui/src/components/EmailTaskActivity.tsx` | 11 | 产品候选 |
| `ui/src/components/InstructionHistory.tsx` | 11 | 产品候选 |
| `ui/src/components/issue-properties/helpers.ts` | 11 | 产品候选 |
| `ui/src/components/KanbanBoard.tsx` | 11 | 产品候选 |
| `ui/src/components/ProjectWorkspaceSummaryCard.tsx` | 11 | 产品候选 |
| `ui/src/components/search/SearchFilterSheet.tsx` | 11 | 产品候选 |
| `ui/src/components/SidebarAccountMenu.tsx` | 11 | 产品候选 |
| `ui/src/components/task-chat/TaskChatBubble.tsx` | 11 | 产品候选 |
| `ui/src/components/task-chat/TaskChatQueuedMessages.tsx` | 11 | 产品候选 |
| `ui/src/pages/apps/gateways/EditGatewayDialog.tsx` | 11 | 产品候选 |
| `ui/src/pages/OrgChart.production.tsx` | 11 | 产品候选 |
| `ui/src/pages/OrgChart.tsx` | 11 | 产品候选 |
| `ui/src/pages/StatusCards/CreateStatusCardDialog.tsx` | 11 | 产品候选 |
| `ui/src/components/BudgetIncidentCard.tsx` | 10 | 产品候选 |
| `ui/src/components/CloudAccessGate.tsx` | 10 | 产品候选 |
| `ui/src/components/IssueRelatedWorkPanel.tsx` | 10 | 产品候选 |
| `ui/src/components/IssueRow.tsx` | 10 | 产品候选 |
| `ui/src/components/MarkdownBody.tsx` | 10 | 产品候选 |
| `ui/src/components/WorkspaceExportRecovery.tsx` | 10 | 产品候选 |
| `ui/src/pages/apps/generic-mcp-connect.ts` | 10 | 产品候选 |
| `ui/src/pages/apps/PaperclipCloudOAuthHandoff.tsx` | 10 | 产品候选 |
| `ui/src/pages/DashboardLive.tsx` | 10 | 产品候选 |
| `ui/src/pages/secrets/MissingUserSecretsBanner.tsx` | 10 | 产品候选 |
| `ui/src/pages/tools/profiles/profile-model.ts` | 10 | 产品候选 |
| `ui/src/components/ai-connections/AiConnectionCredentialStep.tsx` | 9 | 产品候选 |
| `ui/src/components/ai-connections/AiConnectionField.tsx` | 9 | 产品候选 |
| `ui/src/components/ApprovalCard.tsx` | 9 | 产品候选 |
| `ui/src/components/artifacts/IssueArtifactCard.tsx` | 9 | 产品候选 |
| `ui/src/components/chat/AgentChannelsPanel.tsx` | 9 | 产品候选 |
| `ui/src/components/DocumentFrameHeader.tsx` | 9 | 产品候选 |
| `ui/src/components/NewGoalDialog.tsx` | 9 | 产品候选 |
| `ui/src/components/NewProjectDialog.tsx` | 9 | 产品候选 |
| `ui/src/components/RoutineContextualSidebar.tsx` | 9 | 产品候选 |
| `ui/src/components/SidebarProjects.tsx` | 9 | 产品候选 |
| `ui/src/components/StageSecretsPanel.tsx` | 9 | 产品候选 |
| `ui/src/components/task-chat/ComposerAddMenu.tsx` | 9 | 产品候选 |
| `ui/src/components/task-chat/TaskChatPausedTakeover.tsx` | 9 | 产品候选 |
| `ui/src/components/task-chat/TweakPanel.tsx` | 9 | 产品候选 |
| `ui/src/features/connections/remote-mcp/RemoteMcpManagement.tsx` | 9 | 产品候选 |
| `ui/src/pages/tools/profiles/ProfileWizardRoute.tsx` | 9 | 产品候选 |
| `ui/src/components/AccountingModelCard.tsx` | 8 | 产品候选 |
| `ui/src/components/ActiveAgentsPanel.tsx` | 8 | 产品候选 |
| `ui/src/components/AppsSidebar.production.tsx` | 8 | 产品候选 |
| `ui/src/components/BlockedInboxView.tsx` | 8 | 产品候选 |
| `ui/src/components/DecisionShelf.tsx` | 8 | 产品候选 |
| `ui/src/components/FileTree.tsx` | 8 | 产品候选 |
| `ui/src/components/issue-output/OutputPrimaryCard.tsx` | 8 | 产品候选 |
| `ui/src/components/PathInstructionsModal.tsx` | 8 | 产品候选 |
| `ui/src/components/RunWorkspaceRecoverySurface.tsx` | 8 | 产品候选 |
| `ui/src/components/task-chat/TaskChatMarker.tsx` | 8 | 产品候选 |
| `ui/src/features/connections/remote-mcp/providers.ts` | 8 | 产品候选 |
| `ui/src/features/connections/remote-mcp/RemoteMcpAccountChoice.tsx` | 8 | 产品候选 |
| `ui/src/lib/pipeline-liveness.ts` | 8 | 产品候选 |
| `ui/src/pages/apps/chat/ChatCommunicationInstructions.tsx` | 8 | 产品候选 |
| `ui/src/components/AgentChatSidebar.tsx` | 7 | 产品候选 |
| `ui/src/components/artifacts/ArtifactCard.tsx` | 7 | 产品候选 |
| `ui/src/components/EmailConnectionAccess.tsx` | 7 | 产品候选 |
| `ui/src/components/environment-variables-editor/model.ts` | 7 | 产品候选 |
| `ui/src/components/FinanceBillerCard.tsx` | 7 | 产品候选 |
| `ui/src/components/FinanceTimelineCard.tsx` | 7 | 产品候选 |
| `ui/src/components/GoalProperties.tsx` | 7 | 产品候选 |
| `ui/src/components/IssueContinuationHandoff.tsx` | 7 | 产品候选 |
| `ui/src/components/ManagedRoutinesList.tsx` | 7 | 产品候选 |
| `ui/src/components/side-panel/SidePanelFrame.tsx` | 7 | 产品候选 |
| `ui/src/components/SkillsContextualSidebar.tsx` | 7 | 产品候选 |
| `ui/src/components/SystemNotice.tsx` | 7 | 产品候选 |
| `ui/src/components/task-chat/TaskChatBlockerLinks.tsx` | 7 | 产品候选 |
| `ui/src/components/task-chat/TaskChatPlanPreviewCard.tsx` | 7 | 演示/预览，后置复核 |
| `ui/src/components/task-chat/TaskChatTurn.tsx` | 7 | 产品候选 |
| `ui/src/components/task-chat/transcript-adapter.ts` | 7 | 产品候选 |
| `ui/src/components/task-detail/TaskDetailTasksPanel.tsx` | 7 | 产品候选 |
| `ui/src/components/task-side-panel/TaskDocumentPanel.tsx` | 7 | 产品候选 |
| `ui/src/pages/secrets/ProposalsTab.tsx` | 7 | 产品候选 |
| `ui/src/pages/tools/McpConfigHelpDialog.tsx` | 7 | 产品候选 |
| `ui/src/components/AgentContextualSidebar.tsx` | 6 | 产品候选 |
| `ui/src/components/ai-connections/ManagedAiConnectionDetails.tsx` | 6 | 产品候选 |
| `ui/src/components/BuiltInAgentBadges.tsx` | 6 | 产品候选 |
| `ui/src/components/CaseActivityFeed.tsx` | 6 | 产品候选 |
| `ui/src/components/chat/ChatDetailSidebar.tsx` | 6 | 产品候选 |
| `ui/src/components/CompanySwitcher.tsx` | 6 | 产品候选 |
| `ui/src/components/DocumentAnnotationPopover.tsx` | 6 | 产品候选 |
| `ui/src/components/ExecutionBlockerNotice.tsx` | 6 | 产品候选 |
| `ui/src/components/FinanceKindCard.tsx` | 6 | 产品候选 |
| `ui/src/components/MobileBottomNav.tsx` | 6 | 产品候选 |
| `ui/src/components/PipelineHealthWarnings.tsx` | 6 | 产品候选 |
| `ui/src/components/PriorityIcon.tsx` | 6 | 产品候选 |
| `ui/src/components/ProjectRepositories.tsx` | 6 | 产品候选 |
| `ui/src/components/ReportsToPicker.tsx` | 6 | 产品候选 |
| `ui/src/components/StalledReviewActions.tsx` | 6 | 产品候选 |
| `ui/src/components/StandaloneBrowserControls.tsx` | 6 | 产品候选 |
| `ui/src/components/task-chat/TaskChatRunnerActivityGroup.tsx` | 6 | 产品候选 |
| `ui/src/lib/announcement-preview.ts` | 6 | 演示/预览，后置复核 |
| `ui/src/lib/search-filters.ts` | 6 | 产品候选 |
| `ui/src/pages/agent-skills/agent-skill-source.ts` | 6 | 产品候选 |
| `ui/src/pages/CompanySettingsPluginPage.tsx` | 6 | 产品候选 |
| `ui/src/pages/PluginPage.tsx` | 6 | 产品候选 |
| `ui/src/pages/StatusCards/ArchivedStatusCardRow.tsx` | 6 | 产品候选 |
| `ui/src/adapters/claude-local/config-fields.tsx` | 5 | 产品候选 |
| `ui/src/components/AppsSidebar.tsx` | 5 | 产品候选 |
| `ui/src/components/BreadcrumbBar.tsx` | 5 | 产品候选 |
| `ui/src/components/CaseFieldsPanel.tsx` | 5 | 产品候选 |
| `ui/src/components/CodexSubscriptionPanel.tsx` | 5 | 产品候选 |
| `ui/src/components/DecisionDateChips.tsx` | 5 | 产品候选 |
| `ui/src/components/DocumentAnnotationLayer.tsx` | 5 | 产品候选 |
| `ui/src/components/EmailSafetyNotice.tsx` | 5 | 产品候选 |
| `ui/src/components/EnforcementBanner.tsx` | 5 | 产品候选 |
| `ui/src/components/ImageGalleryModal.tsx` | 5 | 产品候选 |
| `ui/src/components/issue-output/IssueOutputSection.tsx` | 5 | 产品候选 |
| `ui/src/components/issue-output/OutputRow.tsx` | 5 | 产品候选 |
| `ui/src/components/IssueAssignedBacklogNotice.tsx` | 5 | 产品候选 |
| `ui/src/components/IssueReferencePill.tsx` | 5 | 产品候选 |
| `ui/src/components/LegacyProjectRepository.tsx` | 5 | 产品候选 |
| `ui/src/components/LiveRunWidget.tsx` | 5 | 产品候选 |
| `ui/src/components/onboarding/ConnectModelPreview.tsx` | 5 | 演示/预览，后置复核 |
| `ui/src/components/routine-triggers/TriggerCard.tsx` | 5 | 产品候选 |
| `ui/src/components/SidebarStarredProjects.production.tsx` | 5 | 产品候选 |
| `ui/src/components/SidebarStarredProjects.tsx` | 5 | 产品候选 |
| `ui/src/components/skill-studio/SkillProvenance.tsx` | 5 | 产品候选 |
| `ui/src/components/SummarySlotCard.tsx` | 5 | 产品候选 |
| `ui/src/components/task-chat/motion-tokens.ts` | 5 | 产品候选 |
| `ui/src/components/task-chat/TaskChatSystemNotice.tsx` | 5 | 产品候选 |
| `ui/src/components/task-side-panel/TaskWorkspaceFilePanel.tsx` | 5 | 产品候选 |
| `ui/src/components/timeline/WorkTimelineChart.tsx` | 5 | 产品候选 |
| `ui/src/lib/system-notice-humanizer.ts` | 5 | 产品候选 |
| `ui/src/pages/apps/AppsReview.tsx` | 5 | 产品候选 |
| `ui/src/pages/apps/chat/SetupPrompt.tsx` | 5 | 产品候选 |
| `ui/src/pages/apps/gateways/gateway-tabs.ts` | 5 | 产品候选 |
| `ui/src/pages/audit/audit-navigation.ts` | 5 | 产品候选 |
| `ui/src/pages/audit/RoutineAuditActivity.tsx` | 5 | 产品候选 |
| `ui/src/pages/tools/profiles/ProfileActionDialog.tsx` | 5 | 产品候选 |
| `ui/src/pages/tools/profiles/ProfileDetailRoute.tsx` | 5 | 产品候选 |
| `ui/src/plugins/launchers.tsx` | 5 | 产品候选 |
| `ui/src/adapters/process/config-fields.tsx` | 4 | 产品候选 |
| `ui/src/adapters/runtime-json-fields.tsx` | 4 | 产品候选 |
| `ui/src/adapters/schema-config-fields.tsx` | 4 | 产品候选 |
| `ui/src/components/CaseChildrenTree.tsx` | 4 | 产品候选 |
| `ui/src/components/CaseIdentifierKey.tsx` | 4 | 产品候选 |
| `ui/src/components/CloudSignIn.tsx` | 4 | 产品候选 |
| `ui/src/components/ExecutionParticipantPicker.tsx` | 4 | 产品候选 |
| `ui/src/components/GitHubAgentTrustWarning.tsx` | 4 | 产品候选 |
| `ui/src/components/InlineEditor.tsx` | 4 | 产品候选 |
| `ui/src/components/issue-properties/IssueProperties.tsx` | 4 | 产品候选 |
| `ui/src/components/IssueDocumentAnnotations.tsx` | 4 | 产品候选 |
| `ui/src/components/IssueMonitorBanner.tsx` | 4 | 产品候选 |
| `ui/src/components/PipelineLivenessBanner.tsx` | 4 | 产品候选 |
| `ui/src/components/RouteErrorBoundary.tsx` | 4 | 产品候选 |
| `ui/src/components/search/SearchResultRow.tsx` | 4 | 产品候选 |
| `ui/src/components/SidebarServerInfo.tsx` | 4 | 产品候选 |
| `ui/src/components/SmokeLabDashboardCard.tsx` | 4 | 产品候选 |
| `ui/src/components/WorktreeBanner.tsx` | 4 | 产品候选 |
| `ui/src/lib/inbox.ts` | 4 | 产品候选 |
| `ui/src/lib/issue-filters.ts` | 4 | 产品候选 |
| `ui/src/lib/recovery-display.ts` | 4 | 产品候选 |
| `ui/src/lib/review-policy.ts` | 4 | 产品候选 |
| `ui/src/lib/saved-provider-credentials.ts` | 4 | 产品候选 |
| `ui/src/lib/task-side-panel-state.ts` | 4 | 产品候选 |
| `ui/src/pages/AgentChat.tsx` | 4 | 产品候选 |
| `ui/src/pages/apps/gateways/CopyableGatewayUrl.tsx` | 4 | 产品候选 |
| `ui/src/pages/audit/AuditHub.tsx` | 4 | 产品候选 |
| `ui/src/pages/MyIssues.tsx` | 4 | 产品候选 |
| `ui/src/pages/NotFound.tsx` | 4 | 产品候选 |
| `ui/src/pages/TeamCatalog.fixtures.ts` | 4 | 产品候选 |
| `ui/src/pages/tools/AdvancedToolsRoute.tsx` | 4 | 产品候选 |
| `ui/src/pages/tools/profiles/ToolsAdminGate.tsx` | 4 | 产品候选 |
| `ui/src/pages/tools/tool-tabs.ts` | 4 | 产品候选 |
| `ui/src/pages/WhatNeedsMe.tsx` | 4 | 产品候选 |
| `ui/src/adapters/hermes-gateway/config-fields.tsx` | 3 | 产品候选 |
| `ui/src/adapters/opencode-local/config-fields.tsx` | 3 | 产品候选 |
| `ui/src/components/agent-config-primitives.tsx` | 3 | 产品候选 |
| `ui/src/components/ai-connections/AiConnectionDesignExamples.tsx` | 3 | 产品候选 |
| `ui/src/components/ai-connections/AiConnectionIdentity.tsx` | 3 | 产品候选 |
| `ui/src/components/ai-connections/AiConnectionManagement.tsx` | 3 | 产品候选 |
| `ui/src/components/AnnouncementWell.tsx` | 3 | 产品候选 |
| `ui/src/components/AppErrorBoundary.tsx` | 3 | 产品候选 |
| `ui/src/components/artifacts/MediaArtifactCard.tsx` | 3 | 产品候选 |
| `ui/src/components/ChatComposer.tsx` | 3 | 产品候选 |
| `ui/src/components/ClaudeSubscriptionPanel.tsx` | 3 | 产品候选 |
| `ui/src/components/DecisionQueueRail.tsx` | 3 | 产品候选 |
| `ui/src/components/issue-properties/external-object-rows.tsx` | 3 | 产品候选 |
| `ui/src/components/IssueFieldChangeReceipt.tsx` | 3 | 产品候选 |
| `ui/src/components/Layout.production.tsx` | 3 | 产品候选 |
| `ui/src/components/Layout.tsx` | 3 | 产品候选 |
| `ui/src/components/onboarding/Stepper.tsx` | 3 | 产品候选 |
| `ui/src/components/ProviderTraceStatusBadge.tsx` | 3 | 产品候选 |
| `ui/src/components/ReusableExecutionWorkspaceSelect.tsx` | 3 | 产品候选 |
| `ui/src/components/routine-sections/operate-sections.tsx` | 3 | 产品候选 |
| `ui/src/components/search/SearchSortMenu.tsx` | 3 | 产品候选 |
| `ui/src/components/SidebarSection.tsx` | 3 | 产品候选 |
| `ui/src/components/task-chat/TaskChatDescriptionBubble.tsx` | 3 | 产品候选 |
| `ui/src/components/task-chat/TaskChatPlanView.tsx` | 3 | 产品候选 |
| `ui/src/components/task-chat/TaskChatTurnStatusIsland.tsx` | 3 | 产品候选 |
| `ui/src/features/connections/remote-mcp/RemoteMcpProductionSetup.tsx` | 3 | 产品候选 |
| `ui/src/lib/interaction-resolution-error.ts` | 3 | 产品候选 |
| `ui/src/lib/work-mode-meta.ts` | 3 | 产品候选 |
| `ui/src/pages/agent-skills/AgentSkillRow.tsx` | 3 | 产品候选 |
| `ui/src/pages/apps/app-detail/ActivityPanel.tsx` | 3 | 产品候选 |
| `ui/src/pages/apps/connection-owner.tsx` | 3 | 产品候选 |
| `ui/src/pages/apps/ConnectionProvenanceChip.tsx` | 3 | 产品候选 |
| `ui/src/pages/InstanceAccess.tsx` | 3 | 产品候选 |
| `ui/src/pages/InviteLanding.tsx` | 3 | 产品候选 |
| `ui/src/pages/Org.tsx` | 3 | 产品候选 |
| `ui/src/pages/StatusCards/SummarizerAgentSelect.tsx` | 3 | 产品候选 |
| `ui/src/adapters/cursor/config-fields.tsx` | 2 | 产品候选 |
| `ui/src/adapters/grok-local/config-fields.tsx` | 2 | 产品候选 |
| `ui/src/adapters/http/config-fields.tsx` | 2 | 产品候选 |
| `ui/src/adapters/kimi-local/config-fields.tsx` | 2 | 产品候选 |
| `ui/src/adapters/pi-local/config-fields.tsx` | 2 | 产品候选 |
| `ui/src/App.tsx` | 2 | 产品候选 |
| `ui/src/components/AgentIconPicker.tsx` | 2 | 产品候选 |
| `ui/src/components/ai-connections/useLocalAiLogin.ts` | 2 | 产品候选 |
| `ui/src/components/AttentionInteractionResolver.tsx` | 2 | 产品候选 |
| `ui/src/components/CommentAttributionChip.tsx` | 2 | 产品候选 |
| `ui/src/components/ContextualSidebarFrame.tsx` | 2 | 产品候选 |
| `ui/src/components/DecisionResolver.tsx` | 2 | 产品候选 |
| `ui/src/components/GoalTree.tsx` | 2 | 产品候选 |
| `ui/src/components/HoneycombRunLink.tsx` | 2 | 产品候选 |
| `ui/src/components/issue-output/OutputVideoPlayer.tsx` | 2 | 产品候选 |
| `ui/src/components/IssueReferenceActivitySummary.tsx` | 2 | 产品候选 |
| `ui/src/components/IssueSiblingNavigation.tsx` | 2 | 产品候选 |
| `ui/src/components/IssueWriteDenialNotice.tsx` | 2 | 产品候选 |
| `ui/src/components/OpenCodeLogoIcon.tsx` | 2 | 产品候选 |
| `ui/src/components/PipelineWorkReferences.tsx` | 2 | 产品候选 |
| `ui/src/components/ProjectRepositoryInput.tsx` | 2 | 产品候选 |
| `ui/src/components/ProjectWorkspacesContent.tsx` | 2 | 产品候选 |
| `ui/src/components/PropertiesPanel.tsx` | 2 | 产品候选 |
| `ui/src/components/RunChatSurface.tsx` | 2 | 产品候选 |
| `ui/src/components/search/MatchSourceChip.tsx` | 2 | 产品候选 |
| `ui/src/components/search/SearchFilterChips.tsx` | 2 | 产品候选 |
| `ui/src/components/search/SearchFilterMenu.tsx` | 2 | 产品候选 |
| `ui/src/components/side-panel/SidePanelLauncher.tsx` | 2 | 产品候选 |
| `ui/src/components/SourceResolvedFoldBadge.tsx` | 2 | 产品候选 |
| `ui/src/components/StarToggle.tsx` | 2 | 产品候选 |
| `ui/src/components/StatusIcon.tsx` | 2 | 产品候选 |
| `ui/src/components/task-chat/TaskChatProjectCreatedCard.tsx` | 2 | 产品候选 |
| `ui/src/components/task-chat/TaskChatRichInput.tsx` | 2 | 产品候选 |
| `ui/src/components/task-chat/TaskChatRunnerTurn.tsx` | 2 | 产品候选 |
| `ui/src/components/task-chat/TaskChatSkillCreatedCard.tsx` | 2 | 产品候选 |
| `ui/src/components/task-chat/TaskChatStatusPill.tsx` | 2 | 产品候选 |
| `ui/src/components/task-chat/TaskChatToolCard.tsx` | 2 | 产品候选 |
| `ui/src/components/ui/breadcrumb.tsx` | 2 | 产品候选 |
| `ui/src/components/ui/dialog.tsx` | 2 | 产品候选 |
| `ui/src/components/WorkspaceAccessCard.tsx` | 2 | 产品候选 |
| `ui/src/lib/built-in-agent-toast.ts` | 2 | 产品候选 |
| `ui/src/lib/interrupt-handoff.ts` | 2 | 产品候选 |
| `ui/src/lib/issueDetailBreadcrumb.ts` | 2 | 产品候选 |
| `ui/src/lib/pipeline-item-detail.ts` | 2 | 产品候选 |
| `ui/src/lib/provider-credential.ts` | 2 | 产品候选 |
| `ui/src/lib/reusable-execution-workspaces.ts` | 2 | 产品候选 |
| `ui/src/lib/skill-policy-denial.ts` | 2 | 产品候选 |
| `ui/src/lib/transcriptPresentation.ts` | 2 | 产品候选 |
| `ui/src/pages/agent-skills/AgentSkillReleasePicker.tsx` | 2 | 产品候选 |
| `ui/src/pages/apps/app-tabs.ts` | 2 | 产品候选 |
| `ui/src/pages/audit/CompanyActivity.production.tsx` | 2 | 产品候选 |
| `ui/src/pages/audit/CompanyActivity.tsx` | 2 | 产品候选 |
| `ui/src/pages/Costs.tsx` | 2 | 产品候选 |
| `ui/src/pages/NewAgent.tsx` | 2 | 产品候选 |
| `ui/src/plugins/slots.tsx` | 2 | 产品候选 |
| `ui/src/adapters/claude-local/index.ts` | 1 | 产品候选 |
| `ui/src/adapters/codex-local/index.ts` | 1 | 产品候选 |
| `ui/src/adapters/cursor-cloud/index.ts` | 1 | 产品候选 |
| `ui/src/adapters/cursor/index.ts` | 1 | 产品候选 |
| `ui/src/adapters/gemini-local/index.ts` | 1 | 产品候选 |
| `ui/src/adapters/grok-local/index.ts` | 1 | 产品候选 |
| `ui/src/adapters/hermes-gateway/index.ts` | 1 | 产品候选 |
| `ui/src/adapters/hermes-local/index.ts` | 1 | 产品候选 |
| `ui/src/adapters/http/index.ts` | 1 | 产品候选 |
| `ui/src/adapters/kimi-local/index.ts` | 1 | 产品候选 |
| `ui/src/adapters/openclaw-gateway/index.ts` | 1 | 产品候选 |
| `ui/src/adapters/opencode-local/index.ts` | 1 | 产品候选 |
| `ui/src/adapters/paperclip-runner/index.ts` | 1 | 产品候选 |
| `ui/src/adapters/pi-local/index.ts` | 1 | 产品候选 |
| `ui/src/adapters/process/index.ts` | 1 | 产品候选 |
| `ui/src/components/ActivityRow.tsx` | 1 | 产品候选 |
| `ui/src/components/AgentIdentity.tsx` | 1 | 产品候选 |
| `ui/src/components/AnimatedPaperclipIcon.tsx` | 1 | 产品候选 |
| `ui/src/components/AnnouncementCard.tsx` | 1 | 产品候选 |
| `ui/src/components/AppConnectionSidebar.production.tsx` | 1 | 产品候选 |
| `ui/src/components/AppConnectionSidebar.tsx` | 1 | 产品候选 |
| `ui/src/components/artifacts/ArtifactGroupCard.tsx` | 1 | 产品候选 |
| `ui/src/components/BlockedReasonChip.tsx` | 1 | 产品候选 |
| `ui/src/components/BreadcrumbBar.production.tsx` | 1 | 产品候选 |
| `ui/src/components/CaseAttachmentsGallery.tsx` | 1 | 产品候选 |
| `ui/src/components/CompanyPatternIcon.tsx` | 1 | 产品候选 |
| `ui/src/components/ExternalObjectPill.tsx` | 1 | 产品候选 |
| `ui/src/components/FeedCard.tsx` | 1 | 产品候选 |
| `ui/src/components/FilterBar.tsx` | 1 | 产品候选 |
| `ui/src/components/InlineEntitySelector.tsx` | 1 | 产品候选 |
| `ui/src/components/issue-properties/IssuePropertiesPlansTab.tsx` | 1 | 产品候选 |
| `ui/src/components/IssueCasesPanel.tsx` | 1 | 产品候选 |
| `ui/src/components/IssueLinkQuicklook.tsx` | 1 | 产品候选 |
| `ui/src/components/MissingPluginTabPlaceholder.tsx` | 1 | 产品候选 |
| `ui/src/components/onboarding/FooterNav.tsx` | 1 | 产品候选 |
| `ui/src/components/PageTabBar.tsx` | 1 | 产品候选 |
| `ui/src/components/PluginAppShellOverlays.tsx` | 1 | 产品候选 |
| `ui/src/components/PluginOrganizationSwitcher.tsx` | 1 | 产品候选 |
| `ui/src/components/QuotaBar.tsx` | 1 | 产品候选 |
| `ui/src/components/ScrollToBottom.tsx` | 1 | 产品候选 |
| `ui/src/components/SearchableSelect.tsx` | 1 | 产品候选 |
| `ui/src/components/SetupWizard.tsx` | 1 | 产品候选 |
| `ui/src/components/SidebarNavItem.production.tsx` | 1 | 产品候选 |
| `ui/src/components/SidebarNavItem.tsx` | 1 | 产品候选 |
| `ui/src/components/SidebarShell.production.tsx` | 1 | 产品候选 |
| `ui/src/components/SidebarShell.tsx` | 1 | 产品候选 |
| `ui/src/components/skill-studio/SkillPolicySurfaces.tsx` | 1 | 产品候选 |
| `ui/src/components/SwipeToArchive.tsx` | 1 | 产品候选 |
| `ui/src/components/task-chat/completed-activity-summary.ts` | 1 | 产品候选 |
| `ui/src/components/task-chat/task-chat-adapter.ts` | 1 | 产品候选 |
| `ui/src/components/task-chat/TaskChatActivityPhase.tsx` | 1 | 产品候选 |
| `ui/src/components/task-chat/TaskChatInteractionCard.tsx` | 1 | 产品候选 |
| `ui/src/components/task-chat/TaskChatThinking.tsx` | 1 | 产品候选 |
| `ui/src/components/task-chat/TaskChatUsageReadout.tsx` | 1 | 产品候选 |
| `ui/src/components/task-chat/TaskMessageScroller.tsx` | 1 | 产品候选 |
| `ui/src/components/ToastViewport.tsx` | 1 | 产品候选 |
| `ui/src/components/transcript/native-run-events.ts` | 1 | 产品候选 |
| `ui/src/components/transcript/useNativeRunTranscripts.ts` | 1 | 产品候选 |
| `ui/src/components/ui/command.tsx` | 1 | 产品候选 |
| `ui/src/components/ui/sheet.tsx` | 1 | 产品候选 |
| `ui/src/hooks/useComposerStop.ts` | 1 | 产品候选 |
| `ui/src/hooks/useResourceMemberships.ts` | 1 | 产品候选 |
| `ui/src/hooks/useRetryNowMutation.ts` | 1 | 产品候选 |
| `ui/src/lib/agent-chat-draft.ts` | 1 | 产品候选 |
| `ui/src/lib/assignees.ts` | 1 | 产品候选 |
| `ui/src/lib/interaction-audience.ts` | 1 | 产品候选 |
| `ui/src/lib/issue-chat-messages.ts` | 1 | 产品候选 |
| `ui/src/lib/use-copy-action.ts` | 1 | 产品候选 |
| `ui/src/pages/AgentToolsTab.tsx` | 1 | 产品候选 |
| `ui/src/pages/ApprovalDetail.tsx` | 1 | 产品候选 |
| `ui/src/pages/apps/app-detail/ReviewPanel.tsx` | 1 | 产品候选 |
| `ui/src/pages/apps/UnverifiedServerBadge.tsx` | 1 | 产品候选 |
| `ui/src/pages/Artifacts.tsx` | 1 | 产品候选 |
<!-- UI-COPY-INVENTORY:END -->

## 2026-10-01 本轮已合入进度（持续更新）

已合入的模块及各新增双语键数量：

| 模块 | 键数 | 完成范围/保留项 |
|---|---:|---|
| AgentConfigForm / Codex / Claude / Hermes / config primitives | 301 | 固定标签、帮助、登录反馈；模型名/提示词示例/配置值保留 |
| 剩余 adapters / JSON / schema 表单显示 | 207 | 9 个手写适配器；内置 schema 按 type/field/value 在渲染时翻译，未知第三方元数据回退 |
| issue-properties | 235 | 属性主组件、计划、产物、外部对象、选择器、关系组件 |
| IssueThreadInteractionCard | 238 | 固定反馈/按钮/权限提示/动态插值；payload 用户/代理内容不翻译 |
| App TestPanel / action-permission-summary | 156 | 标签、权限摘要、状态、授权提示、错误建议；provider 输出/工具目录文案保留 |
| issue shared helpers | 85 | 监控、review/pause/resolver/workspace 显示 |
| monitor surfaces | 40 | 监控及定时重试面板；显示字符串判断改为状态/时间判断 |
| AgentActionButtons | 24 | 默认标签/确认反馈；调用者自定义标签保留 |
| Secrets | 318 | 固定页面/表单/弹窗/帮助/状态/计数；密钥值/路径/服务端详情原样 |
| ConnectionSetupFlow / intent body | 275 | 步骤、认证方式、固定说明/错误/插值；动态 provider catalog 元数据后续复核 |
| remote MCP 产品流程 | 112 | 账户选择/设置/管理/生产设置/provider presentation；URL/header/auth 值原样 |
| IssueRecoveryActionCard / recovery-lineage | 158 | 恢复显示及动态反馈；时间状态不能通过翻译字符串判断 |
| CompanySkills / CompanySkills.production | 332 | 技能管理两版页面；正文、代码与真实服务端内容保留；补齐语言订阅和 memo/effect 依赖 |
| SkillStudio | 173 | 技能编辑、模板、运行测试产品界面、历史/版本和本地反馈；技能正文/模板提示词保留 |
| NewIssueDialog | 98 | 新建任务表单及确认；复用既有审核者/批准者文案，短监督标签采用独立 watchdogLabel 键 |
| IssueChatThread | 134 | 聊天固定显示、工具/附件/时长插值与英文单复数；协议/notice 判定保留 |
| issue-chat-messages / TaskChatLiveRunPill | 53 | 作者/运行/活动/时长显示；原系统 notice 标题的业务判断不翻译；相关 memo 需订阅语言变化 |
| Apps/chat 基础接入 | 105 | 6 个基础接入视图；保留 Slack 外部页面英文名称及复制用自动化执行指令 |
| Apps SlackToolSettings | 34 | 工具权限与可用性显示；scope code/外部限制详情保留 |
| Apps EmailEndpointSetup | 82 | 邮件接入三个视图、状态显示及日期语言；真实 API 状态保留 |
| Apps GitHubBotManagement | 51 | 设置与审查界面；状态映射和本地反馈；审查正文、API 错误保留 |
| Apps GitHubBotConfiguration | 89 | PolicyEditor / AccessEditor；事件显示映射；权限/事件/filter API 值保留 |
| Apps GitHubChatSetup | 88 | 8 步接入流程、步骤显示、面包屑/复制反馈；App 名称、真实测试指令与权限 code 保留 |
| InstanceExperimentalSettings | 111 | 27 个实验开关、说明、无障碍标签和页面反馈；功能标志/启用判定不变，日期跟随语言 |
| CompanySwitcher 剩余反馈 | 4 | 选择组织、加载失败、空列表与管理入口 |
| BudgetPolicyCard | 31 | 预算范围、状态/原因显示、进度/无障碍文本；USD 输入解析、金额及预算暂停规则原样 |
| KeyboardShortcutsCheatsheet | 25 | 快捷键说明/分组标题/关闭说明；实际按键及快捷键逻辑原样；固定数组在渲染时翻译 |
| SecretBindingPicker / common.clear | 32 | 密钥绑定、版本/状态与跨公司反馈；真实 secretId/version/provider/密钥值保留，调用者自定义标签保留 |
| TeamCatalog | 156 | 团队目录/安装向导/兼容与信任状态/冲突和安装结果；API/外部元数据原样；静态选项使用 getter 防止语言缓存 |
| IssueDetail | 194 | 任务详情固定显示/反馈/统计/权限提示；attribution协议与testId原样，agent delivery/wakeup/recovery任务正文保留 |
| IssueDetail 显示 helpers | 71 | 工作模式/交互 summary/编辑器菜单；agent delivery 正文原样；调用组件订阅语言 |
| Apps ChatEndpointSetup | 259 | Slack/Discord/Telegram/Teams/Photon 产品设置；真实外部门户名称、凭据、manifest和测试命令原样 |
| Apps ChatEndpointDetail | 170 | 设置/访问/对话/活动及操作反馈；真实活动summary/details原样；phase/scope枚举显示另批补齐 |
| AgentDetail / AgentDetail.production | 219 | 两版智能体详情/日志/配置/密钥显示；Default密钥默认名称、示例提示词、协议值和代理输出原样 |
| PipelineSettings | 203 | 流水线设置导航/阶段/变量说明/工作区/流转反馈；真实脚本/变量token/stage kind/key和生成名称原样 |
| Apps detail status | 20 | 15 个文件传输 phase 与资源类型显示；原 API phase / 真实 Slack scope 权限代码保留 |
| AgentDetail runRetryState helper | 20 | 重试状态/次数/排期及显示通用称谓；未知 reason / 服务端 exhaustedReason 原样；Ledger调用者订阅语言 |
| ExecutionWorkspaceCloseDialog | 46 | 关闭确认/检查/状态/无障碍显示；关闭请求与安全门禁不变，命令/路径/后端清理计划和阻止详情原样 |
| Apps AdvancedPanel | 48 | 重连/技术详情/凭据/危险操作；真实地址/提供方详情原样 |
| Apps chat 本地异常映射 | 4 | 查明无文本协议判断后，在显示层翻译本地固定异常；未知服务端错误保留 |
| Apps IdentitiesSection / identity labels | 69 | 身份设置、范围与成员摘要、撤销反馈；connectionTypeLabel 的英文值参与存储判断，保留并在未来渲染处单独映射 |
| FileViewerSheet | 62 | 文件预览/拒绝反馈/Markdown切换/复制/定位/无障碍提示；权限code/真实文件内容/路径/未知API错误原样，字节单位 B/KB/MB 保留 |
| Apps PermissionsPanel | 35 | 权限模式/筛选/计数/测试入口；真实权限值 off/ask/allowed 与工具catalog原样 |
| Apps 公共 tabs / sidebar | 7 | 7个tab稳定 labelKey，两版侧栏/审查标题按渲染翻译；原label/id保留 |
| Apps AppNotConnected | 22 | 未连接/重连/访问提示和动态应用名称；真实应用名称/描述/URL/身份值原样 |
| New-agent / OnboardingWizard | 166 | 4个新建智能体组件和入门引导；默认名称/首任务标题/CLI及提示词示例保留；helper另批继续 |
| Pipelines | 316 | 列表/看板/产出/批量添加/审核/总结及动态计数；键盘/审计reason/graph/stage/API值原样，产出status显示另批补齐 |
| Pipeline output status | 7 | 7 个固定任务状态只在显示层映射；未知/custom状态保留原值 |
| New-agent 显示 helpers | 53 | RuntimeTestCard/登录/已存凭据/字段帮助；未知检查输出与命令原样 |
| Apps AppDetail | 52 | 连接与访问/toast/退役说明/标题编辑；用户name/provider metadata/healthMessage/API值原样 |
| WorkspaceFileBrowser | 32 | 浏览/搜索/空状态/定位/下载/计数提示；复用FileViewer拒绝反馈；真实文件名/路径/数据/API原因判断原样 |
| FolderControls | 38 | 文件夹选择/分组/创建/重命名/删除/批量移动/颜色无障碍提示；真实folderId/名称/颜色值保持；Unfiled统一译为未分类 |
| Apps Connections | 70 | 连接列表/健康和审批/Cloud说明/删除反馈；原类型用于存储判断保持原值，显示另映射 |
| Apps review / setup | 82 | 审批队列、PostHog/Sheets设置、Railway SSH说明；真实工具/用户preview/生成SSH和URL原样 |
| CompanyImport | 132 | 导入/分片上传/计划预览/冲突/结果；原manifest/plan/API enum与用户正文保持 |
| RunnerInspector | 178 | 运行器检查视图/筛选/字段/映射/追踪确认与计数；原始JSON/event/schema/追踪数据保持 |
| AdapterManager | 69 | 适配器安装/覆盖/重载/重装/删除与操作反馈；命令和真实package数据保持 |
| SkillFolderTree / folder display helpers / common.add | 21 | 技能树、路径、拖动/移动/创建提示；复用FolderControls；systemKey/真实路径与用户folder名保持；两版Skills显示路径memo加t依赖 |
| Apps Browse | 74 | 应用浏览/搜索/空状态/连接管理；未知provider metadata/用户name/URL原样 |
| Apps common | 15 | Cloud授权接入状态/未验证提示/来源标记与Unknown；生成名称和connector UID原样 |
| Apps ActivityPanel | 34 | 调用/审批/连接事件显示及Test-tab身份；真实事件/工具/用户输出原样 |
| CompanyEnvironments | 221 | 环境管理/SSH/沙箱/模板/租约/终端显示与本地反馈；provider/ID/path/实际连接日志原样 |
| RoutineVariablesEditor | 32 | 变量表单/内置变量帮助；真实模板token/类型枚举/日期示例原样 |
| Routines / Routines.production 余项 | 78 | 并发/补运行说明/分组与操作反馈；原dirty/已有键保留，显示memo订阅语言 |
| Apps gateway core | 40 | 网关新建/编辑/URL显示与scope/owner/工具数；API scope与保存值原样，未知scope fallback |
| Tools profiles | 373 | 工具配置列表/详情/向导/审核/操作与summary/helper；工具目录正文/API values和复制默认名称保持；getter/memo依赖补齐 |
| useCopyToast / common clipboard feedback | 2 | 默认复制成功复用common.copied；失败与手动复制帮助翻译，Boolean/Clipboard/定时器行为不变，dedupeKey保持原稳定值 |
| CompanyAccess / access | 160 | 成员/审批/邀请/移除重分配/权限提示；API角色和状态值原样，显示映射及语言依赖补齐 |
| Apps gateway pages / final | 200 | 网关列表/概览/工具/连接客户端/令牌/活动；真实snippets/JSON/API值原样，计数和状态在显示层翻译 |
| Routine triggers / history | 270 | 触发器设置/向导与执行历史；星期原value、cron、签名头和智能体指令保留；diff比较原始字段 |
| Skills / SkillStudio / TeamCatalog 尾项 | 19 | 条件表达式/空状态/保存与操作反馈；修复模板中的字面 t(...)；保留之前目录memo修改 |
| Apps generic MCP guidance | 29 | MCP设置帮助及本地校验显示映射；保留示例URL与原始配置，状态中的帮助也随语言切换 |
| CommentThread / issue-timeline-events | 37 | 时间线/评论/排队/负责人/运行环境/状态与复制；真实内容、路径、ID和未知错误原样 |
| OutputFeedbackButtons | 15 | 评价按钮/原因/保存与共享偏好说明；保留反馈提交及共享授权逻辑，富文本采用Trans |
| ProjectProperties / repository editors | 112 | 项目属性/仓库/路径与分支设置及本地反馈；真实命令/路径/服务状态/API值保留，显示映射 |
| Routine sections / cron preview / activity | 132 | 两版行为章节与预览/活动摘要；cron计算及星期索引保持原值，显示日期/说明与状态跟随语言 |
| Tools remaining pages | 353 | 剩余工具入口/配置/访问/审计/烟测固定UI；侧栏订阅和profiles memo依赖补齐，原工具目录/JSON/命令和运行结果保留 |
| PluginManager / PluginSettings | 180 | 插件管理与设置页固定显示；真实schema/name/description/categories/服务端日志原样，message state存key渲染翻译 |
| Audit feeds / CompanyActivity / audit navigation | 81 | 审计信息流两版、组织活动两版、导航与筛选；raw动作值/CSV/用户内容保留 |
| activity-format / ActivityRow | 213 | 静态动作标签getter和动态审计摘要；所有实际调用者订阅，API动作/参与者值保持 |
| attention / decisions | 174 | 决策公共helpers、5个组件和2页固定copy；原tuple契约/业务verb/授权/筛选规则及agent请求保持，显示时映射 |
| TrustPresetSection / SourceTrustBadge / trust UI helpers | 62 | 信任/边界说明与数量/tooltip；权限策略build逻辑、scope、artifactLabel union及原值判断不变 |
| IssueDocuments / DocumentFrameHeader / DocumentDiffModal | 78 | 文档创建/编辑/复制/冲突/历史/锁定/删除及差异标签；原409锁判断/正文/ID/修订逻辑不变，本地错误state存key即时翻译 |
| CompanyExport / FileTree | 52 | 导出UI/预览/数量/分类/文件树默认与无障碍提示；导出README包正文、YAML过滤和真实文件名/路径/用户标签保持，frontmatter显示复用CompanyImport |
| FrontmatterPanel | 28 | 元数据编辑/校验/摘要计数/字段操作与aria；YAML解析/序列化/真实字段键与字节保持不变，显示memo订阅语言 |
| WorkspaceServiceControlBar | 26 | 服务状态/URL复制/开关/重启/聚合数量与aria；state/action union、回调值、URL及后端详情原样 |
| ResourceStatusChip / BuiltInBundlePanel | 60 | 10种资源状态和tooltip、内置包设置/更新/重置/计划确认说明；原API值/样式/资源名与自定义schedule保持 |
| Skill project / Vault import / User secret definitions | 223 | 项目技能导入/AWS密钥导入/用户密钥定义与展示helper；实际ARN/字段/slug/路径/外部错误保留 |
| Routine entrypoints | 47 | 例行任务侧栏/旧触发器卡片/单次运行变量弹窗；lastResult/API值和默认配置逻辑保持 |
| AuditRuns / JsonSchemaForm | 80 | 审计运行与公共schema表单固定copy；schema title/description/enum原文保留；校验message协议保留，显示层翻译 |
| Task chat compact / attachments / display | 150 | 完整交互卡/附件helper与11个聊天展示组件；verdict及操作值/用户payload保持，附件MIME检测不再比较译后File标签 |
| Task system notice / chat forms | 117 | 系统通知与运行配置/问题表单/消息动作；workspace隐藏正文读取rawTitle，showTryAgain按原payload，模型/effort/共享选择/验证规则保持 |
| Cases / Case views / TaskDetail relations | 128 | Case列表/详情尾项及7个专属组件；分组/筛选业务键、用户正文/字段与复制Markdown保持，动态显示译 |
| IssueAttachmentsSection / OutputVideoPlayer | 20 | 附件预览/下载/删除确认/动态aria与视频label；真实文件名/路径/MIME/视频控制和未知错误保持 |
| BootstrapPendingPage | 23 | 首位管理员设置/认领状态/错误/主机命令帮助；原公开模式认领门禁、401/409分支及一次性命令保持 |
| IssueBlockedNotice | 45 | 阻塞/恢复/跟进与排队提示；原任务状态、重试时刻与重新打开条件保持，富文本ID保留 |
| Task composer / thread / timeline / protocol | 362 | Composer55、Thread74、Timeline83、Protocol150；协议分类与查找保持原label，失败marker增加rawLabel供重试分支使用 |
| Secret review / Costs | 207 | 密钥审批112、费用95；实际授权/额度/币种/模型/未知后端字段保留，只翻译显示 |
| StatusCards | 184 | 状态卡完整生命周期/创建/设置/详情与helper；原刷新策略、用户summary和生成输入保持 |
| Search / search controls | 117 | 搜索页/桌面及移动筛选/结果/无结果/建议提示；搜索token和URL往返保持，已知状态显示映射，用户名称不翻译 |
| CommandPalette / IssueColumns / IssueFiltersPopover | 106 | 命令面板21、任务列38、任务筛选47；协议token/分组key/原tuple与确认逻辑保持，仅显示译 |
| Account settings / Governance controls | 262 | 账号设置110、治理控件152；修正字面t(...)、运行时getter/订阅，环境草稿flush兼容实际中文操作按钮 |
| Inbox / Issue lists | 250 | Inbox两版及加入/阻塞161、IssuesList两版与Kanban89；原过滤/分组/导航/拖拽/状态值保持 |
| Task activity / tail / adapter | 444 | Activity324、Tail59、Adapter61；分类与去重先按原值，最后显示翻译；用户输出/工具名称/协议保持 |
| RoutineSaveBar / DecisionCard | 80 | 保存栏15、决策卡65；任务状态/权限/确认token/执行动作保持，data-decision-state使用原英文值 |
| Profile / Onboarding / skills tail | 164 | 用户设置/技能/聊天选择/引导/开发重启及归档策略；真实生成指令与API枚举保持，memo和组件订阅补齐 |
| IssueRunLedger | 110 | 运行台账全模块状态/停止原因/恢复说明及数量；原授权/续运行耗尽regex与payload保持 |
| IssueWorkspaceCard / ReusableExecutionWorkspaceSelect | 34 | 工作区配置/复用/复制/文件入口与选择器；原隔离/路径隐藏策略及workspace ID/status保持 |
| Document annotations / MarkdownEditor | 40 | 批注面板/弹出卡/回复与mutation fallback30、编辑器提示10；用户正文/selection/链接和MDX解析保持，本地错误state存key渲染译 |
| DispositionRecoveryNotice / SourceResolvedFoldCallout | 60 | 恢复重试禁用原因/描述及源已解决收起审计提示；原门禁/快照/证据解析保持，显示时间随语言 |
| Companies / CompanySettings / Timeline page | 76 | 公司页44、时间线页32；用户内容与原状态/范围值保持，数字与日期随语言 |
| PluginPage / RoutineOverview / RoutineDetail / Auth | 121 | 插件页5、概览30、详情两版70、登录16；触发器标签和API值保持，secretMessage存键在显示处按数量翻译 |
| RunTranscript / External chat / AI connections | 285 | 运行记录90、外部聊天90、AI连接105；运行协议与原始输出保持，授权副作用不随语言重复启动 |
| Artifact / Action / Timeline Chart | 155 | 产物动作119、图表36；错误分类保留原英文，渲染已知原因，图表布局/时刻/缩放不变 |
| Skill / Pipeline widgets / Chat side panels | 245 | 技能流水线130、聊天侧栏115；权限分类输入、持久化tab原label与用户标题保持，显示时运行翻译 |
| Sidebar pickers / Shared Feed / UX Labs | 727 | 导航选择器114、Feed144、9个UX Labs469；演示叙事翻译，fixtures与用户数据保持 |
| Agent/Routine tail / Task display / Pipeline health | 248 | 代理例行任务66、任务显示151、流水线31；运行协议/后台原因保持，已知状态显示及实时helper补齐 |
| Remaining shell / gates / shared controls | 240 | 审批邮件30、访问门禁33、页面侧栏32、账号摘要26、核算参与人24、插件交接14、看板新项目31、小控件21、布局服务器29 |
| 公共时间/金额/账单/财务显示与状态徽章 | 86 | 日期跟随语言、保留 USD、保留英文时间阈值；三类徽章保留真实 status 与自定义 label |
| 已有漏键修复 | 4 | agentActions.resume/pause/cancel 与 app.cloudCreateUnavailable |

注意：键数是模块新增量，不等于替换位置数；后续新模块不会覆盖此前进度。初始候选清单保留作为范围索引，实时结果以重新扫描为准。三路 worker 当前继续工具页、例行任务章节/任务决策及项目属性与仓库设置；未完成整个项目。当前并发额度是 4（主 agent + 3 个 subagent），已用满；模块完成后继续分配，避免共享语言包发生并发冲突。

主 agent 另将 11 个页面/组件中 57 处完全相同且已有唯一中文翻译的短文案复用现有键，仅处理已经绑定 useTranslation 的渲染作用域，跳过 memo/callback 和 worker 所有权范围。CompanySwitcher 的剩余固定显示已单独补齐。

第二轮复用增加 7 个文件 8 处显示替换，保留全部业务值。一次性脚本需注意 Babel 下标为 UTF-16，而 Python 字符串下标按 Unicode code point：TaskChatThread 中一处 Emoji 前缀造成替换偏移，已手动恢复完整 Button 标签并重新通过 UI typecheck。后续必须在 Node 中应用 AST 下标，或先转 UTF-16 编码，不复用存在该缺陷的 Python切片实现。

扫描工具已扩展 body/footnote/caption/ariaLabel/emptyHint 等固定显示字段、props 默认文案和 Trans i18nKey 引用，新增自检通过。统计口径扩大后，不能将后续候选数与初始表直接计算完成率；它始终是人工复核候选索引。

Pipelines 两个格式化数字已改为 value 插值而非 i18next 的数值 count 选项，避免把 formatNumber 的字符串传入 count；英语与中文占位符同步。该修复后 typecheck 实际通过。

格式化自检扩展了中英文实际渲染：快捷键说明的 Trans 文本与 Esc keycap、文件夹选择的未分类标签、reserved root 与用户自定义folder名。真实运行通过，未改动任何 *.test/spec/fixture/snapshot 文件。

真实检查：本轮多次 UI typecheck、token gates、locale-validation 7/7 已通过；新增 read-only scanner 自检、调度器 self-test 和 context-guard 检查通过。新增 `node scripts/i18n/check-ui-formatters.mjs` 已验证中英文切换、时间/日期秒精度、USD、状态别名/外部 label、监控 ±30s/60s 边界及无效日期。后续每次词库合并后必须再检查，不把正在编辑而尚未合入的 key 当作最终缺失。

校验中修复了两个 Hermes URL 文案的标点：现有 URI 校验会把尾随标点包含到 URL，必须与英文参考保持一致，不得放宽校验来掩盖问题。英文 key 中的 plural base（_one/_other）在静态引用检查中按 count 选项识别，不误判为漏键。UI 旧英文断言测试与全仓测试/构建尚未执行或适配，不能宣称 PR-ready。

根因提醒：翻译公共 helper 前必须搜索全部调用者及下游显示变量。`formatMonitorOffset` 的英文 `now` 曾被属性、定时重试、blocked notice、recovery-lineage 和恢复卡片分支使用；已由同一 `isMonitorOffsetNow` 或 derived state 替代，仍需统一回归。不要重复只检查直接调用点而漏掉下游变量比较。

本批回归：技能生产版本曾缺少 t import，已修复；面包屑与模板等 memo/effect 补语言依赖。语言包校验 7/7、格式化自检、token gates 和 diff whitespace 检查再次通过。合并中如果看到正在编辑的 TaskChatThread / IssueDetail hook 或漏键，必须等 worker 稳定后重新跑 UI typecheck 与静态键检查，不将历史通过当作最终验证。

最新稳定合并：en/zh-CN 各 9302 叶键，键集无差异。UI typecheck、locale-validation 7/7、token gates、实际格式化/反馈按钮/时间线工作区标签检查和 diff --check 通过，测试/spec/stories/fixture/snapshot 无修改。静态键检查还有 worker 正在编辑而待合并的 routine-sections/工具/项目属性键，不是最终缺失结论。Apps generic guidance 的示例URL末尾句点需与英文URL token保持一致，已经修正文案并重新通过严格词库检查；不放宽校验。未执行全仓测试/构建或浏览器语言切换验收，不能报告全部完成。

后续稳定回归：文档frame实际中英文渲染验证展开aria/版本号/自定义标题，文件树实际渲染验证默认空状态与自定义aria/标题/说明保持，UI typecheck和SSR检查通过。一次性文档替换误触header的agent/system类型及比较，立即恢复raw值并通过检查；后续不得对通用词全局替换类型/比较。三个worker已续接任务聊天/例行任务关联组件、技能/密钥导入、审计运行与JsonSchemaForm；主流程继续未覆盖公共UI。整个项目仍在推进，旧检查通过不能充当最终验收。

当前已合入 en/zh-CN 各 10739 叶键，键集一致；静态检查尚有48个正在编辑且待合并的RoutineRunVariablesDialog关联键，交接时要等worker稳定后统一核对。CompanyExport 只译交互UI，其generateReadmeFromSelection生成的可移植包内容保留，不让下载结果随界面语言产生额外内容差异。

最新稳定检查点：en/zh-CN 各11353叶键；UI typecheck、locale-validation 7/7、SSR共享组件检查和diff --check通过。SSR新增验证：FrontmatterPanel显示不会触发onChange、摘要数量与自定义skill名；服务开关显示/真实URL保持且无action触发；10种资源状态及自定义schedule标签。Frontmatter的YAML/name/description/allowed-tools/metadata标签为真实配置键，ResourceStatusChip中的英文VARIANTS只是显示fallback参考且实际渲染已译，不能当漏译或重复替换。测试仍不编辑；并未完成所有UI，未做最终全仓/浏览器验收。

后续合并已补系统通知、任务表单/气泡共享反馈、Case两批、附件和初始化管理员UI；三worker仍持续执行任务Composer/Thread、密钥关联与Costs、StatusCards。主流程不与这些源文件重叠。Bootstrap raw认领条件保持；附件fetch内部错误不直接显示，保留开发诊断；视频实际SSR校验自定义title和src原样。扫描候选还含专名/协议/元数据，不当作剩余条数或完成率。

2026-10-01 19:22 稳定合并：en/zh-CN 各12541叶键，键集一致；随后Search运算符提示补14键（待再次统一检查）。UI typecheck、locale-validation 7/7、共享组件实际SSR检查通过；token gates与diff --check亦通过。Search中误用不存在的statusBadgeLabel导出已改为现有statusBadge词库显示映射，实际类型检查恢复通过。搜索helper原导出英文常量为参考/兼容值，实际渲染及getter已译；运算符token、用户查询、筛选值和URL保持。本轮继续账号设置、Inbox两版/加入请求、任务聊天剩余helper；主流程负责Search/CommandPalette。4个并发槽已满，完成即续接。测试文件不改，尚未做全仓测试/构建及浏览器最终验收，不宣称全部完成。

2026-10-01 19:36 后续已合并：任务活动/adapter、Inbox、账号设置/治理、命令面板/任务列筛选/保存栏与决策卡；en/zh-CN各13608叶键，随后IssueLists再合并89键。最近UI typecheck、locale-validation 7/7、SSR实际渲染及diff --check通过。SSR新增验证搜索token插入/用户名称/筛选移除与原status过滤、任务列说明、决策卡raw data-decision-state以及显示不会触发onDecide。一次性依赖补丁误将t插入groupBy实参，已恢复原调用并加到真实memo deps，实际类型通过；并行期间的t shadow/未定义亦由owner修复。当前worker分配：个人设置/技能尾项与Onboarding、运行日志/Transcript/外部聊天banner、产物/Action展示。任务未整体完成；用户问最新ETA时答预计剩2–3小时含统一检查，属于估算，发现兼容问题需延长。

2026-10-01 19:44 稳定检查：en/zh-CN各14105叶键；UI typecheck、词库校验7/7、SSR共享组件/恢复门禁检查、token gates、diff --check通过。恢复SSR验证可重试时返回null，运行中禁用，外部自定义reason保持；清理状态未知fallback及静默时长0/60秒/61分钟阈值保持。批注SSR确认用户内容/raw resolved状态与中文数量。MarkdownEditor内部MDE-EMPTY诊断message不直接显示，保留开发诊断，只译fallback提示/重试/mention类别/拖放上传/上传错误fallback。worker继续AI连接/agent设置尾项、运行Transcript/外部聊天、产物与Action；主流程继续未覆盖页面/共享控件。仍未执行全仓测试/构建或浏览器最终验收，测试文件不修改。

2026-10-01 19:59 稳定合并：en/zh-CN各14987叶键，键集一致；UI typecheck、词库校验7/7、SSR语言/格式化/共享组件检查、token gates、diff --check通过，git diff HEAD无test/spec/stories/fixtures/snapshot文件变化。本批登录页原字面t("auth.signInFailed")已修为实际表达式；本地登录错误state保存key以支持语言切换，未知错误保留。RoutineDetail两版补齐固定文案与dirtyFields依赖；Webhook秘密提示state保存key，两个实际渲染点按entries.length翻译，原API与生成trigger label保持。生产版SECTION_TITLES的History参考常量被误替为组件t，已恢复原常量，显示处调用翻译，类型检查通过。worker现在负责：导航/选择器尾项、9个UX Lab演示页面、共享Feed及工作区/关联任务组件。主流程继续剩余固定文案扫描，不将协议/配置键或用户内容计为漏译。全仓测试/构建及浏览器最终验收仍待完成；上述检查不是最终全部完成声明。

2026-10-01 20:18 稳定合并：en/zh-CN各16202叶键；UI typecheck、词库校验7/7、SSR实际双语渲染、token gates及diff --check通过，无测试等排除文件变化。SSR新增例行任务Webhook单数/计划复数、disabled触发排除/nextRun排序、原cron及时区保持，Summary原status/custom tool保持，CloudAccessError渲染不触发重试，核算cost_events和Breadcrumb原data-slot保持。JSX字面t错误已修Auth/AgentChat/NotFound。错误边界采用现有Translation render prop，异常发生后仍可更新语言；不更改错误捕获/遥测。BoardChat状态/本地fallback error存key，用户和后台SSE原文本显示保留；组织欢迎显示译，chip实际提交prompt保持原英文。小控件补丁曾误替Breadcrumb data-slot，已恢复原协议值并通过类型与SSR检查；任何统一字串替换必须核对data属性/协议字段。AccountingModelCard仍用原surface.title作为React key，仅显示翻译。Worker继续DesignGuide与PriorityIcon、工作区/组织图尾项、任务小控件。主流程继续剩余生产UI查漏与最终检查，仍未完成全仓测试/构建和浏览器验收。

2026-10-01 20:49 收尾检查点：已合并 workspace-remaining-tail 135、task-ui-final-tail 70、design-guide 498、task-small-tail 68、goalUiTail 24、markdownBodyTail 15、final-shared-audit 79、connector-sidebar-final 2、audit-extra 5、final-controls 53、final-aria 12、final-props 53 和 finalSidebarUi 55；en/zh-CN 各17271叶键，键集一致。全仓 `pnpm -r typecheck` 在20:28通过；最后UI typecheck、18487个静态literal引用（缺失0）、608个变更源文件AST/JSX表达式、token gates与同步脚本、diff检查通过，排除的测试/spec/fixture/stories/snapshot路径无修改。

用户最新要求：跳过构建、测试和语言切换核查。此前全仓测试第一次等待超过context工具300秒上限，未拿到可采信结果；改用持续日志的第二次实际止于 `ERR_PNPM_PNPM_ENGINE_IDENTITY_UNVERIFIABLE`，未执行用例。当前已无测试进程，不重试，不报告测试通过；没有启动构建或浏览器最终核查。保留此前目标检查的历史结果，不能替代本次未执行的验收。

本轮显示/状态约束：OAuth 17个固定错误保存稳定翻译键、渲染时翻译，登录poll/listener/handoff等副作用依赖不加t；真实API默认连接名 Custom app / My provider 保留。外部Slack/Azure/GitHub等门户的精确菜单、scope、命令、URL、用户内容保持。角色/适配器/成员显示getter与消费memo订阅已统一补齐；Markdown表格/图片默认提示使用独立Translation render prop，不向外层markdown组件memo注入不存在的t。侧栏React key、routine分区key、移动导航key保持原稳定值，只有显示翻译。移动任务面包屑布局依据原 `/issues` 路由，而非已翻译的Tasks文本。

最后只读审查继续处理不在components/pages直扫范围的固定helper/全局toast/原生运行提示；announcement-preview数据已由DesignGuide显示层翻译，测试/fixture数据、品牌和持久化secret描述/生成任务标题不属于待译UI。`workspaces.workspaceCount` / `needsMe.bundleProposed` 的英文plural_0:s仅为英语后缀，中文不保留该占位符；这是现有语言格式设计，不误作普通插值遗漏。

2026-10-01 21:02 最终交接：last-shared 42键、last-helpers 57键、last-navigation 41键全部合并，en/zh-CN各17411叶键。运行视图本地 Provider notice/session usage fallback 在显示层翻译，原始cached TranscriptEntry、provider内容和协议保留；task-chat-states/audit-navigation/effort/task-side-panel metadata由已有显示层译，不翻持久化值。全局实时通知、凭据显示、技能运行提示、停止错误和12个互动错误状态补齐，后者保存raw失败对象、渲染时派生本地提示，未知后端reason保持。NewAgent、面包屑固定默认标签、流水线展示helper和连接产品预览已补齐；Open状态使用语义独立的“待处理”，None使用“无”，不复用按钮“打开”或分组“不分组”。

最终静态引用18665条（缺失0；动态键已按调用链复核），UI typecheck、token gates、diff --check通过。测试排除文件无修改。三名worker完成并停止编辑，没有剩余已知固定UI漏项或临时词库待合并。构建、测试、浏览器语言切换核查按用户最新要求跳过；原有英语断言与未经运行验收的布局/交互不在本次完成声明内。继续工作时保留当前未提交更改，不重启Pi，不回到已经翻译的模块重复替换。
