import { t, useTranslation } from "@/i18n";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { copyTextToClipboard } from "@/lib/clipboard";

export function CopyField({
  label,
  value,
  help,
}: {
  label: string;
  value: string;
  help?: string;
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex min-w-0 items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
        <code title={value} className="min-w-0 flex-1 truncate text-xs">
          {value}
        </code>
        <Button
          variant="ghost"
          size="sm"
          aria-label={t("routineTriggers.copy_label", { label })}
          onClick={async () => {
            try {
              await copyTextToClipboard(value);
              setCopied(true);
              setError(false);
            } catch {
              setError(true);
            }
          }}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? t("routineTriggers.copied") : t("routineTriggers.copy")}
        </Button>
      </div>
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
      {error && (
        <div className="space-y-2">
          <p role="alert" className="text-xs text-destructive">{t("routineTriggers.copy_failed_select_and_copy_the_text_below")}</p>
          <textarea
            readOnly
            aria-label={t("routineTriggers.label_text", { label })}
            value={value}
            rows={5}
            className="w-full rounded-md border border-input bg-background p-3 font-mono text-xs"
          />
        </div>
      )}
    </div>
  );
}

export function AgentInstructions({ value }: { value: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  return (
    <section
      aria-label={t("routineTriggers.agent_instructions")}
      className="space-y-3 rounded-md bg-muted/40 p-4"
    >
      <div className="space-y-1">
        <h2 className="text-sm font-medium">{t("routineTriggers.agent_instructions")}</h2>
        <p className="text-sm text-muted-foreground">{t("routineTriggers.give_your_agent_everything_it_needs_to_connect_this_webhook_the_url_authentication_key_and_step_by_step_instructions")}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        aria-label={t("routineTriggers.copy_for_your_agent")}
        onClick={async () => {
          try {
            await copyTextToClipboard(value);
            setCopied(true);
            setError(false);
          } catch {
            setError(true);
          }
        }}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
        {copied ? t("routineTriggers.copied_instructions") : t("routineTriggers.copy_for_your_agent")}
      </Button>
      {error && (
        <div className="space-y-2">
          <p role="alert" className="text-xs text-destructive">{t("routineTriggers.copy_failed_select_and_copy_the_instructions_below")}</p>
          <textarea
            readOnly
            aria-label={t("routineTriggers.agent_instructions_text")}
            value={value}
            rows={5}
            className="w-full rounded-md border border-input bg-background p-3 text-sm"
          />
        </div>
      )}
    </section>
  );
}
