import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database helpers to avoid real DB calls in unit tests
vi.mock("./db", () => ({
  getContractorProfile: vi.fn().mockResolvedValue(null),
  upsertContractorProfile: vi.fn().mockResolvedValue({ userId: 1 }),
  ensureSubscription: vi.fn().mockResolvedValue({
    userId: 1,
    plan: "free",
    proposalsUsedThisMonth: 0,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
  }),
  updateSubscription: vi.fn().mockResolvedValue(undefined),
  getPlanLimit: vi.fn().mockReturnValue(3),
  getProposalsByUser: vi.fn().mockResolvedValue([]),
  getUserProposals: vi.fn().mockResolvedValue([]),
  getProposalById: vi.fn().mockResolvedValue(null),
  getProposalByToken: vi.fn().mockResolvedValue(null),
  createProposal: vi.fn().mockResolvedValue({ id: 1 }),
  updateProposal: vi.fn().mockResolvedValue(undefined),
  deleteProposal: vi.fn().mockResolvedValue(undefined),
  createEmailEvent: vi.fn().mockResolvedValue(undefined),
  getEmailEventsByProposal: vi.fn().mockResolvedValue([]),
}));

// Mock LLM to avoid real API calls
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "# Test Proposal\n\nThis is a test proposal." } }],
  }),
}));

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://cdn.example.com/test.png", key: "test.png" }),
}));

function createMockContext(overrides?: Partial<TrpcContext>): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user-123",
      email: "contractor@test.com",
      name: "Test Contractor",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: { origin: "https://test.proposalcraft.ai" },
      ip: "127.0.0.1",
      socket: { remoteAddress: "127.0.0.1" },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
    ...overrides,
  };
}

describe("auth", () => {
  it("returns the current user from auth.me", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user?.email).toBe("contractor@test.com");
    expect(user?.name).toBe("Test Contractor");
  });

  it("clears cookie on logout", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});

describe("subscription", () => {
  it("returns subscription data with plan limit", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const sub = await caller.subscription.get();
    expect(sub).not.toBeNull();
    expect(sub?.plan).toBe("free");
    expect(sub?.limit).toBe(3);
  });

  it("returns remaining proposals count", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const sub = await caller.subscription.get();
    expect(sub?.remaining).toBe(3); // 3 - 0 used = 3 remaining
  });
});

describe("profile", () => {
  it("returns null profile for new user", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const profile = await caller.profile.get();
    expect(profile).toBeNull();
  });

  it("updates profile successfully", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.profile.update({
      businessName: "Smith HVAC Services",
      phone: "555-1234",
    });
    expect(result).toBeDefined();
  });
});

describe("proposals", () => {
  it("returns empty list for new user", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const proposals = await caller.proposals.list();
    expect(Array.isArray(proposals)).toBe(true);
    expect(proposals.length).toBe(0);
  });

  it("throws NOT_FOUND for non-existent proposal", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.proposals.get({ id: 9999 })).rejects.toThrow();
  });
});

describe("tracking", () => {
  it("returns false for unknown tracking token", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.tracking.recordOpen({ token: "unknown-token-xyz" });
    expect(result.success).toBe(false);
  });
});
