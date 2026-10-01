import { webcrypto } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { secretsApi } from "../api/secrets";
import { storeOrganizationApiKey, storeProviderApiKey } from "./provider-credential";

vi.mock("../api/secrets", () => ({
  secretsApi: {
    create: vi.fn(),
    remove: vi.fn(),
    createUserSecretDefinition: vi.fn(),
    createMyUserSecret: vi.fn(),
    removeUserSecretDefinition: vi.fn(),
  },
}));

describe("agent setup credentials without crypto.randomUUID", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetAllMocks();
  });

  function useHttpCrypto() {
    vi.stubGlobal("crypto", {
      getRandomValues: webcrypto.getRandomValues.bind(webcrypto),
    });
  }

  it("stores distinct Hermes organization keys and keeps their cleanup bindings", async () => {
    useHttpCrypto();
    vi.mocked(secretsApi.create).mockResolvedValue({ id: "secret-id" } as never);

    const stored = await storeOrganizationApiKey("company-id", "API_SERVER_KEY", " gateway-key ");
    await storeOrganizationApiKey("company-id", "API_SERVER_KEY", "gateway-key");

    const [first, second] = vi.mocked(secretsApi.create).mock.calls;
    expect(first).toEqual(["company-id", expect.objectContaining({
      key: expect.stringMatching(/^API_SERVER_KEY\.setup\.[0-9a-f]{32}$/),
      value: "gateway-key",
    })]);
    expect(first[1].key).not.toBe(second[1].key);
    expect(stored.binding).toEqual({ type: "secret_ref", secretId: "secret-id", version: "latest" });
    await stored.remove();
    expect(secretsApi.remove).toHaveBeenCalledWith("secret-id");
  });

  it("stores a provider user key with the same definition and binding key", async () => {
    useHttpCrypto();
    vi.mocked(secretsApi.createUserSecretDefinition).mockResolvedValue({ id: "definition-id" } as never);

    const stored = await storeProviderApiKey("company-id", "OPENAI_API_KEY", " provider-key ");

    expect(stored.binding.key).toMatch(/^OPENAI_API_KEY\.setup\.[0-9a-f]{32}$/);
    expect(secretsApi.createUserSecretDefinition).toHaveBeenCalledWith("company-id", expect.objectContaining({ key: stored.binding.key }));
    expect(secretsApi.createMyUserSecret).toHaveBeenCalledWith("company-id", {
      definitionId: "definition-id", definitionKey: stored.binding.key, value: "provider-key",
    });
    await stored.remove();
    expect(secretsApi.removeUserSecretDefinition).toHaveBeenCalledWith("company-id", "definition-id");
  });

  it("removes the staged definition if storing the provider value fails", async () => {
    useHttpCrypto();
    vi.mocked(secretsApi.createUserSecretDefinition).mockResolvedValue({ id: "definition-id" } as never);
    const failure = new Error("store failed");
    vi.mocked(secretsApi.createMyUserSecret).mockRejectedValue(failure);

    await expect(storeProviderApiKey("company-id", "OPENAI_API_KEY", "key")).rejects.toBe(failure);
    expect(secretsApi.removeUserSecretDefinition).toHaveBeenCalledWith("company-id", "definition-id");
  });
});
