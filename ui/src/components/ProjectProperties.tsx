import { useTranslation } from "@/i18n";
import { useWorkspaceIsolationControls } from "@/hooks/useWorkspaceIsolationControls";
import { useState, type ReactNode } from "react";
import { environmentDisplayLabel, filterManagedSandboxSelectableEnvironments } from "@/lib/managed-sandbox-environment";
import { Link } from "@/lib/router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Project, SharedWorkspaceConcurrency } from "@paperclipai/shared";
import { ProjectRepositories } from "./ProjectRepositories";
import { cn, formatDate } from "../lib/utils";
import { environmentsApi } from "../api/environments";
import { instanceSettingsApi } from "../api/instanceSettings";
import { projectsApi } from "../api/projects";
import { secretsApi } from "../api/secrets";
import { useCompany } from "../context/CompanyContext";
import { queryKeys } from "../lib/queryKeys";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, Archive, ArchiveRestore, Check, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { ChoosePathButton } from "./PathInstructionsModal";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { DraftInput } from "./agent-config-primitives";
import { InlineEditor } from "./InlineEditor";
import { EnvironmentVariablesEditor } from "./environment-variables-editor";
import { Badge } from "@/components/ui/badge";

const SERVICE_STATUS_KEYS: Record<string, string> = { provisioning: "projectProperties.provisioning", starting: "projectProperties.starting", running: "projectProperties.running", stopped: "projectProperties.stopped", failed: "projectProperties.failed" };
const SERVICE_LIFECYCLE_KEYS: Record<string, string> = { shared: "projectProperties.shared", ephemeral: "projectProperties.ephemeral" };
const EXPOSURE_STATE_KEYS: Record<string, string> = { pending: "projectProperties.exposurePending", ready: "projectProperties.exposureReady", failed: "projectProperties.exposureFailed", cleanup_pending: "projectProperties.exposureCleanup", removed: "projectProperties.exposureRemoved" };

interface ProjectPropertiesProps {
  project: Project;
  repositories?: ReactNode;
  onUpdate?: (data: Record<string, unknown>) => void;
  onFieldUpdate?: (field: ProjectConfigFieldKey, data: Record<string, unknown>) => void;
  getFieldSaveState?: (field: ProjectConfigFieldKey) => ProjectFieldSaveState;
  onArchive?: (archived: boolean) => void;
  archivePending?: boolean;
}

export type ProjectFieldSaveState = "idle" | "saving" | "saved" | "error";
export type ProjectConfigFieldKey =
  | "name"
  | "description"
  | "status"
  | "goals"
  | "env"
  | "execution_workspace_enabled"
  | "execution_workspace_default_mode"
  | "execution_workspace_shared_concurrency"
  | "execution_workspace_environment"
  | "execution_workspace_base_ref"
  | "execution_workspace_branch_template"
  | "execution_workspace_worktree_parent_dir"
  | "execution_workspace_provision_command"
  | "execution_workspace_runtime_provision_command"
  | "execution_workspace_teardown_command";

const SHARED_WORKSPACE_CONCURRENCY_OPTIONS: {
  value: SharedWorkspaceConcurrency;
  label: string;
  help: string;
}[] = [
  {
    value: "auto",
    label: "projectProperties.auto",
    help: "projectProperties.concurrentRunsOnLocalsshRunnersRunsTakeTurnsIn",
  },
  {
    value: "serialize",
    label: "projectProperties.serialize",
    help: "projectProperties.sandboxRunsTakeTurnsInTheSharedProjectWorkspace",
  },
  {
    value: "allow",
    label: "projectProperties.allow",
    help: "projectProperties.runsNeverWaitForTheWorkspaceConcurrentEditsAre",
  },
];

function SaveIndicator({ state }: { state: ProjectFieldSaveState }) {
  const { t } = useTranslation();
  if (state === "saving") {
    return (
      <span className="inline-flex items-center gap-1 text-(length:--text-micro) text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        {t("projectProperties.saving")}
      </span>
    );
  }
  if (state === "saved") {
    return (
      <span className="inline-flex items-center gap-1 text-(length:--text-micro) text-green-600 dark:text-green-400">
        <Check className="h-3 w-3" />
        {t("projectProperties.saved")}
      </span>
    );
  }
  if (state === "error") {
    return (
      <span className="inline-flex items-center gap-1 text-(length:--text-micro) text-destructive">
        <AlertCircle className="h-3 w-3" />
        {t("projectProperties.failed")}
      </span>
    );
  }
  return null;
}

function FieldLabel({
  label,
  state,
}: {
  label: string;
  state: ProjectFieldSaveState;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <SaveIndicator state={state} />
    </div>
  );
}

function PropertyRow({
  label,
  children,
  alignStart = false,
  valueClassName = "",
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  alignStart?: boolean;
  valueClassName?: string;
}) {
  return (
    <div className={cn("flex gap-3 py-1.5 items-start")}>
      <div className="shrink-0 w-20 mt-0.5">{label}</div>
      <div className={cn("min-w-0 flex-1", alignStart ? "pt-0.5" : "flex items-center gap-1.5 flex-wrap", valueClassName)}>
        {children}
      </div>
    </div>
  );
}

function ArchiveDangerZone({
  project,
  onArchive,
  archivePending,
}: {
  project: Project;
  onArchive: (archived: boolean) => void;
  archivePending?: boolean;
}) {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const isArchive = !project.archivedAt;

  return (
    <div className="space-y-3 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-4">
      <p className="text-sm text-muted-foreground">
        {isArchive
          ? t("projectProperties.archiveThisProjectToHideItFromTheSidebar")
          : t("projectProperties.unarchiveThisProjectToRestoreItInTheSidebar")}
      </p>
      {archivePending ? (
        <Button size="sm" variant="destructive" disabled>
          <Loader2 className="h-3 w-3 animate-spin mr-1" />
          {isArchive ? t("projectProperties.archiving") : t("projectProperties.unarchiving")}
        </Button>
      ) : confirming ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-destructive font-medium">
            {t(isArchive ? "projectProperties.archiveQuestion" : "projectProperties.unarchiveQuestion", { name: project.name })}
          </span>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              setConfirming(false);
              onArchive(isArchive);
            }}
          >
            {t("projectProperties.confirm")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setConfirming(false)}
          >
            {t("projectProperties.cancel")}
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="destructive"
          onClick={() => setConfirming(true)}
        >
          {isArchive ? (
            <><Archive className="h-3 w-3 mr-1" />{t("projectProperties.archiveProject")}</>
          ) : (
            <><ArchiveRestore className="h-3 w-3 mr-1" />{t("projectProperties.unarchiveProject")}</>
          )}
        </Button>
      )}
    </div>
  );
}

export function ProjectProperties({ project, repositories, onUpdate, onFieldUpdate, getFieldSaveState, onArchive, archivePending }: ProjectPropertiesProps) {
  const { t } = useTranslation();
  const { visible: workspaceIsolationControlsVisible } = useWorkspaceIsolationControls();
  const { selectedCompanyId } = useCompany();
  const queryClient = useQueryClient();
  const [executionWorkspaceAdvancedOpen, setExecutionWorkspaceAdvancedOpen] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState<"local" | null>(null);
  const [workspaceCwd, setWorkspaceCwd] = useState("");
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);

  const commitField = (field: ProjectConfigFieldKey, data: Record<string, unknown>) => {
    if (onFieldUpdate) {
      onFieldUpdate(field, data);
      return;
    }
    onUpdate?.(data);
  };
  const fieldState = (field: ProjectConfigFieldKey): ProjectFieldSaveState => getFieldSaveState?.(field) ?? "idle";

  const { data: experimentalSettings } = useQuery({
    queryKey: queryKeys.instance.experimentalSettings,
    queryFn: () => instanceSettingsApi.getExperimental(),
    retry: false,
  });
  const environmentsEnabled = experimentalSettings?.enableEnvironments === true;
  const { data: availableSecrets = [] } = useQuery({
    queryKey: selectedCompanyId ? queryKeys.secrets.list(selectedCompanyId) : ["secrets", "none"],
    queryFn: () => secretsApi.list(selectedCompanyId!),
    enabled: Boolean(selectedCompanyId),
  });
  const { data: userSecretDefinitions = [] } = useQuery({
    queryKey: selectedCompanyId
      ? queryKeys.secrets.userDefinitions(selectedCompanyId)
      : ["user-secret-definitions", "none"],
    queryFn: () => secretsApi.listUserSecretDefinitions(selectedCompanyId!),
    enabled: Boolean(selectedCompanyId),
    retry: false,
  });
  const createSecret = useMutation({
    mutationFn: (input: { name: string; value: string }) => {
      if (!selectedCompanyId) throw new Error(t("projectProperties.selectAnOrganizationToCreateSecrets"));
      return secretsApi.create(selectedCompanyId, input);
    },
    onSuccess: () => {
      if (!selectedCompanyId) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.secrets.list(selectedCompanyId) });
    },
  });
  const { data: environments } = useQuery({
    queryKey: queryKeys.environments.list(selectedCompanyId!),
    queryFn: () => environmentsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId && environmentsEnabled,
  });

  const workspaces = project.workspaces ?? [];
  const codebase = project.codebase;
  const primaryCodebaseWorkspace = project.primaryWorkspace ?? null;
  const hasAdditionalLegacyWorkspaces = workspaces.some((workspace) => workspace.id !== primaryCodebaseWorkspace?.id && !workspace.metadata?.githubRepositoryId);
  const executionWorkspacePolicy = project.executionWorkspacePolicy ?? null;
  const executionWorkspacesEnabled = executionWorkspacePolicy?.enabled === true;
  const isolatedWorkspacesEnabled = experimentalSettings?.enableIsolatedWorkspaces === true;
  const executionWorkspaceDefaultMode =
    executionWorkspacePolicy?.defaultMode === "isolated_workspace" ? "isolated_workspace" : "shared_workspace";
  // Absent/unset round-trips as "auto" — we only write a value once the user picks one.
  const executionWorkspaceSharedConcurrency: SharedWorkspaceConcurrency =
    executionWorkspacePolicy?.sharedWorkspaceConcurrency ?? "auto";
  const selectedConcurrencyOption = SHARED_WORKSPACE_CONCURRENCY_OPTIONS.find(
    (option) => option.value === executionWorkspaceSharedConcurrency,
  );
  const executionWorkspaceEnvironmentId = executionWorkspacePolicy?.environmentId ?? "";
  const executionWorkspaceStrategy = executionWorkspacePolicy?.workspaceStrategy ?? {
    type: "git_worktree",
    baseRef: "",
    branchTemplate: "",
    worktreeParentDir: "",
  };
  // Defense in depth alongside the server's managed-sandbox-only read
  // filter: a cached environments list may still carry the local row.
  const managedSandboxOnly = experimentalSettings?.enableManagedSandboxOnly === true;
  // The gate for the host-path surfaces below. It fails closed whenever the
  // policy is unknown — in flight and also on a failed read: an unresolved
  // policy reads as "not managed", which would show the local folder the policy
  // exists to hide.
  const hideHostPaths = experimentalSettings === undefined || managedSandboxOnly;
  const runSelectableEnvironments = filterManagedSandboxSelectableEnvironments(
    environments ?? [],
    managedSandboxOnly,
  ).filter((environment) => {
    if (environment.driver === "local" || environment.driver === "ssh") return true;
    if (environment.driver !== "sandbox") return false;
    const provider = typeof environment.config?.provider === "string" ? environment.config.provider : null;
    return provider !== null && provider !== "fake";
  });
  const showExecutionWorkspaceEnvironmentControl = environmentsEnabled && runSelectableEnvironments.length > 1;

  const invalidateProject = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(project.id) });
    if (project.urlKey !== project.id) {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(project.urlKey) });
    }
    if (selectedCompanyId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all(selectedCompanyId) });
    }
  };

  const createWorkspace = useMutation({
    mutationFn: (data: Record<string, unknown>) => projectsApi.createWorkspace(project.id, data),
    onSuccess: () => {
      setWorkspaceCwd("");
      setWorkspaceMode(null);
      setWorkspaceError(null);
      invalidateProject();
    },
  });

  const removeWorkspace = useMutation({
    mutationFn: (workspaceId: string) => projectsApi.removeWorkspace(project.id, workspaceId),
    onSuccess: () => {
      setWorkspaceCwd("");
      setWorkspaceMode(null);
      setWorkspaceError(null);
      invalidateProject();
    },
  });
  const updateWorkspace = useMutation({
    mutationFn: ({ workspaceId, data }: { workspaceId: string; data: Record<string, unknown> }) =>
      projectsApi.updateWorkspace(project.id, workspaceId, data),
    onSuccess: () => {
      setWorkspaceCwd("");
      setWorkspaceMode(null);
      setWorkspaceError(null);
      invalidateProject();
    },
  });

  const updateExecutionWorkspacePolicy = (patch: Record<string, unknown>) => {
    if (!onUpdate && !onFieldUpdate) return;
    return {
      executionWorkspacePolicy: {
        enabled: executionWorkspacesEnabled,
        defaultMode: executionWorkspaceDefaultMode,
        allowIssueOverride: executionWorkspacePolicy?.allowIssueOverride ?? true,
        ...executionWorkspacePolicy,
        ...patch,
      },
    };
  };

  const isAbsolutePath = (value: string) => value.startsWith("/") || /^[A-Za-z]:[\\/]/.test(value);

  const isSafeExternalUrl = (value: string | null | undefined) => {
    if (!value) return false;
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const deriveSourceType = (cwd: string | null, repoUrl: string | null) => {
    if (repoUrl) return "git_repo";
    if (cwd) return "local_path";
    return undefined;
  };

  const persistCodebase = (patch: { cwd?: string | null; repoUrl?: string | null }) => {
    const nextCwd = patch.cwd !== undefined ? patch.cwd : codebase.localFolder;
    const nextRepoUrl = patch.repoUrl !== undefined ? patch.repoUrl : codebase.repoUrl;
    if (!nextCwd && !nextRepoUrl) {
      if (primaryCodebaseWorkspace) {
        removeWorkspace.mutate(primaryCodebaseWorkspace.id);
      }
      return;
    }

    const data: Record<string, unknown> = {
      ...(patch.cwd !== undefined ? { cwd: patch.cwd } : {}),
      ...(patch.repoUrl !== undefined ? { repoUrl: patch.repoUrl } : {}),
      ...(deriveSourceType(nextCwd, nextRepoUrl) ? { sourceType: deriveSourceType(nextCwd, nextRepoUrl) } : {}),
      isPrimary: true,
    };

    if (primaryCodebaseWorkspace) {
      updateWorkspace.mutate({ workspaceId: primaryCodebaseWorkspace.id, data });
      return;
    }

    createWorkspace.mutate(data);
  };

  const submitLocalWorkspace = () => {
    const cwd = workspaceCwd.trim();
    if (!cwd) {
      setWorkspaceError(null);
      persistCodebase({ cwd: null });
      return;
    }
    if (!isAbsolutePath(cwd)) {
      setWorkspaceError("projectProperties.localFolderMustBeAFullAbsolutePath");
      return;
    }
    setWorkspaceError(null);
    persistCodebase({ cwd });
  };

  const clearLocalWorkspace = () => {
    const confirmed = window.confirm(
      codebase.repoUrl
        ? t("projectProperties.clearLocalFolderFromThisWorkspace")
        : t("projectProperties.deleteThisWorkspaceLocalFolder"),
    );
    if (!confirmed) return;
    persistCodebase({ cwd: null });
  };

  return (
    <div>
      <div className="space-y-1 pb-4">
        <PropertyRow label={<FieldLabel label={t("projectProperties.name")} state={fieldState("name")} />}>
          {onUpdate || onFieldUpdate ? (
            <DraftInput
              value={project.name}
              onCommit={(name) => commitField("name", { name })}
              immediate
              className="w-full rounded border border-border bg-transparent px-2 py-1 text-sm outline-none"
              placeholder={t("projectProperties.projectName")}
            />
          ) : (
            <span className="text-sm">{project.name}</span>
          )}
        </PropertyRow>
        <PropertyRow
          label={<FieldLabel label={t("projectProperties.description")} state={fieldState("description")} />}
          alignStart
          valueClassName="space-y-0.5"
        >
          {onUpdate || onFieldUpdate ? (
            <InlineEditor
              value={project.description ?? ""}
              onSave={(description) => commitField("description", { description })}
              nullable
              as="p"
              className="text-sm text-muted-foreground"
              placeholder={t("projectProperties.addADescription")}
              multiline
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {project.description?.trim() || t("projectProperties.noDescription")}
            </p>
          )}
        </PropertyRow>
        {repositories ?? <ProjectRepositories key={project.id} project={project} />}
        <PropertyRow
          label={<FieldLabel label={t("projectProperties.env")} state={fieldState("env")} />}
          alignStart
          valueClassName="space-y-2"
        >
          <div className="space-y-2">
            <EnvironmentVariablesEditor
              footerHint={null}
              value={project.env ?? {}}
              secrets={availableSecrets}
              userSecretDefinitions={userSecretDefinitions}
              onCreateSecret={async (name, value) => {
                const created = await createSecret.mutateAsync({ name, value });
                return created;
              }}
              onChange={(env) => commitField("env", { env: env ?? null })}
            />

          </div>
        </PropertyRow>
        <PropertyRow label={<FieldLabel label={t("projectProperties.updated")} state="idle" />}>
          <span className="text-sm">{formatDate(project.updatedAt)}</span>
        </PropertyRow>
        {project.targetDate && (
          <PropertyRow label={<FieldLabel label={t("projectProperties.targetDate")} state="idle" />}>
            <span className="text-sm">{formatDate(project.targetDate)}</span>
          </PropertyRow>
        )}
      </div>

      <Separator className="my-4" />

      <div className="space-y-1 py-4">
        {(!hideHostPaths || (primaryCodebaseWorkspace?.runtimeServices?.length ?? 0) > 0) && <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{t("projectProperties.codebase")}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border text-(length:--text-nano) text-muted-foreground hover:text-foreground"
                  aria-label={t("projectProperties.codebaseHelp")}
                >
                  ?
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {hideHostPaths
                  ? t("projectProperties.repoIdentifiesTheSourceOfTruthAgentsCheckIt")
                  : t("projectProperties.repoIdentifiesTheSourceOfTruthLocalFolderIs")}
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="space-y-2 rounded-md border border-border/70 p-3">
            {/*
              The local folder is an absolute path on the execution host. Under
              the managed-sandbox-only policy every agent runs in the
              platform-managed environment, so the path, the folder controls,
              and the edit panel below all disappear. A managed checkout keeps
              its one-line label so the codebase still reads as accounted for,
              but never renders the path itself.
            */}
            {hideHostPaths ? (
              codebase.origin === "managed_checkout" ? (
                <div className="text-(length:--text-micro) text-muted-foreground">{t("projectProperties.paperclipmanagedFolder")}</div>
              ) : null
            ) : (
              <div className="space-y-1">
                <div className="text-(length:--text-micro) uppercase tracking-wide text-muted-foreground">{t("projectProperties.localFolder")}</div>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <div className="min-w-0 break-all font-mono text-xs text-muted-foreground">
                      {codebase.effectiveLocalFolder}
                    </div>
                    {codebase.origin === "managed_checkout" && (
                      <div className="text-(length:--text-micro) text-muted-foreground">{t("projectProperties.paperclipmanagedFolder")}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="xs"
                      className="h-6 px-2"
                      onClick={() => {
                        setWorkspaceMode("local");
                        setWorkspaceCwd(codebase.localFolder ?? "");
                        setWorkspaceError(null);
                      }}
                    >
                      {codebase.localFolder ? t("projectProperties.changeLocalFolder") : t("projectProperties.setLocalFolder")}
                    </Button>
                    {codebase.localFolder ? (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={clearLocalWorkspace}
                        aria-label={t("projectProperties.clearLocalFolder")}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            {hasAdditionalLegacyWorkspaces && (
              <div className="text-(length:--text-micro) text-muted-foreground">
                {t("projectProperties.additionalLegacyWorkspaceRecordsExistOnThisProjectPaperclip")}
              </div>
            )}

            {primaryCodebaseWorkspace?.runtimeServices && primaryCodebaseWorkspace.runtimeServices.length > 0 ? (
              <div className="space-y-1">
                {primaryCodebaseWorkspace.runtimeServices.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-2 py-1"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-(length:--text-micro) font-medium">{service.serviceName}</span>
                        <Badge variant="ghost"
                          className={cn(
                            "px-1.5 text-(length:--text-nano) uppercase tracking-wide",
                            service.status === "running"
                              ? "bg-green-500/15 text-green-700 dark:text-green-300"
                              : service.status === "failed"
                                ? "bg-red-500/15 text-red-700 dark:text-red-300"
                                : "bg-muted text-muted-foreground",
                          )}
                        >
                          {SERVICE_STATUS_KEYS[service.status] ? t(SERVICE_STATUS_KEYS[service.status]) : service.status}
                        </Badge>
                      </div>
                      <div className="text-(length:--text-micro) text-muted-foreground">
                        {service.url ? (
                          <a
                            href={service.url}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-foreground hover:underline"
                          >
                            {service.url}
                          </a>
                        ) : (
                          service.command ?? t("projectProperties.noUrl")
                        )}
                      </div>
                      {service.exposure && service.exposure.state !== "removed" ? (
                        <div
                          className={cn(
                            "text-(length:--text-nano)",
                            service.exposure.state === "failed" || service.exposure.state === "cleanup_pending"
                              ? "text-destructive"
                              : "text-muted-foreground",
                          )}
                        >
                          {EXPOSURE_STATE_KEYS[service.exposure.state] ? t(EXPOSURE_STATE_KEYS[service.exposure.state]) : `HTTPS ${service.exposure.state.replace("_", " ")}`}
                        </div>
                      ) : null}
                    </div>
                    <div className="text-(length:--text-nano) text-muted-foreground whitespace-nowrap">
                      {SERVICE_LIFECYCLE_KEYS[service.lifecycle] ? t(SERVICE_LIFECYCLE_KEYS[service.lifecycle]) : service.lifecycle}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          {!hideHostPaths && workspaceMode === "local" && (
            <div className="space-y-1.5 rounded-md border border-border p-2">
              <div className="flex items-center gap-2">
                <input
                  className="w-full rounded border border-border bg-transparent px-2 py-1 text-xs font-mono outline-none"
                  value={workspaceCwd}
                  onChange={(e) => setWorkspaceCwd(e.target.value)}
                  placeholder="/absolute/path/to/workspace"
                />
                <ChoosePathButton />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  className="h-6 px-2"
                  disabled={(!workspaceCwd.trim() && !primaryCodebaseWorkspace) || createWorkspace.isPending || updateWorkspace.isPending}
                  onClick={submitLocalWorkspace}
                >
                  {t("projectProperties.save")}
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  className="h-6 px-2"
                  onClick={() => {
                    setWorkspaceMode(null);
                    setWorkspaceCwd("");
                    setWorkspaceError(null);
                  }}
                >
                  {t("projectProperties.cancel")}
                </Button>
              </div>
            </div>
          )}
          {workspaceError && (
            <p className="text-xs text-destructive">{workspaceError.startsWith("projectProperties.") ? t(workspaceError) : workspaceError}</p>
          )}
          {createWorkspace.isError && (
            <p className="text-xs text-destructive">{t("projectProperties.failedToSaveWorkspace")}</p>
          )}
          {removeWorkspace.isError && (
            <p className="text-xs text-destructive">{t("projectProperties.failedToDeleteWorkspace")}</p>
          )}
          {updateWorkspace.isError && (
            <p className="text-xs text-destructive">{t("projectProperties.failedToUpdateWorkspace")}</p>
          )}
        </div>}

        {isolatedWorkspacesEnabled && workspaceIsolationControlsVisible ? (
          <>
            <Separator className="my-4" />

            <div className="py-1.5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>{t("projectProperties.executionWorkspaces")}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border text-(length:--text-nano) text-muted-foreground hover:text-foreground"
                      aria-label={t("projectProperties.executionWorkspacesHelp")}
                    >
                      ?
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {t("projectProperties.projectownedDefaultsForIsolatedTaskCheckoutsAndExecutionWorkspace")}
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span>{t("projectProperties.enableIsolatedTaskCheckouts")}</span>
                      <SaveIndicator state={fieldState("execution_workspace_enabled")} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("projectProperties.letTasksChooseBetweenTheProjectsPrimaryCheckoutAnd")}
                    </div>
                  </div>
                  {onUpdate || onFieldUpdate ? (
                    <ToggleSwitch
                      checked={executionWorkspacesEnabled}
                      onCheckedChange={() =>
                        commitField(
                          "execution_workspace_enabled",
                          updateExecutionWorkspacePolicy({ enabled: !executionWorkspacesEnabled })!,
                        )}
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {executionWorkspacesEnabled ? t("projectProperties.enabled") : t("projectProperties.disabled")}
                    </span>
                  )}
                </div>

                {executionWorkspacesEnabled ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 text-sm">
                          <span>{t("projectProperties.newTasksDefaultToIsolatedCheckout")}</span>
                          <SaveIndicator state={fieldState("execution_workspace_default_mode")} />
                        </div>
                        <div className="text-(length:--text-micro) text-muted-foreground">
                          {t("projectProperties.ifDisabledNewTasksStayOnTheProjectsPrimary")}
                        </div>
                      </div>
                      <ToggleSwitch
                        checked={executionWorkspaceDefaultMode === "isolated_workspace"}
                        onCheckedChange={() =>
                          commitField(
                            "execution_workspace_default_mode",
                            updateExecutionWorkspacePolicy({
                              defaultMode:
                                executionWorkspaceDefaultMode === "isolated_workspace"
                                  ? "shared_workspace"
                                  : "isolated_workspace",
                            })!,
                          )}
                      />
                    </div>

                    <div className="space-y-0.5">
                      <div className="mb-1 flex items-center gap-1.5">
                        <label className="flex items-center gap-2 text-sm">
                          <span>{t("projectProperties.sharedWorkspaceConcurrency")}</span>
                          <SaveIndicator state={fieldState("execution_workspace_shared_concurrency")} />
                        </label>
                      </div>
                      {onUpdate || onFieldUpdate ? (
                        <select
                          className="w-full rounded border border-border bg-transparent px-2 py-1 text-xs outline-none"
                          aria-label={t("projectProperties.sharedWorkspaceConcurrency")}
                          value={executionWorkspaceSharedConcurrency}
                          onChange={(e) =>
                            commitField(
                              "execution_workspace_shared_concurrency",
                              updateExecutionWorkspacePolicy({
                                sharedWorkspaceConcurrency: e.target.value as SharedWorkspaceConcurrency,
                              })!,
                            )}
                        >
                          {SHARED_WORKSPACE_CONCURRENCY_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {t(option.label)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-xs">
                          {selectedConcurrencyOption ? t(selectedConcurrencyOption.label) : ""}
                        </div>
                      )}
                      <p className="text-(length:--text-micro) text-muted-foreground">
                        {selectedConcurrencyOption ? t(selectedConcurrencyOption.help) : ""}
                      </p>
                    </div>

                    <div className="border-t border-border/60 pt-2">
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                        onClick={() => setExecutionWorkspaceAdvancedOpen((open) => !open)}
                      >
                        {executionWorkspaceAdvancedOpen
                          ? t("projectProperties.hideAdvancedCheckoutSettings")
                          : t("projectProperties.showAdvancedCheckoutSettings")}
                      </button>
                    </div>

                    {executionWorkspaceAdvancedOpen ? (
                      <div className="space-y-3">
                        <div className="text-xs text-muted-foreground">
                          {t("projectProperties.hostmanagedImplementation")} <span className="text-foreground">{t("projectProperties.gitWorktree")}</span>
                        </div>
                        {showExecutionWorkspaceEnvironmentControl ? (
                          <div>
                            <div className="mb-1 flex items-center gap-1.5">
                              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{t("projectProperties.environment")}</span>
                                <SaveIndicator state={fieldState("execution_workspace_environment")} />
                              </label>
                            </div>
                            <select
                              className="w-full rounded border border-border bg-transparent px-2 py-1 text-xs outline-none"
                              value={executionWorkspaceEnvironmentId}
                              onChange={(e) =>
                                commitField(
                                  "execution_workspace_environment",
                                  updateExecutionWorkspacePolicy({
                                    environmentId: e.target.value || null,
                                  })!,
                                )}
                            >
                              <option value="">{t("projectProperties.noEnvironment")}</option>
                              {runSelectableEnvironments.map((environment) => (
                                <option key={environment.id} value={environment.id}>
                                  {environmentDisplayLabel(environment)}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : null}
                        <div>
                          <div className="mb-1 flex items-center gap-1.5">
                            <label className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{t("projectProperties.baseRef")}</span>
                              <SaveIndicator state={fieldState("execution_workspace_base_ref")} />
                            </label>
                          </div>
                          <DraftInput
                            value={executionWorkspaceStrategy.baseRef ?? ""}
                            onCommit={(value) =>
                              commitField("execution_workspace_base_ref", {
                                ...updateExecutionWorkspacePolicy({
                                  workspaceStrategy: {
                                    ...executionWorkspaceStrategy,
                                    type: "git_worktree",
                                    baseRef: value || null,
                                  },
                                })!,
                              })}
                            immediate
                            className="w-full rounded border border-border bg-transparent px-2 py-1 text-xs font-mono outline-none"
                            placeholder="origin/main"
                          />
                        </div>
                        <div>
                          <div className="mb-1 flex items-center gap-1.5">
                            <label className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{t("projectProperties.branchTemplate")}</span>
                              <SaveIndicator state={fieldState("execution_workspace_branch_template")} />
                            </label>
                          </div>
                          <DraftInput
                            value={executionWorkspaceStrategy.branchTemplate ?? ""}
                            onCommit={(value) =>
                              commitField("execution_workspace_branch_template", {
                                ...updateExecutionWorkspacePolicy({
                                  workspaceStrategy: {
                                    ...executionWorkspaceStrategy,
                                    type: "git_worktree",
                                    branchTemplate: value || null,
                                  },
                                })!,
                              })}
                            immediate
                            className="w-full rounded border border-border bg-transparent px-2 py-1 text-xs font-mono outline-none"
                            placeholder="{{issue.identifier}}-{{slug}}"
                          />
                        </div>
                        <div>
                          <div className="mb-1 flex items-center gap-1.5">
                            <label className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{t("projectProperties.worktreeParentDir")}</span>
                              <SaveIndicator state={fieldState("execution_workspace_worktree_parent_dir")} />
                            </label>
                          </div>
                          <DraftInput
                            value={executionWorkspaceStrategy.worktreeParentDir ?? ""}
                            onCommit={(value) =>
                              commitField("execution_workspace_worktree_parent_dir", {
                                ...updateExecutionWorkspacePolicy({
                                  workspaceStrategy: {
                                    ...executionWorkspaceStrategy,
                                    type: "git_worktree",
                                    worktreeParentDir: value || null,
                                  },
                                })!,
                              })}
                            immediate
                            className="w-full rounded border border-border bg-transparent px-2 py-1 text-xs font-mono outline-none"
                            placeholder=".paperclip/worktrees"
                          />
                        </div>
                        <div>
                          <div className="mb-1 flex items-center gap-1.5">
                            <label className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{t("projectProperties.provisionCommand")}</span>
                              <SaveIndicator state={fieldState("execution_workspace_provision_command")} />
                            </label>
                          </div>
                          <DraftInput
                            value={executionWorkspaceStrategy.provisionCommand ?? ""}
                            onCommit={(value) =>
                              commitField("execution_workspace_provision_command", {
                                ...updateExecutionWorkspacePolicy({
                                  workspaceStrategy: {
                                    ...executionWorkspaceStrategy,
                                    type: "git_worktree",
                                    provisionCommand: value || null,
                                  },
                                })!,
                              })}
                            immediate
                            className="w-full rounded border border-border bg-transparent px-2 py-1 text-xs font-mono outline-none"
                            placeholder="bash ./scripts/provision-worktree.sh"
                          />
                        </div>
                        <div>
                          <div className="mb-1 flex items-center gap-1.5">
                            <label className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{t("projectProperties.runtimeProvisionCommand")}</span>
                              <SaveIndicator state={fieldState("execution_workspace_runtime_provision_command")} />
                            </label>
                          </div>
                          <DraftInput
                            value={executionWorkspaceStrategy.runtimeProvisionCommand ?? ""}
                            onCommit={(value) =>
                              commitField("execution_workspace_runtime_provision_command", {
                                ...updateExecutionWorkspacePolicy({
                                  workspaceStrategy: {
                                    ...executionWorkspaceStrategy,
                                    type: "git_worktree",
                                    runtimeProvisionCommand: value || null,
                                  },
                                })!,
                              })}
                            immediate
                            className="w-full rounded border border-border bg-transparent px-2 py-1 text-xs font-mono outline-none"
                            placeholder="bash ./scripts/provision-worktree-runtime.sh"
                          />
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t("projectProperties.runsOnceBeforeTheFirstRuntimeserviceStartHeavySetup")}
                          </p>
                        </div>
                        <div>
                          <div className="mb-1 flex items-center gap-1.5">
                            <label className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{t("projectProperties.teardownCommand")}</span>
                              <SaveIndicator state={fieldState("execution_workspace_teardown_command")} />
                            </label>
                          </div>
                          <DraftInput
                            value={executionWorkspaceStrategy.teardownCommand ?? ""}
                            onCommit={(value) =>
                              commitField("execution_workspace_teardown_command", {
                                ...updateExecutionWorkspacePolicy({
                                  workspaceStrategy: {
                                    ...executionWorkspaceStrategy,
                                    type: "git_worktree",
                                    teardownCommand: value || null,
                                  },
                                })!,
                              })}
                            immediate
                            className="w-full rounded border border-border bg-transparent px-2 py-1 text-xs font-mono outline-none"
                            placeholder="bash ./scripts/teardown-worktree.sh"
                          />
                        </div>
                        <p className="text-(length:--text-micro) text-muted-foreground">
                          {t("projectProperties.provisionRunsInsideTheDerivedWorktreeBeforeAgentExecution")}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </>
        ) : null}

      </div>

      {onArchive && (
        <>
          <Separator className="my-4" />
          <div className="space-y-4 py-4">
            <div className="text-xs font-medium text-destructive uppercase tracking-wide">
              {t("projectProperties.dangerZone")}
            </div>
            <ArchiveDangerZone
              project={project}
              onArchive={onArchive}
              archivePending={archivePending}
            />
          </div>
        </>
      )}
        <PropertyRow label={<FieldLabel label={t("projectProperties.created")} state="idle" />}>
          <span className="text-sm">{formatDate(project.createdAt)}</span>
        </PropertyRow>
    </div>
  );
}
