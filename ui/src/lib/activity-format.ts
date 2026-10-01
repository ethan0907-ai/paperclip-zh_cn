import { t } from "@/i18n";
import type { Agent } from "@paperclipai/shared";
import type { CompanyUserProfile } from "./company-members";
import { formatReviewPolicyValue } from "./review-policy";

type ActivityDetails = Record<string, unknown> | null | undefined;

type ActivityParticipant = {
  type: "agent" | "user";
  agentId?: string | null;
  userId?: string | null;
};

type ActivityIssueReference = {
  id?: string | null;
  identifier?: string | null;
  title?: string | null;
};

interface ActivityFormatOptions {
  agentMap?: Map<string, Agent>;
  userProfileMap?: Map<string, CompanyUserProfile>;
  currentUserId?: string | null;
}

const ACTIVITY_ROW_VERBS: Record<string, string> = {
  get "issue.created"() { return t("activityFormat.created"); },
  get "issue.updated"() { return t("activityFormat.updated"); },
  get "issue.read_marked"() { return t("activityFormat.read"); },
  get "issue.read_unmarked"() { return t("activityFormat.markedUnread"); },
  get "issue.checked_out"() { return t("activityFormat.checkedOut"); },
  get "issue.released"() { return t("activityFormat.released"); },
  get "issue.comment_added"() { return t("activityFormat.commentedOn"); },
  get "issue.comment_cancelled"() { return t("activityFormat.cancelledAQueuedCommentOn"); },
  get "issue.queued_comment_edited"() { return t("activityFormat.editedAQueuedCommentOn"); },
  get "issue.queued_comments_reordered"() { return t("activityFormat.reorderedQueuedCommentsOn"); },
  get "issue.queued_comment_discarded"() { return t("activityFormat.discardedAQueuedCommentOn"); },
  get "issue.comment_deleted"() { return t("activityFormat.deletedACommentOn"); },
  get "issue.attachment_added"() { return t("activityFormat.attachedFileTo"); },
  get "issue.attachment_removed"() { return t("activityFormat.removedAttachmentFrom"); },
  get "issue.document_created"() { return t("activityFormat.createdDocumentFor"); },
  get "issue.document_updated"() { return t("activityFormat.updatedDocumentOn"); },
  get "issue.document_locked"() { return t("activityFormat.lockedDocumentOn"); },
  get "issue.document_unlocked"() { return t("activityFormat.unlockedDocumentOn"); },
  get "issue.document_deleted"() { return t("activityFormat.deletedDocumentFrom"); },
  get "issue.monitor_scheduled"() { return t("activityFormat.scheduledMonitorOn"); },
  get "issue.monitor_triggered"() { return t("activityFormat.triggeredMonitorFor"); },
  get "issue.monitor_cleared"() { return t("activityFormat.clearedMonitorOn"); },
  get "issue.monitor_skipped"() { return t("activityFormat.skippedMonitorFor"); },
  get "issue.monitor_exhausted"() { return t("activityFormat.exhaustedMonitorOn"); },
  get "issue.monitor_recovery_wake_queued"() { return t("activityFormat.queuedMonitorRecoveryFor"); },
  get "issue.monitor_recovery_issue_created"() { return t("activityFormat.createdMonitorRecoveryFor"); },
  get "issue.monitor_escalated_to_board"() { return t("activityFormat.escalatedMonitorFor"); },
  get "issue.commented"() { return t("activityFormat.commentedOn"); },
  get "issue.deleted"() { return t("activityFormat.deleted"); },
  get "issue.successful_run_handoff_required"() { return t("activityFormat.flaggedMissingNextStepOn"); },
  get "issue.successful_run_handoff_resolved"() { return t("activityFormat.recordedNextStepChosenOn"); },
  get "issue.successful_run_handoff_escalated"() { return t("activityFormat.escalatedMissingNextStepOn"); },
  get "issue.accepted_plan_decomposition_updated"() { return t("activityFormat.updatedAcceptedplanDecompositionOn"); },
  get "issue.recovery_action_opened"() { return t("activityFormat.openedARecoveryActionOn"); },
  get "issue.recovery_action_resolved"() { return t("activityFormat.resolvedTheRecoveryActionOn"); },
  get "issue.recovery_action_escalated"() { return t("activityFormat.escalatedTheRecoveryActionOn"); },
  get "agent.created"() { return t("activityFormat.created"); },
  get "agent.updated"() { return t("activityFormat.updated"); },
  get "agent.paused"() { return t("activityFormat.paused"); },
  get "agent.resumed"() { return t("activityFormat.resumed"); },
  get "agent.error_cleared"() { return t("activityFormat.clearedErrorOn"); },
  get "agent.terminated"() { return t("activityFormat.terminated"); },
  get "agent.key_created"() { return t("activityFormat.createdApiKeyFor"); },
  get "agent.budget_updated"() { return t("activityFormat.updatedBudgetFor"); },
  get "agent.runtime_session_reset"() { return t("activityFormat.resetSessionFor"); },
  get "heartbeat.invoked"() { return t("activityFormat.invokedHeartbeatFor"); },
  get "heartbeat.cancelled"() { return t("activityFormat.cancelledHeartbeatFor"); },
  get "heartbeat.output_stale_source_resolved"() { return t("activityFormat.systemfoldedStaleRunOn"); },
  get "heartbeat.output_stale_recovery_recursion_refused"() { return t("activityFormat.refusedRecoveryonrecoveryFor"); },
  get "approval.created"() { return t("activityFormat.requestedApproval"); },
  get "approval.approved"() { return t("activityFormat.approved"); },
  get "approval.rejected"() { return t("activityFormat.rejected"); },
  // Interaction outcomes (PAP-16506). An agent may now resolve one — including a
  // review of its own work — so these must read as outcomes in the feed instead
  // of falling through to the raw "issue thread interaction accepted" action id.
  // `details.interactionKind` sharpens the wording; see INTERACTION_OUTCOME_LABELS.
  get "issue.thread_interaction_created"() { return t("activityFormat.askedForADecisionOn"); },
  get "issue.thread_interaction_accepted"() { return t("activityFormat.acceptedTheRequestOn"); },
  get "issue.thread_interaction_rejected"() { return t("activityFormat.rejectedTheRequestOn"); },
  get "issue.thread_interaction_answered"() { return t("activityFormat.answeredTheRequestOn"); },
  get "issue.thread_interaction_withdrawn"() { return t("activityFormat.withdrewTheRequestOn"); },
  get "issue.thread_interaction_cancelled"() { return t("activityFormat.cancelledTheRequestOn"); },
  get "issue.thread_interaction_skipped"() { return t("activityFormat.skippedTheRequestOn"); },
  get "issue.thread_interaction_expired"() { return t("activityFormat.expiredTheRequestOn"); },
  get "issue.thread_interaction_item_verdicts_submitted"() { return t("activityFormat.submittedVerdictsOn"); },
  get "issue.stalled_review_decided"() { return t("activityFormat.recordedAReviewVerdictOn"); },
  get "project.created"() { return t("activityFormat.created"); },
  get "project.updated"() { return t("activityFormat.updated"); },
  get "project.deleted"() { return t("activityFormat.deleted"); },
  get "goal.created"() { return t("activityFormat.created"); },
  get "goal.updated"() { return t("activityFormat.updated"); },
  get "goal.deleted"() { return t("activityFormat.deleted"); },
  get "cost.reported"() { return t("activityFormat.reportedCostFor"); },
  get "cost.recorded"() { return t("activityFormat.recordedCostFor"); },
  get "company.created"() { return t("activityFormat.createdOrganization"); },
  get "company.updated"() { return t("activityFormat.updatedOrganization"); },
  get "company.archived"() { return t("activityFormat.archived"); },
  get "company.reactivated"() { return t("activityFormat.reactivated"); },
  get "company.budget_updated"() { return t("activityFormat.updatedBudgetFor"); },
  get "audit.exported"() { return t("activityFormat.exportedTheAgentAuditLogFor"); },
  get "tool_app.connected"() { return t("activityFormat.connected"); },
  get "tool_app.oauth_connected"() { return t("activityFormat.connectedCredentialsFor"); },
  get "tool_app.oauth_failed"() { return t("activityFormat.failedToConnectCredentialsFor"); },
  get "tool_app.oauth_access_finalized"() { return t("activityFormat.finishedCredentialAccessFor"); },
  get "tool_app.finished"() { return t("activityFormat.finishedSetupFor"); },
  get "tool_app.reconnected"() { return t("activityFormat.reconnected"); },
  get "tool_connection.created"() { return t("activityFormat.created"); },
  get "tool_connection.updated"() { return t("activityFormat.updated"); },
  get "tool_connection.archived"() { return t("activityFormat.removed"); },
  get "tool_connection.catalog_refresh"() { return t("activityFormat.refreshedActionsFor"); },
  get "tool_connection.installs_synced"() { return t("activityFormat.changedAgentInstallsFor"); },
  get "tool_connection.install_access_extended"() { return t("activityFormat.extendedAgentAccessFor"); },
  get "tool_connection.grant_audience_replaced"() { return t("activityFormat.changedHumanAccessFor"); },
  get "tool_connection.grant_added"() { return t("activityFormat.addedCredentialsTo"); },
  get "tool_connection.grant_revoked"() { return t("activityFormat.revokedCredentialsFrom"); },
  get "tool_connection.grant_delegated"() { return t("activityFormat.delegatedCredentialsFor"); },
  get "tool_connection.grant_delegation_revoked"() { return t("activityFormat.revokedCredentialDelegationFor"); },
};

const ISSUE_ACTIVITY_LABELS: Record<string, string> = {
  get "issue.created"() { return t("activityFormat.createdTheIssue"); },
  get "issue.updated"() { return t("activityFormat.updatedTheIssue"); },
  get "issue.checked_out"() { return t("activityFormat.checkedOutTheIssue"); },
  get "issue.released"() { return t("activityFormat.releasedTheIssue"); },
  get "issue.comment_added"() { return t("activityFormat.addedAComment"); },
  get "issue.comment_cancelled"() { return t("activityFormat.cancelledAQueuedComment"); },
  get "issue.queued_comment_edited"() { return t("activityFormat.editedAQueuedComment"); },
  get "issue.queued_comments_reordered"() { return t("activityFormat.reorderedQueuedComments"); },
  get "issue.queued_comment_discarded"() { return t("activityFormat.discardedAQueuedComment"); },
  get "issue.comment_deleted"() { return t("activityFormat.deletedAComment"); },
  get "issue.feedback_vote_saved"() { return t("activityFormat.savedFeedbackOnAnAiOutput"); },
  get "issue.attachment_added"() { return t("activityFormat.addedAnAttachment"); },
  get "issue.attachment_removed"() { return t("activityFormat.removedAnAttachment"); },
  get "issue.document_created"() { return t("activityFormat.createdADocument"); },
  get "issue.document_updated"() { return t("activityFormat.updatedADocument"); },
  get "issue.document_locked"() { return t("activityFormat.lockedADocument"); },
  get "issue.document_unlocked"() { return t("activityFormat.unlockedADocument"); },
  get "issue.document_deleted"() { return t("activityFormat.deletedADocument"); },
  get "issue.monitor_scheduled"() { return t("activityFormat.scheduledAMonitor"); },
  get "issue.monitor_triggered"() { return t("activityFormat.triggeredAMonitor"); },
  get "issue.monitor_cleared"() { return t("activityFormat.clearedAMonitor"); },
  get "issue.monitor_skipped"() { return t("activityFormat.skippedAMonitor"); },
  get "issue.monitor_exhausted"() { return t("activityFormat.exhaustedAMonitor"); },
  get "issue.monitor_recovery_wake_queued"() { return t("activityFormat.queuedAMonitorRecoveryWake"); },
  get "issue.monitor_recovery_issue_created"() { return t("activityFormat.createdAMonitorRecoveryIssue"); },
  get "issue.monitor_escalated_to_board"() { return t("activityFormat.escalatedAMonitorToTheBoard"); },
  get "issue.deleted"() { return t("activityFormat.deletedTheIssue"); },
  get "issue.successful_run_handoff_required"() { return t("activityFormat.runFinishedWithoutAClearNextStep"); },
  get "issue.successful_run_handoff_resolved"() { return t("activityFormat.nextStepChosen"); },
  get "issue.successful_run_handoff_escalated"() { return t("activityFormat.runFinishedWithoutANextStepRecoveryEscalated"); },
  get "issue.cross_issue_influence_cap_rejected"() { return t("activityFormat.hitThePerrunCrosstaskWriteCap"); },
  get "issue.cross_issue_influence_observed"() { return t("activityFormat.madeACrosstaskWrite"); },
  get "issue.attribution_spoof_rejected"() { return t("activityFormat.triedToChooseItsOwnResponsibleUser"); },
  get "issue.recovery_action_opened"() { return t("activityFormat.openedASourcescopedRecoveryAction"); },
  get "issue.recovery_action_resolved"() { return t("activityFormat.resolvedTheRecoveryAction"); },
  get "issue.recovery_action_escalated"() { return t("activityFormat.escalatedTheRecoveryAction"); },
  get "issue.accepted_plan_decomposition_updated"() { return t("activityFormat.updatedTheAcceptedplanDecomposition"); },
  get "agent.created"() { return t("activityFormat.createdAnAgent"); },
  get "agent.updated"() { return t("activityFormat.updatedTheAgent"); },
  get "agent.paused"() { return t("activityFormat.pausedTheAgent"); },
  get "agent.resumed"() { return t("activityFormat.resumedTheAgent"); },
  get "agent.error_cleared"() { return t("activityFormat.clearedTheAgentError"); },
  get "agent.terminated"() { return t("activityFormat.terminatedTheAgent"); },
  get "heartbeat.invoked"() { return t("activityFormat.invokedAHeartbeat"); },
  get "heartbeat.cancelled"() { return t("activityFormat.cancelledAHeartbeat"); },
  get "heartbeat.output_stale_source_resolved"() { return t("activityFormat.systemFoldedAStaleRun"); },
  get "heartbeat.output_stale_recovery_recursion_refused"() { return t("activityFormat.refusedRecoveryonrecoveryEscalation"); },
  get "approval.created"() { return t("activityFormat.requestedApproval"); },
  get "approval.approved"() { return t("activityFormat.approved"); },
  get "approval.rejected"() { return t("activityFormat.rejected"); },
  get "issue.thread_interaction_created"() { return t("activityFormat.askedForADecision"); },
  get "issue.thread_interaction_accepted"() { return t("activityFormat.acceptedTheRequest"); },
  get "issue.thread_interaction_rejected"() { return t("activityFormat.rejectedTheRequest"); },
  get "issue.thread_interaction_answered"() { return t("activityFormat.answeredTheRequest"); },
  get "issue.thread_interaction_withdrawn"() { return t("activityFormat.withdrewTheRequest"); },
  get "issue.thread_interaction_cancelled"() { return t("activityFormat.cancelledTheRequest"); },
  get "issue.thread_interaction_skipped"() { return t("activityFormat.skippedTheRequest"); },
  get "issue.thread_interaction_expired"() { return t("activityFormat.expiredTheRequest"); },
  get "issue.thread_interaction_item_verdicts_submitted"() { return t("activityFormat.submittedVerdictsOnTheRequest"); },
  get "issue.stalled_review_decided"() { return t("activityFormat.recordedAReviewVerdict"); },
};

/**
 * `issue.stalled_review_decided` carries the verb the actor chose, so the line
 * names the verdict ("approved the review") rather than the generic action.
 * Mirrors `StalledReviewDecisionAction` in shared.
 */
const STALLED_REVIEW_DECISION_LABELS: Record<string, string> = {
  get approve() { return t("activityFormat.approvedTheReview"); },
  get request_changes() { return t("activityFormat.requestedChangesOnTheReview"); },
  get send_back() { return t("activityFormat.sentTheReviewBackToWork"); },
};

/**
 * `issue.thread_interaction_accepted` / `_rejected` fire for *every* interaction
 * kind, not only for a review. A task suggestion or a question is accepted, not
 * approved, so the kind on the event picks the verb. Kinds absent from a map
 * keep the neutral "accepted the request" wording from the tables above, which
 * is also the fallback for an event that carries no kind.
 */
const INTERACTION_ACCEPTED_LABELS: Record<string, string> = {
  get request_confirmation() { return t("activityFormat.approvedTheRequest"); },
  get request_checkbox_confirmation() { return t("activityFormat.approvedTheRequest"); },
  get suggest_tasks() { return t("activityFormat.acceptedTheTaskSuggestions"); },
  get ask_user_questions() { return t("activityFormat.acceptedTheAnswers"); },
};

const INTERACTION_REJECTED_LABELS: Record<string, string> = {
  get request_confirmation() { return t("activityFormat.rejectedTheRequest"); },
  get request_checkbox_confirmation() { return t("activityFormat.rejectedTheRequest"); },
  get suggest_tasks() { return t("activityFormat.declinedTheTaskSuggestions"); },
  get ask_user_questions() { return t("activityFormat.declinedTheQuestions"); },
};

/**
 * Kind-aware wording for an interaction outcome, or `null` when the tables
 * above already say it well enough.
 */
function formatInteractionOutcomeLabel(action: string, details: ActivityDetails): string | null {
  const table = action === "issue.thread_interaction_accepted"
    ? INTERACTION_ACCEPTED_LABELS
    : action === "issue.thread_interaction_rejected"
      ? INTERACTION_REJECTED_LABELS
      : null;
  if (!table) return null;
  const kind = typeof details?.interactionKind === "string" ? details.interactionKind : null;
  return kind ? table[kind] ?? null : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

const VALUE_LABEL_KEYS: Record<string, string> = {"backlog":"activityFormat.stateBacklog","todo":"activityFormat.stateTodo","in_progress":"activityFormat.stateInProgress","in_review":"activityFormat.stateInReview","idle":"activityFormat.stateIdle","done":"activityFormat.stateDone","cancelled":"activityFormat.stateCancelled","blocked":"activityFormat.stateBlocked","critical":"activityFormat.priorityCritical","high":"activityFormat.priorityHigh","medium":"activityFormat.priorityMedium","low":"activityFormat.priorityLow"};

function humanizeValue(value: unknown): string {
  if (typeof value !== "string") return String(value ?? t("activityFormat.none"));
  return VALUE_LABEL_KEYS[value] ? t(VALUE_LABEL_KEYS[value]) : value.replace(/_/g, " ");
}

function isActivityParticipant(value: unknown): value is ActivityParticipant {
  const record = asRecord(value);
  if (!record) return false;
  return record.type === "agent" || record.type === "user";
}

function isActivityIssueReference(value: unknown): value is ActivityIssueReference {
  return asRecord(value) !== null;
}

function readParticipants(details: ActivityDetails, key: string): ActivityParticipant[] {
  const value = details?.[key];
  if (!Array.isArray(value)) return [];
  return value.filter(isActivityParticipant);
}

function readIssueReferences(details: ActivityDetails, key: string): ActivityIssueReference[] {
  const value = details?.[key];
  if (!Array.isArray(value)) return [];
  return value.filter(isActivityIssueReference);
}

function formatUserLabel(userId: string | null | undefined, options: ActivityFormatOptions = {}): string {
  if (!userId || userId === "local-board") return t("activityFormat.board");
  if (options.currentUserId && userId === options.currentUserId) return t("activityFormat.you");
  const profile = options.userProfileMap?.get(userId);
  if (profile) return profile.label;
  return t("activityFormat.userLabel", { id: userId.slice(0, 5) });
}

function formatParticipantLabel(participant: ActivityParticipant, options: ActivityFormatOptions): string {
  if (participant.type === "agent") {
    const agentId = participant.agentId ?? "";
    return options.agentMap?.get(agentId)?.name ?? t("activityFormat.agent");
  }
  return formatUserLabel(participant.userId, options);
}

function formatIssueReferenceLabel(reference: ActivityIssueReference): string {
  if (reference.identifier) return reference.identifier;
  if (reference.title) return reference.title;
  if (reference.id) return reference.id.slice(0, 8);
  return t("activityFormat.task");
}

function formatChangedEntityLabel(
  singular: string,
  plural: string,
  labels: string[],
): string {
  if (labels.length <= 0) return plural;
  if (labels.length === 1) return t("activityFormat.singleEntity", { kind: singular, name: labels[0] });
  return t("activityFormat.entityCount", { count: labels.length, kind: plural });
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

function readStringArrayLength(value: unknown): number {
  if (!Array.isArray(value)) return 0;
  return value.filter((entry) => typeof entry === "string" && entry.length > 0).length;
}

function formatAcceptedPlanDecompositionDetail(details: ActivityDetails): string | null {
  if (!details) return null;
  const status = typeof details.status === "string" ? details.status : null;
  const requested = readNumber(details.requestedChildCount);
  const totalChildren = readStringArrayLength(details.childIssueIds);
  const newlyCreated = readStringArrayLength(details.newlyCreatedChildIssueIds);
  const reused = Math.max(0, totalChildren - newlyCreated);
  const parts: string[] = [];
  if (newlyCreated > 0) parts.push(t("activityFormat.createdNew", { count: newlyCreated }));
  if (reused > 0) parts.push(t("activityFormat.reusedExisting", { count: reused }));
  if (parts.length === 0 && requested !== null) parts.push(t("activityFormat.requestedCount", { count: requested }));
  const summary = parts.length > 0 ? parts.join(", ") : null;
  if (status === "completed" && summary) return t("activityFormat.decompositionCompletedSummary", { summary });
  if (status === "completed") return t("activityFormat.decompositionCompleted");
  if (status === "in_flight" && summary) return t("activityFormat.decompositionInFlight", { summary });
  return summary;
}

function formatIssueUpdatedVerb(details: ActivityDetails): string | null {
  if (!details) return null;
  const previous = asRecord(details._previous) ?? {};
  if (details.status !== undefined) {
    const from = previous.status;
    const to = humanizeValue(details.status === "in_review" && details.externalConversationState === "waiting" ? "idle" : details.status);
    return from
      ? t("activityFormat.statusFromVerb", { from: humanizeValue(from), to })
      : t("activityFormat.statusToVerb", { to });
  }
  if (details.priority !== undefined) {
    const from = previous.priority;
    return from
      ? t("activityFormat.priorityFromVerb", { from: humanizeValue(from), to: humanizeValue(details.priority) })
      : t("activityFormat.priorityToVerb", { to: humanizeValue(details.priority) });
  }
  return null;
}

function formatAssigneeName(details: ActivityDetails, options: ActivityFormatOptions): string | null {
  if (!details) return null;
  const agentId = details.assigneeAgentId;
  const userId = details.assigneeUserId;
  if (typeof agentId === "string" && agentId) {
    return options.agentMap?.get(agentId)?.name ?? t("activityFormat.agent");
  }
  if (typeof userId === "string" && userId) {
    return formatUserLabel(userId, options);
  }
  return null;
}

function formatIssueUpdatedAction(details: ActivityDetails, options: ActivityFormatOptions = {}): string | null {
  if (!details) return null;
  const previous = asRecord(details._previous) ?? {};
  const parts: string[] = [];

  if (details.status !== undefined) {
    const from = previous.status;
    const to = humanizeValue(details.status === "in_review" && details.externalConversationState === "waiting" ? "idle" : details.status);
    parts.push(
      from
        ? t("activityFormat.statusFrom", { from: humanizeValue(from), to })
        : t("activityFormat.statusTo", { to }),
    );
  }
  if (details.priority !== undefined) {
    const from = previous.priority;
    parts.push(
      from
        ? t("activityFormat.priorityFrom", { from: humanizeValue(from), to: humanizeValue(details.priority) })
        : t("activityFormat.priorityTo", { to: humanizeValue(details.priority) }),
    );
  }
  if (details.assigneeAgentId !== undefined || details.assigneeUserId !== undefined) {
    const assigneeName = formatAssigneeName(details, options);
    parts.push(assigneeName ? t("activityFormat.responsible", { name: assigneeName }) : t("activityFormat.clearedTheResponsible"));
  }
  if (details.reviewPolicy !== undefined) {
    // `null` is the default ("anyone can approve"), so it must not read as
    // "changed the review policy to none" (PAP-16506).
    parts.push(t("activityFormat.reviewPolicy", { policy: formatReviewPolicyValue(details.reviewPolicy) }));
  }
  if (details.title !== undefined) parts.push(t("activityFormat.updatedTheTitle"));
  if (details.description !== undefined) parts.push(t("activityFormat.updatedTheDescription"));

  return parts.length > 0 ? parts.join(", ") : null;
}

function formatStructuredIssueChange(input: {
  action: string;
  details: ActivityDetails;
  options: ActivityFormatOptions;
  forIssueDetail: boolean;
}): string | null {
  const details = input.details;
  if (!details) return null;

  if (input.action === "issue.blockers_updated") {
    const added = readIssueReferences(details, "addedBlockedByIssues").map(formatIssueReferenceLabel);
    const removed = readIssueReferences(details, "removedBlockedByIssues").map(formatIssueReferenceLabel);
    if (added.length > 0 && removed.length === 0) {
      const changed = formatChangedEntityLabel(t("activityFormat.blocker"), t("activityFormat.blockers"), added);
      return input.forIssueDetail ? t("activityFormat.addedEntity", { entity: changed }) : t("activityFormat.addedEntityTo", { entity: changed });
    }
    if (removed.length > 0 && added.length === 0) {
      const changed = formatChangedEntityLabel(t("activityFormat.blocker"), t("activityFormat.blockers"), removed);
      return input.forIssueDetail ? t("activityFormat.removedEntity", { entity: changed }) : t("activityFormat.removedEntityFrom", { entity: changed });
    }
    return input.forIssueDetail ? t("activityFormat.updatedBlockers") : t("activityFormat.updatedBlockersOn");
  }

  if (input.action === "issue.reviewers_updated" || input.action === "issue.approvers_updated") {
    const added = readParticipants(details, "addedParticipants").map((participant) => formatParticipantLabel(participant, input.options));
    const removed = readParticipants(details, "removedParticipants").map((participant) => formatParticipantLabel(participant, input.options));
    const singular = input.action === "issue.reviewers_updated" ? t("activityFormat.reviewer") : t("activityFormat.approver");
    const plural = input.action === "issue.reviewers_updated" ? t("activityFormat.reviewers") : t("activityFormat.approvers");
    if (added.length > 0 && removed.length === 0) {
      const changed = formatChangedEntityLabel(singular, plural, added);
      return input.forIssueDetail ? t("activityFormat.addedEntity", { entity: changed }) : t("activityFormat.addedEntityTo", { entity: changed });
    }
    if (removed.length > 0 && added.length === 0) {
      const changed = formatChangedEntityLabel(singular, plural, removed);
      return input.forIssueDetail ? t("activityFormat.removedEntity", { entity: changed }) : t("activityFormat.removedEntityFrom", { entity: changed });
    }
    return input.forIssueDetail ? t("activityFormat.updatedEntity", { kind: plural }) : t("activityFormat.updatedEntityOn", { kind: plural });
  }

  return null;
}

export function formatActivityVerb(
  action: string,
  details?: Record<string, unknown> | null,
  options: ActivityFormatOptions = {},
): string {
  if (action.startsWith("tool_gateway.")) {
    const rawTool = typeof details?.tool === "string"
      ? details.tool
      : typeof details?.upstreamToolName === "string"
        ? details.upstreamToolName
        : t("activityFormat.anAppAction");
    const tool = rawTool.replace(/[._-]+/g, " ");
    const isTest = details?.source === "test";
    if (action === "tool_gateway.call_completed") return t(isTest ? "activityFormat.testedTool" : "activityFormat.usedTool", { tool });
    if (action === "tool_gateway.call_allowed") return t(isTest ? "activityFormat.startedToolTest" : "activityFormat.allowedTool", { tool });
    if (action === "tool_gateway.call_denied") return t("activityFormat.blockedTool", { tool });
    if (action === "tool_gateway.approval_requested") return t("activityFormat.askedTool", { tool });
    if (action === "tool_gateway.session_created") return t("activityFormat.openedAnAppSessionFor");
    if (action === "tool_gateway.session_rejected") return t("activityFormat.wasBlockedFromOpeningAnAppSessionFor");
    if (action === "tool_gateway.discovery") return t("activityFormat.discoveredAppActionsFor");
  }

  if (action === "issue.updated") {
    const issueUpdatedVerb = formatIssueUpdatedVerb(details);
    if (issueUpdatedVerb) return issueUpdatedVerb;
  }

  if (action === "issue.stalled_review_decided") {
    const decision = typeof details?.action === "string" ? details.action : null;
    const label = decision ? STALLED_REVIEW_DECISION_LABELS[decision] : null;
    if (label) return t("activityFormat.labelOn", { label });
  }

  const outcomeLabel = formatInteractionOutcomeLabel(action, details);
  if (outcomeLabel) return t("activityFormat.labelOn", { label: outcomeLabel });

  const structuredChange = formatStructuredIssueChange({
    action,
    details,
    options,
    forIssueDetail: false,
  });
  if (structuredChange) return structuredChange;

  return ACTIVITY_ROW_VERBS[action] ?? action.replace(/[._]/g, " ");
}

export function formatIssueActivityAction(
  action: string,
  details?: Record<string, unknown> | null,
  options: ActivityFormatOptions = {},
): string {
  if (action === "issue.updated") {
    const issueUpdatedAction = formatIssueUpdatedAction(details, options);
    if (issueUpdatedAction) return issueUpdatedAction;
  }

  const structuredChange = formatStructuredIssueChange({
    action,
    details,
    options,
    forIssueDetail: true,
  });
  if (structuredChange) return structuredChange;

  if (action === "issue.accepted_plan_decomposition_updated") {
    const detail = formatAcceptedPlanDecompositionDetail(details);
    if (detail) return detail;
  }

  if (action === "issue.stalled_review_decided") {
    const decision = typeof details?.action === "string" ? details.action : null;
    const label = decision ? STALLED_REVIEW_DECISION_LABELS[decision] : null;
    if (label) return label;
  }

  const outcomeLabel = formatInteractionOutcomeLabel(action, details);
  if (outcomeLabel) return outcomeLabel;

  if (action.startsWith("issue.monitor_") && details) {
    const serviceName = typeof details.serviceName === "string" && details.serviceName.trim()
      ? details.serviceName.trim()
      : null;
    const base = ISSUE_ACTIVITY_LABELS[action] ?? action.replace(/[._]/g, " ");
    return serviceName ? t("activityFormat.serviceLabel", { label: base, service: serviceName }) : base;
  }

  if (
    (
      action === "issue.document_created" ||
      action === "issue.document_updated" ||
      action === "issue.document_locked" ||
      action === "issue.document_unlocked" ||
      action === "issue.document_deleted"
    ) &&
    details
  ) {
    const key = typeof details.key === "string" ? details.key : t("activityFormat.document");
    const title = typeof details.title === "string" && details.title ? ` (${details.title})` : "";
    return `${ISSUE_ACTIVITY_LABELS[action] ?? action} ${key}${title}`;
  }

  return ISSUE_ACTIVITY_LABELS[action] ?? action.replace(/[._]/g, " ");
}
