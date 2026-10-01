import { t, useTranslation } from "@/i18n";
import { DispositionRecoveryNotice } from "../components/DispositionRecoveryNotice";
import { CloudSignIn } from "../components/CloudSignIn";
import { CloudAccessError } from "../components/CloudAccessGate";
import { SetupPrompt } from "./apps/chat/SetupPrompt";
import { MediaArtifactCard } from "@/components/artifacts/MediaArtifactCard";
import { WebhookUrlWarning } from "@/components/routine-triggers/WebhookUrlWarning";
import { SetupWizardNavigation, SetupWizardFooter } from "../components/SetupWizard";
import { RemoteMcpDesignExample } from "@/features/connections/remote-mcp/RemoteMcpDesignExample";
import { AgentChatPicker } from "@/components/AgentChatPicker";
import { TaskChatProjectCreatedCard } from "@/components/task-chat/TaskChatProjectCreatedCard";
import { TextAttachmentPreview } from "@/components/task-side-panel/TaskAttachmentPanel";
import { AnnouncementCard } from "@/components/AnnouncementCard";
import { announcementPreview, announcementAnimationPreview, announcementAnimationPreviewSrc } from "@/lib/announcement-preview";
import { TaskDetailTasksPanel } from "@/components/task-detail/TaskDetailTasksPanel";
import { AiConnectionDesignExamples } from "@/components/ai-connections/AiConnectionDesignExamples";
import { SavedProviderKeySelect } from "../components/onboarding/SavedProviderKeySelect";
import { AgentAvatar } from "@/components/AgentAvatar";
import { AgentCharacter } from "@/components/AgentCharacter";
import { AGENT_PALETTE_IDS, appearanceForPalette } from "@paperclipai/shared";
import { RepositoryEditor } from "@/components/RepositoryEditor";
import { TaskChatRunnerActivityGroup } from "@/components/task-chat/TaskChatRunnerActivityGroup";
import { TaskChatMarker } from "@/components/task-chat/TaskChatMarker";
import { TaskChatComposer } from "@/components/task-chat/TaskChatComposer";
import { ComposerAddMenu, ComposerModeChip } from "@/components/task-chat/ComposerAddMenu";
import type { IssueWorkMode } from "@paperclipai/shared";
import { TaskTreeControlDialog, TaskTreeControlMenuItems } from "@/components/TaskTreeControls";
import { useState } from "react";
import {
  BookOpen,
  Bot,
  Check,
  ChevronDown,
  CircleDot,
  Command as CommandIcon,
  DollarSign,
  Hexagon,
  History,
  Inbox,
  LayoutDashboard,
  ListTodo,
  Mail,
  Plus,
  Search,
  Settings,
  Target,
  Trash2,
  Upload,
  User,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { InlineBanner } from "@/components/InlineBanner";
import { BuiltInLifecycleChip } from "@/components/BuiltInAgentBadges";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable-panels";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";
import { AgentCapsule, AGENT_GRADIENT_COUNT } from "@/components/AgentCapsule";
import { AgentRunCard } from "@/components/ActiveAgentsPanel";
import { StatusBadge, IssueStatusBadge } from "@/components/StatusBadge";
import { StatusIcon } from "@/components/StatusIcon";
import { EnforcementBanner } from "@/components/EnforcementBanner";
import { ActionCard, ActionCardMobile, BindingsTable } from "@/components/actions/ActionCard";
import { PriorityIcon } from "@/components/PriorityIcon";
import { SHOW_TASK_PRIORITY_UI } from "@/lib/ui-flags";
import { agentStatusDot, agentStatusDotDefault } from "@/lib/status-colors";
import { EntityRow } from "@/components/EntityRow";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard } from "@/components/MetricCard";
import { FilterBar, type FilterValue } from "@/components/FilterBar";
import { InlineEditor } from "@/components/InlineEditor";
import { PageSkeleton } from "@/components/PageSkeleton";
import { Identity } from "@/components/Identity";
import { AppLogo } from "@/pages/apps/AppLogo";
import { IssueReferencePill } from "@/components/IssueReferencePill";
import { MembershipAction } from "@/components/MembershipAction";
import { IssueOutputSection } from "@/components/issue-output/IssueOutputSection";
import { EnvironmentVariablesEditor } from "@/components/environment-variables-editor";
import { IssueThreadInteractionCard } from "@/components/IssueThreadInteractionCard";
import {
  connectedConnectionIntentInteraction,
  issueThreadInteractionFixtureMeta,
  pendingConnectionIntentInteraction,
  retryConnectionIntentInteraction,
} from "@/fixtures/issueThreadInteractionFixtures";
import type { CompanySecret, EnvBinding, Issue } from "@paperclipai/shared";
import { CollectionToolbar } from "@/components/CollectionToolbar";
import { IssueRow } from "@/components/IssueRow";
import {
  EnvInputsList,
  ExternalSourcesList,
  RequiredSkillsList,
  StepSkillPlan,
  StepSourcePolicy,
  TeamCard,
  TeamHierarchyPreview,
  TeamRow,
} from "@/pages/TeamCatalog";
import {
  currentInstalledState,
  onboardingTeams,
  optionalTeam,
  outOfDateInstalledState,
  sampleSkillPreparations,
  sampleTeam,
  warnTeam,
} from "@/pages/TeamCatalog.fixtures";
import type { IssueWorkProduct } from "@paperclipai/shared";

/* ------------------------------------------------------------------ */
/*  Sample data for the Issue Output surface showcase                  */
/* ------------------------------------------------------------------ */

function sampleOutput(
  id: string,
  attachmentId: string,
  contentType: string,
  filename: string,
  opts: { byteSize: number; isPrimary?: boolean; createdAt: string },
): IssueWorkProduct {
  const contentPath = `/api/attachments/${attachmentId}/content`;
  return {
    id,
    companyId: "demo-company",
    projectId: null,
    issueId: "demo-issue",
    executionWorkspaceId: null,
    runtimeServiceId: null,
    type: "artifact",
    provider: "paperclip",
    externalId: null,
    title: filename,
    url: null,
    status: "active",
    reviewState: "none",
    isPrimary: Boolean(opts.isPrimary),
    healthStatus: "unknown",
    summary: null,
    createdByRunId: null,
    createdAt: new Date(opts.createdAt),
    updatedAt: new Date(opts.createdAt),
    metadata: {
      attachmentId,
      contentType,
      byteSize: opts.byteSize,
      contentPath,
      openPath: contentPath,
      downloadPath: `${contentPath}?download=1`,
      originalFilename: filename,
    },
  } as IssueWorkProduct;
}

const DESIGN_GUIDE_OUTPUTS: IssueWorkProduct[] = [
  sampleOutput("wp-vid", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "video/mp4", "q3-summary.mp4", {
    byteSize: 19_293_798,
    isPrimary: true,
    createdAt: "2026-05-30T12:00:00Z",
  }),
  sampleOutput("wp-pdf", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "application/pdf", "talking-points.pdf", {
    byteSize: 421_888,
    createdAt: "2026-05-30T11:52:00Z",
  }),
];

const DESIGN_GUIDE_DEGRADED_OUTPUTS: IssueWorkProduct[] = [
  {
    ...sampleOutput("wp-broken", "cccccccc-cccc-4ccc-8ccc-cccccccccccc", "video/mp4", "corrupt-output.mp4", {
      byteSize: 0,
      isPrimary: true,
      createdAt: "2026-05-30T12:01:00Z",
    }),
    // Strip the path metadata so it fails the shared artifact schema.
    metadata: { attachmentId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", contentType: "video/mp4" },
  } as IssueWorkProduct,
];

const DESIGN_GUIDE_TASK = {
  id: "design-guide-task",
  identifier: "PAP-427",
  get title() { return t("designGuide.reconcile_the_navigation_model_across_operator_surfaces"); },
  status: "in_progress",
  priority: "medium",
  blockerAttention: false,
} as unknown as Issue;

/* ------------------------------------------------------------------ */
/*  Section wrapper                                                    */
/* ------------------------------------------------------------------ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {title}
      </h3>
      <Separator />
      {children}
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">{title}</h4>
      {children}
    </div>
  );
}

// Onboarding seam (design §6 + §12.5): the TeamCard tile in its "Pick a starter
// team" 3-col grid, with the first defaultInstall tile selected.
function TeamCardShowcase() {
  const [selectedId, setSelectedId] = useState(onboardingTeams[0]?.id ?? null);
  return (
    <div className="grid max-w-2xl gap-4 md:grid-cols-2 lg:grid-cols-3">
      {onboardingTeams.map((team) => (
        <TeamCard
          key={team.id}
          team={team}
          selected={team.id === selectedId}
          onSelect={() => setSelectedId(team.id)}
        />
      ))}
    </div>
  );
}

// Reusable environment-variables editor: one shared grid, in-field source
// switch, fuzzy secret picker, sensitive-value detection, inline health.
const DESIGN_GUIDE_SECRETS: CompanySecret[] = [
  {
    id: "dg-github",
    companyId: "dg",
    scope: "company",
    ownerUserId: null,
    userSecretDefinitionId: null,
    key: "github_token",
    name: "GITHUB_TOKEN",
    provider: "local_encrypted",
    status: "active",
    managedMode: "paperclip_managed",
    externalRef: null,
    providerConfigId: null,
    providerMetadata: null,
    latestVersion: 3,
    description: null,
    lastResolvedAt: null,
    lastRotatedAt: null,
    deletedAt: null,
    createdByAgentId: null,
    createdByUserId: null,
    createdAt: new Date("2026-03-01T10:00:00.000Z"),
    updatedAt: new Date("2026-03-01T10:00:00.000Z"),
  },
  {
    id: "dg-db",
    companyId: "dg",
    scope: "company",
    ownerUserId: null,
    userSecretDefinitionId: null,
    key: "db_connection",
    name: "DB_CONNECTION",
    provider: "local_encrypted",
    status: "active",
    managedMode: "paperclip_managed",
    externalRef: null,
    providerConfigId: null,
    providerMetadata: null,
    latestVersion: 3,
    description: null,
    lastResolvedAt: null,
    lastRotatedAt: null,
    deletedAt: null,
    createdByAgentId: null,
    createdByUserId: null,
    createdAt: new Date("2026-03-01T10:00:00.000Z"),
    updatedAt: new Date("2026-03-01T10:00:00.000Z"),
  },
];

function EnvironmentVariablesEditorShowcase() {
  const [env, setEnv] = useState<Record<string, EnvBinding>>({
    NODE_ENV: { type: "plain", value: "production" },
    GH_TOKEN: { type: "secret_ref", secretId: "dg-github", version: "latest" },
    DB_URL: { type: "secret_ref", secretId: "dg-db", version: 3 },
    STRIPE_API_KEY: { type: "plain", value: "sk-live-51H8xL0aBcDeFgHiJkLmNoPq" },
  });
  return (
    <div className="max-w-(--sz-640px) rounded-md border border-border p-4">
      <EnvironmentVariablesEditor
        value={env}
        secrets={DESIGN_GUIDE_SECRETS}
        onChange={(next) => setEnv(next ?? {})}
        onCreateSecret={async (name) => ({
          ...DESIGN_GUIDE_SECRETS[0]!,
          id: `dg-${name}`,
          key: name,
          name: name.toUpperCase(),
          latestVersion: 1,
        })}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Color swatch                                                       */
/* ------------------------------------------------------------------ */

function Swatch({ name, cssVar }: { name: string; cssVar: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-8 w-8 rounded-md border border-border shrink-0"
        style={{ backgroundColor: `var(${cssVar})` }}
      />
      <div>
        <p className="text-xs font-mono">{cssVar}</p>
        <p className="text-xs text-muted-foreground">{name}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

function TaskExecutionControlsExample() {
  const { t } = useTranslation();
  const [running, setRunning] = useState(true);
  const [dialogMode, setDialogMode] = useState<"resume" | "cancel" | "restore" | null>(null);
  const [wake, setWake] = useState(true);
  return <div className="max-w-xl space-y-4">
    <div className="w-52 rounded-md border border-border p-1">
      <TaskTreeControlMenuItems scope="subtree" canPause={running} canResume={!running} canCancel canRestore={!running}
        onPause={() => setRunning(false)} onResume={() => setDialogMode("resume")}
        onCancel={() => setDialogMode("cancel")} onRestore={() => setDialogMode("restore")} />
    </div>
    <p className="text-sm text-muted-foreground">{running ? t("designGuide.running_type_to_switch_stop_to_send") : t("designGuide.paused_resume_from_the_menu")}</p>
    <TaskChatProjectCreatedCard item={{ id: "design-project", kind: "project_created", projectId: "example-project", name: t("designGuide.onboarding_improvements"), description: t("designGuide.help_new_teams_reach_their_first_useful_result"), timestamp: "2026-09-11T00:00:00Z", repositories: [{ id: "1", name: "paperclipai/paperclip", url: "https://github.com/paperclipai/paperclip" }] }} />
    {!running ? <TaskChatMarker item={{ id: "design-cancelled", kind: "marker", variant: "interrupted", tone: "neutral", label: t("designGuide.run_cancelled"), detail: t("designGuide.the_run_was_cancelled_before_returning_an_answer"), collapsible: true }} /> : null}
    <TaskChatComposer pause={!running ? { scope: "subtree", onResume: () => setDialogMode("resume") } : null} onAdd={async () => {}} workMode="standard" stopScope="subtree" onStop={running ? async () => setRunning(false) : undefined} />
    <TaskTreeControlDialog open={dialogMode !== null} onOpenChange={(open) => { if (!open) setDialogMode(null); }}
      mode={dialogMode ?? "cancel"} scope="subtree" affectedCount={3} affectedAgentCount={2} loading={false} pending={false} valid
      wakeAgents={wake} onWakeAgentsChange={setWake} onRetry={() => {}}
      onApply={() => { setRunning(dialogMode !== "cancel" && wake); setDialogMode(null); }} />
  </div>;
}

function TaskPendingInputExample() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(true);
  const [pending, setPending] = useState(true);
  return <div className="max-w-xl">
    <TaskChatComposer
      onAdd={async () => {}}
      workMode="standard"
      takeover={pending && open ? {
        id: "design-question",
        label: t("designGuide.question"),
        pendingCount: 1,
        content: <div className="space-y-3 text-sm">
          <p>{t("designGuide.should_the_agent_use_the_existing_draft")}</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setPending(false)}>{t("designGuide.use_draft")}</Button>
            <Button size="sm" variant="outline" onClick={() => setPending(false)}>{t("designGuide.start_fresh")}</Button>
          </div>
        </div>,
        onDismiss: () => setOpen(false),
        onSkip: () => setPending(false),
      } : null}
      pendingTakeover={pending ? { count: 1, label: t("designGuide.question"), onOpen: () => setOpen(true) } : null}
    />
  </div>;
}

function AgentChatPickerExample() {
  const { t } = useTranslation();
  const [state, setState] = useState<"closed" | "empty" | "loading" | "error">("closed");
  return <div className="flex flex-wrap gap-2">
    <Button variant="outline" onClick={() => setState("empty")}>{t("designGuide.empty_picker")}</Button>
    <Button variant="outline" onClick={() => setState("loading")}>{t("designGuide.loading_picker")}</Button>
    <Button variant="outline" onClick={() => setState("error")}>{t("designGuide.failed_picker")}</Button>
    <AgentChatPicker agents={[]} open={state !== "closed"} onOpenChange={(open) => { if (!open) setState("closed"); }} onSelect={() => {}}
      loading={state === "loading"} error={state === "error" ? new Error(t("designGuide.unavailable")) : null} onRetry={() => setState("empty")} />
  </div>;
}

function ComposerActionsExample() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<IssueWorkMode>("standard");
  return <div className="flex max-w-xl items-center gap-2 rounded-xl border border-border bg-card p-3">
    <ComposerAddMenu mode={mode} onModeChange={setMode} onAttachFile={() => {}} onGoal={() => {}} />
    <ComposerModeChip mode={mode} onRemove={() => setMode("standard")} />
    <span className="ml-auto text-xs text-muted-foreground">{t("designGuide.plus_menu_removable_mode_chip")}</span>
  </div>;
}

export function DesignGuide() {
  const { t } = useTranslation();
  const [wizardStep, setWizardStep] = useState(0);
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [selectValue, setSelectValue] = useState("in_progress");
  const [menuChecked, setMenuChecked] = useState(true);
  const [collapsibleOpen, setCollapsibleOpen] = useState(false);
  const [inlineText, setInlineText] = useState<string | null>(null);
  const [inlineTitle, setInlineTitle] = useState<string | null>(null);
  const [inlineDesc, setInlineDesc] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterValue[]>([
    { key: "status", label: "Status", value: "Active" },
    // PAP-411: priority filter demo row suppressed while SHOW_TASK_PRIORITY_UI is off.
    ...(SHOW_TASK_PRIORITY_UI
      ? [{ key: "priority", label: "Priority", value: "High" } as FilterValue]
      : []),
  ]);
  const [allowExternal, setAllowExternal] = useState(false);
  const [allowUnpinned, setAllowUnpinned] = useState(false);
  const [allowLocalPath, setAllowLocalPath] = useState(false);
  const localizedAnnouncementPreview = {
    ...announcementPreview,
    eyebrow: t("designGuide.announcementEyebrow"),
    title: t("designGuide.announcementTitle"),
    description: t("designGuide.announcementDescription"),
    image: announcementPreview.image ? { ...announcementPreview.image, alt: t("designGuide.announcementImageAlt") } : undefined,
    primaryAction: { ...announcementPreview.primaryAction, label: t("designGuide.announcementPrimary") },
    secondaryLink: announcementPreview.secondaryLink ? { ...announcementPreview.secondaryLink, label: t("designGuide.announcementSecondary") } : undefined,
  };
  const localizedAnnouncementAnimationPreview = {
    ...announcementAnimationPreview,
    ...localizedAnnouncementPreview,
    animation: announcementAnimationPreview.animation ? { ...announcementAnimationPreview.animation, alt: t("designGuide.announcementAnimationAlt") } : undefined,
  };

  return (
    <div className="space-y-10 max-w-4xl">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold">{t("designGuide.design_guide")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("designGuide.every_component_style_and_pattern_used_across_paperclip")}</p>
      </div>

      {/* ============================================================ */}
      {/*  COVERAGE                                                     */}
      {/* ============================================================ */}
      <Section title={t("designGuide.component_coverage")}>
        <p className="text-sm text-muted-foreground">{t("designGuide.this_page_should_be_updated_when_new_ui_primitives_or_app_level_patterns_ship")}</p>
        <div className="grid gap-6 md:grid-cols-2">
          <SubSection title={t("designGuide.ui_primitives")}>
            <div className="flex flex-wrap gap-2">
              {[
                "avatar", "badge", "breadcrumb", "button", "card", "checkbox", "collapsible",
                "command", "dialog", "dropdown-menu", "input", "label", "popover", "resizable-panels",
                "scroll-area", "select", "separator", "sheet", "skeleton", "tabs", "textarea", "tooltip",
              ].map((name) => (
                <Badge key={name} variant="outline" className="font-mono text-(length:--text-nano)">
                  {name}
                </Badge>
              ))}
            </div>
          </SubSection>
          <SubSection title={t("designGuide.app_components")}>
            <div className="flex flex-wrap gap-2">
              {[
                "StatusBadge", "StatusIcon", "PriorityIcon", "EntityRow", "EmptyState", "MetricCard",
                "FilterBar", "InlineEditor", "PageSkeleton", "Identity", "CommentThread", "MarkdownEditor",
                "PropertiesPanel", "Sidebar", "CommandPalette", "EnvironmentVariablesEditor",
                "InlineBanner", "BuiltInAgentGate", "BuiltInLifecycleChip", "CollectionToolbar",
                "IssueRow", "ContextualSidebarFrame",
              ].map((name) => (
                <Badge key={name} variant="ghost" className="font-mono text-(length:--text-nano)">
                  {name}
                </Badge>
              ))}
            </div>
          </SubSection>
        </div>
      </Section>

      <Section title={t("designGuide.announcements")}>
        <div className="grid gap-4 md:grid-cols-2">
          <AnnouncementCard announcement={localizedAnnouncementAnimationPreview} imageSrc="/announcement-preview.svg" animationSrc={announcementAnimationPreviewSrc} onDismiss={() => {}} />
          <AnnouncementCard announcement={localizedAnnouncementPreview} imageSrc="/announcement-preview.svg" onDismiss={() => {}} />
          <AnnouncementCard announcement={{ ...localizedAnnouncementPreview, image: undefined, secondaryLink: undefined }} onDismiss={() => {}} />
        </div>
      </Section>

      <Section title={t("designGuide.task_execution_controls")}>
        <TaskExecutionControlsExample />
      </Section>

      <Section title={t("designGuide.composer_actions")}>
        <ComposerActionsExample />
      </Section>

      <Section title={t("designGuide.task_collection")}>
        <p className="max-w-prose text-sm text-muted-foreground">{t("designGuide.collectiontoolbar_owns_shared_geometry_while_each_page_owns_its_state_and_behavior_the_canonical_task_row_is_opt_in_during_migration_status_leads_unread_work_uses_title_emphasis_metadata_remains_stable_and_the_task_identifier_trails")}</p>
        <CollectionToolbar
          context={<span className="text-sm font-medium">{t("designGuide.recent_tasks")}</span>}
          search={<Input aria-label={t("designGuide.search_task_collection_example")} placeholder={t("designGuide.search_tasks")} />}
          controls={<Button variant="outline" size="sm">{t("designGuide.filter")}</Button>}
          actions={<Button size="sm">{t("designGuide.new_task")}</Button>}
          feedback={<span className="text-xs text-muted-foreground">{t("designGuide.1_task_updated_newest_first")}</span>}
        />
        <div className="overflow-hidden rounded-lg border border-border">
          <IssueRow
            issue={DESIGN_GUIDE_TASK}
            presentation="task"
            unreadState="visible"
            metadata={<span className="text-xs text-muted-foreground">{t("designGuide.updated_12m_ago")}</span>}
            actions={<Button variant="ghost" size="xs">{t("designGuide.more")}</Button>}
          />
        </div>
      </Section>

      <Section title={t("designGuide.theme_toggle")}>
        <SubSection title={t("designGuide.variants")}>
          <div className="flex max-w-sm flex-col items-start gap-3">
            <ThemeToggle />
            <ThemeToggle variant="menu-action" />
            <ThemeToggle variant="compact-menu-action" />
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  COLORS                                                       */}
      {/* ============================================================ */}
      <Section title={t("designGuide.colors")}>
        <SubSection title={t("designGuide.core")}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Swatch name={t("designGuide.background")} cssVar="--background" />
            <Swatch name={t("designGuide.foreground")} cssVar="--foreground" />
            <Swatch name={t("designGuide.card")} cssVar="--card" />
            <Swatch name={t("designGuide.primary")} cssVar="--primary" />
            <Swatch name={t("designGuide.primary_foreground")} cssVar="--primary-foreground" />
            <Swatch name={t("designGuide.secondary")} cssVar="--secondary" />
            <Swatch name={t("designGuide.muted")} cssVar="--muted" />
            <Swatch name={t("designGuide.muted_foreground")} cssVar="--muted-foreground" />
            <Swatch name={t("designGuide.accent")} cssVar="--accent" />
            <Swatch name={t("designGuide.destructive")} cssVar="--destructive" />
            <Swatch name={t("designGuide.border")} cssVar="--border" />
            <Swatch name={t("designGuide.ring")} cssVar="--ring" />
          </div>
        </SubSection>

        <SubSection title={t("designGuide.sidebar")}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Swatch name={t("designGuide.sidebar")} cssVar="--sidebar" />
            <Swatch name={t("designGuide.sidebar_border")} cssVar="--sidebar-border" />
          </div>
        </SubSection>

        <SubSection title={t("designGuide.chart")}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Swatch name={t("designGuide.chart_1")} cssVar="--chart-1" />
            <Swatch name={t("designGuide.chart_2")} cssVar="--chart-2" />
            <Swatch name={t("designGuide.chart_3")} cssVar="--chart-3" />
            <Swatch name={t("designGuide.chart_4")} cssVar="--chart-4" />
            <Swatch name={t("designGuide.chart_5")} cssVar="--chart-5" />
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  TYPOGRAPHY                                                   */}
      {/* ============================================================ */}
      <Section title={t("designGuide.runner_activity")}>
        <TaskChatRunnerActivityGroup item={{ id: "design-runner-activity", kind: "activity_phase", active: true, summary: "", interstitial: { id: "design-runner-commentary", kind: "message", author: "agent", text: t("designGuide.i_ll_inspect_the_activity_feed_and_check_the_layout"), interstitial: true }, items: [
          { id: "design-runner-read", kind: "tool", name: "read", target: "TaskChatRunnerTurn.tsx", status: "completed", detail: t("designGuide.found_the_activity_groups") },
          { id: "design-runner-check", kind: "tool", name: "exec_command", target: "pnpm check:token-gates", status: "in_progress" },
        ] }} />
        <TaskChatRunnerActivityGroup item={{ id: "design-runner-completed", kind: "activity_phase", active: false, summary: "", items: [
          { id: "design-completed-read", kind: "tool", name: "read", target: "TaskChatRunnerTurn.tsx", status: "completed", detail: t("designGuide.read_the_activity_groups") },
          { id: "design-completed-check", kind: "tool", name: "exec_command", target: "pnpm check:token-gates", status: "failed", detail: t("designGuide.a_token_check_needs_another_pass") },
        ] }} />
      </Section>

      <Section title={t("designGuide.typography")}>
        <div className="space-y-3">
          <h2 className="text-xl font-bold">{t("designGuide.page_title_text_xl_font_bold")}</h2>
          <h2 className="text-lg font-semibold">{t("designGuide.section_title_text_lg_font_semibold")}</h2>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t("designGuide.section_heading_text_sm_font_semibold_uppercase_tracking_wide")}</h3>
          <p className="text-sm font-medium">{t("designGuide.card_title_text_sm_font_medium")}</p>
          <p className="text-sm font-semibold">{t("designGuide.card_title_alt_text_sm_font_semibold")}</p>
          <p className="text-sm">{t("designGuide.body_text_text_sm")}</p>
          <p className="text-sm text-muted-foreground">{t("designGuide.muted_description_text_sm_text_muted_foreground")}</p>
          <p className="text-xs text-muted-foreground">{t("designGuide.tiny_label_text_xs_text_muted_foreground")}</p>
          <p className="text-sm font-mono text-muted-foreground">{t("designGuide.mono_identifier_text_sm_font_mono_text_muted_foreground")}</p>
          <p className="text-2xl font-bold">{t("designGuide.large_stat_text_2xl_font_bold")}</p>
          <p className="font-mono text-xs">{t("designGuide.log_code_text_font_mono_text_xs")}</p>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  SPACING & RADIUS                                             */}
      {/* ============================================================ */}
      <Section title={t("designGuide.radius")}>
        <div className="flex items-end gap-4 flex-wrap">
          {[
            ["sm", "var(--radius-sm)"],
            ["md", "var(--radius-md)"],
            ["lg", "var(--radius-lg)"],
            ["xl", "var(--radius-xl)"],
            ["full", "9999px"],
          ].map(([label, radius]) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div
                className="h-12 w-12 bg-primary"
                style={{ borderRadius: radius }}
              />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  BUTTONS                                                      */}
      {/* ============================================================ */}
      <Section title={t("designGuide.buttons")}>
        <SubSection title={t("designGuide.variants")}>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="default">{t("designGuide.default")}</Button>
            <Button variant="secondary">{t("designGuide.secondary")}</Button>
            <Button variant="outline">{t("designGuide.outline")}</Button>
            <Button variant="ghost">{t("designGuide.ghost")}</Button>
            <Button variant="destructive">{t("designGuide.destructive")}</Button>
            <Button variant="link">{t("designGuide.link")}</Button>
          </div>
        </SubSection>

        <SubSection title={t("designGuide.sizes")}>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="xs">{t("designGuide.extra_small")}</Button>
            <Button size="sm">{t("designGuide.small")}</Button>
            <Button size="default">{t("designGuide.default")}</Button>
            <Button size="lg">{t("designGuide.large")}</Button>
          </div>
        </SubSection>

        <SubSection title={t("designGuide.icon_buttons")}>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="ghost" size="icon-xs"><Search /></Button>
            <Button variant="ghost" size="icon-sm"><Search /></Button>
            <Button variant="outline" size="icon"><Search /></Button>
            <Button variant="outline" size="icon-lg"><Search /></Button>
          </div>
        </SubSection>

        <SubSection title={t("designGuide.with_icons")}>
          <div className="flex items-center gap-2 flex-wrap">
            <Button><Plus />{" "}{t("designGuide.new_issue")}</Button>
            <Button variant="outline"><Upload />{" "}{t("designGuide.upload")}</Button>
            <Button variant="destructive"><Trash2 />{" "}{t("designGuide.delete")}</Button>
            <Button size="sm"><Plus />{" "}{t("designGuide.add")}</Button>
          </div>
        </SubSection>

        <SubSection title={t("designGuide.states")}>
          <div className="flex items-center gap-2 flex-wrap">
            <Button disabled>{t("designGuide.disabled")}</Button>
            <Button variant="outline" disabled>{t("designGuide.disabled_outline")}</Button>
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  BADGES                                                       */}
      {/* ============================================================ */}
      <Section title={t("designGuide.badges")}>
        <SubSection title={t("designGuide.variants")}>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="default">{t("designGuide.default")}</Badge>
            <Badge variant="secondary">{t("designGuide.secondary")}</Badge>
            <Badge variant="outline">{t("designGuide.outline")}</Badge>
            <Badge variant="destructive">{t("designGuide.destructive")}</Badge>
            <Badge variant="ghost">{t("designGuide.ghost")}</Badge>
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  STATUS BADGES & ICONS                                        */}
      {/* ============================================================ */}
      <Section title={t("designGuide.status_system")}>
        <SubSection title={t("designGuide.statusbadge_all_statuses")}>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              "active", "running", "paused", "idle", "archived", "planned",
              "achieved", "completed", "failed", "timed_out", "succeeded", "error",
              "pending_approval", "backlog", "todo", "in_progress", "in_review", "blocked",
              "done", "terminated", "cancelled", "pending", "revision_requested",
              "approved", "rejected",
            ].map((s) => (
              <StatusBadge key={s} status={s} />
            ))}
          </div>
        </SubSection>

        <SubSection title={t("designGuide.issuestatusbadge_brand_chip_glyph_pap_75")}>
          <div className="flex items-center gap-2 flex-wrap">
            {["backlog", "todo", "in_progress", "in_review", "done", "blocked", "cancelled"].map(
              (s) => (
                <IssueStatusBadge key={s} status={s} />
              )
            )}
          </div>
        </SubSection>

        <SubSection title={t("designGuide.idle_slack_conversation")}>
          <StatusIcon status="in_review" externalConversationState="waiting" showLabel />
          <IssueStatusBadge status="in_review" externalConversationState="waiting" />
        </SubSection>
        <SubSection title={t("designGuide.statusicon_interactive")}>
          <div className="flex items-center gap-3 flex-wrap">
            {["backlog", "todo", "in_progress", "in_review", "done", "cancelled", "blocked"].map(
              (s) => (
                <div key={s} className="flex items-center gap-1.5">
                  <StatusIcon status={s} />
                  <span className="text-xs text-muted-foreground">{t(`statusBadge.${s}`, { defaultValue: s })}</span>
                </div>
              )
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <StatusIcon status={status} onChange={setStatus} />
            <span className="text-sm">{t("designGuide.changeStatus", { status: t(`statusBadge.${status}`, { defaultValue: status }) })}</span>
          </div>
        </SubSection>

        {/* PAP-411: PriorityIcon showcase gated behind SHOW_TASK_PRIORITY_UI per board decision. */}
        {SHOW_TASK_PRIORITY_UI && (
        <SubSection title={t("designGuide.priorityicon_interactive")}>
          <div className="flex items-center gap-3 flex-wrap">
            {["critical", "high", "medium", "low"].map((p) => (
              <div key={p} className="flex items-center gap-1.5">
                <PriorityIcon priority={p} />
                <span className="text-xs text-muted-foreground">{t(`designGuide.${p}`, { defaultValue: p })}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <PriorityIcon priority={priority} onChange={setPriority} />
            <span className="text-sm">{t("designGuide.changePriority", { priority: t(`designGuide.${priority}`, { defaultValue: priority }) })}</span>
          </div>
        </SubSection>
        )}

        <SubSection title={t("designGuide.agent_status_dots")}>
          <div className="flex items-center gap-4 flex-wrap">
            {(["running", "active", "paused", "error", "archived"] as const).map((label) => (
              <div key={label} className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`inline-flex h-full w-full rounded-full ${agentStatusDot[label] ?? agentStatusDotDefault}`} />
                </span>
                <span className="text-xs text-muted-foreground">{t(`statusBadge.${label}`, { defaultValue: label })}</span>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title={t("designGuide.run_invocation_badges")}>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              ["timer", "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"],
              ["assignment", "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300"],
              ["on_demand", "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300"],
              ["automation", "bg-muted text-muted-foreground"],
            ].map(([label, cls]) => (
              <Badge variant="ghost" key={label} className={`px-1.5 text-(length:--text-nano) ${cls}`}>
                {t(`designGuide.invocation_${label}`, { defaultValue: label })}
              </Badge>
            ))}
          </div>
        </SubSection>

        <SubSection title="IssueReferencePill">
          <p className="text-xs text-muted-foreground">{t("designGuide.used_wherever_a_task_is_referenced_in_markdown_the_related_work_tab_and_activity_summaries_pass")}{" "}<code className="font-mono">status</code>{" "}{t("designGuide.to_show_the_target_issue_s_state_at_a_glance_use")}{" "}<code className="font-mono">variant="property"</code>{" "}{t("designGuide.for_compact_badges_with_direct_navigation_pass")}{" "}<code className="font-mono">onRemove</code>{" "}{t("designGuide.for_a_separate_blocker_removal_control_with_reserved_space_use")}{" "}<code className="font-mono">strikethrough</code>{" "}{t("designGuide.for_removed_contexts")}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <IssueReferencePill issue={{ id: "demo-1", identifier: "PAP-123", title: t("designGuide.identifier_only_no_status_yet") }} />
            <IssueReferencePill issue={{ id: "demo-2", identifier: "PAP-456", title: t("designGuide.with_in_progress_status"), status: "in_progress" }} />
            <IssueReferencePill issue={{ id: "demo-3", identifier: "PAP-789", title: t("designGuide.done_status"), status: "done" }} />
            <IssueReferencePill issue={{ id: "demo-4", identifier: "PAP-101", title: t("designGuide.blocked_status"), status: "blocked" }} />
            <IssueReferencePill onRemove={() => window.alert(t("designGuide.blocker_removed"))} issue={{ id: "demo-blocker", identifier: "PAP-303", title: t("designGuide.hover_or_focus_to_remove_blocker"), status: "in_review" }} />
            <IssueReferencePill strikethrough issue={{ id: "demo-5", identifier: "PAP-202", title: t("designGuide.removed_strikethrough"), status: "todo" }} />
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  AGENT CAPSULE                                                */}
      {/* ============================================================ */}
      <Section title={t("designGuide.agent_capsule")}>
        <p className="text-sm text-muted-foreground max-w-prose">{t("designGuide.the_brand_capsule_is_the_agent_motif_a_single_agent_reads_as_a_tall_pill_that_moves_through_three_states_as_it_comes_to_life_the_online_fill_uses_the_live_brand_agent_gradient_tokens")}<code className="font-mono">--agent-Na</code> →{" "}
          <code className="font-mono">--agent-Nb</code>); <code className="font-mono">prefers-reduced-motion</code>{" "}{t("designGuide.skips_the_liquid_rise_and_pulses_and_renders_the_final_state")}</p>
        <SubSection title={t("designGuide.states")}>
          <div className="flex items-end gap-10">
            <div className="flex flex-col items-center gap-2">
              <AgentCapsule state="slot" />
              <span className="text-xs text-muted-foreground">{t("designGuide.capsuleSlot")}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <AgentCapsule state="configured" />
              <span className="text-xs text-muted-foreground">{t("designGuide.capsuleConfigured")}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <AgentCapsule state="online" gradient={5} />
              <span className="text-xs text-muted-foreground">{t("designGuide.capsuleOnline")}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <AgentCapsule state="online" gradient={5} glow="blue" />
              <span className="text-xs text-muted-foreground">{t("designGuide.online_blue_glow")}</span>
            </div>
          </div>
        </SubSection>
        <SubSection title={t("designGuide.sizes")}>
          <div className="flex items-end gap-8">
            <div className="flex flex-col items-center gap-2">
              <AgentCapsule state="online" size="sm" gradient={1} />
              <span className="text-xs text-muted-foreground">sm</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <AgentCapsule state="online" size="md" gradient={4} />
              <span className="text-xs text-muted-foreground">md</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <AgentCapsule state="online" size="lg" gradient={8} />
              <span className="text-xs text-muted-foreground">lg</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <AgentCapsule state="online" size={{ width: 28, height: 96 }} gradient={6} />
              <span className="text-xs text-muted-foreground">{t("designGuide.custom_px")}</span>
            </div>
          </div>
        </SubSection>
        <SubSection title={t("designGuide.gradients")}>
          <div className="flex items-end gap-3 flex-wrap">
            {Array.from({ length: AGENT_GRADIENT_COUNT }, (_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <AgentCapsule state="online" size="sm" gradient={i + 1} />
                <span className="text-(length:--text-nano) font-mono text-muted-foreground">{i + 1}</span>
              </div>
            ))}
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  FORM ELEMENTS                                                */}
      {/* ============================================================ */}
      <Section title={t("designGuide.form_elements")}>
        <div className="grid gap-6 md:grid-cols-2">
          <SubSection title={t("designGuide.input")}>
            <Input placeholder={t("designGuide.default_input")} />
            <Input placeholder={t("designGuide.disabled_input")} disabled className="mt-2" />
          </SubSection>

          <SubSection title={t("designGuide.textarea")}>
            <Textarea placeholder={t("designGuide.write_something")} />
          </SubSection>

          <SubSection title={t("designGuide.checkbox_label")}>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox id="check1" defaultChecked />
                <Label htmlFor="check1">{t("designGuide.checked_item")}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="check2" />
                <Label htmlFor="check2">{t("designGuide.unchecked_item")}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="check3" disabled />
                <Label htmlFor="check3">{t("designGuide.disabled_item")}</Label>
              </div>
            </div>
          </SubSection>

          <SubSection title={t("designGuide.inline_editor")}>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("designGuide.title_single_line")}</p>
                <InlineEditor
                  value={inlineTitle ?? t("designGuide.editable_title")}
                  onSave={setInlineTitle}
                  as="h2"
                  className="text-xl font-bold"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("designGuide.body_text_single_line")}</p>
                <InlineEditor
                  value={inlineText ?? t("designGuide.click_to_edit_this_text")}
                  onSave={setInlineText}
                  as="p"
                  className="text-sm"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("designGuide.description_multiline_auto_sizing")}</p>
                <InlineEditor
                  value={inlineDesc ?? t("designGuide.this_is_an_editable_description_click_to_edit_it_the_textarea_auto_sizes_to_fit_the_content_without_layout_shift")}
                  onSave={setInlineDesc}
                  as="p"
                  className="text-sm text-muted-foreground"
                  placeholder={t("designGuide.add_a_description")}
                  multiline
                />
              </div>
            </div>
          </SubSection>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  SELECT                                                       */}
      {/* ============================================================ */}
      <Section title={t("designGuide.select")}>
        <div className="grid gap-6 md:grid-cols-2">
          <SubSection title={t("designGuide.default_size")}>
            <Select value={selectValue} onValueChange={setSelectValue}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("designGuide.select_status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="backlog">{t("designGuide.backlog")}</SelectItem>
                <SelectItem value="todo">{t("designGuide.todo")}</SelectItem>
                <SelectItem value="in_progress">{t("designGuide.in_progress")}</SelectItem>
                <SelectItem value="in_review">{t("designGuide.in_review")}</SelectItem>
                <SelectItem value="done">{t("designGuide.done")}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{t("designGuide.currentValue", { value: t(`statusBadge.${selectValue}`, { defaultValue: selectValue }) })}</p>
          </SubSection>
          <SubSection title={t("designGuide.small_trigger")}>
            <Select defaultValue="high">
              <SelectTrigger size="sm" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">{t("designGuide.critical")}</SelectItem>
                <SelectItem value="high">{t("designGuide.high")}</SelectItem>
                <SelectItem value="medium">{t("designGuide.medium")}</SelectItem>
                <SelectItem value="low">{t("designGuide.low")}</SelectItem>
              </SelectContent>
            </Select>
          </SubSection>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  DROPDOWN MENU                                                */}
      {/* ============================================================ */}
      <Section title={t("designGuide.dropdown_menu")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">{t("designGuide.quick_actions")}<ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem>
              <Check className="h-4 w-4" />{t("designGuide.mark_as_done")}<DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <BookOpen className="h-4 w-4" />{t("designGuide.open_docs")}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={menuChecked}
              onCheckedChange={(value) => setMenuChecked(value === true)}
            >{t("designGuide.watch_issue")}</DropdownMenuCheckboxItem>
            <DropdownMenuItem variant="destructive">
              <Trash2 className="h-4 w-4" />{t("designGuide.delete_issue")}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Section>

      {/* ============================================================ */}
      {/*  POPOVER                                                      */}
      {/* ============================================================ */}
      <Section title={t("designGuide.popover")}>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">{t("designGuide.open_popover")}</Button>
          </PopoverTrigger>
          <PopoverContent className="space-y-2">
            <p className="text-sm font-medium">{t("designGuide.agent_heartbeat")}</p>
            <p className="text-xs text-muted-foreground">{t("designGuide.last_run_succeeded_24s_ago_next_timer_run_in_9m")}</p>
            <Button size="xs">{t("designGuide.wake_now")}</Button>
          </PopoverContent>
        </Popover>
      </Section>

      {/* ============================================================ */}
      {/*  COLLAPSIBLE                                                  */}
      {/* ============================================================ */}
      <Section title={t("designGuide.collapsible")}>
        <Collapsible open={collapsibleOpen} onOpenChange={setCollapsibleOpen} className="space-y-2">
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm">
              {t(collapsibleOpen ? "designGuide.hideAdvancedFilters" : "designGuide.showAdvancedFilters")}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="rounded-md border border-border p-3">
            <div className="space-y-2">
              <Label htmlFor="owner-filter">{t("designGuide.owner")}</Label>
              <Input id="owner-filter" placeholder={t("designGuide.filter_by_agent_name")} />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Section>

      {/* ============================================================ */}
      {/*  SHEET                                                        */}
      {/* ============================================================ */}
      <Section title={t("designGuide.sheet")}>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">{t("designGuide.open_side_panel")}</Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>{t("designGuide.issue_properties")}</SheetTitle>
              <SheetDescription>{t("designGuide.edit_metadata_without_leaving_the_current_page")}</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 px-4">
              <div className="space-y-1">
                <Label htmlFor="sheet-title">{t("designGuide.title")}</Label>
                <Input id="sheet-title" defaultValue={t("designGuide.improve_onboarding_docs")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sheet-description">{t("designGuide.description")}</Label>
                <Textarea id="sheet-description" defaultValue={t("designGuide.capture_setup_pitfalls_and_screenshots")} />
              </div>
            </div>
            <SheetFooter>
              <Button variant="outline">{t("designGuide.cancel")}</Button>
              <Button>{t("designGuide.save")}</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </Section>

      {/* ============================================================ */}
      {/*  SCROLL AREA                                                  */}
      {/* ============================================================ */}
      <Section title={t("designGuide.scroll_area")}>
        <ScrollArea className="h-36 rounded-md border border-border">
          <div className="space-y-2 p-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-md border border-border p-2 text-sm">
                {t("designGuide.heartbeatRunCompleted", { number: i + 1 })}
              </div>
            ))}
          </div>
        </ScrollArea>
      </Section>

      {/* ============================================================ */}
      {/*  COMMAND                                                      */}
      {/* ============================================================ */}
      <Section title={t("designGuide.command_cmdk")}>
        <div className="rounded-md border border-border">
          <Command>
            <CommandInput placeholder={t("designGuide.type_a_command_or_search")} />
            <CommandList>
              <CommandEmpty>{t("designGuide.no_results_found")}</CommandEmpty>
              <CommandGroup heading={t("designGuide.pages")}>
                <CommandItem>
                  <LayoutDashboard className="h-4 w-4" />{t("designGuide.dashboard")}</CommandItem>
                <CommandItem>
                  <CircleDot className="h-4 w-4" />{t("designGuide.issues")}</CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading={t("designGuide.actions")}>
                <CommandItem>
                  <CommandIcon className="h-4 w-4" />{t("designGuide.open_command_palette")}</CommandItem>
                <CommandItem>
                  <Plus className="h-4 w-4" />{t("designGuide.create_new_issue")}</CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  BREADCRUMB                                                   */}
      {/* ============================================================ */}
      <Section title={t("designGuide.breadcrumb")}>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">{t("designGuide.projects")}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">{t("designGuide.paperclip_app")}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t("designGuide.issue_list")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Section>

      {/* ============================================================ */}
      {/*  CARDS                                                        */}
      {/* ============================================================ */}
      <Section title={t("designGuide.cards")}>
        <SubSection title={t("designGuide.dashboard_agent_runs")}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {["running", "queued", "succeeded", "failed", "timed_out", "cancelled", "interrupted"].map((status) => (
              <AgentRunCard
                key={status}
                companyId="design-guide"
                run={{
                  id: `design-guide-${status}`, agentId: "design-guide-agent", agentName: "CodexCoder",
                  status, adapterType: "codex_local", invocationSource: "on_demand", triggerDetail: "manual",
                  startedAt: null, finishedAt: null, createdAt: "2026-09-11T12:00:00Z", issueId: "design-guide-task",
                }}
                issue={{ identifier: "PAP-559", title: t("designGuide.recreate_this_wireframe_on_pages_paperclip"), status: status === "succeeded" ? "done" : "in_progress" }}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{t("designGuide.the_dashboard_and_live_runs_page_use_the_same_compact_cards_in_progress_task_icons_animate_across_the_app_including_between_runs_to_represent_task_workflow_status_live_indicators_report_active_execution_open_a_run_to_view_its_status_and_transcript")}</p>
        </SubSection>
        <SubSection title={t("designGuide.standard_card")}>
          <Card>
            <CardHeader>
              <CardTitle>{t("designGuide.card_title")}</CardTitle>
              <CardDescription>{t("designGuide.card_description_with_supporting_text")}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{t("designGuide.card_content_goes_here_this_is_the_main_body_area")}</p>
            </CardContent>
            <CardFooter className="gap-2">
              <Button size="sm">{t("designGuide.action")}</Button>
              <Button variant="outline" size="sm">{t("designGuide.cancel")}</Button>
            </CardFooter>
          </Card>
        </SubSection>

        <SubSection title={t("designGuide.metric_cards")}>
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricCard icon={Bot} value={12} label={t("designGuide.active_agents")} description={t("designGuide.3_this_week")} />
            <MetricCard icon={CircleDot} value={48} label={t("designGuide.open_issues")} />
            <MetricCard icon={DollarSign} value="$1,234" label={t("designGuide.monthly_cost")} description={t("designGuide.under_budget")} />
            <MetricCard icon={Zap} value="99.9%" label={t("designGuide.uptime")} />
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  TABS                                                         */}
      {/* ============================================================ */}
      <Section title={t("designGuide.tabs")}>
        <SubSection title={t("designGuide.default_pill_variant")}>
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">{t("designGuide.overview")}</TabsTrigger>
              <TabsTrigger value="runs">{t("designGuide.runs")}</TabsTrigger>
              <TabsTrigger value="config">{t("designGuide.config")}</TabsTrigger>
              <TabsTrigger value="costs">{t("designGuide.costs")}</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <p className="text-sm text-muted-foreground py-4">{t("designGuide.overview_tab_content")}</p>
            </TabsContent>
            <TabsContent value="runs">
              <p className="text-sm text-muted-foreground py-4">{t("designGuide.runs_tab_content")}</p>
            </TabsContent>
            <TabsContent value="config">
              <p className="text-sm text-muted-foreground py-4">{t("designGuide.config_tab_content")}</p>
            </TabsContent>
            <TabsContent value="costs">
              <p className="text-sm text-muted-foreground py-4">{t("designGuide.costs_tab_content")}</p>
            </TabsContent>
          </Tabs>
        </SubSection>

        <SubSection title={t("designGuide.line_variant")}>
          <Tabs defaultValue="summary">
            <TabsList variant="line">
              <TabsTrigger value="summary">{t("designGuide.summary")}</TabsTrigger>
              <TabsTrigger value="details">{t("designGuide.details")}</TabsTrigger>
              <TabsTrigger value="comments">{t("designGuide.comments")}</TabsTrigger>
            </TabsList>
            <TabsContent value="summary">
              <p className="text-sm text-muted-foreground py-4">{t("designGuide.summary_content_with_underline_tabs")}</p>
            </TabsContent>
            <TabsContent value="details">
              <p className="text-sm text-muted-foreground py-4">{t("designGuide.details_content")}</p>
            </TabsContent>
            <TabsContent value="comments">
              <p className="text-sm text-muted-foreground py-4">{t("designGuide.comments_content")}</p>
            </TabsContent>
          </Tabs>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  ENTITY ROWS                                                  */}
      {/* ============================================================ */}
      <Section title={t("designGuide.entity_rows")}>
        <div className="border border-border rounded-md">
          <EntityRow
            leading={
              <>
                <StatusIcon status="in_progress" />
                {/* PAP-411: PriorityIcon hidden behind SHOW_TASK_PRIORITY_UI. */}
                {SHOW_TASK_PRIORITY_UI && <PriorityIcon priority="high" />}
              </>
            }
            identifier="PAP-001"
            title={t("designGuide.implement_authentication_flow")}
            subtitle={t("designGuide.responsible_agent_alpha")}
            trailing={<IssueStatusBadge status="in_progress" />}
            onClick={() => {}}
          />
          <EntityRow
            leading={
              <>
                <StatusIcon status="done" />
                {SHOW_TASK_PRIORITY_UI && <PriorityIcon priority="medium" />}
              </>
            }
            identifier="PAP-002"
            title={t("designGuide.set_up_ci_cd_pipeline")}
            subtitle={t("designGuide.completed_2_days_ago")}
            trailing={<IssueStatusBadge status="done" />}
            onClick={() => {}}
          />
          <EntityRow
            leading={
              <>
                <StatusIcon status="todo" />
                {SHOW_TASK_PRIORITY_UI && <PriorityIcon priority="low" />}
              </>
            }
            identifier="PAP-003"
            title={t("designGuide.write_api_documentation")}
            trailing={<IssueStatusBadge status="todo" />}
            onClick={() => {}}
          />
          <EntityRow
            leading={
              <>
                <StatusIcon status="blocked" />
                {SHOW_TASK_PRIORITY_UI && <PriorityIcon priority="critical" />}
              </>
            }
            identifier="PAP-004"
            title={t("designGuide.deploy_to_production")}
            subtitle={t("designGuide.blocked_by_pap_001")}
            trailing={<IssueStatusBadge status="blocked" />}
            selected
          />
        </div>
        <SubSection title={t("designGuide.membership_action")}>
          <div className="border border-border rounded-md">
            <EntityRow
              title={t("designGuide.joined_resource")}
              subtitle={t("designGuide.hover_or_focus_the_row_to_reveal_the_reserved_action_slot")}
              className="group"
              trailing={
                <MembershipAction
                  state="joined"
                  resourceName={t("designGuide.joined_resource")}
                  onJoin={() => {}}
                  onLeave={() => {}}
                />
              }
            />
            <EntityRow
              title={t("designGuide.left_resource")}
              subtitle={t("designGuide.persistent_action_with_dimmed_row_content")}
              className="group text-foreground/55"
              trailing={
                <MembershipAction
                  state="left"
                  resourceName={t("designGuide.left_resource")}
                  onJoin={() => {}}
                  onLeave={() => {}}
                />
              }
            />
            <EntityRow
              title={t("designGuide.leaving_resource")}
              subtitle={t("designGuide.disabled_while_the_optimistic_mutation_is_pending")}
              className="group text-foreground/55"
              trailing={
                <MembershipAction
                  state="left"
                  pending
                  pendingState="left"
                  resourceName={t("designGuide.leaving_resource")}
                  onJoin={() => {}}
                  onLeave={() => {}}
                />
              }
            />
            <EntityRow
              title={t("designGuide.joining_resource")}
              subtitle={t("designGuide.the_target_state_is_visible_immediately_while_the_server_confirms")}
              className="group"
              trailing={
                <MembershipAction
                  state="joined"
                  pending
                  pendingState="joined"
                  resourceName={t("designGuide.joining_resource")}
                  onJoin={() => {}}
                  onLeave={() => {}}
                />
              }
            />
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  FILTER BAR                                                   */}
      {/* ============================================================ */}
      <Section title={t("designGuide.filter_bar")}>
        <FilterBar
          filters={filters.map((filter) => ({
            ...filter,
            label: t(filter.key === "status" ? "designGuide.status" : "designGuide.priority"),
            value: t(filter.key === "status" ? "designGuide.active" : "designGuide.high"),
          }))}
          onRemove={(key) => setFilters((f) => f.filter((x) => x.key !== key))}
          onClear={() => setFilters([])}
        />
        {filters.length === 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setFilters([
                { key: "status", label: "Status", value: "Active" },
                // PAP-411: priority filter demo row suppressed while SHOW_TASK_PRIORITY_UI is off.
                ...(SHOW_TASK_PRIORITY_UI
                  ? [{ key: "priority", label: "Priority", value: "High" } as FilterValue]
                  : []),
              ])
            }
          >{t("designGuide.reset_filters")}</Button>
        )}
      </Section>

      {/* ============================================================ */}
      {/*  AVATARS                                                      */}
      {/* ============================================================ */}
      <Section title={t("designGuide.avatars")}>
        <SubSection title={t("designGuide.sizes")}>
          <div className="flex items-center gap-3">
            <Avatar size="sm"><AvatarFallback>SM</AvatarFallback></Avatar>
            <Avatar><AvatarFallback>DF</AvatarFallback></Avatar>
            <Avatar size="lg"><AvatarFallback>LG</AvatarFallback></Avatar>
          </div>
        </SubSection>

        <SubSection title={t("designGuide.group")}>
          <AvatarGroup>
            <Avatar><AvatarFallback>A1</AvatarFallback></Avatar>
            <Avatar><AvatarFallback>A2</AvatarFallback></Avatar>
            <Avatar><AvatarFallback>A3</AvatarFallback></Avatar>
            <AvatarGroupCount>+5</AvatarGroupCount>
          </AvatarGroup>
        </SubSection>
      </Section>

      <Section title={t("designGuide.app_logos")}>
        <SubSection title={t("designGuide.official_marks_and_runtime_fallback")}>
          <div className="flex items-center gap-3">
            <AppLogo
              name="Notion"
              logoUrl="/brands/apps/notion.svg"
              darkLogoUrl="/brands/apps/notion-dark.svg"
              size={36}
            />
            <AppLogo name="Jira" logoUrl="/brands/apps/jira.svg" darkLogoUrl="/brands/apps/jira-dark.svg" size={44} />
            <AppLogo name={t("designGuide.fallback")} logoUrl="/brands/apps/does-not-exist.svg" size={36} />
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  IDENTITY                                                     */}
      {/* ============================================================ */}
      <Section title={t("designGuide.agent_personas")}>
        <SubSection title={t("designGuide.stable_palette_identities")}>
          <div className="flex flex-wrap gap-3">{AGENT_PALETTE_IDS.map(palette => <AgentAvatar key={palette} appearance={appearanceForPalette(palette)} size={48} label={palette} />)}</div>
        </SubSection>
        <SubSection title={t("designGuide.onboarding_and_live_character")}>
          <p className="text-sm text-muted-foreground">{t("designGuide.place_one_live_character_beside_the_agent_name_onboarding_uses_a_larger_padded_frame_onboarding_and_agent_headers_follow_the_pointer_across_the_page_other_placements_track_within_their_region_full_page_examples_are_in_storybook_under_agents_personas_full_pages")}</p>
          <div className="flex gap-4"><AgentCharacter muted state="sleepy" motion="still" size={128} /><AgentCharacter size={128} /></div>
        </SubSection>
      </Section>
      <Section title={t("designGuide.human_identity")}>
        <SubSection title={t("designGuide.sizes")}>
          <div className="flex items-center gap-6">
            <Identity name="Alex Morgan" size="sm" />
            <Identity name="Alex Morgan" />
            <Identity name="Alex Morgan" size="lg" />
          </div>
        </SubSection>

        <SubSection title={t("designGuide.initials_derivation")}>
          <div className="flex flex-col gap-2">
            <Identity name="Casey Jordan" size="sm" />
            <Identity name="Alpha" size="sm" />
            <Identity name="Quinn Lee" size="sm" />
          </div>
        </SubSection>

        <SubSection title={t("designGuide.custom_initials")}>
          <Identity name={t("designGuide.backend_service")} initials="BS" size="sm" />
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  TOOLTIPS                                                     */}
      {/* ============================================================ */}
      <Section title={t("designGuide.tooltips")}>
        <div className="flex items-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm">{t("designGuide.hover_me")}</Button>
            </TooltipTrigger>
            <TooltipContent>{t("designGuide.this_is_a_tooltip")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm"><Settings /></Button>
            </TooltipTrigger>
            <TooltipContent>{t("designGuide.settings")}</TooltipContent>
          </Tooltip>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  DIALOG                                                       */}
      {/* ============================================================ */}
      <Section title={t("designGuide.dialog")}>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">{t("designGuide.open_dialog")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("designGuide.dialog_title")}</DialogTitle>
              <DialogDescription>{t("designGuide.this_is_a_sample_dialog_showing_the_standard_layout_with_header_content_and_footer")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>{t("designGuide.name")}</Label>
                <Input placeholder={t("designGuide.enter_a_name")} className="mt-1.5" />
              </div>
              <div>
                <Label>{t("designGuide.description")}</Label>
                <Textarea placeholder={t("designGuide.describe")} className="mt-1.5" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline">{t("designGuide.cancel")}</Button>
              <Button>{t("designGuide.save")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Section>

      {/* ============================================================ */}
      {/*  EMPTY STATE                                                  */}
      {/* ============================================================ */}
      <Section title={t("designGuide.empty_state")}>
        <div className="border border-border rounded-md">
          <EmptyState
            icon={Inbox}
            message={t("designGuide.no_items_to_show_create_your_first_one_to_get_started")}
            action={t("designGuide.create_item")}
            onAction={() => {}}
          />
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  PROGRESS BARS                                                */}
      {/* ============================================================ */}
      <Section title={t("designGuide.progress_bars_budget")}>
        <div className="space-y-3">
          {[
            { label: t("designGuide.under_budget_40"), pct: 40, color: "bg-green-400" },
            { label: t("designGuide.warning_75"), pct: 75, color: "bg-yellow-400" },
            { label: t("designGuide.over_budget_95"), pct: 95, color: "bg-red-400" },
          ].map(({ label, pct, color }) => (
            <div key={label} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-xs font-mono">{pct}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-(--tp-width-background-color) duration-150 ${color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  LOG VIEWER                                                   */}
      {/* ============================================================ */}
      <Section title={t("designGuide.log_viewer")}>
        <div className="bg-neutral-950 rounded-lg p-3 font-mono text-xs max-h-80 overflow-y-auto">
          <div className="text-foreground">{t("designGuide.12_00_01_info_agent_started_successfully")}</div>
          <div className="text-foreground">{t("designGuide.12_00_02_info_processing_task_pap_001")}</div>
          <div className="text-yellow-400">{t("designGuide.12_00_05_warn_rate_limit_approaching_80")}</div>
          <div className="text-foreground">{t("designGuide.12_00_08_info_task_pap_001_completed")}</div>
          <div className="text-red-400">{t("designGuide.12_00_12_error_connection_timeout_to_upstream_service")}</div>
          <div className="text-blue-300">{t("designGuide.12_00_12_sys_retrying_connection_in_5s")}</div>
          <div className="text-foreground">{t("designGuide.12_00_17_info_reconnected_successfully")}</div>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 animate-pulse" />
              <span className="inline-flex h-full w-full rounded-full bg-blue-500" />
            </span>
            <span className="text-blue-600 dark:text-blue-400">{t("designGuide.live")}</span>
          </div>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  PROPERTY ROW PATTERN                                         */}
      {/* ============================================================ */}
      <Section title={t("designGuide.property_row_pattern")}>
        <div className="border border-border rounded-md p-4 space-y-1 max-w-sm">
          <div className="flex items-center justify-between py-1.5">
            <span className="text-xs text-muted-foreground">{t("designGuide.status")}</span>
            <StatusBadge status="active" />
          </div>
          {/* PAP-411: priority metadata row hidden behind SHOW_TASK_PRIORITY_UI. */}
          {SHOW_TASK_PRIORITY_UI && (
            <div className="flex items-center justify-between py-1.5">
              <span className="text-xs text-muted-foreground">{t("designGuide.priority")}</span>
              <PriorityIcon priority="high" />
            </div>
          )}
          <div className="flex items-center justify-between py-1.5">
            <span className="text-xs text-muted-foreground">{t("designGuide.responsible")}</span>
            <div className="flex items-center gap-1.5">
              <Avatar size="sm"><AvatarFallback>A</AvatarFallback></Avatar>
              <span className="text-xs">Agent Alpha</span>
            </div>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-xs text-muted-foreground">{t("designGuide.created")}</span>
            <span className="text-xs">{t("designGuide.jan_15_2025")}</span>
          </div>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  NAVIGATION PATTERNS                                          */}
      {/* ============================================================ */}
      <Section title={t("designGuide.navigation_patterns")}>
        <SubSection title={t("designGuide.independent_mcp_connections")}>
          <p className="text-sm text-muted-foreground">{t("designGuide.zapier_arcade_composio_and_executor_each_own_a_connection_their_controlled_setup_views_share_access_connect_tool_discovery_completes_setup_saved_connections_reuse_the_standard_permissions_action_list_and_per_action_test_dialog_storybook_s_apps_connections_groups_use_in_memory_provider_fixtures")}</p>
          <RemoteMcpDesignExample />
        </SubSection>
        <SubSection title={t("designGuide.setup_wizard")}>
          <p className="text-sm text-muted-foreground">{t("designGuide.shared_by_connection_setup_and_trigger_previews_setup_navigation_takes_over_the_section_sidebar_each_step_owns_a_single_footer")}</p>
          <div className="max-w-sm space-y-6">
            <SetupWizardNavigation inline labels={[t("designGuide.choose_trigger"), t("designGuide.configure"), t("designGuide.review")]} step={wizardStep} availableStep={2} onSelect={setWizardStep} />
            <SetupWizardFooter onSaveExit={() => setWizardStep(0)}><Button onClick={() => setWizardStep((wizardStep + 1) % 3)}>{t("designGuide.continue")}</Button></SetupWizardFooter>
          </div>
        </SubSection>
        <SubSection title={t("designGuide.agent_chat_picker")}>
          <AgentChatPickerExample />
        </SubSection>
        <SubSection title={t("designGuide.sidebar_nav_items")}>
          <p className="text-sm text-muted-foreground">{t("designGuide.layout_accepts_sidebarsections_to_compose_additional_sidebarsection_groups_inside_the_shared_sidebar_use_sidebarnavitem_for_each_row_with_sibling_action_buttons_for_starring_or_menus_the_chats_section_shows_starred_agents_the_earliest_created_agent_when_unstarred_then_four_recent_agents_without_duplicates_compose_and_star_controls_share_a_vertical_column_compose_appears_on_hover_or_keyboard_focus_and_remains_visible_on_touch_starred_icons_remain_visible_the_picker_searches_all_company_agents_by_name_or_role_without_a_subtitle_count_continuation_labels_or_footer_task_breadcrumbs_support_leading_identity_and_trailing_actions_beside_the_label_including_single_item_task_headers_see_the_agent_chat_storybook")}</p>
          <Card className="block w-60 p-3 space-y-0.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-accent text-accent-foreground">
              <LayoutDashboard className="h-4 w-4" />{t("designGuide.dashboard")}</div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground cursor-pointer">
              <CircleDot className="h-4 w-4" />{t("designGuide.issues")}<Badge variant="ghost" className="ml-auto bg-primary text-primary-foreground px-1.5">
                12
              </Badge>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground cursor-pointer">
              <Bot className="h-4 w-4" />{t("designGuide.agents")}</div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground cursor-pointer">
              <Hexagon className="h-4 w-4" />{t("designGuide.projects")}</div>
          </Card>
        </SubSection>

        <SubSection title={t("designGuide.view_toggle")}>
          <div className="flex items-center border border-border rounded-md w-fit">
            <button className="px-3 py-1.5 text-xs font-medium bg-accent text-foreground rounded-l-md">
              <ListTodo className="h-3.5 w-3.5 inline mr-1" />{t("designGuide.list")}</button>
            <button className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent/50 rounded-r-md">
              <Target className="h-3.5 w-3.5 inline mr-1" />{t("designGuide.org")}</button>
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  GROUPED LIST (Issues pattern)                                */}
      {/* ============================================================ */}
      <Section title={t("designGuide.grouped_list_issues_pattern")}>
        <div>
          <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-t-md">
            <StatusIcon status="in_progress" />
            <span className="text-sm font-medium">{t("designGuide.in_progress")}</span>
            <span className="text-xs text-muted-foreground ml-1">2</span>
          </div>
          <div className="border border-border rounded-b-md">
            {/* PAP-411: leading PriorityIcon hidden behind SHOW_TASK_PRIORITY_UI. */}
            <EntityRow
              leading={SHOW_TASK_PRIORITY_UI ? <PriorityIcon priority="high" /> : undefined}
              identifier="PAP-101"
              title={t("designGuide.build_agent_heartbeat_system")}
              onClick={() => {}}
            />
            <EntityRow
              leading={SHOW_TASK_PRIORITY_UI ? <PriorityIcon priority="medium" /> : undefined}
              identifier="PAP-102"
              title={t("designGuide.add_cost_tracking_dashboard")}
              onClick={() => {}}
            />
          </div>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  COMMENT THREAD PATTERN                                       */}
      {/* ============================================================ */}
      <Section title={t("designGuide.comment_thread_pattern")}>
        <div className="space-y-3 max-w-2xl">
          <h3 className="text-sm font-semibold">{t("designGuide.comments_2")}</h3>
          <div className="space-y-3">
            <div className="rounded-md border border-border p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground">{t("designGuide.agent")}</span>
                <span className="text-xs text-muted-foreground">{t("designGuide.jan_15_2025")}</span>
              </div>
              <p className="text-sm">{t("designGuide.started_working_on_the_authentication_module_will_need_api_keys_configured")}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground">{t("designGuide.human")}</span>
                <span className="text-xs text-muted-foreground">{t("designGuide.jan_16_2025")}</span>
              </div>
              <p className="text-sm">{t("designGuide.api_keys_have_been_added_to_the_vault_please_proceed")}</p>
            </div>
          </div>
          <div className="space-y-2">
            <Textarea placeholder={t("designGuide.leave_a_comment")} rows={3} />
            <Button size="sm">{t("designGuide.comment")}</Button>
          </div>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  COST TABLE PATTERN                                           */}
      {/* ============================================================ */}
      <Section title={t("designGuide.cost_table_pattern")}>
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead className="border-b border-border bg-accent/20">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">{t("designGuide.model")}</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">{t("designGuide.tokens")}</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">{t("designGuide.cost")}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-3 py-2">claude-sonnet-4-20250514</td>
                <td className="px-3 py-2 font-mono">1.2M</td>
                <td className="px-3 py-2 font-mono">$18.00</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-3 py-2">claude-haiku-4-20250506</td>
                <td className="px-3 py-2 font-mono">500k</td>
                <td className="px-3 py-2 font-mono">$1.25</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">{t("designGuide.total")}</td>
                <td className="px-3 py-2 font-mono">1.7M</td>
                <td className="px-3 py-2 font-mono font-medium">$19.25</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  SKELETONS                                                    */}
      {/* ============================================================ */}
      <Section title={t("designGuide.skeletons")}>
        <SubSection title={t("designGuide.individual")}>
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-8 w-full max-w-sm" />
            <Skeleton className="h-20 w-full" />
          </div>
        </SubSection>

        <SubSection title={t("designGuide.page_skeleton_list")}>
          <div className="border border-border rounded-md p-4">
            <PageSkeleton variant="list" />
          </div>
        </SubSection>

        <SubSection title={t("designGuide.page_skeleton_detail")}>
          <div className="border border-border rounded-md p-4">
            <PageSkeleton variant="detail" />
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  SEPARATOR                                                    */}
      {/* ============================================================ */}
      <Section title={t("designGuide.separator")}>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("designGuide.horizontal")}</p>
          <Separator />
          <div className="flex items-center gap-4 h-8">
            <span className="text-sm">{t("designGuide.left")}</span>
            <Separator orientation="vertical" />
            <span className="text-sm">{t("designGuide.right")}</span>
          </div>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  ICON REFERENCE                                               */}
      {/* ============================================================ */}
      {/*  TEAM CATALOG                                                 */}
      {/* ============================================================ */}
      <Section title={t("designGuide.team_catalog")}>
        <p className="text-sm text-muted-foreground">{t("designGuide.components_from_the_team_catalog_browse_install_surface")}<code className="font-mono text-xs">/teams-catalog</code>{t("designGuide.fixtures_are_shared_with_the_storybook_stories")}</p>

        <SubSection title={t("designGuide.teamrow_browse_list")}>
          <div className="w-(--sz-28rem) rounded-md border border-border">
            <div className="px-3 py-2 text-(length:--text-micro) font-semibold uppercase tracking-wide text-muted-foreground">{t("designGuide.bundled_1")}</div>
            <TeamRow team={sampleTeam} selected onSelect={() => {}} />
            <div className="px-3 py-2 text-(length:--text-micro) font-semibold uppercase tracking-wide text-muted-foreground">{t("designGuide.optional_2")}</div>
            <TeamRow team={optionalTeam} selected={false} onSelect={() => {}} />
            <div className="px-3 py-2 text-(length:--text-micro) font-semibold uppercase tracking-wide text-muted-foreground">{t("designGuide.installed_2")}</div>
            <TeamRow team={sampleTeam} selected={false} onSelect={() => {}} installed={outOfDateInstalledState} />
            <TeamRow team={warnTeam} selected={false} onSelect={() => {}} installed={currentInstalledState} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{t("designGuide.installed_teams_collapse_under")}{" "}<code className="font-mono">INSTALLED · N</code>{t("designGuide.an_out_of_date_install_server")}{" "}<code className="font-mono">originHash</code>{" "}{t("designGuide.catalog")}{" "}<code className="font-mono">contentHash</code>{t("designGuide.shows_the_amber")}{" "}<code className="font-mono">↑</code>{" "}{t("designGuide.badge_pap_10256")}</p>
        </SubSection>

        <SubSection title={t("designGuide.teamcard_onboarding_grid")}>
          <p className="text-xs text-muted-foreground">{t("designGuide.square_tile_for_the_onboarding_pick_a_starter_team_grid_selected_tile_gets")}{" "}
            <code className="font-mono">ring-2 ring-ring</code>{t("designGuide.drives_the")}{" "}
            <code className="font-mono">useInstallTeamCatalogEntry</code>{" "}{t("designGuide.simplified_flow")}</p>
          <TeamCardShowcase />
        </SubSection>

        <SubSection title="TeamHierarchyPreview">
          <div className="max-w-md">
            <TeamHierarchyPreview team={sampleTeam} />
          </div>
        </SubSection>

        <SubSection title="RequiredSkillsList">
          <div className="max-w-xl">
            <RequiredSkillsList skills={sampleTeam.requiredSkills} />
          </div>
        </SubSection>

        <SubSection title="EnvInputsList">
          <div className="max-w-xl">
            <EnvInputsList inputs={sampleTeam.envInputs} />
          </div>
        </SubSection>

        <SubSection title="ExternalSourcesList">
          <div className="max-w-xl">
            <ExternalSourcesList sources={sampleTeam.sourceRefs} />
          </div>
        </SubSection>

        <SubSection title={t("designGuide.source_policy_step_stepsourcepolicy")}>
          <div className="max-w-xl rounded-md border border-border p-4">
            <StepSourcePolicy
              team={warnTeam}
              allowExternalSources={allowExternal}
              allowUnpinnedOptionalSources={allowUnpinned}
              allowLocalPathSources={allowLocalPath}
              onChange={(key, value) => {
                if (key === "external") setAllowExternal(value);
                if (key === "unpinned") setAllowUnpinned(value);
                if (key === "localPath") setAllowLocalPath(value);
              }}
            />
          </div>
        </SubSection>

        <SubSection title={t("designGuide.skill_plan_step_stepskillplan")}>
          <div className="max-w-xl rounded-md border border-border p-4">
            <StepSkillPlan team={sampleTeam} preparations={sampleSkillPreparations} />
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      <Section title={t("designGuide.common_icons_lucide")}>
        <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
          {[
            ["Inbox", Inbox],
            ["ListTodo", ListTodo],
            ["CircleDot", CircleDot],
            ["Hexagon", Hexagon],
            ["Target", Target],
            ["LayoutDashboard", LayoutDashboard],
            ["Bot", Bot],
            ["DollarSign", DollarSign],
            ["History", History],
            ["Search", Search],
            ["Plus", Plus],
            ["Trash2", Trash2],
            ["Settings", Settings],
            ["User", User],
            ["Mail", Mail],
            ["Upload", Upload],
            ["Zap", Zap],
          ].map(([name, Icon]) => {
            const LucideIcon = Icon as React.FC<{ className?: string }>;
            return (
              <div key={name as string} className="flex flex-col items-center gap-1.5 p-2">
                <LucideIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-(length:--text-nano) text-muted-foreground font-mono">{name as string}</span>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  KEYBOARD SHORTCUTS                                           */}
      {/* ============================================================ */}
      <Section title={t("designGuide.keyboard_shortcuts")}>
        <div className="border border-border rounded-md divide-y divide-border text-sm">
          {[
            ["Cmd+K / Ctrl+K", t("designGuide.open_command_palette_65747465")],
            ["C", t("designGuide.new_issue_outside_inputs")],
            ["[", t("designGuide.toggle_sidebar")],
            ["]", t("designGuide.toggle_properties_panel")],

            ["Cmd+Enter / Ctrl+Enter", t("designGuide.submit_markdown_comment")],
          ].map(([key, desc]) => (
            <div key={key} className="flex items-center justify-between px-4 py-2">
              <span className="text-muted-foreground">{desc}</span>
              <kbd className="px-2 py-0.5 text-xs font-mono bg-muted rounded border border-border">
                {key}
              </kbd>
            </div>
          ))}
        </div>
      </Section>

      <Section title={t("designGuide.issue_output_surface")}>
        <SubSection title={t("designGuide.multiple_outputs_primary_video_also_produced")}>
          <IssueOutputSection workProducts={DESIGN_GUIDE_OUTPUTS} />
        </SubSection>
        <SubSection title={t("designGuide.degraded_output_invalid_failed_attachment_metadata")}>
          <IssueOutputSection workProducts={DESIGN_GUIDE_DEGRADED_OUTPUTS} />
        </SubSection>
        <SubSection title={t("designGuide.empty_state_74617465")}>
          <p className="text-xs text-muted-foreground">{t("designGuide.when_an_issue_has_produced_no_artifact_work_products_the_output_section_renders_nothing_at_all_no_placeholder_card")}</p>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  TOOLS & ACCESS (PAP-10389)                                   */}
      {/* ============================================================ */}
      <Section title={t("designGuide.tools_access")}>
        <SubSection title={t("designGuide.enforcementbanner_default_denied_detected")}>
          <div className="space-y-3">
            <EnforcementBanner companyId="" forceVariant="default" recentDenialCount={0} />
            <EnforcementBanner companyId="" forceVariant="denied-detected" recentDenialCount={3} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{t("designGuide.persistent_at_the_top_of_the_tools_access_surface_tints_to")}{" "}<code>denied-detected</code>{" "}{t("designGuide.when_governed_tool_calls_were_denied_or_failed_in_the_last_hour_observability_only_enforcement_lives_in_the_tool_gateway")}</p>
        </SubSection>

        <SubSection title={t("designGuide.enforcementbanner_presentational_tones_info_warning_error")}>
          <div className="space-y-3">
            <EnforcementBanner
              tone="info"
              title={t("designGuide.effective_access_server_resolved")}
              body={t("designGuide.this_is_exactly_what_the_tool_gateway_will_accept_profile_and_policy_edits_reflect_within_5s_the_prompt_cannot_expand_it")}
            />
            <EnforcementBanner
              tone="warning"
              title={t("designGuide.local_stdio_is_local_code_execution_not_a_security_sandbox")}
              body={t("designGuide.a_local_stdio_slot_runs_with_the_orchestrator_s_privileges_only_bind_trusted_commands_quarantine_anything_you_would_not_run_yourself")}
            />
            <EnforcementBanner
              tone="error"
              title={t("designGuide.runtime_failed_closed")}
              body={t("designGuide.the_supervisor_is_restarting_attempt_2_3_the_gateway_returns_runtime_error_and_the_agent_does_not_see_partial_output")}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{t("designGuide.static_governance_copy_with_a_tone_used_for_the_pap_10400_trust_tier_banner_on_runtime_and_the_effective_access_banner_on_agent_tools_pass")}{" "}<code>title</code>/<code>body</code>{" "}{t("designGuide.and_an_optional")}{" "}
            <code>icon</code>.
          </p>
        </SubSection>

        <SubSection title={t("designGuide.action_approval_card_pending_stale_surfaces_11_12")}>
          <div className="grid gap-4 lg:grid-cols-2">
            <ActionCard
              toolName="slack.post_message"
              risk="medium"
              isWrite
              binding={{
                application: "Slack",
                manifestVersion: "2.4.1",
                connection: "https://slack.com/api · acme-workspace",
                catalogSha256: "sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
                payloadSha256: "sha256:2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae",
              }}
              input={{ channel: "#launch", text: "Deploy v2 is live 🎉", unfurl_links: false }}
              reason={t("designGuide.this_tool_can_write_to_your_workspace_so_a_human_signs_off_before_the_agent_posts")}
              policyNumber={7}
              expiresInLabel={t("designGuide.expires_in_23h_51m")}
            />
            <ActionCard
              variant="stale"
              toolName="slack.post_message"
              risk="medium"
              isWrite
              binding={{
                application: "Slack",
                manifestVersion: "2.4.1",
                connection: "https://slack.com/api · acme-workspace",
                catalogSha256: "sha256:7d793037a0760186574b0282f2f435e7a4b1b2b0b822cd15d6c15b0f00a0e3f1",
                previousCatalogSha256: "sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
                payloadSha256: "sha256:2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae",
              }}
              input={{ channel: "#launch", text: "Deploy v2 is live 🎉", unfurl_links: false }}
              reason={t("designGuide.this_tool_can_write_to_your_workspace_so_a_human_signs_off_before_the_agent_posts")}
              policyNumber={7}
              expiresInLabel={t("designGuide.expires_in_18h_02m")}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{t("designGuide.signed_payload_sha256_expiry_surface_on_every_variant_pap_10400_the")}{" "}
            <code>stale</code>{" "}{t("designGuide.variant_tints_the_border_amber_banners_the_catalog_hash_mismatch_strikes_through_the_previous_hash_next_to_the_current_one_and_renders")}{" "}<code>Approve</code>{" "}{t("designGuide.disabled_until_the_request_is_re_issued")}</p>
        </SubSection>

        <SubSection title={t("designGuide.action_approval_card_mobile_390_844_surface_99")}>
          <div className="w-(--sz-390px) max-w-full rounded-xl border border-border bg-background p-3">
            <ActionCardMobile
              toolName="slack.post_message"
              risk="medium"
              isWrite
              binding={{
                application: "Slack",
                manifestVersion: "2.4.1",
                connection: "https://slack.com/api · acme-workspace",
                catalogSha256: "sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
                payloadSha256: "sha256:2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae",
              }}
              input={{ channel: "#launch", text: "Deploy v2 is live 🎉" }}
              reason={t("designGuide.this_tool_can_write_to_your_workspace_so_a_human_signs_off_before_the_agent_posts")}
              policyNumber={7}
              expiresInLabel={t("designGuide.expires_in_23h_51m")}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{t("designGuide.identical_content_the_three_buttons_stack_full_width_in_the_order_approve_deny_edit_re_sign_and_the_bindings_table_uses_a_70px_label_column")}</p>
        </SubSection>

        <SubSection title={t("designGuide.bindingstable_reused_in_the_audit_row_drilldown")}>
          <BindingsTable
            rows={[
              { label: t("designGuide.application"), value: "Slack · manifest v2.4.1" },
              { label: t("designGuide.connection"), value: "https://slack.com/api · acme-workspace", mono: true },
              { label: t("designGuide.catalog_616c6f67"), value: "sha256:9f86d081…f00a08", mono: true },
              { label: t("designGuide.payload"), value: "sha256:2c26b46b…66e7ae", mono: true },
            ]}
          />
          <p className="mt-2 text-xs text-muted-foreground">{t("designGuide.two_column_key_value_block_with_mono_values_lives_inside")}{" "}<code>ActionCard</code>{" "}{t("designGuide.and_is_reused_standalone_in_the_audit_row_drilldown")}</p>
        </SubSection>

        <SubSection title={t("designGuide.tool_access_status_keys_statusbadge")}>
          <div className="flex flex-wrap items-center gap-2">
            {[
              "allowed", "denied", "block", "require-approval", "redacted", "rate-limit",
              "deferred", "hidden", "quarantined", "healthy", "degraded", "runtime-error", "unchecked",
            ].map((s) => (
              <StatusBadge key={s} status={s} />
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{t("designGuide.policy_decisions_connection_runtime_health_and_catalog_quarantine_all_route_through_the_canonical")}{" "}
            <code>StatusBadge</code>{" "}{t("designGuide.keys_defined_in")}{" "}<code>lib/status-colors</code>.
          </p>
        </SubSection>

        <SubSection title={t("designGuide.emptystate_canonical_with_description_action")}>
          <EmptyState
            icon={Inbox}
            message={t("designGuide.no_connections_yet")}
            description={t("designGuide.add_a_connection_to_an_application_to_configure_credentials_and_discover_its_tools")}
            action={t("designGuide.new_connection")}
            onAction={() => {}}
          />
        </SubSection>
      </Section>

      <Section title={t("designGuide.source_repositories")}>
        <SubSection title={t("designGuide.empty_and_disconnected")}>
          <RepositoryEditor selected={[]} onChange={() => {}} state="disconnected" onConnect={() => {}} onRetry={() => {}} />
        </SubSection>
        <SubSection title={t("designGuide.selected_and_searchable")}>
          <RepositoryEditor selected={[{ id: "1", fullName: "paperclipai/paperclip", url: "https://github.com/paperclipai/paperclip", connections: [t("designGuide.your_github")] }]}
            available={[{ id: "2", fullName: "paperclipai/docs", url: "https://github.com/paperclipai/docs", connections: [t("designGuide.company_github")] }]}
            onChange={() => {}} onConnect={() => {}} onRetry={() => {}} />
        </SubSection>
        <p className="text-sm text-muted-foreground">{t("designGuide.loading_errors_empty_search_mobile_and_short_viewports_are_covered_in_the_project_repos_storybook_stories")}</p>
      </Section>

      <Section title={t("designGuide.environment_variables_editor")}>
        <p className="text-sm text-muted-foreground">{t("designGuide.reusable_env_var_editor_agents_projects_environments_routines_one_shared_grid_an_in_field_text_secret_source_switch_a_fuzzy_secret_picker_with_a_pinned_create_secret_item_automatic_sensitive_value_detection_and_inline_secret_health_warnings_see_the_storybook")}{" "}<span className="font-mono">Product/Environment Variables Editor</span>{" "}{t("designGuide.stories_for_all_10_states")}</p>
        <EnvironmentVariablesEditorShowcase />
      </Section>

      <Section title={t("designGuide.tasks_created_from_a_task")}>
        <SubSection title={t("designGuide.subtasks_and_created_work_are_independent")}>
          <div className="max-w-xl">
            <TaskDetailTasksPanel
              subtasks={[DESIGN_GUIDE_TASK]}
              createdTasks={[
                { ...DESIGN_GUIDE_TASK, projectId: "design-board", project: { id: "design-board", name: t("designGuide.board_ui") } as Issue["project"] },
                { ...DESIGN_GUIDE_TASK, id: "design-followup", identifier: "PAP-428", title: t("designGuide.write_release_notes"), status: "todo", projectId: null },
              ]}
              projects={[]}
            />
          </div>
        </SubSection>
        <SubSection title={t("designGuide.empty_loading_and_failed")}>
          <TaskDetailTasksPanel subtasks={[]} createdTasks={[]} projects={[]} />
          <TaskDetailTasksPanel subtasks={[]} createdTasks={[]} projects={[]} isLoading />
          <TaskDetailTasksPanel subtasks={[]} createdTasks={[]} projects={[]} hasError onRetry={() => {}} />
        </SubSection>
      </Section>

      <Section title={t("designGuide.disposition_recovery_notice")}>
        <SubSection title={t("designGuide.needs_attention_with_inspectable_details")}>
          <DispositionRecoveryNotice snapshot={{ kind: "disposition_repair_escalated", actionId: "design-recovery", attemptCount: 2, maxAttempts: 2, reason: "unchanged_source_state_exhausted", assigneeAgentId: null }} defaultExpanded />
        </SubSection>
        <p className="text-sm text-muted-foreground">{t("designGuide.storybook_s_recovery_notice_stories_show_the_actionable_pending_acknowledged_unavailable_failed_and_mobile_states_using_this_production_component")}</p>
      </Section>

      <Section title={t("designGuide.pending_task_input_above_composer")}>
        <p className="mb-3 text-sm text-muted-foreground">{t("designGuide.a_decision_card_sits_above_the_ordinary_message_composer_dismiss_the_card_to_keep_a_reopen_control_or_resolve_it_to_clear_the_pending_state")}</p>
        <TaskPendingInputExample />
      </Section>

      <Section title={t("designGuide.execution_recovery")}>
        <p className="text-sm text-muted-foreground">{t("designGuide.recovery_runs_in_the_background_task_lists_keep_their_ordinary_status_without_execution_badges_active_transcript_headers_keep_saying_working_during_automatic_recovery_recovery_decisions_and_attempts_belong_in_the_run_log_there_is_no_execution_status_card_or_reconciliation_form")}</p>
      </Section>

      <Section title={t("designGuide.cloud_sign_in_unavailable")}>
        <CloudSignIn cloud={{ managed: true, managedBy: "paperclip-cloud", cloudBaseUrl: null, stackSlug: null }} returnTo="/" />
      </Section>

      <Section title={t("designGuide.saved_provider_api_keys")}>
        <SavedProviderKeySelect options={[{ id: "example", label: t("designGuide.claude_api_key_your_key"), binding: { type: "user_secret_ref", key: "ANTHROPIC_API_KEY", version: "latest" } }]} value="example" onChange={() => {}} loading={false} error={false} />
        <SavedProviderKeySelect options={[]} value="" onChange={() => {}} loading error={false} />
        <SavedProviderKeySelect options={[]} value="" onChange={() => {}} loading={false} error />
      </Section>

      <Section title={t("designGuide.browser_setup_prompt")}>
        <p className="text-sm text-muted-foreground">{t("designGuide.a_shared_copy_action_for_provider_setup_instructions_confirms_success_inline_and_offers_selectable_text_if_clipboard_access_fails")}</p>
        <SetupPrompt prompt={t("designGuide.setupPromptPreview")} />
      </Section>

      <Section title={t("designGuide.connection_intent")}>
        <p className="text-sm text-muted-foreground">{t("designGuide.the_task_card_is_the_dialog_host_for_the_shared_connection_setup_flow_provider_forms_validation_oauth_access_selection_and_completion_come_from_the_same_feature_module_as_the_full_page_apps_setup_this_card_owns_only_audience_dialog_and_task_refresh_behavior_pending_connections_stay_in_the_timeline_beside_a_usable_composer_the_independently_addressable_connections_in_task_connections_stories_cover_access_oauth_recovery_narrow_layouts_completion_and_historical_outcomes")}</p>
        <div className="grid gap-4 xl:grid-cols-3">
          <IssueThreadInteractionCard
            interaction={pendingConnectionIntentInteraction}
            currentUserId={issueThreadInteractionFixtureMeta.currentUserId}
          />
          <IssueThreadInteractionCard
            interaction={retryConnectionIntentInteraction}
            currentUserId={issueThreadInteractionFixtureMeta.currentUserId}
          />
          <IssueThreadInteractionCard
            interaction={connectedConnectionIntentInteraction}
            currentUserId={issueThreadInteractionFixtureMeta.currentUserId}
          />
        </div>
      </Section>

      <Section title={t("designGuide.resizable_panels")}>
        <p className="text-sm text-muted-foreground">{t("designGuide.design_system_wrapper_over")}{" "}<span className="font-mono">react-resizable-panels</span>{" "}{t("designGuide.skill_studio_d2_drag_a_handle_to_resize_panels_accept_percentage_or_pixel")}<span className="font-mono">minSize="240px"</span>{t("designGuide.constraints_and_the_middle_panel_is_collapsible_use_anywhere_a_split_view_is_needed")}</p>
        <div className="h-48 max-w-2xl overflow-hidden rounded-md border border-border">
          <ResizablePanelGroup>
            <ResizablePanel id="a" minSize="120px" className="bg-muted/30">
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">{t("designGuide.panel_a")}</div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel id="b" minSize="120px" collapsible collapsedSize="40px" className="bg-muted/10">
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">{t("designGuide.panel_b_collapsible")}</div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel id="c" minSize="120px" className="bg-muted/30">
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">{t("designGuide.panel_c")}</div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  INLINE BANNER + BUILT-IN AGENTS                              */}
      {/* ============================================================ */}
      <Section title={t("designGuide.webhook_url_warnings")}>
        <div className="space-y-3">
          {["http://localhost:3100", "https://paperclip.internal", "https://paperclip.example-tailnet.ts.net", "http://paperclip.example.com", "not-a-url"].map((url) => <WebhookUrlWarning key={url} url={url} />)}
        </div>
      </Section>

      <Section title={t("designGuide.inline_banner")}>
        <p className="text-sm text-muted-foreground">{t("designGuide.token_backed_full_width_notice")}<span className="font-mono">brandBanner</span>{" "}{t("designGuide.tones_use")}{" "}
          <span className="font-mono">info</span>{" "}{t("designGuide.for_provenance_context_and")}{" "}
          <span className="font-mono">warning</span>{" "}{t("designGuide.for_paused_attention_supports_an_optional_bold_title_and_a_trailing_actions_slot_replaces_hand_rolled")}{" "}
          <span className="font-mono">bg-yellow-*</span>/<span className="font-mono">bg-blue-*</span>{" "}{t("designGuide.banners")}</p>
        <div className="space-y-3">
          <InlineBanner
            tone="info"
            title={t("designGuide.built_in_agent")}
            actions={<Button variant="outline" size="sm">{t("designGuide.reset_to_defaults")}</Button>}
          >{t("designGuide.ships_with_paperclip_and_powers")}{" "}<strong>{t("designGuide.briefs")}</strong>{t("designGuide.it_can_be_paused_but_not_deleted")}</InlineBanner>
          <InlineBanner
            tone="warning"
            title={t("designGuide.briefs_is_paused")}
            actions={
              <>
                <Button variant="ghost" size="sm">{t("designGuide.view_agent")}</Button>
                <Button size="sm">{t("designGuide.resume_agent")}</Button>
              </>
            }
          >{t("designGuide.its_built_in_agent_was_paused_2_days_ago_so_new_briefs_aren_t_being_generated")}</InlineBanner>
          <InlineBanner
            tone="danger"
            title={t("designGuide.summary_generation_failed")}
            actions={<Button size="sm">{t("designGuide.retry")}</Button>}
          >{t("designGuide.the_linked_issue_reached_a_terminal_state_before_a_summary_was_written")}</InlineBanner>
          <InlineBanner tone="info" compact>{t("designGuide.compact_variant_for_embedding_inside_dialogs_and_modals")}</InlineBanner>
        </div>
      </Section>

      <Section title={t("designGuide.text_attachment_tabs")}>
        <p className="text-sm text-muted-foreground">{t("designGuide.uploaded_text_opens_in_a_named_task_tab_markdown_offers_rendered_and_raw_icon_controls_every_text_file_has_a_download_action")}</p>
        <div className="grid gap-4 md:grid-cols-2">
          <TextAttachmentPreview title="README.md" text={"# Project notes\n\nReview the **original** file."} markdown downloadUrl="data:text/markdown,%23%20Project%20notes" />
          <TextAttachmentPreview title="notes.txt" text="Plain text stays literal: <example>" markdown={false} downloadUrl="data:text/plain,Plain%20text" />
        </div>
      </Section>

      <Section title={t("designGuide.connection_recovery")}>
        <SubSection title={t("designGuide.waiting_for_server")}>
          <CloudAccessError temporary retrying={false} onRetry={() => undefined} />
        </SubSection>
        <SubSection title={t("designGuide.checking_connection")}>
          <CloudAccessError temporary retrying onRetry={() => undefined} />
        </SubSection>
        <SubSection title={t("designGuide.access_check_failed")}>
          <CloudAccessError temporary={false} retrying={false} onRetry={() => undefined} />
        </SubSection>
      </Section>

      <Section title={t("designGuide.media_artifacts")}>
        <p className="text-sm text-muted-foreground">{t("designGuide.images_and_videos_use_gallery_tiles_the_whole_tile_opens_the_task_gallery_files_and_links_keep_compact_fully_clickable_rows_task_artifact_gallery_in_storybook_covers_playable_videos_mixed_files_narrow_panels_and_unavailable_previews")}</p>
        <div className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
          <MediaArtifactCard id="design-image" title={t("designGuide.launch_artwork")} contentPath="/announcement-preview.svg" contentType="image/svg+xml" originalFilename="launch.svg" detail={t("designGuide.image")} />
          <MediaArtifactCard id="design-video" title={t("designGuide.video_preview_unavailable")} contentPath="" contentType="video/mp4" originalFilename="preview.mp4" detail={t("designGuide.video")} />
        </div>
      </Section>

      <Section title={t("designGuide.ai_connections")}>
        <AiConnectionDesignExamples />
      </Section>

      <Section title={t("designGuide.built_in_agent_lifecycle_chips")}>
        <p className="text-sm text-muted-foreground">{t("designGuide.a_derived_lifecycle_chip_amber_for_attention_states_the_lifecycle_chip_is_separate_from_the_agent_status_vocabulary_and_only_shows_for")}{" "}
          <span className="font-mono">needs_setup</span> / <span className="font-mono">pending_approval</span>.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <BuiltInLifecycleChip status="needs_setup" />
          <BuiltInLifecycleChip status="pending_approval" />
          <BuiltInLifecycleChip status="needs_setup" compact />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          <span className="font-mono">&lt;BuiltInAgentGate agentKey&gt;</span>{" "}{t("designGuide.composes")}{" "}
          <span className="font-mono">PageSkeleton</span> + <span className="font-mono">EmptyState</span>{" "}
          + <span className="font-mono">InlineBanner</span>{" "}{t("designGuide.to_render_the_loading_setup_pending_approval_paused_ready_states_of_a_feature_that_depends_on_a_built_in_agent")}</p>
      </Section>
    </div>
  );
}
