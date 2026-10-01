import { useTranslation } from "@/i18n";
import { useId, useState } from "react";
import {
  ArrowRight,
  Check,
  Download,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SetupWizardFooter } from "@/components/SetupWizard";

export interface SlackAvatarProps {
  agentName: string;
  appName: string;
  avatarUrl: string;
}

/** Shared by Slack onboarding and its Settings page. Slack upload is manual. */
export function SlackAvatarContent({
  agentName,
  appName,
  avatarUrl,
  compact = false,
}: SlackAvatarProps & { compact?: boolean }) {
  const { t } = useTranslation();
  const id = useId();
  const filename = `${appName.replace(/[^a-zA-Z0-9_-]+/g, "-") || "agent"}-avatar.png`;
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);
  const download = async () => {
    if (downloading) return;
    setDownloading(true);
    setDownloadError(false);
    try {
      const response = await fetch(avatarUrl);
      if (
        !response.ok ||
        !response.headers.get("content-type")?.startsWith("image/png")
      )
        throw new Error("Avatar unavailable");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1_000);
    } catch {
      setDownloadError(true);
    } finally {
      setDownloading(false);
    }
  };
  return (
    <div className="space-y-8">
      <section
        aria-labelledby={`${id}-download`}
        className="flex flex-col items-start gap-6 sm:flex-row sm:items-center"
      >
        <img
          src={avatarUrl}
          width={512}
          height={512}
          alt={t("appsChatBasic.cliptoonAvatar", { agent: agentName })}
          className="size-40 shrink-0 rounded-lg bg-muted object-contain"
        />
        <div className="space-y-3">
          <div className="space-y-1">
            <h2 id={`${id}-download`} className="text-sm font-semibold">
              {compact
                ? t("appsChatBasic.downloadYourAgentsAvatar")
                : t("appsChatBasic.1DownloadYourAgentsAvatar")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("appsChatBasic.pNG512512ReadyForSlack")}
            </p>
          </div>
          <Button variant="outline" asChild>
            <a
              href={avatarUrl}
              download={filename}
              aria-disabled={downloading}
              onClick={(event) => {
                event.preventDefault();
                void download();
              }}
            >
              {downloading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              {t("appsChatBasic.downloadAvatar")}
            </a>
          </Button>
          {downloadError && (
            <p role="alert" className="text-sm text-destructive">
              {t("appsChatBasic.couldntDownloadTheAvatarTryDownloadingItAgain")}
            </p>
          )}
        </div>
      </section>

      <details open={compact ? undefined : true} className="space-y-4">
        <summary
          className={
            compact
              ? "cursor-pointer text-sm underline underline-offset-4"
              : "hidden"
          }
        >
          {t("appsChatBasic.howToUploadInSlack")}
        </summary>
        <section aria-labelledby={`${id}-upload`} className="space-y-4">
          <div className="space-y-1">
            <h2 id={`${id}-upload`} className="text-sm font-semibold">
              {compact ? t("appsChatBasic.uploadItInSlack") : t("appsChatBasic.2UploadItInSlack")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("appsChatBasic.youllUploadTheDownloadedImageDirectlyInSlacksApp")}
            </p>
          </div>
          <ol className="list-decimal space-y-3 pl-5 text-sm">
            <li>
              <a
                href="https://api.slack.com/apps"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4"
              >
                {t("appsChatBasic.openSlackAppSettings")}{" "}
                <ExternalLink className="inline size-3" />
              </a>{" "}
              {t("appsChatBasic.andChoose")} <strong>{appName}</strong>.
            </li>
            <li>
              {t("appsChatBasic.choose")} <strong>Basic Information</strong>{t("appsChatBasic.thenScrollTo")}{" "}
              <strong>Display Information</strong>.
            </li>
            <li>
              {t("appsChatBasic.under")} <strong>App icon &amp; Preview</strong>{t("appsChatBasic.clickTheAppIconAndUpload")}{" "}
              <span className="break-all font-mono text-xs">{filename}</span>.
            </li>
            <li>
              {t("appsChatBasic.confirmTheCropThenClick")} <strong>Save Changes</strong> {t("appsChatBasic.inSlack")}
            </li>
          </ol>
        </section>
      </details>
    </div>
  );
}

export function SlackAvatarStep({
  uploaded,
  onUploaded,
  onSkip,
  onSaveExit,
  ...props
}: SlackAvatarProps & {
  uploaded: boolean;
  onUploaded: () => void;
  onSkip: () => void;
  onSaveExit: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">
            {t("appsChatBasic.giveAgentFace", { agent: props.agentName })}
          </h1>
          <span className="text-xs text-muted-foreground">{t("appsChatBasic.optional")}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("appsChatBasic.useAgentAvatar", { agent: props.agentName })}
        </p>
      </div>
      <SlackAvatarContent {...props} />
      {uploaded && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-lg bg-(--status-task-done)/10 p-3 text-sm"
        >
          <Check className="size-4 text-(--status-task-done)" />
          {t("appsChatBasic.youMarkedTheAvatarAsUploadedInSlack")}
        </p>
      )}
      <SetupWizardFooter onSaveExit={onSaveExit}>
        <Button variant="ghost" onClick={onSkip}>
          {t("appsChatBasic.skipForNow")}
        </Button>
        <Button onClick={onUploaded}>
          {uploaded ? t("appsChatBasic.continue") : t("appsChatBasic.iveUploadedTheAvatar")}
          <ArrowRight className="size-4" />
        </Button>
      </SetupWizardFooter>
    </div>
  );
}

export function SlackAvatarSettings(props: SlackAvatarProps) {
  const { t } = useTranslation();
  return (
    <section className="space-y-4" aria-label={t("appsChatBasic.slackAvatar")}>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{t("appsChatBasic.agentAvatar")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("appsChatBasic.useAgentAvatar", { agent: props.agentName })}
        </p>
      </div>
      <SlackAvatarContent {...props} compact />
    </section>
  );
}
