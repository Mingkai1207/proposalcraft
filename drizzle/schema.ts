import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  bigint,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Contractor business profile / branding
export const contractorProfiles = mysqlTable("contractor_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  businessName: varchar("businessName", { length: 255 }),
  ownerName: varchar("ownerName", { length: 255 }),
  phone: varchar("phone", { length: 64 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  licenseNumber: varchar("licenseNumber", { length: 128 }),
  logoUrl: text("logoUrl"),
  website: varchar("website", { length: 512 }),
  defaultTerms: text("defaultTerms"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContractorProfile = typeof contractorProfiles.$inferSelect;
export type InsertContractorProfile = typeof contractorProfiles.$inferInsert;

// Subscription plans
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  plan: mysqlEnum("plan", ["free", "starter", "pro"]).default("free").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }),
  stripeCurrentPeriodEnd: bigint("stripeCurrentPeriodEnd", { mode: "number" }),
  proposalsUsedThisMonth: int("proposalsUsedThisMonth").default(0).notNull(),
  usageResetAt: timestamp("usageResetAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// Proposals
export const proposals = mysqlTable("proposals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  tradeType: mysqlEnum("tradeType", ["hvac", "plumbing", "electrical", "roofing", "general"]).notNull(),
  clientName: varchar("clientName", { length: 255 }),
  clientEmail: varchar("clientEmail", { length: 320 }),
  clientAddress: text("clientAddress"),
  jobScope: text("jobScope").notNull(),
  materials: text("materials"),
  laborCost: varchar("laborCost", { length: 64 }),
  materialsCost: varchar("materialsCost", { length: 64 }),
  totalCost: varchar("totalCost", { length: 64 }),
  generatedContent: text("generatedContent"),
  pdfUrl: text("pdfUrl"),
  status: mysqlEnum("status", ["draft", "sent", "viewed", "accepted", "declined"]).default("draft").notNull(),
  trackingToken: varchar("trackingToken", { length: 128 }).unique(),
  sentAt: timestamp("sentAt"),
  viewedAt: timestamp("viewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = typeof proposals.$inferInsert;

// Email tracking events
export const emailEvents = mysqlTable("email_events", {
  id: int("id").autoincrement().primaryKey(),
  proposalId: int("proposalId").notNull(),
  eventType: mysqlEnum("eventType", ["sent", "opened", "clicked"]).notNull(),
  ipAddress: varchar("ipAddress", { length: 64 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailEvent = typeof emailEvents.$inferSelect;
export type InsertEmailEvent = typeof emailEvents.$inferInsert;
