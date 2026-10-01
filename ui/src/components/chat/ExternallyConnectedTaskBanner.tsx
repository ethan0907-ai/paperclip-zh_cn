import { createUuid } from "@/lib/uuid";
import { t, useTranslation } from "@/i18n";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Paperclip, Radio } from "lucide-react";
import type {
  ChatPublicationState,
  ChatFileTransferPhase,
  IssueAttachment,
} from "@paperclipai/shared";
import {
  chatEndpointsApi,
  type ChatProvider,
  type ChatPublicationSummary,
  type ExternalChannelBindingSummary,
} from "@/api/chatEndpoints";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/context/ToastContext";
import { Link } from "@/lib/router";
import { queryKeys } from "@/lib/queryKeys";
import { useChatConnectorsEnabled } from "@/hooks/useChatConnectorsEnabled";
import { issuesApi } from "@/api/issues";
import {
  boardSendDraftKey,
  clearBoardSendDraft,
  canDismissBoardSendBatch,
  readBoardSendDraft,
  readBoardSendRejection,
  writeBoardSendDraft,
  type BoardSendRejection,
  type RetainedBoardSend,
} from "./board-send-draft";

const providerNames: Record<ChatProvider, string> = {
  slack: "Slack",
  github: "GitHub",
  discord: "Discord",
  "microsoft-teams": "Microsoft Teams",
  telegram: "Telegram",
  agentmail: "AgentMail",
  "imessage-photon": "iMessage Photon",
};

type PublicationFeedback = {
  title: string;
  body: string;
  tone: "info" | "success" | "warn" | "error";
};

const publicationFeedback: Record<ChatPublicationState, PublicationFeedback> = {
  awaiting_consent: {
    get title() { return t("externalChat.waiting_for_file_consent"); },
    get body() { return t("externalChat.the_recipient_must_accept_the_file_card_in_microsoft_teams_the_file_is_not_delivered_yet_this_send_identity_is_kept_while_paperclip_waits"); },
    tone: "info",
  },
  published: {
    get title() { return t("externalChat.sent_to_channel"); },
    get body() { return t("externalChat.the_board_update_was_published_to_the_connected_conversation"); },
    tone: "success",
  },
  pending: {
    get title() { return t("externalChat.queued_for_channel"); },
    get body() { return t("externalChat.delivery_is_still_pending_your_draft_is_kept_until_paperclip_confirms_publication"); },
    tone: "info",
  },
  streaming: {
    get title() { return t("externalChat.publishing_to_channel"); },
    get body() { return t("externalChat.delivery_is_still_in_progress_your_draft_is_kept_until_paperclip_confirms_publication"); },
    tone: "info",
  },
  retry: {
    get title() { return t("externalChat.delivery_retry_scheduled"); },
    get body() { return t("externalChat.paperclip_will_retry_this_publication_your_draft_and_retry_identity_are_kept"); },
    tone: "warn",
  },
  delivery_unknown: {
    get title() { return t("externalChat.delivery_not_confirmed"); },
    get body() { return t("externalChat.the_provider_may_have_accepted_this_update_resolve_it_in_activity_before_trying_again_to_avoid_a_duplicate"); },
    tone: "warn",
  },
  failed: {
    get title() { return t("externalChat.channel_delivery_failed"); },
    get body() { return t("externalChat.your_draft_is_kept_open_activity_to_retry_this_same_publication_safely"); },
    tone: "error",
  },
  cancelled: {
    get title() { return t("externalChat.channel_delivery_cancelled"); },
    get body() { return t("externalChat.your_draft_is_kept_some_parts_may_already_have_been_published_check_activity_before_starting_a_new_send"); },
    tone: "info",
  },
};

const filePhaseLabels: Record<ChatFileTransferPhase, string> = {
  get consent_pending() { return t("externalChat.consent_card_queued"); },
  get consent_sending() { return t("externalChat.sending_consent_card"); },
  get consent_unknown() { return t("externalChat.consent_card_delivery_not_confirmed"); },
  get awaiting_consent() { return t("externalChat.awaiting_consent"); },
  get upload_pending() { return t("externalChat.upload_queued"); },
  get uploading() { return t("externalChat.uploading_file"); },
  get upload_unknown() { return t("externalChat.file_upload_not_confirmed"); },
  get file_info_pending() { return t("externalChat.file_notification_queued"); },
  get file_info_sending() { return t("externalChat.sending_file_notification"); },
  get file_info_unknown() { return t("externalChat.file_notification_not_confirmed"); },
  get delivered() { return t("externalChat.delivered"); },
  get declined() { return t("externalChat.declined"); },
  get expired() { return t("externalChat.consent_expired"); },
  get cancelled() { return t("externalChat.cancelled_remote_bytes_may_remain"); },
  get conflict() { return t("externalChat.file_delivery_needs_review"); },
};

export function useIssueChatBinding(companyId: string, issueId: string) {
  const { enabled } = useChatConnectorsEnabled();
  const queryEnabled = enabled && Boolean(companyId && issueId) && !issueId.startsWith("chat:");
  const query = useQuery({
    queryKey: ["issue-chat-binding", companyId, issueId],
    queryFn: () => chatEndpointsApi.getIssueBinding(issueId),
    enabled: queryEnabled,
  });
  return {
    binding: queryEnabled ? (query.data ?? null) : null,
    isLoading: queryEnabled && query.isLoading,
  };
}

type ConnectedTaskProps = {
  attachments?: IssueAttachment[];
  companyId: string;
  issueId: string;
  issueCacheRefs?: string[];
};

export function ExternallyConnectedTaskBanner(props: ConnectedTaskProps) {
  useTranslation();
  const { binding } = useIssueChatBinding(props.companyId, props.issueId);
  if (!binding || binding.provider === "agentmail") return null;
  return (
    <ConnectedTaskComposer
      key={boardSendDraftKey(
        props.companyId,
        props.issueId,
        binding.endpointId,
        binding.conversationId,
      )}
      {...props}
      binding={binding}
    />
  );
}

function ConnectedTaskComposer({
  attachments = [],
  companyId,
  issueId,
  issueCacheRefs,
  binding,
}: ConnectedTaskProps & { binding: ExternalChannelBindingSummary }) {
  const { t } = useTranslation();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [composing, setComposing] = useState(false);
  const [body, setBody] = useState("");
  const [selectedAttachmentIds, setSelectedAttachmentIds] = useState<string[]>(
    [],
  );
  const [publication, setPublication] = useState<ChatPublicationSummary | null>(
    null,
  );
  const idempotencyKey = useRef<string | null>(null);
  const retainedSend = useRef<RetainedBoardSend | null>(null);
  const retainedScopeKey = useRef<string | null>(null);
  const [unconfirmedRequest, setUnconfirmedRequest] = useState(false);
  const [rejection, setRejection] = useState<BoardSendRejection | null>(null);
  const [excludedAttachmentIds, setExcludedAttachmentIds] = useState<string[]>(
    [],
  );
  const [selectionNotice, setSelectionNotice] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadInFlight = useRef(false);
  const mounted = useRef(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedAttachments, setUploadedAttachments] = useState<
    IssueAttachment[]
  >([]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const storageKey = binding
    ? boardSendDraftKey(
        companyId,
        issueId,
        binding.endpointId,
        binding.conversationId,
      )
    : null;
  const loadedStorageKey = useRef<string | null>(null);
  useEffect(() => {
    if (!storageKey || loadedStorageKey.current === storageKey) return;
    loadedStorageKey.current = storageKey;
    try {
      const saved = readBoardSendDraft(storageKey);
      retainedScopeKey.current = storageKey;
      retainedSend.current = saved;
      idempotencyKey.current = saved?.idempotencyKey ?? null;
      setBody(saved?.body ?? "");
      setSelectedAttachmentIds(saved?.attachmentIds ?? []);
      setPublication(saved?.publication ?? null);
      setUnconfirmedRequest(
        Boolean(saved && !saved.publication && !saved.rejection),
      );
      setRejection(saved?.rejection ?? null);
      setComposing(Boolean(saved));
      setStorageError(null);
    } catch {
      setStorageError(
        t("externalChat.saved_delivery_identity_could_not_be_read_check_activity_and_restore_browser_storage_before_starting_another_send"),
      );
      setComposing(true);
    }
  }, [storageKey, t]);
  const deliveryScopeReady = Boolean(
    storageKey &&
    loadedStorageKey.current === storageKey &&
    retainedScopeKey.current === storageKey,
  );
  const invalidateTask = useCallback(() => {
    for (const ref of new Set([issueId, ...(issueCacheRefs ?? [])])) {
      for (const queryKey of [
        queryKeys.issues.comments(ref),
        queryKeys.issues.attachments(ref),
        queryKeys.issues.detail(ref),
        queryKeys.issues.activity(ref),
      ]) {
        void queryClient.invalidateQueries({ queryKey });
      }
    }
  }, [issueId, issueCacheRefs, queryClient]);
  const finishPublication = useCallback(() => {
    if (storageKey) {
      try {
        clearBoardSendDraft(storageKey);
      } catch {
        /* The retained anchor remains safe to recheck after reload. */
      }
    }
    retainedSend.current = null;
    setUnconfirmedRequest(false);
    setRejection(null);
    setSelectionNotice(false);
    setPublication(null);
    idempotencyKey.current = null;
    setBody("");
    setSelectedAttachmentIds([]);
    setUploadedAttachments([]);
    setUploadError(null);
    setComposing(false);
    invalidateTask();
    pushToast(publicationFeedback.published);
  }, [invalidateTask, pushToast, storageKey]);
  // Keep the first returned ID as the anchor. A batch's blocking row may
  // change as text and files finish; no read is allowed to submit another send.
  const publicationStatus = useQuery({
    queryKey: [
      "chat-publication-batch",
      companyId,
      binding?.endpointId,
      binding?.conversationId,
      publication?.id,
    ],
    queryFn: () =>
      chatEndpointsApi.getPublicationBatchStatus(
        binding!.endpointId,
        binding!.conversationId,
        publication!.id,
      ),
    enabled: deliveryScopeReady && Boolean(publication),
    staleTime: 0,
    refetchInterval: 2_000,
    refetchIntervalInBackground: false,
    retry: false,
  });
  useEffect(() => {
    const batch = publicationStatus.data;
    if (
      publication &&
      batch &&
      batch.total > 0 &&
      batch.published === batch.total &&
      batch.publication.state === "published"
    ) {
      finishPublication();
    }
  }, [publication, publicationStatus.data, finishPublication]);
  const publish = useMutation({
    mutationFn: (input: {
      attachmentIds: string[];
      body: string;
      idempotencyKey: string;
      endpointId: string;
      conversationId: string;
    }) =>
      chatEndpointsApi.publishBoardMessage(
        input.endpointId,
        input.conversationId,
        input.body,
        input.idempotencyKey,
        input.attachmentIds,
      ),
    onSuccess: (result) => {
      invalidateTask();
      const feedback = publicationFeedback[result.state];
      setPublication(result.state === "published" ? null : result);
      if (result.state === "published") {
        finishPublication();
        return;
      }
      setUnconfirmedRequest(false);
      if (storageKey && retainedSend.current) {
        retainedSend.current = {
          ...retainedSend.current,
          publication: {
            id: result.id,
            state: result.state,
            attempts: result.attempts,
          },
        };
        try {
          writeBoardSendDraft(storageKey, retainedSend.current);
        } catch {
          // The pre-POST payload/key is already persisted. It remains a safe,
          // explicit same-request retry when the publication ID cannot be saved.
        }
      }
      pushToast({
        ...feedback,
        action: {
          label: t("externalChat.view_activity"),
          href: `/apps/chat/${binding!.endpointId}/activity`,
        },
      });
    },
    onError: (error, request) => {
      const rejected = readBoardSendRejection(error, request);
      if (rejected && retainedSend.current && storageKey) {
        const saved = { ...retainedSend.current, rejection: rejected };
        try {
          // Keep the negative receipt through reload before offering a new key.
          writeBoardSendDraft(storageKey, saved);
        } catch {
          setStorageError(
            t("externalChat.the_rejected_send_could_not_be_saved_restore_browser_storage_then_retry_this_same_request_to_recover_its_receipt"),
          );
          return;
        }
        retainedSend.current = saved;
        setRejection(rejected);
        setUnconfirmedRequest(false);
        invalidateTask();
        pushToast({
          title: t("externalChat.update_was_not_sent"),
          body: t("externalChat.a_selected_file_already_belongs_to_another_comment_edit_the_rejected_send_to_correct_the_selection"),
          tone: "error",
        });
        return;
      }
      pushToast({
        title: t("externalChat.couldn_t_confirm_channel_delivery"),
        body:
          error instanceof Error
            ? t("externalChat.delivery_error", { error: error.message })
            : t("externalChat.your_draft_is_kept_retrying_here_reuses_the_same_request_identity"),
        tone: "error",
      });
    },
  });
  const uploadDisabled = Boolean(
    retainedSend.current ||
    publication ||
    publish.isPending ||
    publish.isError ||
    unconfirmedRequest ||
    storageError ||
    !deliveryScopeReady ||
    uploading,
  );
  async function uploadFile(file: File) {
    if (uploadDisabled || uploadInFlight.current || retainedSend.current)
      return;
    uploadInFlight.current = true;
    setUploading(true);
    setUploadError(null);
    try {
      const attachment = await issuesApi.uploadAttachment(
        companyId,
        issueId,
        file,
      );
      if (!mounted.current) return;
      setUploadedAttachments((current) => [...current, attachment]);
      setSelectedAttachmentIds((current) => [...current, attachment.id]);
      idempotencyKey.current = null;
    } catch (error) {
      if (mounted.current) {
        setUploadError(
          t("externalChat.upload_error", { error: error instanceof Error ? error.message : t("externalChat.upload_could_not_be_confirmed") }),
        );
      }
    } finally {
      uploadInFlight.current = false;
      if (mounted.current) setUploading(false);
      // An interrupted response may still have stored the file on this task.
      invalidateTask();
    }
  }
  // Keep newly uploaded files usable before the task refetch completes. Once
  // present, server metadata wins (especially a file bound to a sent comment).
  const taskAttachments = [
    ...new Map(
      [...uploadedAttachments, ...attachments].map((attachment) => [
        attachment.id,
        attachment,
      ]),
    ).values(),
  ];
  useEffect(() => {
    // Metadata may arrive after this file was selected but before Send. Never
    // silently keep a now-hidden selection, and never rewrite a retained send.
    if (retainedSend.current) return;
    const newlyBound = attachments
      .filter((file) => file.issueCommentId !== null)
      .map((file) => file.id);
    if (!selectedAttachmentIds.some((id) => newlyBound.includes(id))) return;
    setSelectedAttachmentIds((current) =>
      current.filter((id) => !newlyBound.includes(id)),
    );
    setSelectionNotice(true);
    idempotencyKey.current = null;
  }, [attachments, selectedAttachmentIds]);
  const showingRetainedFiles = Boolean(retainedSend.current);
  // Comment binding removes files from new-send eligibility, not from the
  // immutable receipt for the current send. Saved names survive reload while
  // task metadata is loading (or a selected attachment has since been removed).
  const visibleAttachments = retainedSend.current
    ? retainedSend.current.attachmentIds.map((id) => ({
        id,
        originalFilename:
          retainedSend.current?.attachmentNames?.find((file) => file.id === id)
            ?.name ??
          taskAttachments.find((attachment) => attachment.id === id)
            ?.originalFilename ??
          t("externalChat.selected_task_file_details_unavailable"),
      }))
    : taskAttachments.filter(
        (attachment) =>
          attachment.issueCommentId === null &&
          !excludedAttachmentIds.includes(attachment.id),
      );
  const currentPublication = publicationStatus.data?.publication ?? publication;
  const batch = publicationStatus.data;
  const dismissible =
    !publicationStatus.isError &&
    !publicationStatus.isFetching &&
    canDismissBoardSendBatch(batch);
  const mixedTerminal =
    canDismissBoardSendBatch(batch) && batch!.published < batch!.total;
  const currentFeedback = mixedTerminal
    ? {
        title: t("externalChat.delivery_settled_with_mixed_outcomes"),
        body: t("externalChat.not_every_part_was_confirmed_delivered_review_the_outcomes_below_dismissing_this_receipt_does_not_resend_anything"),
        tone: "info" as const,
      }
    : currentPublication?.state === "cancelled" &&
        (batch?.awaitingConsent ?? 0) > 0
      ? {
          title: t("externalChat.waiting_for_remaining_file_consent"),
          body: t("externalChat.some_parts_have_settled_the_remaining_file_cards_still_need_the_recipient_s_response_this_send_stays_locked_until_the_whole_batch_is_resolved"),
          tone: "info" as const,
        }
      : currentPublication
        ? publicationFeedback[currentPublication.state]
        : null;
  const activityPath = `/apps/chat/${binding.endpointId}/activity`;
  return (
    <section
      aria-label={t("externalChat.external_conversation")}
      className="space-y-3 rounded-lg border border-border bg-muted/40 p-3 text-sm"
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 flex-1 basis-64 items-center gap-3">
          <Radio className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="font-medium">
              {t("externalChat.connected_to", { provider: providerNames[binding.provider] })}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {binding.externalLabel} · {binding.provider === "slack"
                ? t("externalChat.messages_you_send_here_and_agent_replies_are_also_posted_to_slack")
                : t("externalChat.agent_assignment_is_fixed_for_this_external_task")}
            </p>
          </div>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {binding.externalUrl && (
            <Button asChild size="sm" variant="outline">
              <a href={binding.externalUrl} target="_blank" rel="noreferrer">
                {t("externalChat.open_provider", { provider: providerNames[binding.provider] })} <ExternalLink />
              </a>
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setComposing((value) => !value)}
          >{t("externalChat.send_to_channel")}</Button>
          <Button asChild size="sm" variant="ghost">
            <Link to={`/apps/chat/${binding.endpointId}/conversations`}>{t("externalChat.connection")}</Link>
          </Button>
        </div>
      </div>
      {composing && (
        <div className="space-y-2 border-t border-border pt-3">
          <label
            className="text-xs font-medium"
            htmlFor="external-board-update"
          >{t("externalChat.board_update")}</label>
          <Textarea
            id="external-board-update"
            value={body}
            disabled={
              Boolean(publication) ||
              Boolean(rejection) ||
              publish.isError ||
              unconfirmedRequest ||
              Boolean(storageError) ||
              !deliveryScopeReady
            }
            onChange={(event) => {
              setBody(event.target.value);
              idempotencyKey.current = null;
              publish.reset();
            }}
            placeholder={t("externalChat.write_only_what_should_be_visible_in_the_provider_conversation")}
          />
          {selectedAttachmentIds.length > 0 && !body.trim() && (
            <p className="text-xs text-muted-foreground">{t("externalChat.add_a_message_to_send_with_your_files")}</p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInput}
              type="file"
              className="hidden"
              aria-label={t("externalChat.attach_file_to_channel_update")}
              disabled={uploadDisabled}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void uploadFile(file);
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={uploadDisabled}
              onClick={() => fileInput.current?.click()}
            >
              <Paperclip />
              {uploading ? t("externalChat.uploading") : t("externalChat.attach_file")}
            </Button>
            <p className="text-xs text-muted-foreground">{t("externalChat.files_stay_on_this_task_until_you_send_them_to_the_channel")}</p>
          </div>
          {uploadError && (
            <p role="alert" className="text-xs text-destructive">
              {uploadError}
            </p>
          )}
          {selectionNotice && (
            <p role="status" className="text-xs text-muted-foreground">{t("externalChat.a_file_already_attached_to_another_comment_was_removed_from_this_selection_attach_a_new_copy_or_share_the_task_link_your_message_is_unchanged")}</p>
          )}
          {visibleAttachments.length > 0 && (
            <fieldset
              className="space-y-2 rounded-md border border-border bg-background p-3"
              disabled={
                showingRetainedFiles ||
                Boolean(publication) ||
                publish.isError ||
                unconfirmedRequest ||
                Boolean(storageError) ||
                !deliveryScopeReady
              }
            >
              <legend className="px-1 text-xs font-medium">
                {showingRetainedFiles
                  ? t("externalChat.files_in_this_send")
                  : t("externalChat.include_task_files")}
              </legend>
              <p className="text-xs text-muted-foreground">
                {binding.provider === "github"
                  ? t("externalChat.github_apps_cannot_upload_file_bytes_in_comments_checked_files_stay_on_the_paperclip_task_github_receives_an_authenticated_task_link_when_this_board_has_a_public_url_or_a_private_task_notice_otherwise")
                  : binding.provider === "microsoft-teams" &&
                      !showingRetainedFiles
                    ? t("externalChat.in_personal_teams_chats_recipients_accept_each_file_before_upload_channels_and_group_chats_receive_supported_images_directly_other_files_stay_on_the_task_with_a_task_link_or_private_task_notice")
                    : showingRetainedFiles
                      ? t("externalChat.these_are_the_files_selected_for_this_send_selection_is_locked_until_delivery_is_resolved")
                      : t("externalChat.only_checked_files_will_be_published_to_the_external_conversation")}
              </p>
              <div className="space-y-2">
                {visibleAttachments.map((attachment) => {
                  const label =
                    attachment.originalFilename ?? t("externalChat.unnamed_attachment");
                  return (
                    <label
                      className="flex items-center gap-2 text-xs"
                      key={attachment.id}
                    >
                      <Checkbox
                        disabled={showingRetainedFiles}
                        checked={selectedAttachmentIds.includes(attachment.id)}
                        onCheckedChange={(checked) => {
                          setSelectedAttachmentIds((current) =>
                            checked === true
                              ? [...current, attachment.id]
                              : current.filter((id) => id !== attachment.id),
                          );
                          idempotencyKey.current = null;
                          publish.reset();
                        }}
                      />
                      <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="truncate">{label}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}
          {storageError && (
            <p role="alert" className="text-xs text-destructive">
              {storageError}
            </p>
          )}
          {rejection && (
            <div
              role="alert"
              className="space-y-1 rounded-md border border-border bg-background p-3 text-xs"
            >
              <p className="font-medium">{t("externalChat.update_was_not_sent")}</p>
              <p className="text-muted-foreground">{t("externalChat.a_selected_file_already_belongs_to_another_comment_this_request_was_rejected_before_any_channel_message_was_queued_your_exact_draft_is_kept")}</p>
              <Button
                size="sm"
                variant="outline"
                disabled={Boolean(storageError)}
                onClick={() => {
                  if (!storageKey || !retainedSend.current?.rejection) return;
                  try {
                    clearBoardSendDraft(storageKey);
                  } catch {
                    setStorageError(
                      t("externalChat.saved_rejection_could_not_be_cleared_restore_browser_storage_before_editing_this_send"),
                    );
                    return;
                  }
                  const invalidIds =
                    retainedSend.current.rejection.attachmentIds;
                  setExcludedAttachmentIds((current) => [
                    ...new Set([...current, ...invalidIds]),
                  ]);
                  setSelectedAttachmentIds((current) =>
                    current.filter((id) => !invalidIds.includes(id)),
                  );
                  setUploadedAttachments((current) =>
                    current.filter((file) => !invalidIds.includes(file.id)),
                  );
                  retainedSend.current = null;
                  idempotencyKey.current = null;
                  setRejection(null);
                  setUnconfirmedRequest(false);
                  setSelectionNotice(true);
                  publish.reset();
                }}
              >{t("externalChat.edit_rejected_send")}</Button>
            </div>
          )}
          {!rejection &&
            (publish.isError || unconfirmedRequest) &&
            !publish.isPending &&
            !publication && (
              <div
                role="alert"
                className="space-y-1 rounded-md border border-border bg-background p-3 text-xs"
              >
                <p className="font-medium">{t("externalChat.delivery_result_not_confirmed")}</p>
                <p className="text-muted-foreground">{t("externalChat.your_exact_draft_and_request_identity_are_kept_retry_safely_to_learn_the_authoritative_publication_state_without_creating_a_duplicate")}</p>
                <Link
                  className="inline-block font-medium underline underline-offset-4"
                  to={activityPath}
                >{t("externalChat.open_activity")}</Link>
              </div>
            )}
          {publication && currentPublication && currentFeedback && (
            <div
              role={
                currentPublication.state === "failed" ||
                currentPublication.state === "delivery_unknown"
                  ? "alert"
                  : "status"
              }
              className="space-y-1 rounded-md border border-border bg-background p-3 text-xs"
            >
              <p className="font-medium">{currentFeedback.title}</p>
              <p className="text-muted-foreground">{currentFeedback.body}</p>
              {batch && (
                <p className="text-muted-foreground">
                  {batch.declined !== undefined &&
                  batch.expired !== undefined &&
                  batch.cancelled !== undefined &&
                  batch.awaitingConsent !== undefined
                    ? [
                        t("externalChat.published_count", { count: batch.published }),
                        ...(batch.awaitingConsent
                          ? [t("externalChat.consent_count", { count: batch.awaitingConsent })]
                          : []),
                        ...(batch.declined
                          ? [t("externalChat.declined_count", { count: batch.declined })]
                          : []),
                        ...(batch.expired ? [t("externalChat.expired_count", { count: batch.expired })] : []),
                        ...(batch.cancelled
                          ? [t("externalChat.cancelled_count", { count: batch.cancelled })]
                          : []),
                      ].join(" · ")
                    : t("externalChat.parts_published", { published: batch.published, total: batch.total })}
                </p>
              )}
              {batch?.parts?.some((part) => part.fileTransfer) && (
                <ul
                  className="space-y-1 text-muted-foreground"
                  aria-label={t("externalChat.file_delivery_outcomes")}
                >
                  {batch.parts
                    .filter((part) => part.fileTransfer)
                    .map((part) => (
                      <li key={part.id}>
                        {part.fileTransfer!.filename} —{" "}
                        {filePhaseLabels[part.fileTransfer!.phase]}
                      </li>
                    ))}
                </ul>
              )}
              {publicationStatus.isError && (
                <p role="alert" className="text-muted-foreground">{t("externalChat.delivery_status_could_not_be_refreshed_your_draft_is_kept_paperclip_will_check_again_without_sending_another_update")}</p>
              )}
              {currentPublication.redactedError && (
                <p className="text-muted-foreground">
                  {t("externalChat.provider_detail", { error: currentPublication.redactedError })}
                </p>
              )}
              <Link
                className="inline-block font-medium underline underline-offset-4"
                to={activityPath}
              >{t("externalChat.open_activity")}</Link>
              {dismissible && (
                <Button
                  className="ml-3"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (storageKey) {
                      try {
                        clearBoardSendDraft(storageKey);
                      } catch {
                        setStorageError(
                          t("externalChat.saved_delivery_identity_could_not_be_cleared_restore_browser_storage_before_starting_another_send"),
                        );
                        return;
                      }
                    }
                    setStorageError(null);
                    retainedSend.current = null;
                    setUnconfirmedRequest(false);
                    setPublication(null);
                    setBody("");
                    setSelectedAttachmentIds([]);
                    setUploadedAttachments([]);
                    setUploadError(null);
                    idempotencyKey.current = null;
                    publish.reset();
                  }}
                >{t("externalChat.dismiss_delivery_receipt")}</Button>
              )}
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {binding.provider === "slack"
                ? t("externalChat.your_message_is_posted_to_slack_with_your_name_and_starts_the_agent")
                : t("externalChat.ordinary_board_comments_remain_paperclip_only")}
            </p>
            <Button
              size="sm"
              disabled={
                !body.trim() ||
                publish.isPending ||
                uploading ||
                Boolean(publication) ||
                Boolean(rejection) ||
                Boolean(storageError) ||
                !deliveryScopeReady
              }
              onClick={() => {
                if (
                  uploadInFlight.current ||
                  !storageKey ||
                  loadedStorageKey.current !== storageKey ||
                  retainedScopeKey.current !== storageKey
                )
                  return;
                idempotencyKey.current ??= createUuid();
                const input = retainedSend.current ?? {
                  attachmentIds: selectedAttachmentIds,
                  attachmentNames: selectedAttachmentIds.map((id) => ({
                    id,
                    name:
                      taskAttachments.find((attachment) => attachment.id === id)
                        ?.originalFilename ?? "Unnamed attachment",
                  })),
                  body: body.trim(),
                  idempotencyKey: idempotencyKey.current,
                  publication: null,
                };
                try {
                  if (!storageKey) throw new Error("Missing delivery scope");
                  writeBoardSendDraft(storageKey, input);
                } catch {
                  setStorageError(
                    t("externalChat.browser_storage_could_not_preserve_this_delivery_identity_no_update_was_sent_restore_browser_storage_then_reload_to_try_again"),
                  );
                  return;
                }
                retainedSend.current = input;
                setUnconfirmedRequest(true);
                publish.mutate({
                  ...input,
                  endpointId: binding.endpointId,
                  conversationId: binding.conversationId,
                });
              }}
            >
              {publish.isPending
                ? t("externalChat.sending")
                : !rejection && (publish.isError || unconfirmedRequest)
                  ? t("externalChat.retry_safely")
                  : t("externalChat.send_to_channel")}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
