import { t } from "@/i18n";
import type {
  WorkspaceOperation,
  WorkspaceReadiness,
  WorkspaceReadinessState,
  WorkspaceRuntimeService,
} from "@paperclipai/shared";

/**
 * Derives the workspace access state the UI shows (PAP-17572).
 *
 * The board cannot read a cloned workspace's protected health directly, so state
 * comes from three server-side facts it *can* see: the live runtime rows, the
 * workspace operation log, and the readiness the control plane reported when it
 * last tried to mint a login handoff.
 *
 * Every state carries one concrete next action. The failure this replaces was a
 * generic "Load failed" (or worse, a green badge) that told an operator nothing
 * about whether to wait, start, repair, or read a log.
 */

export type WorkspaceAccessActionKind =
  | "open"
  | "start"
  | "repair"
  | "view_logs"
  /** Nothing to do but wait for a running operation. */
  | "wait";

export type WorkspaceAccessAction = {
  kind: WorkspaceAccessActionKind;
  label: string;
};

export type WorkspaceAccessNotice = {
  title: string;
  description: string;
  action: WorkspaceAccessAction;
};

export type WorkspaceAccessDisplayState = WorkspaceReadinessState | "stopped";

export type WorkspaceAccessState = {
  state: WorkspaceAccessDisplayState;
  title: string;
  description: string;
  action: WorkspaceAccessAction;
  /** True when a password-independent handoff is the expected way in. */
  handoffAvailable: boolean;
  /** A non-blocking historical failure that is still useful to inspect. */
  secondaryNotice?: WorkspaceAccessNotice;
};

/** What the control plane said the last time a handoff was requested. */
export type WorkspaceLoginHandoffFailureInfo = {
  reason: string;
  detail?: string | null;
  readiness?: WorkspaceReadiness | null;
};

function latestOperation(operations: WorkspaceOperation[], phase: WorkspaceOperation["phase"]) {
  return operations.find((operation) => operation.phase === phase) ?? null;
}

function describeSeedPhase(readiness: WorkspaceReadiness | null | undefined): string | null {
  if (!readiness?.failurePhase && !readiness?.seedPhase) return null;
  return readiness.failurePhase ?? readiness.seedPhase ?? null;
}

function timestampMs(value: Date | string | null | undefined): number | null {
  if (!value) return null;
  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function failedRepairNotice(repair: WorkspaceOperation): WorkspaceAccessNotice {
  const phase = typeof repair.metadata?.repairPhase === "string" ? repair.metadata.repairPhase : null;
  return {
    title: t("workspaceRemainingUi.text9"),
    description: phase
      ? t("workspaceRemainingUi.repairPhase", { phase })
      : t("workspaceRemainingUi.text10"),
    action: { kind: "view_logs", label: t("workspaceRemainingUi.text11") },
  };
}

function failedProvisionNotice(provision: WorkspaceOperation): WorkspaceAccessNotice {
  const phase = typeof provision.metadata?.seedFailurePhase === "string"
    ? provision.metadata.seedFailurePhase
    : null;
  return {
    title: t("workspaceRemainingUi.text12"),
    description: phase
      ? t("workspaceRemainingUi.provisionPhase", { phase })
      : t("workspaceRemainingUi.text13"),
    action: { kind: "view_logs", label: t("workspaceRemainingUi.text14") },
  };
}

const HANDOFF_REASON_COPY: Record<string, string> = {
  get handoff_not_configured() { return t("workspaceRemainingUi.text15"); },
  get no_board_identity() { return t("workspaceRemainingUi.text16"); },
  get runtime_not_running() { return t("workspaceRemainingUi.text17"); },
  get runtime_url_unusable() { return t("workspaceRemainingUi.text18"); },
  get workspace_not_ready() { return t("workspaceRemainingUi.text19"); },
};

const READINESS_FAILURE_COPY: Record<string, string> = {
  get database_unreachable() { return t("workspaceRemainingUi.text20"); },
  get clone_data_missing() { return t("workspaceRemainingUi.text21"); },
  get clone_data_unreadable() { return t("workspaceRemainingUi.text22"); },
  get cloned_membership_missing() { return t("workspaceRemainingUi.text23"); },
  get cloned_identity_unreadable() { return t("workspaceRemainingUi.text24"); },
  get auth_handoff_not_configured() { return t("workspaceRemainingUi.text25"); },
  get seed_manifest_unreadable() { return t("workspaceRemainingUi.text26"); },
};

/**
 * Human cause for a readiness rejection, preferring the specific recorded phase
 * over a generic sentence so the copy names what to fix.
 */
export function describeWorkspaceReadinessCause(
  failure: WorkspaceLoginHandoffFailureInfo | null | undefined,
): string | null {
  if (!failure) return null;
  const phase = describeSeedPhase(failure.readiness);
  if (phase && READINESS_FAILURE_COPY[phase]) return READINESS_FAILURE_COPY[phase];
  if (phase) return t("workspaceRemainingUi.lastPhase", { phase });
  if (failure.detail && READINESS_FAILURE_COPY[failure.detail]) return READINESS_FAILURE_COPY[failure.detail];
  return HANDOFF_REASON_COPY[failure.reason] ?? null;
}

export function resolveWorkspaceAccessState(input: {
  runtimeServices: WorkspaceRuntimeService[] | null | undefined;
  operations: WorkspaceOperation[] | null | undefined;
  handoffFailure?: WorkspaceLoginHandoffFailureInfo | null;
}): WorkspaceAccessState {
  const operations = input.operations ?? [];
  const runtimeServices = input.runtimeServices ?? [];
  const repair = latestOperation(operations, "workspace_repair");
  const provision =
    latestOperation(operations, "workspace_seed")
    ?? latestOperation(operations, "workspace_runtime_provision")
    ?? latestOperation(operations, "workspace_provision");
  const failure = input.handoffFailure ?? null;
  const cause = describeWorkspaceReadinessCause(failure);
  const handoffAvailable = failure?.reason !== "handoff_not_configured" && failure?.reason !== "no_board_identity";
  const servingService = runtimeServices.find(
    (service) => service.status === "running" && service.healthStatus === "healthy" && service.url,
  );
  const startingService = runtimeServices.find(
    (service) => service.status === "provisioning" || service.status === "starting",
  );
  const repairFinishedAt = timestampMs(repair?.finishedAt);
  const servingServiceStartedAt = timestampMs(servingService?.startedAt);
  const provisionFinishedAt = timestampMs(provision?.finishedAt);
  const readinessConfirmsServing = Boolean(servingService && failure?.readiness?.state === "ready");
  const runtimeStartedAfterRepair = repairFinishedAt !== null
    && servingServiceStartedAt !== null
    && repairFinishedAt < servingServiceStartedAt;
  const repairFailureWasSuperseded = repair?.status === "failed" && Boolean(
    servingService
    && (readinessConfirmsServing || runtimeStartedAfterRepair),
  );
  const successfulRepairFinishedAt = repair?.status === "succeeded"
    ? timestampMs(repair.finishedAt)
    : null;
  // A failed seed is historical once the workspace is demonstrably serving,
  // or once a later repair has replaced and revalidated that database.
  const provisionFailureWasSuperseded = provision?.status === "failed" && Boolean(
    servingService
    || (
      provisionFinishedAt !== null
      && successfulRepairFinishedAt !== null
      && provisionFinishedAt < successfulRepairFinishedAt
    ),
  );
  const secondaryNotice = repair?.status === "failed" && repairFailureWasSuperseded
    ? failedRepairNotice(repair)
    : provision?.status === "failed" && provisionFailureWasSuperseded
      ? failedProvisionNotice(provision)
      : undefined;

  // A live repair outranks everything: it is already changing the answer.
  if (repair?.status === "running") {
    const phase = typeof repair.metadata?.repairPhase === "string" ? repair.metadata.repairPhase : null;
    return {
      state: "repairing",
      title: t("workspaceRemainingUi.text27"),
      description: phase
        ? t("workspaceRemainingUi.repairingPhase", { phase })
        : t("workspaceRemainingUi.text28"),
      action: { kind: "wait", label: t("workspaceRemainingUi.text29") },
      handoffAvailable,
    };
  }
  if (repair?.status === "failed" && !repairFailureWasSuperseded) {
    const notice = failedRepairNotice(repair);
    return {
      state: "failed",
      ...notice,
      handoffAvailable,
    };
  }

  if (provision?.status === "running") {
    return {
      state: "provisioning",
      title: t("workspaceRemainingUi.text30"),
      description: t("workspaceRemainingUi.text31"),
      action: { kind: "wait", label: t("workspaceRemainingUi.text1") },
      handoffAvailable,
    };
  }
  if (provision?.status === "failed" && !provisionFailureWasSuperseded) {
    const seedPhase = typeof provision.metadata?.seedFailurePhase === "string"
      ? provision.metadata.seedFailurePhase
      : null;
    return {
      state: "failed",
      title: t("workspaceRemainingUi.text12"),
      description: seedPhase
        ? t("workspaceRemainingUi.clonePhase", { phase: seedPhase })
        : t("workspaceRemainingUi.text32"),
      action: { kind: "repair", label: t("workspaceRemainingUi.text33") },
      handoffAvailable,
    };
  }

  // Readiness the control plane actually observed beats anything inferred from
  // runtime rows, because it is the only signal that looked inside the clone.
  const staleNotReadyFailure = failure?.reason === "workspace_not_ready" && readinessConfirmsServing;
  if (failure && !staleNotReadyFailure) {
    if (failure.reason === "runtime_not_running" && !servingService && !startingService) {
      return {
        state: "stopped",
        title: t("workspaceRemainingUi.text34"),
        description: t("workspaceRemainingUi.text35"),
        action: { kind: "start", label: t("workspaceRemainingUi.text36") },
        handoffAvailable,
      };
    }
    if (failure.reason === "workspace_not_ready" || failure.reason === "runtime_url_unusable") {
      const readinessState = failure.readiness?.state;
      const validating = readinessState === "validating" || readinessState === "provisioning";
      return {
        state: validating ? "validating" : "degraded",
        title: validating ? t("workspaceRemainingUi.text2") : t("workspaceRemainingUi.text37"),
        description: [
          cause ?? t("workspaceRemainingUi.text38"),
          validating ? t("workspaceRemainingUi.text39") : t("workspaceRemainingUi.text40"),
        ].join(" "),
        action: validating
          ? { kind: "wait", label: t("workspaceRemainingUi.text41") }
          : { kind: "repair", label: t("workspaceRemainingUi.text33") },
        handoffAvailable,
      };
    }
    if (!handoffAvailable) {
      return {
        state: servingService ? "ready" : "degraded",
        title: servingService ? t("workspaceRemainingUi.text42") : t("workspaceRemainingUi.text37"),
        description: cause ?? t("workspaceRemainingUi.text43"),
        action: servingService
          ? { kind: "open", label: t("workspaceRemainingUi.text44") }
          : { kind: "start", label: t("workspaceRemainingUi.text36") },
        handoffAvailable: false,
        secondaryNotice,
      };
    }
  }

  if (startingService) {
    return {
      state: "provisioning",
      title: t("workspaceRemainingUi.text45"),
      description: t("workspaceRemainingUi.text46"),
      action: { kind: "wait", label: t("workspaceRemainingUi.text47") },
      handoffAvailable,
    };
  }

  if (servingService) {
    return {
      state: "ready",
      title: t("workspaceRemainingUi.text3"),
      description: t("workspaceRemainingUi.text48"),
      action: { kind: "open", label: t("workspaceRemainingUi.text44") },
      handoffAvailable,
      secondaryNotice,
    };
  }

  const unhealthyService = runtimeServices.find(
    (service) => service.status === "running" && service.healthStatus !== "healthy",
  );
  if (unhealthyService) {
    return {
      state: "degraded",
      title: t("workspaceRemainingUi.text37"),
      description: cause
        ?? t("workspaceRemainingUi.text49"),
      action: { kind: "repair", label: t("workspaceRemainingUi.text33") },
      handoffAvailable,
    };
  }

  return {
    state: "stopped",
    title: t("workspaceRemainingUi.text34"),
    description: t("workspaceRemainingUi.text35"),
    action: { kind: "start", label: t("workspaceRemainingUi.text36") },
    handoffAvailable,
  };
}
