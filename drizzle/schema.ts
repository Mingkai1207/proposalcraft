import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  boolean,
  bigint,
  serial,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const planEnum = pgEnum("plan", ["free", "starter", "pro"]);
export const tradeTypeEnum = pgEnum("tradeType", ["hvac", "plumbing", "electrical", "roofing", "general", "painting", "flooring", "landscaping", "carpentry", "concrete", "masonry", "insulation", "drywall", "windows", "solar"]);
export const statusEnum = pgEnum("status", ["draft", "sent", "viewed", "accepted", "declined"]);
export const eventTypeEnum = pgEnum("eventType", ["sent", "opened", "clicked", "follow_up_opened"]);
export const sourceTypeEnum = pgEnum("sourceType", ["saved_from_proposal", "uploaded"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  verificationToken: varchar("verificationToken", { length: 128 }),
  verificationTokenExpiresAt: bigint("verificationTokenExpiresAt", { mode: "number" }),
  passwordResetToken: varchar("passwordResetToken", { length: 128 }),
  passwordResetTokenExpiresAt: bigint("passwordResetTokenExpiresAt", { mode: "number" }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdateFn(() => new Date()),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Contractor business profile / branding
export const contractorProfiles = pgTable("contractor_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  businessName: varchar("businessName", { length: 255 }),
  ownerName: varchar("ownerName", { length: 255 }),
  phone: varchar("phone", { length: 64 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  licenseNumber: varchar("licenseNumber", { length: 128 }),
  logoUrl: text("logoUrl"),
  website: varchar("website", { length: 512 }),
  defaultTerms: text("defaultTerms"),
  preferredModel: varchar("preferredModel", { length: 128 }).default("claude-sonnet-4-6-thinking").notNull(),
  smtpHost: varchar("smtpHost", { length: 255 }),
  smtpPort: integer("smtpPort"),
  smtpUsername: varchar("smtpUsername", { length: 255 }),
  smtpPassword: text("smtpPassword"),
  smtpFromEmail: varchar("smtpFromEmail", { length: 320 }),
  smtpFromName: varchar("smtpFromName", { length: 255 }),
  followUpTemplate: text("followUpTemplate"),
  onboardingCompleted: boolean("onboardingCompleted").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdateFn(() => new Date()),
});

export type ContractorProfile = typeof contractorProfiles.$inferSelect;
export type InsertContractorProfile = typeof contractorProfiles.$inferInsert;

// Subscription plans
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  plan: planEnum("plan").default("free").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }),
  stripeCurrentPeriodEnd: bigint("stripeCurrentPeriodEnd", { mode: "number" }),
  proposalsUsedThisMonth: integer("proposalsUsedThisMonth").default(0).notNull(),
  usageResetAt: timestamp("usageResetAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdateFn(() => new Date()),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// Proposals
export const proposals = pgTable("proposals", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  tradeType: tradeTypeEnum("tradeType").notNull(),
  clientName: varchar("clientName", { length: 255 }),
  clientEmail: varchar("clientEmail", { length: 320 }),
  clientAddress: text("clientAddress"),
  jobScope: text("jobScope").notNull(),
  materials: text("materials"),
  laborCost: varchar("laborCost", { length: 64 }),
  materialsCost: varchar("materialsCost", { length: 64 }),
  totalCost: varchar("totalCost", { length: 64 }),
  generatedContent: text("generatedContent"),
  summaryContent: text("summaryContent"),
  stylePreferences: text("stylePreferences"),
  pdfUrl: text("pdfUrl"),
  wordUrl: text("wordUrl"),
  googleDocUrl: text("googleDocUrl"),
  templateId: varchar("templateId", { length: 128 }),
  templateFields: text("templateFields"),
  status: statusEnum("status").default("draft").notNull(),
  trackingToken: varchar("trackingToken", { length: 128 }).unique(),
  sentAt: timestamp("sentAt"),
  viewedAt: timestamp("viewedAt"),
  followUpOpenedAt: timestamp("followUpOpenedAt"),
  followUpSentAt: timestamp("followUpSentAt"),
  expiryDays: integer("expiryDays").default(30),
  acceptedAt: timestamp("acceptedAt"),
  declinedAt: timestamp("declinedAt"),
  clientPortalToken: varchar("clientPortalToken", { length: 64 }).unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdateFn(() => new Date()),
});

export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = typeof proposals.$inferInsert;

// Shareable proposal links
export const shareTokens = pgTable("share_tokens", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposalId").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ShareToken = typeof shareTokens.$inferSelect;
export type InsertShareToken = typeof shareTokens.$inferInsert;

// Email tracking events
export const emailEvents = pgTable("email_events", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposalId").notNull(),
  eventType: eventTypeEnum("eventType").notNull(),
  ipAddress: varchar("ipAddress", { length: 64 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailEvent = typeof emailEvents.$inferSelect;
export type InsertEmailEvent = typeof emailEvents.$inferInsert;

// Proposal templates for quick reuse
export const proposalTemplates = pgTable("proposal_templates", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  tradeType: varchar("tradeType", { length: 64 }).notNull(),
  description: text("description"),
  content: text("content").notNull(),
  styleMetadata: text("styleMetadata"),
  clientName: varchar("clientName", { length: 255 }),
  clientAddress: varchar("clientAddress", { length: 512 }),
  jobScope: text("jobScope"),
  materials: text("materials"),
  laborCost: varchar("laborCost", { length: 64 }),
  materialsCost: varchar("materialsCost", { length: 64 }),
  totalCost: varchar("totalCost", { length: 64 }),
  language: varchar("language", { length: 64 }).default("english"),
  expiryDays: integer("expiryDays").default(30),
  sourceType: sourceTypeEnum("sourceType").default("saved_from_proposal").notNull(),
  originalFileUrl: text("originalFileUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdateFn(() => new Date()),
});

export type ProposalTemplate = typeof proposalTemplates.$inferSelect;
export type InsertProposalTemplate = typeof proposalTemplates.$inferInsert;

// Proposal version history
export const proposalVersions = pgTable("proposal_versions", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposalId").notNull().references(() => proposals.id, { onDelete: "cascade" }),
  versionNumber: integer("versionNumber").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  clientName: varchar("clientName", { length: 255 }),
  clientEmail: varchar("clientEmail", { length: 255 }),
  jobScope: text("jobScope"),
  materials: text("materials"),
  laborCost: varchar("laborCost", { length: 64 }),
  materialsCost: varchar("materialsCost", { length: 64 }),
  totalCost: varchar("totalCost", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProposalVersion = typeof proposalVersions.$inferSelect;
export type InsertProposalVersion = typeof proposalVersions.$inferInsert;

// Client feedback on declined proposals
export const clientFeedback = pgTable("client_feedback", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposalId").notNull().references(() => proposals.id, { onDelete: "cascade" }),
  reason: varchar("reason", { length: 255 }),
  comments: text("comments"),
  rating: integer("rating"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ClientFeedback = typeof clientFeedback.$inferSelect;
export type InsertClientFeedback = typeof clientFeedback.$inferInsert;
