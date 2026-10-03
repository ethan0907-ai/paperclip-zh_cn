import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  agents, chatConversations, chatEndpoints, chatExternalPrincipals, chatIdentityLinks,
  chatPublications, companies, companyMemberships, createDb, documents, issueComments,
  issueDocuments, issues, routineRevisions, routineRuns, routines, toolApplications, toolConnections,
} from "@paperclipai/db";
import { routineRevisionSnapshotSchema } from "@paperclipai/shared";
import { getEmbeddedPostgresTestSupport, startEmbeddedPostgresTestDatabase } from "./helpers/embedded-postgres.js";
import { authorizeRoutineTelegramDelivery, authorizeRoutineTelegramPublication, routineTelegramDeliveryService } from "../services/routine-telegram-delivery.js";
import { routineService } from "../services/routines.js";

const support = await getEmbeddedPostgresTestSupport();
const dbDescribe = support.supported ? describe.sequential : describe.skip;
dbDescribe("routine Telegram delivery", () => {
  let database: Awaited<ReturnType<typeof startEmbeddedPostgresTestDatabase>>;
  let db: ReturnType<typeof createDb>;
  beforeAll(async () => {
    database = await startEmbeddedPostgresTestDatabase("routine-telegram-");
    db = createDb(database.connectionString);
  }, 20_000);
  afterAll(async () => { await database?.cleanup(); });
  afterEach(async () => { await db.update(routines).set({ status: "paused" }); });

  async function fixture() {
    const userId = randomUUID();
    const [company] = await db.insert(companies).values({ name: "666", issuePrefix: `T${randomUUID().slice(0, 6)}`, defaultResponsibleUserId: userId }).returning();
    const companyId = company.id;
    await db.insert(companyMemberships).values({ companyId, principalType: "user", principalId: userId });
    const [agent] = await db.insert(agents).values({ companyId, name: "CTO", role: "cto", adapterType: "process", status: "idle" }).returning();
    const [app] = await db.insert(toolApplications).values({ companyId, name: "Telegram", type: "connector" }).returning();
    const [connection] = await db.insert(toolConnections).values({ companyId, applicationId: app.id, name: "Telegram", uid: randomUUID(), transport: "chat_sdk", connectionPurpose: "channel" }).returning();
    const [endpoint] = await db.insert(chatEndpoints).values({ companyId, connectionId: connection.id, assignedAgentId: agent.id, provider: "telegram", providerAccountId: "bot", publicId: randomUUID(), status: "active" }).returning();
    const [conversationIssue] = await db.insert(issues).values({ companyId, title: "Telegram", responsibleUserId: userId }).returning();
    const [conversation] = await db.insert(chatConversations).values({ companyId, endpointId: endpoint.id, issueId: conversationIssue.id, externalConversationId: "telegram:12345", externalThreadId: "telegram:12345", externalLabel: "Owner", isDirectMessage: true }).returning();
    const [principal] = await db.insert(chatExternalPrincipals).values({ companyId, provider: "telegram", providerAccountId: "bot", externalId: "12345" }).returning();
    const [identity] = await db.insert(chatIdentityLinks).values({ companyId, endpointId: endpoint.id, principalId: principal.id, paperclipUserId: userId, status: "linked" }).returning();
    const destination = { endpointId: endpoint.id, conversationId: conversation.id };
    const svc = routineService(db, { heartbeat: { wakeup: async () => null } });
    const routine = await svc.create(companyId, { title: "666 daily report", telegramDelivery: destination, assigneeAgentId: agent.id, status: "active", priority: "medium", concurrencyPolicy: "coalesce_if_active", catchUpPolicy: "skip_missed", variables: [] }, { userId });
    const [issue] = await db.insert(issues).values({ companyId, title: "666 daily report", status: "done", assigneeAgentId: agent.id, responsibleUserId: userId, identifier: `${company.issuePrefix}-1` }).returning();
    const [run] = await db.insert(routineRuns).values({ companyId, routineId: routine.id, routineRevisionId: routine.latestRevisionId, source: "schedule", status: "completed", linkedIssueId: issue.id, completedAt: new Date() }).returning();
    const publish = vi.fn(async (endpointId, conversationId, body, key) => {
      const [publication] = await db.insert(chatPublications).values({ companyId, endpointId, conversationId, issueId: conversationIssue.id,
        idempotencyKey: `explicit-board:${endpointId}:${conversationId}:${key}`,
        payload: { schemaVersion: 1, classification: "external", source: "explicit_board_send", text: body }, state: "pending" }).returning();
      return { ...publication, publications: [] } as any;
    });
    return { companyId, userId, agent, endpoint, conversation, identity, destination, svc, routine, issue, run, publish, delivery: routineTelegramDeliveryService(db, publish) };
  }

  it("enrolls only the board user's own linked company DM and persists revision consent", async () => {
    const f = await fixture();
    expect(f.routine.telegramDelivery).toEqual({ ...f.destination, authorizedUserId: f.userId });
    const [revision] = await db.select().from(routineRevisions).where(eq(routineRevisions.id, f.routine.latestRevisionId!));
    expect(routineRevisionSnapshotSchema.parse(revision.snapshot).routine.telegramDelivery).toEqual(f.routine.telegramDelivery);
    await expect(authorizeRoutineTelegramDelivery(db, f.companyId, f.destination, { agentId: f.agent.id })).rejects.toMatchObject({ status: 403 });
    await expect(authorizeRoutineTelegramDelivery(db, randomUUID(), f.destination, { userId: f.userId })).rejects.toMatchObject({ status: 422 });
    await expect(authorizeRoutineTelegramDelivery(db, f.companyId, f.destination, { userId: randomUUID() })).rejects.toMatchObject({ status: 422 });
    await db.update(chatConversations).set({ isDirectMessage: false }).where(eq(chatConversations.id, f.conversation.id));
    await expect(authorizeRoutineTelegramDelivery(db, f.companyId, f.destination, { userId: f.userId })).rejects.toMatchObject({ status: 422 });
  });

  it("rejects agent recipient updates and restoring an enrolled revision", async () => {
    const f = await fixture();
    await expect(f.svc.update(f.routine.id, { telegramDelivery: null }, { agentId: f.agent.id })).rejects.toMatchObject({ status: 403 });
    await f.svc.update(f.routine.id, { telegramDelivery: null }, { userId: f.userId });
    await expect(f.svc.restoreRevision(f.routine.id, f.routine.latestRevisionId!, { agentId: f.agent.id })).rejects.toMatchObject({ status: 403 });
  });

  it("sends the result once, resumes after restart, and sends the next daily run", async () => {
    const f = await fixture();
    await db.insert(issueComments).values({ companyId: f.companyId, issueId: f.issue.id, authorAgentId: f.agent.id, body: "Fallback report" });
    const [document] = await db.insert(documents).values({ companyId: f.companyId, latestBody: "今日完成：6 项。待审批：部署目标。" }).returning();
    await db.insert(issueDocuments).values({ companyId: f.companyId, issueId: f.issue.id, documentId: document.id, key: "result" });
    expect(await f.delivery.sweep()).toEqual({ queued: 1 });
    expect(f.publish.mock.calls[0][2]).toContain(document.latestBody);
    expect(f.publish.mock.calls[0][2]).not.toContain("Fallback report");
    expect(await routineTelegramDeliveryService(db, f.publish).sweep()).toEqual({ queued: 0 });
    await db.insert(routineRuns).values({ companyId: f.companyId, routineId: f.routine.id, routineRevisionId: f.routine.latestRevisionId, source: "schedule", status: "completed", linkedIssueId: f.issue.id, completedAt: new Date() });
    expect(await f.delivery.sweep()).toEqual({ queued: 1 });
    expect(f.publish).toHaveBeenCalledTimes(2);
    expect(f.publish.mock.calls[0][3]).not.toBe(f.publish.mock.calls[1][3]);
  });

  it("uses the final agent comment, excludes deleted comments and does not send unfinished runs", async () => {
    const f = await fixture();
    await db.insert(issueComments).values({ companyId: f.companyId, issueId: f.issue.id, authorAgentId: f.agent.id, body: "Completed report", createdAt: new Date(1) });
    await db.insert(issueComments).values({ companyId: f.companyId, issueId: f.issue.id, authorAgentId: f.agent.id, body: "Deleted", deletedAt: new Date() });
    await db.update(routineRuns).set({ status: "issue_created" }).where(eq(routineRuns.id, f.run.id));
    expect(await f.delivery.sweep()).toEqual({ queued: 0 });
    await db.update(routineRuns).set({ status: "completed" }).where(eq(routineRuns.id, f.run.id));
    expect(await f.delivery.sweep()).toEqual({ queued: 1 });
    expect(f.publish.mock.calls[0][2]).toContain("Completed report");
    expect(f.publish.mock.calls[0][2]).not.toContain("Deleted");
  });

  it("does not backfill unconfigured revisions or retarget historical reports", async () => {
    const f = await fixture();
    const [revision] = await db.select().from(routineRevisions).where(eq(routineRevisions.id, f.routine.latestRevisionId!));
    await db.update(routineRevisions).set({ snapshot: { ...revision.snapshot, routine: { ...revision.snapshot.routine, telegramDelivery: null } } }).where(eq(routineRevisions.id, revision.id));
    expect(await f.delivery.sweep()).toEqual({ queued: 0 });
    await db.update(routineRevisions).set({ snapshot: revision.snapshot }).where(eq(routineRevisions.id, revision.id));
    await db.update(routines).set({ telegramDelivery: { ...f.routine.telegramDelivery!, conversationId: randomUUID() } }).where(eq(routines.id, f.routine.id));
    expect(await f.delivery.sweep()).toEqual({ queued: 0 });
  });

  it("rechecks consent before transport; unlinking, pausing or removing membership stops sends", async () => {
    const f = await fixture();
    await f.delivery.sweep();
    const [publication] = await db.select().from(chatPublications).where(eq(chatPublications.companyId, f.companyId));
    expect(await authorizeRoutineTelegramPublication(db, publication)).toBe(true);
    await db.update(chatIdentityLinks).set({ status: "revoked" }).where(eq(chatIdentityLinks.id, f.identity.id));
    expect(await authorizeRoutineTelegramPublication(db, publication)).toBe(false);
    await db.update(chatIdentityLinks).set({ status: "linked" }).where(eq(chatIdentityLinks.id, f.identity.id));
    await db.update(routines).set({ status: "paused" }).where(eq(routines.id, f.routine.id));
    expect(await authorizeRoutineTelegramPublication(db, publication)).toBe(false);
    await db.update(routines).set({ status: "active" }).where(eq(routines.id, f.routine.id));
    await db.delete(companyMemberships).where(eq(companyMemberships.companyId, f.companyId));
    expect(await authorizeRoutineTelegramPublication(db, publication)).toBe(false);
  });
});
