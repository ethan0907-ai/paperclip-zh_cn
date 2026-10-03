import { and, asc, desc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import {
  chatConversations, chatEndpoints, chatExternalPrincipals, chatIdentityLinks,
  chatPublications, companyMemberships, companies, documents, issueComments,
  issueDocuments, issues, routineRevisions, routineRuns, routines,
  type Db,
} from "@paperclipai/db";
import { routineRevisionSnapshotSchema, type RoutineTelegramDelivery } from "@paperclipai/shared";
import { forbidden, unprocessable } from "../errors.js";
import { logger } from "../middleware/logger.js";
import type { chatChannelService } from "./chat-channels.js";
import { runtimePublicOrigin } from "./cloud-runtime-identity.js";

type Destination = Pick<RoutineTelegramDelivery, "endpointId" | "conversationId">;

// Enrollment is explicit board consent to send reports to that user's linked DM.
// Repeat this check at delivery time, so unlinking or removal revokes the grant.
export async function authorizeRoutineTelegramDelivery(
  db: Db, companyId: string, destination: Destination | null,
  actor: { userId?: string | null; agentId?: string | null },
): Promise<RoutineTelegramDelivery | null> {
  if (actor.agentId || !actor.userId) throw forbidden("Only a board user can configure Telegram report delivery");
  if (!destination) return null;
  const userId = actor.userId;
  const [recipient] = await db.select({ id: chatConversations.id })
    .from(chatConversations)
    .innerJoin(chatEndpoints, and(
      eq(chatEndpoints.id, chatConversations.endpointId),
      eq(chatEndpoints.companyId, chatConversations.companyId),
    ))
    .innerJoin(chatExternalPrincipals, and(
      eq(chatExternalPrincipals.companyId, companyId),
      eq(chatExternalPrincipals.provider, "telegram"),
      eq(chatExternalPrincipals.providerAccountId, chatEndpoints.providerAccountId),
      sql`${chatConversations.externalConversationId} = 'telegram:' || ${chatExternalPrincipals.externalId}`,
      eq(chatExternalPrincipals.isBot, false),
    ))
    .innerJoin(chatIdentityLinks, and(
      eq(chatIdentityLinks.companyId, companyId),
      eq(chatIdentityLinks.endpointId, chatEndpoints.id),
      eq(chatIdentityLinks.principalId, chatExternalPrincipals.id),
      eq(chatIdentityLinks.paperclipUserId, userId),
      eq(chatIdentityLinks.status, "linked"),
    ))
    .innerJoin(companyMemberships, and(
      eq(companyMemberships.companyId, companyId),
      eq(companyMemberships.principalType, "user"),
      eq(companyMemberships.principalId, userId),
      eq(companyMemberships.status, "active"),
    ))
    .where(and(
      eq(chatConversations.companyId, companyId),
      eq(chatConversations.id, destination.conversationId),
      eq(chatConversations.endpointId, destination.endpointId),
      eq(chatConversations.isDirectMessage, true),
      inArray(chatConversations.state, ["active", "waiting", "completed"]),
      eq(chatEndpoints.provider, "telegram"),
      eq(chatEndpoints.status, "active"),
      eq(chatEndpoints.allowDirectMessages, true),
    )).limit(1);
  if (!recipient) throw unprocessable("Select an active Telegram direct conversation linked to your company user");
  return { ...destination, authorizedUserId: userId };
}

export async function authorizeRoutineTelegramPublication(db: Db, publication: typeof chatPublications.$inferSelect) {
  const runId = publication.idempotencyKey.match(/:routine-run:([0-9a-f-]{36})$/)?.[1];
  if (!runId) return true;
  const [entry] = await db.select({ snapshot: routineRevisions.snapshot, current: routines.telegramDelivery, status: routines.status })
    .from(routineRuns)
    .innerJoin(routines, and(eq(routines.id, routineRuns.routineId), eq(routines.companyId, publication.companyId)))
    .innerJoin(routineRevisions, and(eq(routineRevisions.id, routineRuns.routineRevisionId), eq(routineRevisions.companyId, publication.companyId)))
    .where(and(eq(routineRuns.id, runId), eq(routineRuns.companyId, publication.companyId), eq(routineRuns.status, "completed")));
  if (!entry || entry.status !== "active") return false;
  const parsed = routineRevisionSnapshotSchema.safeParse(entry.snapshot);
  const target = parsed.success ? parsed.data.routine.telegramDelivery : null;
  if (!target || !entry.current || target.endpointId !== publication.endpointId || target.conversationId !== publication.conversationId
    || target.endpointId !== entry.current.endpointId || target.conversationId !== entry.current.conversationId
    || target.authorizedUserId !== entry.current.authorizedUserId) return false;
  try {
    await authorizeRoutineTelegramDelivery(db, publication.companyId, target, { userId: target.authorizedUserId });
    return true;
  } catch { return false; }
}

export function routineTelegramDeliveryService(
  db: Db,
  publish: ReturnType<typeof chatChannelService>["publishBoardMessage"],
) {
  return {
    // The existing scheduler provides the restart backstop; the durable outbox
    // key also serializes simultaneous sweeps and retries without duplicate sends.
    sweep: async () => {
      const pending = await db.select({ run: routineRuns, routine: routines, snapshot: routineRevisions.snapshot })
        .from(routineRuns)
        .innerJoin(routines, and(eq(routines.id, routineRuns.routineId), eq(routines.companyId, routineRuns.companyId)))
        .innerJoin(routineRevisions, and(eq(routineRevisions.id, routineRuns.routineRevisionId), eq(routineRevisions.companyId, routineRuns.companyId)))
        .where(and(
          eq(routineRuns.status, "completed"), eq(routines.status, "active"),
          isNotNull(routineRuns.linkedIssueId), isNotNull(routines.telegramDelivery),
          sql`${routineRevisions.snapshot}->'routine'->'telegramDelivery'->>'conversationId' is not null`,
          sql`not exists (select 1 from ${chatPublications} where ${chatPublications.companyId} = ${routineRuns.companyId}
            and ${chatPublications.idempotencyKey} = 'explicit-board:' ||
            (${routineRevisions.snapshot}->'routine'->'telegramDelivery'->>'endpointId') || ':' ||
            (${routineRevisions.snapshot}->'routine'->'telegramDelivery'->>'conversationId') || ':routine-run:' || ${routineRuns.id}::text)`,
        )).orderBy(asc(routineRuns.completedAt)).limit(50);
      let queued = 0;
      for (const { run, routine, snapshot } of pending) {
        try {
          const destination = routineRevisionSnapshotSchema.parse(snapshot).routine.telegramDelivery;
          const current = routine.telegramDelivery;
          if (!destination || !current || current.endpointId !== destination.endpointId
            || current.conversationId !== destination.conversationId || current.authorizedUserId !== destination.authorizedUserId) continue;
          await authorizeRoutineTelegramDelivery(db, run.companyId, destination, { userId: destination.authorizedUserId });
          const [issue] = await db.select().from(issues).where(and(
            eq(issues.id, run.linkedIssueId!), eq(issues.companyId, run.companyId), eq(issues.status, "done"),
          ));
          if (!issue) continue;
          const [result] = await db.select({ body: documents.latestBody }).from(issueDocuments)
            .innerJoin(documents, and(eq(documents.id, issueDocuments.documentId), eq(documents.companyId, run.companyId)))
            .where(and(eq(issueDocuments.companyId, run.companyId), eq(issueDocuments.issueId, issue.id), eq(issueDocuments.key, "result")));
          const [comment] = result ? [] : await db.select({ body: issueComments.body }).from(issueComments)
            .where(and(eq(issueComments.companyId, run.companyId), eq(issueComments.issueId, issue.id), eq(issueComments.authorAgentId, issue.assigneeAgentId!), isNull(issueComments.deletedAt)))
            .orderBy(desc(issueComments.createdAt)).limit(1);
          const [company] = await db.select({ issuePrefix: companies.issuePrefix }).from(companies).where(eq(companies.id, run.companyId));
          const origin = runtimePublicOrigin();
          const link = origin && company ? `${origin.replace(/\/$/, "")}/${company.issuePrefix}/issues/${issue.identifier ?? issue.id}` : null;
          const body = `${issue.title}\n\n${result?.body || comment?.body || "Report completed."}${link ? `\n\n${link}` : ""}`;
          await publish(destination.endpointId, destination.conversationId, body, `routine-run:${run.id}`, destination.authorizedUserId, [], { routineId: routine.id, runId: run.id });
          queued++;
        } catch (err) {
          logger.warn({ err, routineRunId: run.id }, "routine Telegram report delivery deferred");
        }
      }
      return { queued };
    },
  };
}
