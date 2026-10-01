import { t, i18n } from "@/i18n";
import type { IssueChangeReceiptEntry } from "@paperclipai/shared";
import { formatReviewPolicyValue } from "./review-policy";

/**
 * Read + format the field-level change receipts carried on an `issue.updated`
 * activity event (the open cross-task write design (audit), built on the field-change receipts the API already records).
 *
 * Every issue PATCH — agent and board alike — must leave an auditable record of
 * who changed what, when, and under which authorization. The server writes that
 * receipt; this module turns it into something a human can scan in the activity
 * stream without opening the audit log.
 *
 * The server already drops `updatedAt` and truncates long text (flagging it with
 * `updated: true`), so this module renders what it is given rather than
 * re-deciding what is interesting.
 */

/** Field names whose raw ids carry no meaning in a scannable summary. */
const FIELD_LABELS: Record<string, string> = {
  get title() { return t("taskDisplayTail.title"); },
  get description() { return t("taskDisplayTail.description"); },
  get identifier() { return t("taskDisplayTail.identifier"); },
  get status() { return t("taskDisplayTail.status"); },
  get priority() { return t("taskDisplayTail.priority"); },
  get assigneeAgentId() { return t("taskDisplayTail.fieldAssignee"); },
  get assigneeUserId() { return t("taskDisplayTail.fieldAssigneeUser"); },
  get responsibleUserId() { return t("taskDisplayTail.responsibleUser"); },
  get blockedByIssueIds() { return t("taskDisplayTail.blockers"); },
  get labelIds() { return t("taskDisplayTail.labels"); },
  get parentId() { return t("taskDisplayTail.parent"); },
  get projectId() { return t("taskDisplayTail.project"); },
  get goalId() { return t("taskDisplayTail.goal"); },
  get workMode() { return t("taskDisplayTail.workMode"); },
  get reviewPolicy() { return t("taskDisplayTail.reviewPolicy"); },
  get billingCode() { return t("taskDisplayTail.billingCode"); },
  get checkoutRunId() { return t("taskDisplayTail.checkoutRun"); },
  get executionRunId() { return t("taskDisplayTail.executionRun"); },
  get hiddenAt() { return t("taskDisplayTail.hidden"); },
  get startedAt() { return t("taskDisplayTail.started"); },
  get completedAt() { return t("taskDisplayTail.completed"); },
  get cancelledAt() { return t("taskDisplayTail.cancelled"); },
  get requestDepth() { return t("taskDisplayTail.requestDepth"); },
  get sourceTrust() { return t("taskDisplayTail.sourceTrust"); },
  get executionPolicy() { return t("taskDisplayTail.executionPolicy"); },
  get executionWorkspaceId() { return t("taskDisplayTail.executionWorkspace"); },
  get projectWorkspaceId() { return t("taskDisplayTail.projectWorkspace"); },
};

/** Human label for a changed field, e.g. `assigneeAgentId` → "Assignee". */
export function issueChangeFieldLabel(field: string): string {
  const known = FIELD_LABELS[field];
  if (known) return known;
  // camelCase / snake_case → "Sentence case".
  const spaced = field
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .toLowerCase()
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const VALUE_PREVIEW_BUDGET = 72;

const VALUE_LABEL_KEYS: Record<string, Record<string, string>> = {
  status: {
    backlog: "sharedFeedTail.statusBacklog",
    todo: "sharedFeedTail.statusTodo",
    in_progress: "sharedFeedTail.statusInProgress",
    in_review: "sharedFeedTail.statusInReview",
    blocked: "sharedFeedTail.statusBlocked",
    done: "sharedFeedTail.statusDone",
    cancelled: "sharedFeedTail.statusCancelled",
    idle: "sharedFeedTail.statusIdle",
  },
  priority: {
    critical: "sharedFeedTail.priorityCritical",
    high: "sharedFeedTail.priorityHigh",
    medium: "sharedFeedTail.priorityMedium",
    low: "sharedFeedTail.priorityLow",
  },
  workMode: {
    standard: "taskDisplayTail.modeStandard",
    ask: "taskDisplayTail.modeAsk",
    planning: "taskDisplayTail.modePlanning",
    skill_test: "taskDisplayTail.modeSkillTest",
  },
};

/**
 * Render one side of a change for display. Never returns an empty string, so a
 * receipt row always reads as "from → to" rather than trailing into nothing.
 */
export function formatIssueChangeValue(
  value: unknown,
  options: { resolveAgentLabel?: (id: string) => string | null | undefined;
    resolveUserLabel?: (id: string) => string | null | undefined;
    field?: string } = {},
): string {
  // `reviewPolicy` is nullable-by-default: a cleared column means "anyone can
  // approve", not "no value" (PAP-16506), so it resolves before the null branch.
  if (options.field === "reviewPolicy") return formatReviewPolicyValue(value);
  if (value === null || value === undefined || value === "") return t("taskDisplayTail.none");
  if (typeof value === "boolean") return value ? t("taskDisplayTail.yes") : t("taskDisplayTail.no");
  if (typeof value === "number") return String(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return t("taskDisplayTail.none");
    const strings = value.filter((entry): entry is string => typeof entry === "string");
    if (strings.length !== value.length) return t("taskDisplayTail.itemsCount", { count: value.length });
    return strings.length <= 3
      ? strings.map((id) => shortenId(id)).join(", ")
      : t("taskDisplayTail.itemsCount", { count: strings.length });
  }

  if (value instanceof Date) return value.toLocaleString(i18n.language);

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return t("taskDisplayTail.none");
    // Ids resolve to names when the directory is loaded; otherwise they shorten.
    const resolved = options.field?.toLowerCase().includes("agent")
      ? options.resolveAgentLabel?.(trimmed)
      : options.field?.toLowerCase().includes("user")
        ? options.resolveUserLabel?.(trimmed)
        : null;
    if (resolved) return resolved;
    const labelKeys = options.field ? VALUE_LABEL_KEYS[options.field] : undefined;
    if (labelKeys && Object.hasOwn(labelKeys, trimmed)) return t(labelKeys[trimmed]);
    if (isIsoTimestamp(trimmed)) return new Date(trimmed).toLocaleString(i18n.language);
    if (looksLikeId(trimmed)) return shortenId(trimmed);
    const humanized = trimmed.includes(" ") ? trimmed : trimmed.replace(/_/g, " ");
    return truncate(humanized);
  }

  // Objects (execution policy, workspace settings) are structural — the receipt
  // records that they moved, and the audit log holds the full value.
  return t("taskDisplayTail.updated");
}

function truncate(value: string): string {
  const chars = Array.from(value);
  if (chars.length <= VALUE_PREVIEW_BUDGET) return value;
  return `${chars.slice(0, VALUE_PREVIEW_BUDGET).join("")}…`;
}

function isIsoTimestamp(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value) && !Number.isNaN(Date.parse(value));
}

function looksLikeId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function shortenId(value: string): string {
  return looksLikeId(value) ? value.slice(0, 8) : truncate(value);
}

export interface IssueChangeReceiptRow {
  field: string;
  label: string;
  from: string;
  to: string;
  /** Server flagged the values as truncated previews of long text. */
  truncated: boolean;
}

function isChangeEntry(value: unknown): value is IssueChangeReceiptEntry {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && "from" in (value as object) && "to" in (value as object);
}

/**
 * Parse `details.changes` off an activity event into display rows. Returns an
 * empty array for events with no receipt (older rows, non-PATCH actions), so
 * callers can render nothing without special-casing.
 */
export function readIssueChangeReceipt(
  details: Record<string, unknown> | null | undefined,
  options: Parameters<typeof formatIssueChangeValue>[1] = {},
): IssueChangeReceiptRow[] {
  const changes = details?.changes;
  if (!changes || typeof changes !== "object" || Array.isArray(changes)) return [];

  const rows: IssueChangeReceiptRow[] = [];
  for (const [field, entry] of Object.entries(changes as Record<string, unknown>)) {
    if (!isChangeEntry(entry)) continue;
    rows.push({
      field,
      label: issueChangeFieldLabel(field),
      from: formatIssueChangeValue(entry.from, { ...options, field }),
      to: formatIssueChangeValue(entry.to, { ...options, field }),
      truncated: entry.updated === true,
    });
  }
  // Stable, scannable order regardless of JSON key order (jsonb reorders keys).
  return rows.sort((a, b) => a.label.localeCompare(b.label));
}

/** Authorization reasons, as recorded by the server's write-policy decision. */
const AUTHORIZATION_REASON_LABELS: Record<string, string> = {
  get allow_visible_issue_write() { return t("taskDisplayTail.visibleWrite"); },
  get allow_scoped_agent_write() { return t("taskDisplayTail.scopedAgentWrite"); },
  get allow_board_actor() { return t("taskDisplayTail.boardActor"); },
  get allow_self() { return t("taskDisplayTail.ownTask"); },
  get allow_issue_mention_grant() { return t("taskDisplayTail.mentionGrant"); },
  get allow_direct_parent_report() { return t("taskDisplayTail.parentReport"); },
  get allow_low_trust_boundary() { return t("taskDisplayTail.lowTrustAllowance"); },
  get allow_explicit_grant() { return t("taskDisplayTail.explicitGrant"); },
  get allow_instance_admin() { return t("taskDisplayTail.instanceAdmin"); },
  get allow_local_board() { return t("taskDisplayTail.localBoard"); },
  get internal_agent_write() { return t("taskDisplayTail.internalAgentWrite"); },
};

/**
 * Human phrasing for the authorization reason on a write receipt. Unknown
 * reasons degrade to their humanized code rather than disappearing — an
 * unexplained write is worse than an ugly one.
 */
export function issueAuthorizationReasonLabel(reason: string | null | undefined): string | null {
  const trimmed = reason?.trim();
  if (!trimmed) return null;
  return AUTHORIZATION_REASON_LABELS[trimmed] ?? trimmed.replace(/_/g, " ");
}
