import { t, useTranslation } from "@/i18n";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Code2, Download, Eye } from "lucide-react";
import { issuesApi } from "@/api/issues";
import { Button } from "@/components/ui/button";
import { MarkdownBody } from "@/components/MarkdownBody";
import { attachmentDownloadPath, isMarkdownAttachment, isTextAttachment } from "@/lib/issue-attachments";
import { queryKeys } from "@/lib/queryKeys";

export const TEXT_PREVIEW_MAX_BYTES = 512 * 1024;

/** Bound the actual response, not just producer-supplied attachment metadata. */
export async function readTextPreview(response: Response) {
  if (!response.ok) throw new Error(t("chatSidePanels.load_file_status", { status: response.status }));
  if (!response.body) throw new Error(t("chatSidePanels.the_file_response_is_empty"));
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let bytes = 0;
  let text = "";
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > TEXT_PREVIEW_MAX_BYTES) throw new Error(t("chatSidePanels.this_file_is_too_large_to_preview_download_it_instead"));
      text += decoder.decode(chunk.value, { stream: true });
    }
    text += decoder.decode();
    if (text.includes("\0")) throw new Error(t("chatSidePanels.this_file_contains_binary_data_download_it_instead"));
    return text;
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
}

export function TextAttachmentPreview({ title, text, markdown, downloadUrl }: {
  title: string;
  text: string;
  markdown: boolean;
  downloadUrl: string;
}) {
  const { t } = useTranslation();
  const [raw, setRaw] = useState(false);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-2 border-b border-border px-3 py-2">
        <h2 className="min-w-0 flex-1 truncate text-sm font-medium" title={title}>{title}</h2>
        {markdown ? (
          <div className="flex gap-1" role="group" aria-label={t("chatSidePanels.markdown_view")}>
            <Button size="icon-sm" variant={raw ? "ghost" : "secondary"} aria-label={t("chatSidePanels.rendered")} title={t("chatSidePanels.rendered")} aria-pressed={!raw} onClick={() => setRaw(false)}>
              <Eye aria-hidden />
            </Button>
            <Button size="icon-sm" variant={raw ? "secondary" : "ghost"} aria-label={t("chatSidePanels.raw")} title={t("chatSidePanels.raw")} aria-pressed={raw} onClick={() => setRaw(true)}>
              <Code2 aria-hidden />
            </Button>
          </div>
        ) : null}
        <Button asChild variant="ghost" size="icon-sm">
          <a href={downloadUrl} download aria-label={t("chatSidePanels.download_named", { title })} title={t("chatSidePanels.download_named", { title })}><Download aria-hidden /></a>
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-auto p-4">
        {text.length === 0 ? <p className="text-sm text-muted-foreground">{t("chatSidePanels.file_is_empty")}</p>
          : markdown && !raw ? <MarkdownBody mediaMode="reference">{text}</MarkdownBody>
          : <pre className="whitespace-pre-wrap break-words font-mono text-sm" aria-label={t("chatSidePanels.named_raw_text", { title })}>{text}</pre>}
      </div>
    </div>
  );
}

export function TaskAttachmentPanel({ issueId, attachmentId }: { issueId: string; attachmentId: string }) {
  const { t } = useTranslation();
  const attachments = useQuery({
    queryKey: queryKeys.issues.attachments(issueId),
    queryFn: () => issuesApi.listAttachments(issueId),
  });
  // Re-resolve against this task's authorized attachment list; never trust persisted URLs.
  const attachment = attachments.data?.find((item) => item.id === attachmentId);
  const eligible = attachment && isTextAttachment(attachment) && attachment.byteSize <= TEXT_PREVIEW_MAX_BYTES;
  const content = useQuery({
    queryKey: ["task-text-attachment", issueId, attachmentId],
    queryFn: async ({ signal }) => readTextPreview(await fetch(
      `/api/attachments/${encodeURIComponent(attachmentId)}/content`,
      { signal, credentials: "same-origin" },
    )),
    enabled: Boolean(eligible),
    retry: false,
  });
  if (attachments.isLoading) return <p className="p-4 text-sm" role="status">{t("chatSidePanels.loading_file")}</p>;
  if (attachments.isError) return <div className="p-4" role="alert">{t("chatSidePanels.could_not_load_attachment_details")}{" "}<Button onClick={() => void attachments.refetch()}>{t("chatSidePanels.retry")}</Button></div>;
  if (!attachment) return <p className="p-4 text-sm" role="status">{t("chatSidePanels.file_no_longer_available_close_this_tab_or_choose_another_file")}</p>;
  const downloadUrl = attachmentDownloadPath(attachment);
  if (!eligible || content.isError) {
    return (
      <div className="space-y-3 p-4" role="alert">
        <p className="text-sm">{content.isError ? t("chatSidePanels.could_not_preview_this_file_retry_or_download_it") : t("chatSidePanels.this_file_is_too_large_or_is_not_supported_for_text_preview_download_it_instead")}</p>
        {eligible ? <Button onClick={() => void content.refetch()}>{t("chatSidePanels.retry")}</Button> : null}
        <Button asChild variant="outline"><a href={downloadUrl} download>{t("chatSidePanels.download_file")}</a></Button>
      </div>
    );
  }
  if (content.data === undefined) return <p className="p-4 text-sm" role="status">{t("chatSidePanels.loading_file")}</p>;
  return <TextAttachmentPreview title={attachment.originalFilename ?? attachment.id} text={content.data} markdown={isMarkdownAttachment(attachment)} downloadUrl={downloadUrl} />;
}
