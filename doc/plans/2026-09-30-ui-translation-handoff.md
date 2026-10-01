# Parallel translation handoff

## ui/src/pages/InviteLanding.tsx
# UI 中文翻译交接（2026-10-01）

## 本批完成：InviteLanding 邀请确认与认证反馈

本批仅修改 `ui/src/pages/InviteLanding.tsx` 的邀请落地页及审批确认区，并同步 en/zh-CN 的 `inviteLanding`。完成已加入组织反馈及 Open board、邀请页标题/说明、组织与邀请详情标签、邀请人留言、登录身份、审批等待说明、确认加入区标题和动态公司说明、认证失败与账户已存在反馈、注册/登录帮助文案、自动接受邀请的处理中状态等文案本地化。动态公司名、邀请人/审批人、登录身份及错误中的邮箱均以 i18next 插值或既有动态节点保留；Settings → Members、Paperclip 等专名/产品标识未误作翻译对象。组件外错误映射继续使用项目 `@/i18n` 的 `t`，未使用 hook。未改逻辑、样式、测试、快照、fixture、其他语言或其他产品文件；保留工作树原有更改。

## 修改文件

- `ui/src/pages/InviteLanding.tsx`
- `ui/src/i18n/locales/en.json`
- `ui/src/i18n/locales/zh-CN.json`
- 本交接文件

## 验证及待办

遵循本并行批次的外部调度约束，未运行测试、typecheck、token gates、构建或全仓检查；不声称验证通过。外部调度器需执行其统一的 en/zh-CN 重复键与键集一致性检查及 token gates。当前修改范围内未有刻意未解决的产品错误；测试未执行。已保留原有 staged/未提交修改。

## 下一批唯一建议范围

`ui/src/pages/InviteLanding.tsx` 的 `AwaitingJoinApprovalPanel`：审批导航路径 `Settings → Members`（两处）、`Claim secret` 标签及 `Onboarding:` 标签。这些仍是硬编码用户可见文案；仅修改该区域及 en/zh-CN，保留 claim secret、POST、API 路径、URL 等动态或协议值，不改测试文件。主邀请卡片前置状态/加载/错误 JSX 已本地化，不得再次分配。全项目剩余 UI 尚未扫描，不能据此推断全部完成。

Merged verification: locale parity, token gates and UI typecheck passed.

## 停止恢复：parallel-9c54d4c3 / worker-1-attempt-1（2026-10-01）

读取隔离 worker 日志及工作树确认：worker 只更新交接，没有产品代码修改，因为此前指定的 439–495 行状态反馈已经使用 `t()`。调度器的产品进展检查因此停止；隔离文件及日志仍保留，未自动恢复其文档改动。

本次在主工作树补齐 InviteLanding 的 7 条实际遗漏：默认审批人、默认公司名、默认账户名、邀请不存在、访问检查重试、已属于组织、接受邀请失败。同步新增 en/zh-CN 的 `inviteLanding` 键；未改业务流程、样式、测试、快照或 fixture，保留原有 CaseDetail 和其他已保存修改。

验证：`pnpm check:token-gates`、`pnpm --filter @paperclipai/ui typecheck`、locale-validation 7/7、`git diff --check` 通过。InviteLanding 测试 7 通过、11 失败：测试仍依赖英文断言/元素选择，当前默认 zh-CN 渲染中文；不声称测试全绿。未运行全仓 typecheck/test/build；这不是 PR-ready 交付。下一批唯一范围以本文件上方 `AwaitingJoinApprovalPanel` 建议为准。未提交、推送或重启调度器。
