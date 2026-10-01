import { useTranslation } from "@/i18n";
import { Trans } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ShortcutEntry {
  keys: string[];
  label: string;
  /** Render keys as a simultaneous chord (joined with "+") rather than a
   *  "then" sequence. */
  combo?: boolean;
}

interface ShortcutSection {
  title: string;
  shortcuts: ShortcutEntry[];
}

const sections: ShortcutSection[] = [
  {
    title: "keyboardShortcuts.inbox",
    shortcuts: [
      { keys: ["j"], label: "keyboardShortcuts.moveDown" },
      { keys: ["↓"], label: "keyboardShortcuts.moveDown" },
      { keys: ["k"], label: "keyboardShortcuts.moveUp" },
      { keys: ["↑"], label: "keyboardShortcuts.moveUp" },
      { keys: ["←"], label: "keyboardShortcuts.collapseGroup" },
      { keys: ["→"], label: "keyboardShortcuts.expandGroup" },
      { keys: ["Enter"], label: "keyboardShortcuts.openItem" },
      { keys: ["a"], label: "keyboardShortcuts.archive" },
      { keys: ["y"], label: "keyboardShortcuts.archive" },
      { keys: ["r"], label: "keyboardShortcuts.read" },
      { keys: ["U"], label: "keyboardShortcuts.unread" },
    ],
  },
  {
    title: "keyboardShortcuts.taskDetail",
    shortcuts: [
      { keys: ["y"], label: "keyboardShortcuts.quickArchive" },
      { keys: ["g", "i"], label: "keyboardShortcuts.goInbox" },
      { keys: ["g", "c"], label: "keyboardShortcuts.focusComment" },
    ],
  },
  {
    title: "keyboardShortcuts.decisions",
    shortcuts: [
      { keys: ["j"], label: "keyboardShortcuts.moveDown" },
      { keys: ["↓"], label: "keyboardShortcuts.moveDown" },
      { keys: ["k"], label: "keyboardShortcuts.moveUp" },
      { keys: ["↑"], label: "keyboardShortcuts.moveUp" },
      { keys: ["Enter"], label: "keyboardShortcuts.openDecision" },
      { keys: ["x"], label: "keyboardShortcuts.dismissDecision" },
    ],
  },
  {
    title: "keyboardShortcuts.global",
    shortcuts: [
      { keys: ["/"], label: "keyboardShortcuts.search" },
      { keys: ["c"], label: "keyboardShortcuts.newTask" },
      { keys: ["["], label: "keyboardShortcuts.sidebar" },
      { keys: ["]"], label: "keyboardShortcuts.panel" },
      { keys: ["?"], label: "keyboardShortcuts.show" },
    ],
  },
];

function KeyCap({ children }: { children: string }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-xs font-medium text-foreground shadow-(--shadow-extract-10)">
      {children}
    </kbd>
  );
}

export function KeyboardShortcutsCheatsheetContent() {
  const { t } = useTranslation();
  return (
    <>
      <div className="divide-y divide-border border-t border-border">
        {sections.map((section) => (
          <div key={t(section.title)} className="px-5 py-3">
            <h3 className="mb-2 text-(length:--text-micro) font-semibold uppercase tracking-wider text-muted-foreground">
              {t(section.title)}
            </h3>
            <div className="space-y-1.5">
              {section.shortcuts.map((shortcut) => (
                <div
                  key={shortcut.label + shortcut.keys.join()}
                  className="flex items-center justify-between gap-4"
                >
                  <span className="text-sm text-foreground/90">{t(shortcut.label)}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, i) => (
                      <span key={key} className="flex items-center gap-1">
                        {i > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {shortcut.combo ? "+" : t("keyboardShortcuts.then")}
                          </span>
                        )}
                        <KeyCap>{key}</KeyCap>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-border px-5 py-3">
        <p className="text-xs text-muted-foreground">
          <Trans i18nKey="keyboardShortcuts.footer" components={{ key: <KeyCap>Esc</KeyCap> }} />
        </p>
      </div>
    </>
  );
}

export function KeyboardShortcutsCheatsheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden" showCloseButton={false}>
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-base">{t("keyboardShortcuts.title")}</DialogTitle>
        </DialogHeader>
        <KeyboardShortcutsCheatsheetContent />
      </DialogContent>
    </Dialog>
  );
}
