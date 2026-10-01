/**
 * Provider-neutral tool vocabulary shared by live status, transcript rows,
 * and canonical provider activity. Exact semantic tools get purpose-specific
 * copy; ACP kinds and normalized name prefixes cover future adapters.
 */
import {
  BookOpen,
  Brain,
  ChevronsLeftRightEllipsis,
  CircleHelp,
  Clock3,
  FilePenLine,
  Image,
  ListChecks,
  MessageSquareReply,
  Network,
  Search,
  SearchCode,
  ShieldCheck,
  Terminal,
  Wrench,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { McpIcon } from "./McpIcon";
import { t } from "@/i18n";

/** Translate display copy after stable tool/status classification. */
export function taskActivityDisplayLabel(label: string, generated = false): string {
  const key = ({
    "Unnamed tool": "taskActivity.unnamed_tool",
    "Applying a patch": "taskActivity.applying_a_patch",
    "Applied a patch": "taskActivity.applied_a_patch",
    "Reading a file": "taskActivity.reading_a_file",
    "Read a file": "taskActivity.read_a_file",
    "Writing a file": "taskActivity.writing_a_file",
    "Wrote a file": "taskActivity.wrote_a_file",
    "Editing a file": "taskActivity.editing_a_file",
    "Edited a file": "taskActivity.edited_a_file",
    "Reading a notebook": "taskActivity.reading_a_notebook",
    "Read a notebook": "taskActivity.read_a_notebook",
    "Editing a notebook": "taskActivity.editing_a_notebook",
    "Edited a notebook": "taskActivity.edited_a_notebook",
    "Searching files": "taskActivity.searching_files",
    "Searched files": "taskActivity.searched_files",
    "Searching file contents": "taskActivity.searching_file_contents",
    "Searched file contents": "taskActivity.searched_file_contents",
    "Searching available tools": "taskActivity.searching_available_tools",
    "Searched available tools": "taskActivity.searched_available_tools",
    "Searching the web": "taskActivity.searching_the_web",
    "Searched the web": "taskActivity.searched_the_web",
    "Fetching a web page": "taskActivity.fetching_a_web_page",
    "Fetched a web page": "taskActivity.fetched_a_web_page",
    "Updating the task list": "taskActivity.updating_the_task_list",
    "Updated the task list": "taskActivity.updated_the_task_list",
    "Creating a task": "taskActivity.creating_a_task",
    "Created a task": "taskActivity.created_a_task",
    "Updating a task": "taskActivity.updating_a_task",
    "Updated a task": "taskActivity.updated_a_task",
    "Listing tasks": "taskActivity.listing_tasks",
    "Listed tasks": "taskActivity.listed_tasks",
    "Reading a task": "taskActivity.reading_a_task",
    "Read a task": "taskActivity.read_a_task",
    "Entering plan mode": "taskActivity.entering_plan_mode",
    "Entered plan mode": "taskActivity.entered_plan_mode",
    "Leaving plan mode": "taskActivity.leaving_plan_mode",
    "Left plan mode": "taskActivity.left_plan_mode",
    "Loading a skill": "taskActivity.loading_a_skill",
    "Loaded a skill": "taskActivity.loaded_a_skill",
    "Requesting input": "taskActivity.requesting_input",
    "Requested input": "taskActivity.requested_input",
    "Starting a subagent": "taskActivity.starting_a_subagent",
    "Started a subagent": "taskActivity.started_a_subagent",
    "Checking subagent progress": "taskActivity.checking_subagent_progress",
    "Checked subagent progress": "taskActivity.checked_subagent_progress",
    "Stopping a subagent": "taskActivity.stopping_a_subagent",
    "Stopped a subagent": "taskActivity.stopped_a_subagent",
    "Messaging a subagent": "taskActivity.messaging_a_subagent",
    "Messaged a subagent": "taskActivity.messaged_a_subagent",
    "Checking task progress": "taskActivity.checking_task_progress",
    "Checked task progress": "taskActivity.checked_task_progress",
    "Interrupting a subagent": "taskActivity.interrupting_a_subagent",
    "Interrupted a subagent": "taskActivity.interrupted_a_subagent",
    "Reporting findings": "taskActivity.reporting_findings",
    "Reported findings": "taskActivity.reported_findings",
    "Reviewing safety": "taskActivity.reviewing_safety",
    "Reviewed safety": "taskActivity.reviewed_safety",
    "Inspecting code intelligence": "taskActivity.inspecting_code_intelligence",
    "Inspected code intelligence": "taskActivity.inspected_code_intelligence",
    "Compacting context": "taskActivity.compacting_context",
    "Compacted context": "taskActivity.compacted_context",
    "Generating an image": "taskActivity.generating_an_image",
    "Generated an image": "taskActivity.generated_an_image",
    "Viewing an image": "taskActivity.viewing_an_image",
    "Viewed an image": "taskActivity.viewed_an_image",
    "Running tools in parallel": "taskActivity.running_tools_in_parallel",
    "Ran tools in parallel": "taskActivity.ran_tools_in_parallel",
    "Reading task context": "taskActivity.reading_task_context",
    "Read task context": "taskActivity.read_task_context",
    "Reading task history": "taskActivity.reading_task_history",
    "Read task history": "taskActivity.read_task_history",
    "Listing documents": "taskActivity.listing_documents",
    "Listed documents": "taskActivity.listed_documents",
    "Reading a document": "taskActivity.reading_a_document",
    "Read a document": "taskActivity.read_a_document",
    "Listing document revisions": "taskActivity.listing_document_revisions",
    "Listed document revisions": "taskActivity.listed_document_revisions",
    "Reporting progress": "taskActivity.reporting_progress",
    "Reported progress": "taskActivity.reported_progress",
    "Answering a status question": "taskActivity.answering_a_status_question",
    "Answered a status question": "taskActivity.answered_a_status_question",
    "Writing a document": "taskActivity.writing_a_document",
    "Wrote a document": "taskActivity.wrote_a_document",
    "Registering a deliverable": "taskActivity.registering_a_deliverable",
    "Registered a deliverable": "taskActivity.registered_a_deliverable",
    "Reporting completion": "taskActivity.reporting_completion",
    "Reported completion": "taskActivity.reported_completion",
    "Reporting a blocker": "taskActivity.reporting_a_blocker",
    "Reported a blocker": "taskActivity.reported_a_blocker",
    "Requesting review": "taskActivity.requesting_review",
    "Requested review": "taskActivity.requested_review",
    "Listing agents": "taskActivity.listing_agents",
    "Listed agents": "taskActivity.listed_agents",
    "Reading agent details": "taskActivity.reading_agent_details",
    "Read agent details": "taskActivity.read_agent_details",
    "Searching tasks": "taskActivity.searching_tasks",
    "Searched tasks": "taskActivity.searched_tasks",
    "Listing approvals": "taskActivity.listing_approvals",
    "Listed approvals": "taskActivity.listed_approvals",
    "Reading an approval": "taskActivity.reading_an_approval",
    "Read an approval": "taskActivity.read_an_approval",
    "Reading approval context": "taskActivity.reading_approval_context",
    "Read approval context": "taskActivity.read_approval_context",
    "Reading workspace status": "taskActivity.reading_workspace_status",
    "Read workspace status": "taskActivity.read_workspace_status",
    "Controlling a workspace service": "taskActivity.controlling_a_workspace_service",
    "Controlled a workspace service": "taskActivity.controlled_a_workspace_service",
    "Updating task dependencies": "taskActivity.updating_task_dependencies",
    "Updated task dependencies": "taskActivity.updated_task_dependencies",
    "Requesting approval": "taskActivity.requesting_approval",
    "Requested approval": "taskActivity.requested_approval",
    "Deciding an approval": "taskActivity.deciding_an_approval",
    "Decided an approval": "taskActivity.decided_an_approval",
    "Commenting on an approval": "taskActivity.commenting_on_an_approval",
    "Commented on an approval": "taskActivity.commented_on_an_approval",
    "Scheduling a wake-up": "taskActivity.scheduling_a_wake_up",
    "Scheduled a wake-up": "taskActivity.scheduled_a_wake_up",
    "Calling the Paperclip API": "taskActivity.calling_the_paperclip_api",
    "Called the Paperclip API": "taskActivity.called_the_paperclip_api",
    "Running a command": "taskActivity.running_a_command",
    "Ran a command": "taskActivity.ran_a_command",
    "Waiting": "taskActivity.waiting",
    "Finished waiting": "taskActivity.finished_waiting",
    "Thinking": "taskActivity.thinking",
    "Finished thinking": "taskActivity.finished_thinking",
    "Responding": "taskActivity.responding",
    "Running": "taskActivity.running",
    "Working": "taskActivity.working",
    "Ran": "taskActivity.ran",
    "Running an unnamed tool": "taskActivity.running_an_unnamed_tool",
    "Ran an unnamed tool": "taskActivity.ran_an_unnamed_tool",
    "Opening a web page": "taskActivity.opening_a_web_page",
    "Opened a web page": "taskActivity.opened_a_web_page",
    "Couldn’t open the web page": "taskActivity.couldn_t_open_the_web_page",
    "Stopped opening the web page": "taskActivity.stopped_opening_the_web_page",
    "Searching the page": "taskActivity.searching_the_page",
    "Searched the page": "taskActivity.searched_the_page",
    "Page search failed": "taskActivity.page_search_failed",
    "Page search stopped": "taskActivity.page_search_stopped",
    "Web search failed": "taskActivity.web_search_failed",
    "Web search stopped": "taskActivity.web_search_stopped",
    "Updating the plan": "taskActivity.updating_the_plan",
    "Updated the plan": "taskActivity.updated_the_plan",
    "Plan update failed": "taskActivity.plan_update_failed",
    "Plan update stopped": "taskActivity.plan_update_stopped",
    "Subagent message failed": "taskActivity.subagent_message_failed",
    "Subagent message stopped": "taskActivity.subagent_message_stopped",
    "Resuming a subagent": "taskActivity.resuming_a_subagent",
    "Resumed a subagent": "taskActivity.resumed_a_subagent",
    "Couldn’t resume the subagent": "taskActivity.couldn_t_resume_the_subagent",
    "Subagent resume stopped": "taskActivity.subagent_resume_stopped",
    "Closing a subagent": "taskActivity.closing_a_subagent",
    "Closed a subagent": "taskActivity.closed_a_subagent",
    "Couldn’t close the subagent": "taskActivity.couldn_t_close_the_subagent",
    "Subagent close stopped": "taskActivity.subagent_close_stopped",
    "Waiting for subagents": "taskActivity.waiting_for_subagents",
    "Finished waiting for subagents": "taskActivity.finished_waiting_for_subagents",
    "Subagent wait failed": "taskActivity.subagent_wait_failed",
    "Stopped waiting for subagents": "taskActivity.stopped_waiting_for_subagents",
    "Subagent start failed": "taskActivity.subagent_start_failed",
    "Subagent start stopped": "taskActivity.subagent_start_stopped",
    "Switching models": "taskActivity.switching_models",
    "Switched models": "taskActivity.switched_models",
    "Model switch failed": "taskActivity.model_switch_failed",
    "Model switch stopped": "taskActivity.model_switch_stopped",
    "Verifying the model": "taskActivity.verifying_the_model",
    "Verified the model": "taskActivity.verified_the_model",
    "Model verification failed": "taskActivity.model_verification_failed",
    "Model verification stopped": "taskActivity.model_verification_stopped",
    "Context compaction failed": "taskActivity.context_compaction_failed",
    "Context compaction stopped": "taskActivity.context_compaction_stopped",
    "Viewing an artifact": "taskActivity.viewing_an_artifact",
    "Viewed an artifact": "taskActivity.viewed_an_artifact",
    "Couldn’t view the artifact": "taskActivity.couldn_t_view_the_artifact",
    "Artifact view stopped": "taskActivity.artifact_view_stopped",
    "Generating an artifact": "taskActivity.generating_an_artifact",
    "Generated an artifact": "taskActivity.generated_an_artifact",
    "Artifact generation failed": "taskActivity.artifact_generation_failed",
    "Artifact generation stopped": "taskActivity.artifact_generation_stopped",
    "Leaving review mode": "taskActivity.leaving_review_mode",
    "Left review mode": "taskActivity.left_review_mode",
    "Couldn’t leave review mode": "taskActivity.couldn_t_leave_review_mode",
    "Review-mode change stopped": "taskActivity.review_mode_change_stopped",
    "Entering review mode": "taskActivity.entering_review_mode",
    "Entered review mode": "taskActivity.entered_review_mode",
    "Couldn’t enter review mode": "taskActivity.couldn_t_enter_review_mode",
    "Running a hook": "taskActivity.running_a_hook",
    "Ran a hook": "taskActivity.ran_a_hook",
    "Hook failed": "taskActivity.hook_failed",
    "Hook stopped": "taskActivity.hook_stopped",
    "Checking memory": "taskActivity.checking_memory",
    "Referenced memory": "taskActivity.referenced_memory",
    "Memory lookup failed": "taskActivity.memory_lookup_failed",
    "Memory lookup stopped": "taskActivity.memory_lookup_stopped",
    "Safety review failed": "taskActivity.safety_review_failed",
    "Safety review stopped": "taskActivity.safety_review_stopped",
    "Sending terminal input": "taskActivity.sending_terminal_input",
    "Sent terminal input": "taskActivity.sent_terminal_input",
    "Terminal input failed": "taskActivity.terminal_input_failed",
    "Terminal input stopped": "taskActivity.terminal_input_stopped",
    "Wait failed": "taskActivity.wait_failed",
    "Wait stopped": "taskActivity.wait_stopped",
    "Provider notice": "taskActivity.provider_notice",
    "Provider error": "taskActivity.provider_error",
    "Editing files": "taskActivity.editing_files",
    "Edited files": "taskActivity.edited_files",
    "Referencing a file": "taskActivity.referencing_a_file",
    "Referenced a file": "taskActivity.referenced_a_file",
    "Saving a resource": "taskActivity.saving_a_resource",
    "Added a document": "taskActivity.added_a_document",
    "Added a deliverable": "taskActivity.added_a_deliverable",
    "Ran commands": "taskActivity.ran_commands",
    "Read files": "taskActivity.read_files",
    "Worked on a plan": "taskActivity.worked_on_a_plan",
    "Worked with agents": "taskActivity.worked_with_agents",
    "Worked with images": "taskActivity.worked_with_images",
    "Waited": "taskActivity.waited",
    "Used connected tools": "taskActivity.used_connected_tools",
    "Used tools": "taskActivity.used_tools",
    "Worked with artifacts": "taskActivity.worked_with_artifacts",
    "Managed context": "taskActivity.managed_context",
    "Checked memory": "taskActivity.checked_memory",
    "Checked model settings": "taskActivity.checked_model_settings",
    "Worked in review mode": "taskActivity.worked_in_review_mode",
    "Ran hooks": "taskActivity.ran_hooks",
    "Received a provider update": "taskActivity.received_a_provider_update",
    "Worked on files": "taskActivity.worked_on_files",
    "Referenced files": "taskActivity.referenced_files",
    "Added resources": "taskActivity.added_resources",
    "Checked files": "taskActivity.checked_files",
    "Thought through the task": "taskActivity.thought_through_the_task",
    "Activity stopped": "taskActivity.activity_stopped",
    "Recorded usage": "taskActivity.recorded_usage",
    "Clipping": "taskActivity.clipping",
    "Organizing": "taskActivity.organizing",
    "Sorting": "taskActivity.sorting",
    "Synthesizing": "taskActivity.synthesizing",
    "Analyzing": "taskActivity.analyzing",
    "Filing": "taskActivity.filing",
    "Collating": "taskActivity.collating",
    "Stapling": "taskActivity.stapling",
    "Indexing": "taskActivity.indexing",
    "Annotating": "taskActivity.annotating",
    "Drafting": "taskActivity.drafting",
    "Proofreading": "taskActivity.proofreading",
    "Alphabetizing": "taskActivity.alphabetizing",
    "Photocopying": "taskActivity.photocopying",
    "Laminating": "taskActivity.laminating",
    "Hole-punching": "taskActivity.hole_punching",
    "Bookmarking": "taskActivity.bookmarking",
    "Highlighting": "taskActivity.highlighting",
    "Typing": "taskActivity.typing",
    "Trimming": "taskActivity.trimming",
    "Aligning": "taskActivity.aligning",
    "Combining": "taskActivity.combining",
    "Whiteboarding": "taskActivity.whiteboarding",
    "Diagramming": "taskActivity.diagramming",
    "Sketching": "taskActivity.sketching",
    "Labeling": "taskActivity.labeling",
    "Sticky-noting": "taskActivity.sticky_noting",
    "Brewing": "taskActivity.brewing",
    "Tinkering": "taskActivity.tinkering",
    "Distilling": "taskActivity.distilling",
    "Deliberating": "taskActivity.deliberating",
    "Reading data": "taskActivity.reading_data",
    "Read data": "taskActivity.read_data",
    "Listing items": "taskActivity.listing_items",
    "Listed items": "taskActivity.listed_items",
    "Searching": "taskActivity.searching",
    "Searched": "taskActivity.searched",
    "Fetching data": "taskActivity.fetching_data",
    "Fetched data": "taskActivity.fetched_data",
    "Opening an item": "taskActivity.opening_an_item",
    "Opened an item": "taskActivity.opened_an_item",
    "Updating data": "taskActivity.updating_data",
    "Updated data": "taskActivity.updated_data",
    "Creating an item": "taskActivity.creating_an_item",
    "Created an item": "taskActivity.created_an_item",
    "Deleting an item": "taskActivity.deleting_an_item",
    "Deleted an item": "taskActivity.deleted_an_item",
    "Moving an item": "taskActivity.moving_an_item",
    "Moved an item": "taskActivity.moved_an_item",
    "Posting an update": "taskActivity.posting_an_update",
    "Posted an update": "taskActivity.posted_an_update",
    "Starting an operation": "taskActivity.starting_an_operation",
    "Started an operation": "taskActivity.started_an_operation",
    "Stopping an operation": "taskActivity.stopping_an_operation",
    "Stopped an operation": "taskActivity.stopped_an_operation",
    "Switching mode": "taskActivity.switching_mode",
    "Switched mode": "taskActivity.switched_mode",
  } as Record<string, string>)[label];
  if (key) return t(key);
  if (!generated) return label;
  const suffix = label.match(/^(.*) · (failed|stopped|interrupted)$/);
  if (suffix) return t(`taskActivity.outcome_${suffix[2]}`, { label: taskActivityDisplayLabel(suffix[1], true) });
  const action = label.match(/^(Reading|Read|Listing|Listed|Searching|Searched|Fetching|Fetched|Opening|Opened|Updating|Updated|Creating|Created|Deleting|Deleted|Moving|Moved|Requesting|Requested|Posting|Posted|Starting|Started|Stopping|Stopped|Switching|Switched|Running|Ran) (.+)$/);
  if (action) return t(`taskActivity.action_${action[1].toLowerCase()}`, { target: action[2] });
  return label;
}

/** Lucide icons and hand-rolled SVGs (the MCP logo) share this shape. */
export type ToolIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type ToolFamily =
  | "terminal"
  | "grep"
  | "search"
  | "read"
  | "edit"
  | "web"
  | "plan"
  | "question"
  | "agent"
  | "safety"
  | "image"
  | "wait"
  | "mcp"
  | "other";

export interface ToolTaxonomyEntry {
  family: ToolFamily;
  icon: ToolIcon;
  /** Progressive verb for the status pill, without the trailing ellipsis. */
  verbLabel: string;
}

export type ToolClassificationConfidence = "exact" | "kind" | "inferred" | "fallback" | "unnamed";

export interface ToolActivityPresentationInput {
  name?: string | null;
  transport?: string | null;
  namespace?: string | null;
  /** ACP kind or canonical operation. */
  operation?: string | null;
  target?: string | null;
  progress?: string | null;
}

export interface ToolSummaryGroup {
  key: string;
  singular: string;
  plural: string;
}

export interface ToolActivityPresentation {
  icon: ToolIcon;
  family: ToolFamily;
  runningLabel: string;
  completedLabel: string;
  failedLabel: string;
  interruptedLabel: string;
  displayName: string;
  sourceLabel?: string;
  technicalName?: string;
  confidence: ToolClassificationConfidence;
  summaryGroup: ToolSummaryGroup;
}

/** ACPX's placeholder title must never displace real lifecycle identity. */
const GENERIC_TOOL_NAMES = new Set(["tool", "tool call", "tool_call", "acp_tool"]);

export function isGenericToolName(name: string | undefined | null): boolean {
  const raw = (name ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s*\((?:pending|in[_ -]?progress|completed|failed|cancelled|canceled)\)$/, "");
  return !raw || GENERIC_TOOL_NAMES.has(raw);
}

interface McpIdentity {
  namespace: string;
  name: string;
}

export function mcpToolIdentity(name: string): McpIdentity | null {
  const doubleUnderscore = name.match(/^mcp__(.+?)__(.+)$/i);
  if (doubleUnderscore) return { namespace: doubleUnderscore[1], name: doubleUnderscore[2] };
  const dotted = name.match(/^mcp\.([^.]+)\.(.+)$/i);
  return dotted ? { namespace: dotted[1], name: dotted[2] } : null;
}

function identifierWords(value: string): string[] {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function sentenceCase(words: readonly string[]): string {
  if (words.length === 0) return "";
  const text = words.map((word) => {
    if (["api", "id", "lsp", "mcp", "pr", "url"].includes(word)) return word.toUpperCase();
    return word;
  }).join(" ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function humanizeToolName(name: string | undefined | null): string {
  const raw = (name ?? "").trim();
  if (isGenericToolName(raw)) return "Unnamed tool";
  const mcp = mcpToolIdentity(raw);
  return sentenceCase(identifierWords(mcp?.name ?? raw));
}

/** Humanized MCP tool segment for both mcp__server__tool and mcp.server.tool. */
export function mcpToolSegment(name: string): string | null {
  const identity = mcpToolIdentity(name);
  return identity ? humanizeToolName(identity.name) : null;
}

type Action =
  | "read" | "list" | "search" | "fetch" | "open" | "update" | "create"
  | "delete" | "move" | "run" | "request" | "post" | "start" | "stop"
  | "wait" | "finish" | "block" | "think" | "switch" | "other";

interface ExactAction {
  action: Action;
  running?: string;
  completed?: string;
  group?: ToolSummaryGroup;
  family?: ToolFamily;
}

const group = (key: string, singular: string, plural: string): ToolSummaryGroup => ({ key, singular, plural });

const EXACT_ACTIONS: Record<string, ExactAction> = {
  bash: { action: "run" },
  terminal: { action: "run" },
  shell: { action: "run" },
  command: { action: "run" },
  run: { action: "run" },
  execute: { action: "run" },
  exec_command: { action: "run" },
  apply_patch: { action: "update", running: "Applying a patch", completed: "Applied a patch" },
  read: { action: "read", running: "Reading a file", completed: "Read a file" },
  write: { action: "update", running: "Writing a file", completed: "Wrote a file" },
  edit: { action: "update", running: "Editing a file", completed: "Edited a file" },
  notebook_read: { action: "read", running: "Reading a notebook", completed: "Read a notebook" },
  notebook_edit: { action: "update", running: "Editing a notebook", completed: "Edited a notebook" },
  glob: { action: "search", running: "Searching files", completed: "Searched files" },
  grep: { action: "search", running: "Searching file contents", completed: "Searched file contents", family: "grep" },
  tool_search: { action: "search", running: "Searching available tools", completed: "Searched available tools", group: group("tool_search", "tool search", "tool searches") },
  web_search: { action: "search", running: "Searching the web", completed: "Searched the web", family: "web" },
  web_fetch: { action: "fetch", running: "Fetching a web page", completed: "Fetched a web page", family: "web" },
  todo_write: { action: "update", running: "Updating the task list", completed: "Updated the task list", family: "plan", group: group("task_operation", "task operation", "task operations") },
  task_create: { action: "create", running: "Creating a task", completed: "Created a task", family: "plan", group: group("task_operation", "task operation", "task operations") },
  task_update: { action: "update", running: "Updating a task", completed: "Updated a task", family: "plan", group: group("task_operation", "task operation", "task operations") },
  task_list: { action: "list", running: "Listing tasks", completed: "Listed tasks", family: "plan", group: group("task_operation", "task operation", "task operations") },
  task_get: { action: "read", running: "Reading a task", completed: "Read a task", family: "plan", group: group("task_operation", "task operation", "task operations") },
  enter_plan_mode: { action: "switch", running: "Entering plan mode", completed: "Entered plan mode", family: "plan" },
  exit_plan_mode: { action: "switch", running: "Leaving plan mode", completed: "Left plan mode", family: "plan" },
  skill: { action: "read", running: "Loading a skill", completed: "Loaded a skill" },
  ask_user_question: { action: "request", running: "Requesting input", completed: "Requested input", family: "question" },
  request_human_input: { action: "request", running: "Requesting input", completed: "Requested input", family: "question", group: group("task_operation", "task operation", "task operations") },
  agent: { action: "start", running: "Starting a subagent", completed: "Started a subagent", family: "agent" },
  task: { action: "start", running: "Starting a subagent", completed: "Started a subagent", family: "agent" },
  task_output: { action: "read", running: "Checking subagent progress", completed: "Checked subagent progress", family: "agent" },
  task_stop: { action: "stop", running: "Stopping a subagent", completed: "Stopped a subagent", family: "agent" },
  send_message: { action: "post", running: "Messaging a subagent", completed: "Messaged a subagent", family: "agent" },
  spawn_agent: { action: "start", running: "Starting a subagent", completed: "Started a subagent", family: "agent" },
  wait_agent: { action: "wait", running: "Checking subagent progress", completed: "Checked subagent progress", family: "agent" },
  wait_threads: { action: "wait", running: "Checking task progress", completed: "Checked task progress", family: "agent" },
  interrupt_agent: { action: "stop", running: "Interrupting a subagent", completed: "Interrupted a subagent", family: "agent" },
  report_findings: { action: "post", running: "Reporting findings", completed: "Reported findings", family: "safety" },
  guardian_review: { action: "think", running: "Reviewing safety", completed: "Reviewed safety", family: "safety" },
  lsp: { action: "read", running: "Inspecting code intelligence", completed: "Inspected code intelligence" },
  compact_conversation: { action: "think", running: "Compacting context", completed: "Compacted context" },
  image_generation: { action: "create", running: "Generating an image", completed: "Generated an image", family: "image" },
  view_image: { action: "read", running: "Viewing an image", completed: "Viewed an image", family: "image" },
  multi_tool_use_parallel: { action: "run", running: "Running tools in parallel", completed: "Ran tools in parallel" },
  get_task_context: { action: "read", running: "Reading task context", completed: "Read task context" },
  get_task_history: { action: "read", running: "Reading task history", completed: "Read task history" },
  list_documents: { action: "list", running: "Listing documents", completed: "Listed documents" },
  read_document: { action: "read", running: "Reading a document", completed: "Read a document" },
  list_document_revisions: { action: "list", running: "Listing document revisions", completed: "Listed document revisions" },
  report_progress: { action: "post", running: "Reporting progress", completed: "Reported progress" },
  answer_status_question: { action: "post", running: "Answering a status question", completed: "Answered a status question" },
  write_document: { action: "update", running: "Writing a document", completed: "Wrote a document" },
  register_deliverable: { action: "create", running: "Registering a deliverable", completed: "Registered a deliverable" },
  finish_task: { action: "finish", running: "Reporting completion", completed: "Reported completion" },
  paperclip_finish: { action: "finish", running: "Reporting completion", completed: "Reported completion" },
  block_task: { action: "block", running: "Reporting a blocker", completed: "Reported a blocker" },
  paperclip_block: { action: "block", running: "Reporting a blocker", completed: "Reported a blocker" },
  request_review: { action: "request", running: "Requesting review", completed: "Requested review" },
  list_agents: { action: "list", running: "Listing agents", completed: "Listed agents" },
  get_agent: { action: "read", running: "Reading agent details", completed: "Read agent details" },
  search_tasks: { action: "search", running: "Searching tasks", completed: "Searched tasks" },
  list_approvals: { action: "list", running: "Listing approvals", completed: "Listed approvals" },
  get_approval: { action: "read", running: "Reading an approval", completed: "Read an approval" },
  get_approval_context: { action: "read", running: "Reading approval context", completed: "Read approval context" },
  get_workspace_runtime: { action: "read", running: "Reading workspace status", completed: "Read workspace status" },
  control_workspace_service: { action: "run", running: "Controlling a workspace service", completed: "Controlled a workspace service" },
  set_dependencies: { action: "update", running: "Updating task dependencies", completed: "Updated task dependencies" },
  create_task: { action: "create", running: "Creating a task", completed: "Created a task" },
  request_approval: { action: "request", running: "Requesting approval", completed: "Requested approval" },
  decide_approval: { action: "update", running: "Deciding an approval", completed: "Decided an approval" },
  comment_on_approval: { action: "post", running: "Commenting on an approval", completed: "Commented on an approval" },
  schedule_wake: { action: "create", running: "Scheduling a wake-up", completed: "Scheduled a wake-up", family: "wait" },
  generic_api_request: { action: "request", running: "Calling the Paperclip API", completed: "Called the Paperclip API" },
};

const ACTION_PREFIXES: Record<Action, readonly string[]> = {
  read: ["get", "read", "inspect", "view"],
  list: ["list", "glob"],
  search: ["find", "search", "grep", "query", "lookup"],
  fetch: ["fetch", "browse"],
  open: ["open"],
  update: ["write", "edit", "update", "set", "patch", "upsert", "sync"],
  create: ["create", "add", "register", "upload"],
  delete: ["delete", "remove"],
  move: ["move", "rename"],
  run: ["run", "execute", "bash", "shell", "command"],
  request: ["request", "ask", "prompt"],
  post: ["send", "message", "comment", "report", "answer"],
  start: ["start", "spawn", "delegate"],
  stop: ["stop", "cancel", "interrupt"],
  wait: ["wait", "sleep", "poll"],
  finish: ["finish", "complete"],
  block: ["block"],
  think: ["think", "reason", "compact", "review"],
  switch: ["switch", "enter", "exit"],
  other: [],
};

const OPERATION_ACTIONS: Record<string, Action> = {
  read: "read",
  edit: "update",
  delete: "delete",
  move: "move",
  search: "search",
  list: "list",
  execute: "run",
  think: "think",
  fetch: "fetch",
  switch_mode: "switch",
};

function normalizedKey(name: string): string {
  return identifierWords(name).join("_");
}

function inferredAction(words: readonly string[]): Action | null {
  const first = words[0];
  if (!first) return null;
  for (const [action, prefixes] of Object.entries(ACTION_PREFIXES) as Array<[Action, readonly string[]]>) {
    if (prefixes.includes(first)) return action;
  }
  return null;
}

function actionFamily(action: Action): ToolFamily {
  if (action === "run") return "terminal";
  if (action === "read" || action === "list") return "read";
  if (action === "search") return "search";
  if (action === "fetch" || action === "open") return "web";
  if (["update", "create", "delete", "move"].includes(action)) return "edit";
  if (action === "request") return "question";
  if (action === "start" || action === "stop") return "agent";
  if (action === "wait") return "wait";
  return "other";
}

const FAMILY_ICONS: Record<ToolFamily, ToolIcon> = {
  terminal: Terminal,
  grep: SearchCode,
  search: Search,
  read: BookOpen,
  edit: FilePenLine,
  web: ChevronsLeftRightEllipsis,
  plan: ListChecks,
  question: CircleHelp,
  agent: Network,
  safety: ShieldCheck,
  image: Image,
  wait: Clock3,
  mcp: McpIcon,
  other: Wrench,
};

function actionCopy(action: Action, object: string | undefined): { running: string; completed: string } {
  const suffix = object ? ` ${object}` : "";
  switch (action) {
    case "read": return { running: `Reading${suffix || " data"}`, completed: `Read${suffix || " data"}` };
    case "list": return { running: `Listing${suffix || " items"}`, completed: `Listed${suffix || " items"}` };
    case "search": return { running: `Searching${suffix || ""}`, completed: `Searched${suffix || ""}` };
    case "fetch": return { running: `Fetching${suffix || " data"}`, completed: `Fetched${suffix || " data"}` };
    case "open": return { running: `Opening${suffix || " an item"}`, completed: `Opened${suffix || " an item"}` };
    case "update": return { running: `Updating${suffix || " data"}`, completed: `Updated${suffix || " data"}` };
    case "create": return { running: `Creating${suffix || " an item"}`, completed: `Created${suffix || " an item"}` };
    case "delete": return { running: `Deleting${suffix || " an item"}`, completed: `Deleted${suffix || " an item"}` };
    case "move": return { running: `Moving${suffix || " an item"}`, completed: `Moved${suffix || " an item"}` };
    case "run": return { running: "Running a command", completed: "Ran a command" };
    case "request": return { running: `Requesting${suffix || " input"}`, completed: `Requested${suffix || " input"}` };
    case "post": return { running: `Posting${suffix || " an update"}`, completed: `Posted${suffix || " an update"}` };
    case "start": return { running: `Starting${suffix || " an operation"}`, completed: `Started${suffix || " an operation"}` };
    case "stop": return { running: `Stopping${suffix || " an operation"}`, completed: `Stopped${suffix || " an operation"}` };
    case "wait": return { running: "Waiting", completed: "Finished waiting" };
    case "finish": return { running: "Reporting completion", completed: "Reported completion" };
    case "block": return { running: "Reporting a blocker", completed: "Reported a blocker" };
    case "think": return { running: "Thinking", completed: "Finished thinking" };
    case "switch": return { running: `Switching${suffix || " mode"}`, completed: `Switched${suffix || " mode"}` };
    case "other": return { running: "Running", completed: "Ran" };
  }
}

function defaultSummaryGroup(action: Action): ToolSummaryGroup {
  switch (action) {
    case "run": return group("command", "command", "commands");
    case "read":
    case "list": return group("read", "read", "reads");
    case "search": return group("search", "search", "searches");
    case "update":
    case "create":
    case "delete":
    case "move": return group("file_change", "file change", "file changes");
    case "start":
    case "stop": return group("delegation", "delegation", "delegations");
    case "wait": return group("wait", "wait", "waits");
    default: return group("tool_action", "tool action", "tool actions");
  }
}

function paperclipSummaryGroup(action: Action): ToolSummaryGroup {
  if (action === "read" || action === "list") return group("paperclip_read", "Paperclip read", "Paperclip reads");
  return group("task_operation", "task operation", "task operations");
}

/**
 * Resolve one tool into status-specific copy and iconography. Precedence is:
 * exact aliases, canonical ACP operation/kind, normalized verb, then a named
 * fallback. MCP remains visible as the source icon without losing semantics.
 */
export function toolActivityPresentation(input: ToolActivityPresentationInput): ToolActivityPresentation {
  const rawName = (input.name ?? "").trim();
  const parsedMcp = mcpToolIdentity(rawName);
  const namespace = (input.namespace ?? parsedMcp?.namespace ?? "").trim();
  // The name itself is authoritative for historical ACPX records that were
  // persisted as builtin before MCP transport normalization existed.
  const transport = (parsedMcp ? "mcp" : input.transport ?? "builtin").toLowerCase();
  const semanticName = (parsedMcp?.name ?? rawName).trim();
  const words = identifierWords(semanticName);
  const key = normalizedKey(semanticName);
  const exact = EXACT_ACTIONS[key];
  const operationAction = OPERATION_ACTIONS[(input.operation ?? "").trim().toLowerCase()];
  const inferred = inferredAction(words);
  const action = exact?.action ?? operationAction ?? inferred ?? "other";
  const confidence: ToolClassificationConfidence = exact
    ? "exact"
    : operationAction
      ? "kind"
      : inferred
        ? "inferred"
        : isGenericToolName(semanticName)
          ? "unnamed"
          : "fallback";
  const displayName = isGenericToolName(semanticName) ? "Unnamed tool" : humanizeToolName(semanticName);
  const identifierLikeName = /^[A-Za-z][A-Za-z0-9_.:-]*$/.test(semanticName);
  const objectWords = inferred && identifierLikeName && words.length > 1 ? words.slice(1) : [];
  const object = objectWords.length ? sentenceCase(objectWords).replace(/^./, (letter) => letter.toLowerCase()) : undefined;
  const copy = exact?.running && exact.completed
    ? { running: exact.running, completed: exact.completed }
    : action === "other"
      ? isGenericToolName(semanticName)
        ? { running: "Running an unnamed tool", completed: "Ran an unnamed tool" }
        : { running: `Running ${displayName}`, completed: `Ran ${displayName}` }
      : actionCopy(action, exact ? undefined : object);
  const semanticFamily = exact?.family ?? actionFamily(action);
  const family = transport === "mcp" ? "mcp" : semanticFamily;
  const sourceLabel = namespace
    ? humanizeToolName(namespace)
    : transport === "mcp"
      ? "MCP"
      : undefined;
  const summaryGroup = namespace.toLowerCase() === "paperclip"
    ? paperclipSummaryGroup(action)
    : exact?.group ?? defaultSummaryGroup(action);

  return {
    icon: FAMILY_ICONS[family],
    family,
    runningLabel: copy.running,
    completedLabel: copy.completed,
    failedLabel: `${copy.completed} · failed`,
    interruptedLabel: `${copy.running} · stopped`,
    displayName,
    sourceLabel,
    technicalName: rawName || undefined,
    confidence,
    summaryGroup,
  };
}

/** Compact compatibility mapping used by legacy tool rows and live pills. */
export function toolTaxonomy(name: string | undefined | null): ToolTaxonomyEntry {
  const presentation = toolActivityPresentation({ name });
  return {
    family: presentation.family,
    icon: presentation.icon,
    verbLabel: presentation.runningLabel,
  };
}

/** Icons for tool-free informative statuses. */
export function statusLabelIcon(label: string | undefined | null): ToolIcon | null {
  const raw = (label ?? "").trim().toLowerCase();
  if (raw === "thinking") return Brain;
  if (raw === "responding" || raw.startsWith("responding (")) return MessageSquareReply;
  return null;
}
