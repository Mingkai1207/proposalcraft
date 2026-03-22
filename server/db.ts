import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  contractorProfiles,
  InsertContractorProfile,
  proposals,
  InsertProposal,
  subscriptions,
  InsertSubscription,
  emailEvents,
  InsertEmailEvent,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Contractor Profiles ─────────────────────────────────────────────────────

export async function getContractorProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(contractorProfiles).where(eq(contractorProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertContractorProfile(data: InsertContractorProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { userId, ...rest } = data;
  await db.insert(contractorProfiles).values({ userId, ...rest }).onDuplicateKeyUpdate({ set: rest });
  return getContractorProfile(userId);
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export async function getSubscription(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function ensureSubscription(userId: number) {
  const existing = await getSubscription(userId);
  if (existing) return existing;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(subscriptions).values({ userId, plan: "free", proposalsUsedThisMonth: 0, usageResetAt: new Date() });
  return getSubscription(userId);
}

export async function updateSubscription(userId: number, data: Partial<InsertSubscription>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(subscriptions).set(data).where(eq(subscriptions.userId, userId));
  return getSubscription(userId);
}

export async function incrementProposalUsage(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Reset counter if it's a new month
  const sub = await ensureSubscription(userId);
  if (!sub) throw new Error("Subscription not found");
  const now = new Date();
  const resetAt = new Date(sub.usageResetAt);
  if (now.getMonth() !== resetAt.getMonth() || now.getFullYear() !== resetAt.getFullYear()) {
    await db.update(subscriptions).set({ proposalsUsedThisMonth: 1, usageResetAt: now }).where(eq(subscriptions.userId, userId));
  } else {
    await db.update(subscriptions).set({ proposalsUsedThisMonth: sql`${subscriptions.proposalsUsedThisMonth} + 1` }).where(eq(subscriptions.userId, userId));
  }
}

export function getPlanLimit(plan: string): number {
  if (plan === "pro") return Infinity;
  if (plan === "starter") return 20;
  return 3; // free
}

// ─── Proposals ────────────────────────────────────────────────────────────────

export async function createProposal(data: InsertProposal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(proposals).values(data).$returningId();
  return getProposalById(result.id);
}

export async function getProposalById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(proposals).where(eq(proposals.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getProposalByToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(proposals).where(eq(proposals.trackingToken, token)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getUserProposals(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(proposals).where(eq(proposals.userId, userId)).orderBy(desc(proposals.createdAt));
}

export async function updateProposal(id: number, userId: number, data: Partial<InsertProposal>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(proposals).set(data).where(and(eq(proposals.id, id), eq(proposals.userId, userId)));
  return getProposalById(id);
}

export async function deleteProposal(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(proposals).where(and(eq(proposals.id, id), eq(proposals.userId, userId)));
}

// ─── Email Events ─────────────────────────────────────────────────────────────

export async function createEmailEvent(data: InsertEmailEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(emailEvents).values(data);
}

export async function getEmailEventsByProposal(proposalId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emailEvents).where(eq(emailEvents.proposalId, proposalId)).orderBy(desc(emailEvents.createdAt));
}
