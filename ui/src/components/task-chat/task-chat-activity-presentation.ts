import { t } from "@/i18n";
import {
  AlertTriangle,
  BookOpen,
  Bot,
  Box,
  Clock3,
  Database,
  FileCheck2,
  FilePenLine,
  FileText,
  GitBranch,
  ListChecks,
  PackageCheck,
  Search,
  ShieldCheck,
  TerminalSquare,
  Users,
} from "lucide-react";
import type {
  TaskChatMaterializedResourceItem,
  TaskChatProtocolItem,
  TaskChatProviderActivityItem,
  TaskChatWorkspaceChangeItem,
  TaskChatWorkspaceFileItem,
} from "./task-chat-model";
import {
  humanizeToolName,
  isGenericToolName,
  mcpToolIdentity,
  toolActivityPresentation,
  taskActivityDisplayLabel,
  type ToolIcon,
} from "./tool-taxonomy";

/** Display known protocol metadata without changing labels used for classification. */
export function protocolDetailDisplayLabel(label: string): string {
  const key = ({
    "Revision": "taskProtocol.field_revision",
    "Sync Status": "taskProtocol.field_sync_status",
    "Document Revision": "taskProtocol.field_document_revision",
    "Complete": "taskProtocol.field_complete",
    "Transport": "taskProtocol.field_transport",
    "Operation": "taskProtocol.field_operation",
    "Name": "taskProtocol.field_name",
    "Target": "taskProtocol.field_target",
    "Namespace": "taskProtocol.field_namespace",
    "Read Only": "taskProtocol.field_read_only",
    "Status": "taskProtocol.field_status",
    "Progress": "taskProtocol.field_progress",
    "Duration Ms": "taskProtocol.field_duration_ms",
    "Exit Code": "taskProtocol.field_exit_code",
    "Output Bytes": "taskProtocol.field_output_bytes",
    "Action": "taskProtocol.field_action",
    "Query": "taskProtocol.field_query",
    "Pattern": "taskProtocol.field_pattern",
    "URL": "taskProtocol.field_url",
    "Provider": "taskProtocol.field_provider",
    "Requested Model": "taskProtocol.field_requested_model",
    "From Model": "taskProtocol.field_from_model",
    "Effective Model": "taskProtocol.field_effective_model",
    "Reason": "taskProtocol.field_reason",
    "Buffering": "taskProtocol.field_buffering",
    "Summary": "taskProtocol.field_summary",
    "Pre Tokens": "taskProtocol.field_pre_tokens",
    "Post Tokens": "taskProtocol.field_post_tokens",
    "Same Session": "taskProtocol.field_same_session",
    "Reference": "taskProtocol.field_reference",
    "Media Type": "taskProtocol.field_media_type",
    "Title": "taskProtocol.field_title",
    "Registered": "taskProtocol.field_registered",
    "Transparent Background": "taskProtocol.field_transparent_background",
    "Failure": "taskProtocol.field_failure",
    "State": "taskProtocol.field_state",
    "Scope": "taskProtocol.field_scope",
    "Event": "taskProtocol.field_event",
    "Blocking": "taskProtocol.field_blocking",
    "Label": "taskProtocol.field_label",
    "Available": "taskProtocol.field_available",
    "Decision": "taskProtocol.field_decision",
    "Target Execution Id": "taskProtocol.field_target_execution_id",
    "Origin": "taskProtocol.field_origin",
    "Input Class": "taskProtocol.field_input_class",
    "Byte Count": "taskProtocol.field_byte_count",
    "Planned Duration Ms": "taskProtocol.field_planned_duration_ms",
    "Elapsed Duration Ms": "taskProtocol.field_elapsed_duration_ms",
    "Severity": "taskProtocol.field_severity",
    "Category": "taskProtocol.field_category",
    "Recoverable": "taskProtocol.field_recoverable",
    "User Actionable": "taskProtocol.field_user_actionable",
  } as Record<string, string>)[label];
  return key ? t(key) : label;
}

export function protocolStateDisplayLabel(state: string): string {
  const key = ({
    "pending": "taskProtocol.state_pending",
    "running": "taskProtocol.state_running",
    "in_progress": "taskProtocol.state_in_progress",
    "waiting": "taskProtocol.state_waiting",
    "failed": "taskProtocol.state_failed",
    "blocked": "taskProtocol.state_blocked",
    "denied": "taskProtocol.state_denied",
    "cancelled": "taskProtocol.state_cancelled",
    "interrupted": "taskProtocol.state_interrupted",
    "completed": "taskProtocol.state_completed",
    "done": "taskProtocol.state_done",
    "succeeded": "taskProtocol.state_succeeded",
    "passed": "taskProtocol.state_passed",
    "resolved": "taskProtocol.state_resolved",
    "expired": "taskProtocol.state_expired",
    "informational": "taskProtocol.state_informational",
    "stopped": "taskProtocol.state_stopped",
    "active": "taskProtocol.state_active",
    "queued": "taskProtocol.state_queued",
    "timed_out": "taskProtocol.state_timed_out",
    "added": "taskProtocol.state_added",
    "modified": "taskProtocol.state_modified",
    "deleted": "taskProtocol.state_deleted",
    "renamed": "taskProtocol.state_renamed",
    "copied": "taskProtocol.state_copied",
    "created": "taskProtocol.state_created",
    "unchanged": "taskProtocol.state_unchanged",
    "applied": "taskProtocol.state_applied",
    "rejected": "taskProtocol.state_rejected",
    "not_run": "taskProtocol.state_not_run",
    "needs_input": "taskProtocol.state_needs_input",
    "needs_review": "taskProtocol.state_needs_review",
  } as Record<string, string>)[state];
  return key ? t(key) : state.replaceAll("_", " ");
}

export interface TaskChatActivityPresentation {
  icon: ToolIcon;
  runningLabel: string;
  completedLabel: string;
  failedLabel?: string;
  interruptedLabel?: string;
  detail?: string;
}

function providerDetail(item: TaskChatProviderActivityItem, ...labels: string[]): string | undefined {
  return item.details.find((entry) => labels.includes(entry.label))?.value;
}

function meaningfulToolDetail(value: string | undefined): string | undefined {
  if (!value || isGenericToolName(value) || /^tool(?:\s+|_)call\b/i.test(value)) return undefined;
  return value;
}

export function providerActivityPresentation(item: TaskChatProviderActivityItem): TaskChatActivityPresentation {
  const detail = item.summary
    ?? providerDetail(item, "Query", "URL", "Target", "Name", "Reference", "Reason", "Summary");
  switch (item.family) {
    case "research": {
      const action = providerDetail(item, "Action")?.toLowerCase();
      if (action === "open_page") {
        return { icon: Search, runningLabel: "Opening a web page", completedLabel: "Opened a web page", failedLabel: "Couldn’t open the web page", interruptedLabel: "Stopped opening the web page", detail };
      }
      if (action === "find_in_page") {
        return { icon: Search, runningLabel: "Searching the page", completedLabel: "Searched the page", failedLabel: "Page search failed", interruptedLabel: "Page search stopped", detail };
      }
      return { icon: Search, runningLabel: "Searching the web", completedLabel: "Searched the web", failedLabel: "Web search failed", interruptedLabel: "Web search stopped", detail };
    }
    case "tool_execution": {
      const name = providerDetail(item, "Name");
      const target = providerDetail(item, "Target");
      const progress = providerDetail(item, "Progress");
      const tool = toolActivityPresentation({
        name,
        transport: providerDetail(item, "Transport"),
        namespace: providerDetail(item, "Namespace"),
        operation: providerDetail(item, "Operation"),
        target,
        progress,
      });
      const boundedActivity = meaningfulToolDetail(item.summary)
        ?? meaningfulToolDetail(progress)
        ?? meaningfulToolDetail(target);
      const activityIsIdentity = Boolean(
        boundedActivity && name && humanizeToolName(boundedActivity) === humanizeToolName(name),
      );
      const technicalName = name ? mcpToolIdentity(name)?.name ?? name : tool.displayName;
      const source = tool.sourceLabel
        ? `${tool.sourceLabel} · ${technicalName}`
        : name && !isGenericToolName(name) && humanizeToolName(name) !== tool.runningLabel.replace(/^Running /, "")
          ? name
          : undefined;
      return {
        icon: tool.icon,
        runningLabel: tool.runningLabel,
        completedLabel: tool.completedLabel,
        failedLabel: tool.failedLabel,
        interruptedLabel: tool.interruptedLabel,
        detail: [activityIsIdentity ? undefined : boundedActivity, source].filter(Boolean).join(" · ") || undefined,
      };
    }
    case "plan":
      return { icon: ListChecks, runningLabel: "Updating the plan", completedLabel: "Updated the plan", failedLabel: "Plan update failed", interruptedLabel: "Plan update stopped", detail };
    case "delegation": {
      const action = providerDetail(item, "Action")?.toLowerCase();
      if (action === "message") return { icon: Users, runningLabel: "Messaging a subagent", completedLabel: "Messaged a subagent", failedLabel: "Subagent message failed", interruptedLabel: "Subagent message stopped", detail };
      if (action === "resume") return { icon: Users, runningLabel: "Resuming a subagent", completedLabel: "Resumed a subagent", failedLabel: "Couldn’t resume the subagent", interruptedLabel: "Subagent resume stopped", detail };
      if (action === "close") return { icon: Users, runningLabel: "Closing a subagent", completedLabel: "Closed a subagent", failedLabel: "Couldn’t close the subagent", interruptedLabel: "Subagent close stopped", detail };
      if (action === "wait") return { icon: Users, runningLabel: "Waiting for subagents", completedLabel: "Finished waiting for subagents", failedLabel: "Subagent wait failed", interruptedLabel: "Stopped waiting for subagents", detail };
      return { icon: Users, runningLabel: "Starting a subagent", completedLabel: "Started a subagent", failedLabel: "Subagent start failed", interruptedLabel: "Subagent start stopped", detail };
    }
    case "model_identity":
      return item.eventType === "model.route.changed"
        ? { icon: Bot, runningLabel: "Switching models", completedLabel: "Switched models", failedLabel: "Model switch failed", interruptedLabel: "Model switch stopped", detail }
        : { icon: Bot, runningLabel: "Verifying the model", completedLabel: "Verified the model", failedLabel: "Model verification failed", interruptedLabel: "Model verification stopped", detail };
    case "context":
      return { icon: Database, runningLabel: "Compacting context", completedLabel: "Compacted context", failedLabel: "Context compaction failed", interruptedLabel: "Context compaction stopped", detail };
    case "artifact": {
      const viewed = item.eventType === "artifact.viewed";
      return viewed
        ? { icon: Box, runningLabel: "Viewing an artifact", completedLabel: "Viewed an artifact", failedLabel: "Couldn’t view the artifact", interruptedLabel: "Artifact view stopped", detail }
        : { icon: Box, runningLabel: "Generating an artifact", completedLabel: "Generated an artifact", failedLabel: "Artifact generation failed", interruptedLabel: "Artifact generation stopped", detail };
    }
    case "review": {
      const state = providerDetail(item, "State")?.toLowerCase();
      return state === "exited"
        ? { icon: FileCheck2, runningLabel: "Leaving review mode", completedLabel: "Left review mode", failedLabel: "Couldn’t leave review mode", interruptedLabel: "Review-mode change stopped", detail }
        : { icon: FileCheck2, runningLabel: "Entering review mode", completedLabel: "Entered review mode", failedLabel: "Couldn’t enter review mode", interruptedLabel: "Review-mode change stopped", detail };
    }
    case "hook":
      return { icon: GitBranch, runningLabel: "Running a hook", completedLabel: "Ran a hook", failedLabel: "Hook failed", interruptedLabel: "Hook stopped", detail };
    case "memory":
      return { icon: BookOpen, runningLabel: "Checking memory", completedLabel: "Referenced memory", failedLabel: "Memory lookup failed", interruptedLabel: "Memory lookup stopped", detail };
    case "safety":
      return { icon: ShieldCheck, runningLabel: "Reviewing safety", completedLabel: "Reviewed safety", failedLabel: "Safety review failed", interruptedLabel: "Safety review stopped", detail };
    case "terminal":
      return { icon: TerminalSquare, runningLabel: "Sending terminal input", completedLabel: "Sent terminal input", failedLabel: "Terminal input failed", interruptedLabel: "Terminal input stopped", detail };
    case "wait":
      return { icon: Clock3, runningLabel: "Waiting", completedLabel: "Finished waiting", failedLabel: "Wait failed", interruptedLabel: "Wait stopped", detail };
    case "provider_notice":
      return { icon: AlertTriangle, runningLabel: "Provider notice", completedLabel: "Provider notice", failedLabel: "Provider error", interruptedLabel: "Provider notice", detail };
  }
}

function workspaceChangePresentation(item: TaskChatWorkspaceChangeItem): TaskChatActivityPresentation {
  const count = item.totals.files || item.files.length;
  const detail = count > 0 ? `${count} ${count === 1 ? "file" : "files"}` : undefined;
  return { icon: FilePenLine, runningLabel: "Editing files", completedLabel: "Edited files", detail };
}

function workspaceFilePresentation(item: TaskChatWorkspaceFileItem): TaskChatActivityPresentation {
  return {
    icon: FileText,
    runningLabel: "Referencing a file",
    completedLabel: "Referenced a file",
    detail: item.line == null ? item.path : `${item.path}:${item.line}`,
  };
}

function resourcePresentation(item: TaskChatMaterializedResourceItem): TaskChatActivityPresentation {
  return {
    icon: item.resourceKind === "document" ? FileText : PackageCheck,
    runningLabel: "Saving a resource",
    completedLabel: item.resourceKind === "document" ? "Added a document" : "Added a deliverable",
    detail: item.title,
  };
}

export function protocolActivityPresentation(item: TaskChatProtocolItem): TaskChatActivityPresentation | null {
  switch (item.surface) {
    case "provider_activity": return providerActivityPresentation(item);
    case "workspace_change": return workspaceChangePresentation(item);
    case "workspace_file": return workspaceFilePresentation(item);
    case "resource": return resourcePresentation(item);
    case "runtime_request":
    case "run_result":
    case "run_terminal":
      return null;
  }
}

export function protocolActivityIsRunning(item: TaskChatProtocolItem): boolean {
  if (item.surface === "provider_activity") return item.status === "running";
  if (item.surface === "workspace_change") return !item.complete;
  return false;
}

export function protocolActivityLabel(item: TaskChatProtocolItem, presentation: TaskChatActivityPresentation): string {
  if (item.surface !== "provider_activity") {
    return taskActivityDisplayLabel(protocolActivityIsRunning(item) ? presentation.runningLabel : presentation.completedLabel, true);
  }
  if (item.status === "failed") return taskActivityDisplayLabel(presentation.failedLabel ?? `${presentation.completedLabel} · failed`, true);
  if (item.status === "interrupted") return taskActivityDisplayLabel(presentation.interruptedLabel ?? `${presentation.completedLabel} · interrupted`, true);
  return taskActivityDisplayLabel(item.status === "running" ? presentation.runningLabel : presentation.completedLabel, true);
}
