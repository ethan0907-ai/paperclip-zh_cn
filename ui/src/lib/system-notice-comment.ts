import { t } from "@/i18n";
import type {
  IssueCommentMetadata,
  IssueCommentMetadataRow,
  IssueCommentPresentation,
} from "@paperclipai/shared";
import type {
  SystemNoticeMetadataRow,
  SystemNoticeMetadataSection,
  SystemNoticeProps,
  SystemNoticeTone,
} from "../components/SystemNotice";

const TONE_LABEL: Record<SystemNoticeTone, string> = {
  get neutral() { return t("taskSystemNotice.system_notice"); },
  get info() { return t("taskSystemNotice.system_notice"); },
  get success() { return t("taskSystemNotice.system_notice"); },
  get warning() { return t("taskSystemNotice.system_warning"); },
  get danger() { return t("taskSystemNotice.system_alert"); },
};

/** Known product labels only; custom titles and backend detail text remain intact. */
export function systemNoticeDisplayLabel(label: string): string {
  switch (label) {
    case "System update": return t("taskSystemNotice.system_update");
    case "System notice": return t("taskSystemNotice.system_notice");
    case "System warning": return t("taskSystemNotice.system_warning");
    case "System alert": return t("taskSystemNotice.system_alert");
    case "Detail": return t("taskSystemNotice.detail");
    case "Code": return t("taskSystemNotice.code");
    case "Task": return t("taskSystemNotice.task");
    case "Agent": return t("taskSystemNotice.agent");
    case "Run": return t("taskSystemNotice.run");
    case "Workspace": return t("taskSystemNotice.workspace");
    case "Workspace ready": return t("taskSystemNotice.workspace_ready");
    case "No live execution path": return t("taskSystemNotice.no_live_execution_path");
    default: return label;
  }
}

function metadataRowText(row: { label?: string | null }, fallback: string) {
  const label = row.label?.trim();
  return label && label.length > 0 ? systemNoticeDisplayLabel(label) : fallback;
}

function mapMetadataRow(
  row: IssueCommentMetadataRow,
  ctx: { runAgentId?: string | null },
): SystemNoticeMetadataRow | null {
  switch (row.type) {
    case "text":
      return { kind: "text", label: metadataRowText(row, t("taskSystemNotice.detail")), value: row.text };
    case "code":
      return { kind: "code", label: metadataRowText(row, t("taskSystemNotice.code")), value: row.code };
    case "key_value":
      return { kind: "text", label: systemNoticeDisplayLabel(row.label), value: row.value };
    case "issue_link": {
      const identifier = row.identifier ?? null;
      if (!identifier) {
        return { kind: "text", label: metadataRowText(row, t("taskSystemNotice.task")), value: row.title ?? t("taskSystemNotice.unknown") };
      }
      return {
        kind: "issue",
        label: metadataRowText(row, t("taskSystemNotice.task")),
        identifier,
        href: `/issues/${identifier}`,
        title: row.title ?? undefined,
      };
    }
    case "agent_link": {
      const name = row.name?.trim() || row.agentId.slice(0, 8);
      return {
        kind: "agent",
        label: metadataRowText(row, t("taskSystemNotice.agent")),
        name,
        href: `/agents/${row.agentId}`,
      };
    }
    case "run_link": {
      const runAgentId = row.agentId ?? ctx.runAgentId ?? null;
      const href = runAgentId ? `/agents/${runAgentId}/runs/${row.runId}` : undefined;
      return {
        kind: "run",
        label: metadataRowText(row, t("taskSystemNotice.run")),
        runId: row.runId,
        href,
        status: row.title ?? undefined,
      };
    }
    default:
      return null;
  }
}

export function mapCommentMetadataToSystemNoticeSections(
  metadata: IssueCommentMetadata | null | undefined,
  ctx: { runAgentId?: string | null } = {},
): Array<SystemNoticeMetadataSection & { rawTitle?: string }> {
  if (!metadata || !Array.isArray(metadata.sections)) return [];
  return metadata.sections
    .map((section) => {
      const rows = section.rows
        .map((row) => mapMetadataRow(row, ctx))
        .filter((r): r is SystemNoticeMetadataRow => r !== null);
      if (rows.length === 0) return null;
      const out: SystemNoticeMetadataSection & { rawTitle?: string } = { rows };
      if (section.title) {
        out.rawTitle = section.title;
        out.title = systemNoticeDisplayLabel(section.title);
      }
      return out;
    })
    .filter((s): s is SystemNoticeMetadataSection & { rawTitle?: string } => s !== null);
}

export function systemNoticeLabelForTone(
  tone: SystemNoticeTone,
  presentationTitle?: string | null,
): string {
  const trimmed = presentationTitle?.trim();
  if (trimmed && trimmed.length > 0) return systemNoticeDisplayLabel(trimmed);
  return TONE_LABEL[tone];
}

export function buildSystemNoticeProps(input: {
  presentation: IssueCommentPresentation | null;
  metadata: IssueCommentMetadata | null;
  body: import("react").ReactNode;
  timestamp?: string;
  source?: SystemNoticeProps["source"];
  runAgentId?: string | null;
}): SystemNoticeProps {
  const tone: SystemNoticeTone = input.presentation?.tone ?? "neutral";
  const label = systemNoticeLabelForTone(tone, input.presentation?.title);
  const detailsDefaultOpen = Boolean(input.presentation?.detailsDefaultOpen);
  const sections = mapCommentMetadataToSystemNoticeSections(input.metadata, {
    runAgentId: input.runAgentId ?? null,
  });
  return {
    tone,
    label,
    body: input.body,
    metadata: sections.length > 0 ? sections : undefined,
    detailsDefaultOpen,
    timestamp: input.timestamp,
    source: input.source,
  };
}
