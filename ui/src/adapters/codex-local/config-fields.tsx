import { t, useTranslation } from "@/i18n";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { configFieldsForSection } from "../config-sections";
import type { AdapterConfigFieldsProps } from "../types";
import {
  Field,
  ToggleField,
  DraftInput,
  DraftNumberInput,
  help,
} from "../../components/agent-config-primitives";
import { ChoosePathButton } from "../../components/PathInstructionsModal";
import { LocalWorkspaceRuntimeFields } from "../local-workspace-runtime-fields";
import {
  DEFAULT_CODEX_LOCAL_MODEL,
  CODEX_LOCAL_FAST_MODE_SUPPORTED_MODELS,
  isCodexLocalFastModeSupported,
  isCodexLocalManualModel,
} from "@paperclipai/adapter-codex-local";
import {
  PAPERCLIP_RUNNER_IDLE_TIMEOUT_DEFAULT_MS,
  PAPERCLIP_RUNNER_IDLE_TIMEOUT_MAX_MS,
  PAPERCLIP_RUNNER_PERMISSION_CAPABILITIES,
  PAPERCLIP_RUNNER_ACPX_PROFILES,
  isPaperclipRunnerProvider,
  resolvePaperclipRunnerIdleTimeoutMs,
  resolvePaperclipRunnerPermissionMode,
  type PaperclipRunnerPermissionMode,
  type PaperclipRunnerProvider,
} from "@paperclipai/adapter-utils";

const inputClass =
  "w-full rounded-md border border-border px-2.5 py-1.5 bg-transparent outline-none text-sm font-mono placeholder:text-muted-foreground/40";
const defaultOpenCodeRunnerModel = "openrouter/deepseek/deepseek-v4-flash-0731";
const defaultAcpxClaudeModel = "claude-sonnet-5";
const defaultClaudeManagedModel = "claude-sonnet-5";
const defaultAwsAgentCoreModel = "global.anthropic.claude-sonnet-4-6";

export function CodexLocalConfigFields({
  section,
  mode,
  isCreate,
  adapterType,
  values,
  set,
  config,
  eff,
  mark,
  models,
  hideInstructionsFile,
  managedSandboxOnly,
}: AdapterConfigFieldsProps) {
  useTranslation();
  const runnerManaged = adapterType === "paperclip_runner";
  // The execution engine picks which binary runs on the execution host, and the
  // ACP sub-fields below name host paths. The platform-managed environment owns
  // both, so the managed-sandbox-only policy hides them the same way
  // `runnerManaged` already does for the Paperclip Runner.
  const hideEngineChoice = runnerManaged || managedSandboxOnly === true;
  const configuredRunnerProvider = runnerManaged
    ? isCreate
      ? values!.adapterSchemaValues?.provider
      : eff("adapterConfig", "provider", config.provider === "acpx" && config.acpxAgent === "codex" ? "codex" : config.provider ?? "codex")
    : "codex";
  const runnerProvider: PaperclipRunnerProvider = isPaperclipRunnerProvider(
    configuredRunnerProvider,
  )
    ? configuredRunnerProvider
    : "codex";
  const runnerPermissionCapability =
    PAPERCLIP_RUNNER_PERMISSION_CAPABILITIES[runnerProvider];
  const configuredRunnerPermissionMode =
    runnerManaged && runnerPermissionCapability.configurable
      ? isCreate
        ? (values!.adapterSchemaValues?.[
            runnerPermissionCapability.configKey
          ] ??
          (runnerProvider === "codex"
            ? values!.codexPermissionMode
            : undefined))
        : eff(
            "adapterConfig",
            runnerPermissionCapability.configKey,
            config[runnerPermissionCapability.configKey],
          )
      : undefined;
  const runnerPermissionModeUnsupported =
    runnerManaged &&
    runnerPermissionCapability.configurable &&
    configuredRunnerPermissionMode !== undefined &&
    !runnerPermissionCapability.options.some(
      (option) => option.value === configuredRunnerPermissionMode,
    );
  const runnerPermissionMode =
    runnerManaged && runnerPermissionCapability.configurable
      ? resolvePaperclipRunnerPermissionMode(
          runnerProvider,
          configuredRunnerPermissionMode,
        )
      : runnerPermissionCapability.defaultMode;
  const runnerSchemaValue = (key: string, fallback: unknown): unknown =>
    isCreate
      ? (values!.adapterSchemaValues?.[key] ?? fallback)
      : eff("adapterConfig", key, config[key] ?? fallback);
  const updateRunnerSchemaValue = (key: string, value: unknown): void => {
    if (isCreate) {
      set!({
        adapterSchemaValues: {
          ...values!.adapterSchemaValues,
          [key]: value,
        },
      });
    } else {
      mark("adapterConfig", key, value);
    }
  };
  const runnerLifecycleMode = runnerManaged
    ? isCreate
      ? (values!.paperclipRunnerLifecycleMode ?? "per_turn")
      : eff(
          "adapterConfig",
          "lifecycleMode",
          config.lifecycleMode === "warm" ? "warm" : "per_turn",
        )
    : "per_turn";
  const runnerIdleTimeoutMs = runnerManaged
    ? resolvePaperclipRunnerIdleTimeoutMs(
        isCreate
          ? values!.paperclipRunnerIdleTimeoutMs
          : eff("adapterConfig", "idleTimeoutMs", config.idleTimeoutMs),
      )
    : PAPERCLIP_RUNNER_IDLE_TIMEOUT_DEFAULT_MS;
  const rawEngine = runnerManaged
    ? "cli"
    : isCreate
      ? (values!.codexEngine ?? "auto")
      : eff("adapterConfig", "engine", String(config.engine ?? "auto"));
  const engine =
    rawEngine === "acp" || rawEngine === "cli" ? rawEngine : "auto";
  const acpSelected = engine === "acp";
  const bypassEnabled =
    config.dangerouslyBypassApprovalsAndSandbox === true ||
    config.dangerouslyBypassSandbox === true;
  const fastModeEnabled = isCreate
    ? Boolean(values!.fastMode)
    : eff("adapterConfig", "fastMode", Boolean(config.fastMode));
  const currentModel = isCreate
    ? String(values!.model ?? "")
    : eff("adapterConfig", "model", String(config.model ?? ""));
  const fastModeManualModel = isCodexLocalManualModel(currentModel);
  const fastModeSupported = isCodexLocalFastModeSupported(currentModel);
  const supportedModelsLabel =
    CODEX_LOCAL_FAST_MODE_SUPPORTED_MODELS.join(", ");
  const fastModeMessage = fastModeManualModel
    ? t("adapterConfig.fastModeWillBePassedThroughForThisManualModelIfCodexRejectsItTurnTheToggleOff")
    : fastModeSupported
      ? t("adapterConfig.fastModeConsumesCreditstokensMuchFasterThanStandardCodexRuns")
      : t("adapterConfig.fastModeUnsupported", { models: supportedModelsLabel });

  return configFieldsForSection(section, (
    <>
      {!hideEngineChoice && (
        <Field
          label={t("adapterConfig.executionEngine")}
          hint={t("adapterConfig.defaultUsesACPIfACPIsUnavailableTheRunFailsWithASetupErrorChooseCLIExplicitlyToUseIt")}
        >
          <select
            className={inputClass}
            value={engine}
            onChange={(e) => {
              const value =
                e.target.value === "acp"
                  ? "acp"
                  : e.target.value === "cli"
                    ? "cli"
                    : "auto";
              isCreate
                ? set!({ codexEngine: value })
                : mark(
                    "adapterConfig",
                    "engine",
                    value === "auto" ? undefined : value,
                  );
            }}
          >
            <option value="auto">{t("adapterConfig.defaultACP")}</option>
            <option value="cli">Codex CLI</option>
            <option value="acp">ACP</option>
          </select>
        </Field>
      )}
      {runnerManaged && (
        <Field configSection="adapter"
          label={t("adapterConfig.provider")}
          hint={t("adapterConfig.theRunnerPersistsThisProviderWithEachRunSoRecoveryCannotDriftAfterConfigurationChanges")}
        >
          <select
            className={inputClass}
            value={runnerProvider === "acpx" && runnerSchemaValue("acpxAgent", "claude") === "grok" ? "grok" : runnerProvider}
            onChange={(event) => {
              const grok = event.target.value === "grok";
              const provider = grok ? "acpx" : isPaperclipRunnerProvider(event.target.value)
                ? event.target.value
                : "codex";
              const model =
                provider === "opencode"
                  ? defaultOpenCodeRunnerModel
                  : provider === "claude_managed"
                    ? defaultClaudeManagedModel
                    : provider === "aws_agentcore"
                      ? defaultAwsAgentCoreModel
                      : provider === "acpx"
                        ? grok ? "grok-4.7" : defaultAcpxClaudeModel
                        : DEFAULT_CODEX_LOCAL_MODEL;
              if (isCreate) {
                set!({
                  model,
                  adapterSchemaValues: {
                    ...values!.adapterSchemaValues,
                    provider,
                    ...(provider === "acpx" ? { acpxAgent: grok ? "grok" : "claude" } : {}),
                  },
                });
              } else {
                mark("adapterConfig", "provider", provider);
                mark("adapterConfig", "model", model);
                if (provider === "acpx") {
                  mark("adapterConfig", "acpxAgent", grok ? "grok" : "claude");
                }
              }
            }}
          >
            <option value="codex">Codex</option>
            <option value="opencode">OpenCode 1.18.32</option>
            <option value="claude_managed">{t("aiConnectionsRestUi.claudeManaged")}</option>
            <option value="aws_agentcore">AWS AgentCore</option>
            <option value="acpx">{t("adapterConfig.aCPAgents")}</option>
            <option value="grok">Grok Build</option>
          </select>
        </Field>
      )}
      {runnerManaged && runnerProvider === "acpx" && runnerSchemaValue("acpxAgent", "claude") !== "grok" && (
        <Field configSection="adapter" label={t("adapterConfig.aCPAgent")} hint={t("adapterConfig.cursorGitHubCopilotAndPiAreAwaitingLocalAndDaytonaQualification")}>
          <select className={inputClass}
            value={String(isCreate ? values!.adapterSchemaValues?.acpxAgent ?? "claude" : eff("adapterConfig", "acpxAgent", config.acpxAgent ?? "claude"))}
            onChange={(event) => {
              const profile = PAPERCLIP_RUNNER_ACPX_PROFILES.find(entry => entry.value === event.target.value);
              if (!profile?.qualified) return;
              if (isCreate) set!({ model: profile.value === "claude" ? defaultAcpxClaudeModel : "",
                adapterSchemaValues: { ...values!.adapterSchemaValues, acpxAgent: profile.value } });
              else { mark("adapterConfig", "acpxAgent", profile.value); mark("adapterConfig", "model", profile.value === "claude" ? defaultAcpxClaudeModel : ""); }
            }}>
            {PAPERCLIP_RUNNER_ACPX_PROFILES.map(profile => <option key={profile.value} value={profile.value} disabled={!profile.qualified}>
              {profile.label}{profile.qualified ? "" : t("adapterConfig.qualificationPending")}
            </option>)}
          </select>
        </Field>
      )}
      {runnerManaged && runnerProvider === "claude_managed" && (
        <>
          <Field
            label={t("adapterConfig.managedAgentProfile")}
            hint={t("adapterConfig.companyscopedQualifiedProfileIDOrKeyRemoteResourceIdentityIsLoadedFromTheStoredProfileNotThisAgentConfig")}
          >
            <DraftInput
              value={String(runnerSchemaValue("managedProfileId", ""))}
              onCommit={(value) =>
                updateRunnerSchemaValue("managedProfileId", value.trim())
              }
              immediate
              className={inputClass}
              placeholder="managed-primary"
            />
          </Field>
          <Field
            label={t("adapterConfig.sessionSpendCeilingUSD")}
            hint={t("adapterConfig.optionalPeragentHardCeilingLeave100ToUseAConservativeDefault")}
          >
            <DraftNumberInput
              value={Number(runnerSchemaValue("maxSessionListCostUsd", 1))}
              min={0.01}
              onCommit={(value) =>
                updateRunnerSchemaValue("maxSessionListCostUsd", value)
              }
              immediate
              className={inputClass}
            />
          </Field>
          <ToggleField
            label={t("adapterConfig.acknowledgeManagedRetention")}
            hint={t("adapterConfig.claudeManagedIsAStatefulBetaServiceAndIsNotEligibleForZDROrHIPAAModes")}
            checked={
              runnerSchemaValue("managedAgentsRetentionAcknowledged", false) ===
              true
            }
            onChange={(value) =>
              updateRunnerSchemaValue(
                "managedAgentsRetentionAcknowledged",
                value,
              )
            }
          />
        </>
      )}
      {runnerManaged && runnerProvider === "aws_agentcore" && (
        <>
          <Field
            label={t("adapterConfig.agentCoreProfile")}
            hint={t("adapterConfig.companyscopedQualifiedProfileIDOrKeyHarnessMemoryIAMAndContextstoreIdentityComeFromTheStoredProfile")}
          >
            <DraftInput
              value={String(runnerSchemaValue("agentCoreProfileId", ""))}
              onCommit={(value) =>
                updateRunnerSchemaValue("agentCoreProfileId", value.trim())
              }
              immediate
              className={inputClass}
              placeholder="agentcore-primary"
            />
          </Field>
          <Field
            label={t("adapterConfig.estimatedSessionCeilingUSD")}
            hint={t("adapterConfig.paperclipEstimateAWSDoesNotProvideAPersessionCurrencyHardStop")}
          >
            <DraftNumberInput
              value={Number(runnerSchemaValue("maxEstimatedSessionCostUsd", 1))}
              min={0.01}
              onCommit={(value) =>
                updateRunnerSchemaValue("maxEstimatedSessionCostUsd", value)
              }
              immediate
              className={inputClass}
            />
          </Field>
          <Field
            label={t("adapterConfig.maximumIterations")}
            hint={t("adapterConfig.qualifiedRangeIs18InvalidValuesFailClosedTo8")}
          >
            <DraftNumberInput
              value={Number(runnerSchemaValue("maxIterations", 8))}
              min={1}
              max={8}
              onCommit={(value) =>
                updateRunnerSchemaValue("maxIterations", value)
              }
              immediate
              className={inputClass}
            />
          </Field>
          <Field
            label={t("adapterConfig.maximumOutputTokens")}
            hint={t("adapterConfig.qualifiedRangeIs14096")}
          >
            <DraftNumberInput
              value={Number(runnerSchemaValue("maxOutputTokens", 4_096))}
              min={1}
              max={4_096}
              onCommit={(value) =>
                updateRunnerSchemaValue("maxOutputTokens", value)
              }
              immediate
              className={inputClass}
            />
          </Field>
          <Field configSection="runPolicy"
            label={t("adapterConfig.invocationTimeoutSeconds")}
            hint={t("adapterConfig.qualifiedRangeIs1300Seconds")}
          >
            <DraftNumberInput
              value={Number(runnerSchemaValue("timeoutSeconds", 300))}
              min={1}
              max={300}
              onCommit={(value) =>
                updateRunnerSchemaValue("timeoutSeconds", value)
              }
              immediate
              className={inputClass}
            />
          </Field>
          <ToggleField
            label={t("adapterConfig.acknowledge90dayMemoryRetention")}
            hint={t("adapterConfig.theQualifiedAgentCoreProfileRetainsShorttermMemoryEventsForExactly90Days")}
            checked={
              runnerSchemaValue("agentCoreRetentionAcknowledged", false) ===
              true
            }
            onChange={(value) =>
              updateRunnerSchemaValue("agentCoreRetentionAcknowledged", value)
            }
          />
        </>
      )}
      {runnerManaged && runnerPermissionCapability.configurable && (runnerPermissionCapability.options.length > 1 || runnerPermissionModeUnsupported) && (
        <Field
          label={t("adapterConfig.permissionMode")}
          hint={`${t(`adapterConfig.permissionDescriptions.${runnerProvider}`, { defaultValue: runnerPermissionCapability.description })} ${t("adapterConfig.permissionBoundary")}`}
        >
          <Select
            value={
              runnerPermissionModeUnsupported
                ? "__unsupported__"
                : runnerPermissionMode
            }
            onValueChange={(selectedMode) => {
              const value = resolvePaperclipRunnerPermissionMode(
                runnerProvider,
                selectedMode,
              ) as PaperclipRunnerPermissionMode;
              if (isCreate) {
                set!({
                  adapterSchemaValues: {
                    ...values!.adapterSchemaValues,
                    [runnerPermissionCapability.configKey]: value,
                  },
                });
              } else {
                mark(
                  "adapterConfig",
                  runnerPermissionCapability.configKey,
                  value,
                );
              }
            }}
          >
            <SelectTrigger aria-label={t("adapterConfig.permissionMode")} className="w-full font-sans">
              <SelectValue>
                {runnerPermissionModeUnsupported
                  ? t("adapterConfig.unsupportedSavedModeSelectAQualifiedMode")
                  : t(`adapterConfig.permissions.${runnerPermissionMode}`, { defaultValue: runnerPermissionCapability.options.find((option) => option.value === runnerPermissionMode)?.label })}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {runnerPermissionModeUnsupported && (
                <SelectItem value="__unsupported__" disabled>
                  {t("adapterConfig.unsupportedSavedModeSelectAQualifiedMode")}
                </SelectItem>
              )}
              {runnerPermissionCapability.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(`adapterConfig.permissions.${option.value}`, { defaultValue: option.label })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {runnerPermissionModeUnsupported && runnerProvider === "codex" && (
            <p className="mt-1 text-xs text-destructive" role="alert">
              {t("adapterConfig.unsupportedCodexMode")}
            </p>
          )}
        </Field>
      )}
      {runnerManaged && (
        <Field configSection="runPolicy"
          label={t("adapterConfig.runnerLifecycle")}
          hint={t("adapterConfig.turnByTurnSuspendsAfterEachRunWarmKeepsTheSameProviderProcessAvailableBetweenGovernedRuns")}
        >
          <select
            className={inputClass}
            value={runnerLifecycleMode}
            onChange={(event) => {
              const value = event.target.value === "warm" ? "warm" : "per_turn";
              isCreate
                ? set!({ paperclipRunnerLifecycleMode: value })
                : mark("adapterConfig", "lifecycleMode", value);
            }}
          >
            <option value="per_turn">{t("adapterConfig.turnByTurn")}</option>
            <option value="warm">{t("adapterConfig.warmSession")}</option>
          </select>
        </Field>
      )}
      {runnerManaged && runnerLifecycleMode === "warm" && (
        <Field configSection="runPolicy"
          label={t("adapterConfig.warmIdleTimeoutMs")}
          hint={t("adapterConfig.afterThisMuchInactivityRunnerdCheckpointsAndSuspendsTheProviderSessionTheMaximumIs24Hours")}
        >
          {isCreate ? (
            <input
              type="number"
              min={1}
              max={PAPERCLIP_RUNNER_IDLE_TIMEOUT_MAX_MS}
              className={inputClass}
              value={runnerIdleTimeoutMs}
              onChange={(event) =>
                set!({
                  paperclipRunnerIdleTimeoutMs:
                    resolvePaperclipRunnerIdleTimeoutMs(
                      Number(event.target.value),
                    ),
                })
              }
            />
          ) : (
            <DraftNumberInput
              value={runnerIdleTimeoutMs}
              min={1}
              max={PAPERCLIP_RUNNER_IDLE_TIMEOUT_MAX_MS}
              onCommit={(value) =>
                mark(
                  "adapterConfig",
                  "idleTimeoutMs",
                  resolvePaperclipRunnerIdleTimeoutMs(value),
                )
              }
              immediate
              className={inputClass}
            />
          )}
        </Field>
      )}
      {acpSelected && (
        <>
          {!managedSandboxOnly && (
            <Field configSection="advanced"
              label={t("adapterConfig.aCPServerCommand")}
              hint={t("adapterConfig.optionalOverrideForTheCodexACPServerCommandDefaultsToThePackagelocalCodexacpBinary")}
            >
              <DraftInput
                value={
                  isCreate
                    ? (values!.codexAcpAgentCommand ?? "")
                    : eff(
                        "adapterConfig",
                        "agentCommand",
                        String(config.agentCommand ?? ""),
                      )
                }
                onCommit={(v) =>
                  isCreate
                    ? set!({ codexAcpAgentCommand: v })
                    : mark("adapterConfig", "agentCommand", v || undefined)
                }
                immediate
                className={inputClass}
                placeholder="codex-acp"
              />
            </Field>
          )}
          <Field configSection="runPolicy"
            label={t("adapterConfig.aCPSessionMode")}
            hint={t("adapterConfig.persistentKeepsACPSessionStateBetweenRunsOneshotStartsFreshEachRun")}
          >
            <select
              className={inputClass}
              value={
                isCreate
                  ? (values!.codexAcpMode ?? "persistent")
                  : eff(
                      "adapterConfig",
                      "mode",
                      String(config.mode ?? "persistent"),
                    )
              }
              onChange={(e) => {
                const value =
                  e.target.value === "oneshot" ? "oneshot" : "persistent";
                isCreate
                  ? set!({ codexAcpMode: value })
                  : mark("adapterConfig", "mode", value);
              }}
            >
              <option value="persistent">{t("adapterConfig.persistent")}</option>
              <option value="oneshot">{t("adapterConfig.oneshot")}</option>
            </select>
          </Field>
          <Field
            label={t("adapterConfig.aCPNoninteractivePermissions")}
            hint={t("adapterConfig.fallbackIfTheACPAgentAsksForInputOutsideAnInteractiveSession")}
          >
            <select
              className={inputClass}
              value={
                isCreate
                  ? (values!.codexAcpNonInteractivePermissions ?? "deny")
                  : eff(
                      "adapterConfig",
                      "nonInteractivePermissions",
                      String(config.nonInteractivePermissions ?? "deny"),
                    )
              }
              onChange={(e) => {
                const value = e.target.value === "fail" ? "fail" : "deny";
                isCreate
                  ? set!({ codexAcpNonInteractivePermissions: value })
                  : mark("adapterConfig", "nonInteractivePermissions", value);
              }}
            >
              <option value="deny">{t("adapterConfig.deny")}</option>
              <option value="fail">{t("adapterConfig.fail")}</option>
            </select>
          </Field>
          {!managedSandboxOnly && (
            <Field
              label={t("adapterConfig.aCPStateDirectory")}
              hint={t("adapterConfig.optionalACPSessionStateDirectoryDefaultsToPaperclipmanagedOrganizationagentScopedStorage")}
            >
              <div className="flex items-center gap-2">
                <DraftInput
                  value={
                    isCreate
                      ? (values!.codexAcpStateDir ?? "")
                      : eff(
                          "adapterConfig",
                          "stateDir",
                          String(config.stateDir ?? ""),
                        )
                  }
                  onCommit={(v) =>
                    isCreate
                      ? set!({ codexAcpStateDir: v })
                      : mark("adapterConfig", "stateDir", v || undefined)
                  }
                  immediate
                  className={inputClass}
                  placeholder="/path/to/acp-state"
                />
                <ChoosePathButton />
              </div>
            </Field>
          )}
          <Field configSection="runPolicy"
            label={t("adapterConfig.aCPWarmProcessIdleMs")}
            hint={t("adapterConfig.defaultsTo0WhichClosesTheACPProcessAfterEachRunWhileRetainingPersistentSessionState")}
          >
            {isCreate ? (
              <input
                type="number"
                className={inputClass}
                value={values!.codexAcpWarmHandleIdleMs ?? 0}
                onChange={(e) =>
                  set!({ codexAcpWarmHandleIdleMs: Number(e.target.value) })
                }
              />
            ) : (
              <DraftNumberInput
                value={eff(
                  "adapterConfig",
                  "warmHandleIdleMs",
                  Number(config.warmHandleIdleMs ?? 0),
                )}
                onCommit={(v) =>
                  mark("adapterConfig", "warmHandleIdleMs", v || 0)
                }
                immediate
                className={inputClass}
              />
            )}
          </Field>
        </>
      )}
      {!runnerManaged && !hideInstructionsFile && (
        <Field label={t("adapterConfig.agentInstructionsFile")} hint={t("adapterConfig.codexInstructionsHint")}>
          <div className="flex items-center gap-2">
            <DraftInput
              value={
                isCreate
                  ? (values!.instructionsFilePath ?? "")
                  : eff(
                      "adapterConfig",
                      "instructionsFilePath",
                      String(config.instructionsFilePath ?? ""),
                    )
              }
              onCommit={(v) =>
                isCreate
                  ? set!({ instructionsFilePath: v })
                  : mark(
                      "adapterConfig",
                      "instructionsFilePath",
                      v || undefined,
                    )
              }
              immediate
              className={inputClass}
              placeholder="/absolute/path/to/AGENTS.md"
            />
            <ChoosePathButton />
          </div>
        </Field>
      )}
      {!runnerManaged && (
        <>
          <ToggleField
            label={t("adapterConfig.bypassSandbox")}
            hint={help.dangerouslyBypassSandbox}
            checked={
              isCreate
                ? values!.dangerouslyBypassSandbox
                : eff(
                    "adapterConfig",
                    "dangerouslyBypassApprovalsAndSandbox",
                    bypassEnabled,
                  )
            }
            onChange={(v) =>
              isCreate
                ? set!({ dangerouslyBypassSandbox: v })
                : mark(
                    "adapterConfig",
                    "dangerouslyBypassApprovalsAndSandbox",
                    v,
                  )
            }
          />
          <ToggleField
            label={t("adapterConfig.enableSearch")}
            hint={help.search}
            checked={
              isCreate
                ? values!.search
                : eff("adapterConfig", "search", !!config.search)
            }
            onChange={(v) =>
              isCreate
                ? set!({ search: v })
                : mark("adapterConfig", "search", v)
            }
          />
          <ToggleField
            label={t("adapterConfig.fastMode")}
            hint={help.fastMode}
            checked={fastModeEnabled}
            onChange={(v) =>
              isCreate
                ? set!({ fastMode: v })
                : mark("adapterConfig", "fastMode", v)
            }
          />
          {fastModeEnabled && (
            <div className="rounded-md border border-amber-300/70 bg-amber-50/80 px-3 py-2 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
              {fastModeMessage}
            </div>
          )}
        </>
      )}
      <LocalWorkspaceRuntimeFields
        isCreate={isCreate}
        values={values}
        set={set}
        config={config}
        mark={mark}
        eff={eff}
        mode={mode}
        adapterType={adapterType}
        models={models}
      />
    </>
  ));
}
