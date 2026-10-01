import { t } from "@/i18n";

export const chatSetupErrorFallback =
  "Check the required values and provider access, then try again.";

const localErrorKeys: Record<string, string> = {
  "Check the required values and provider access, then try again.": "appsChatLocalErrors.requiredValues",
  "That file is empty. Choose the private key downloaded from your GitHub App.": "appsChatLocalErrors.emptyPrivateKey",
  "That file is too large. Choose a GitHub App private key smaller than 64 KB.": "appsChatLocalErrors.largePrivateKey",
  "Paperclip couldn't read that file. Choose the .pem file again or paste the private key.": "appsChatLocalErrors.privateKeyRead",
};

export function chatSetupErrorDisplay(message: string): string {
  const key = localErrorKeys[message];
  return key ? t(key) : message;
}

function uriEncoded(value: string): string | null {
  try {
    return encodeURIComponent(value);
  } catch {
    // encodeURIComponent rejects malformed UTF-16 (for example, a lone
    // surrogate). The raw and JSON-escaped forms remain safe to redact.
    return null;
  }
}

export function sanitizedSetupErrorMessage(
  error: unknown,
  submittedValues: Record<string, string> | undefined,
): string {
  let message = error instanceof Error ? error.message.trim() : "";
  if (!message) return chatSetupErrorFallback;

  const submittedSecrets = Object.values(submittedValues ?? {})
    .flatMap((value) => {
      const trimmed = value.trim();
      return trimmed && trimmed !== value ? [value, trimmed] : [value];
    })
    .filter(Boolean)
    .sort((left, right) => right.length - left.length);
  for (const secret of submittedSecrets) {
    const escapedSecret = JSON.stringify(secret).slice(1, -1);
    const candidates = new Set<string>([secret, escapedSecret]);
    const encodedSecret = uriEncoded(secret);
    if (encodedSecret) candidates.add(encodedSecret);
    for (const candidate of candidates) {
      message = message.replaceAll(candidate, "[redacted]");
    }
  }

  const normalized = message.replace(/\s+/g, " ").trim();
  return normalized ? normalized.slice(0, 500) : chatSetupErrorFallback;
}
