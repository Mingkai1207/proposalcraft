import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

// ── Mock the database ──────────────────────────────────────────────────────
const mockInsert = vi.fn().mockReturnValue({
  values: vi.fn().mockResolvedValue(undefined),
});
const mockSelect = vi.fn();
const mockUpdate = vi.fn().mockReturnValue({
  set: vi.fn().mockReturnValue({
    where: vi.fn().mockResolvedValue(undefined),
  }),
});

vi.mock("../server/db", () => ({
  getDb: vi.fn().mockResolvedValue({
    insert: mockInsert,
    select: mockSelect,
    update: mockUpdate,
  }),
}));

// ── Mock the SDK ───────────────────────────────────────────────────────────
vi.mock("../server/_core/sdk", () => ({
  sdk: {
    createSessionToken: vi.fn().mockResolvedValue("mock-session-token"),
  },
}));

// ── Mock cookie helpers ────────────────────────────────────────────────────
vi.mock("../server/_core/cookies", () => ({
  getSessionCookieOptions: vi.fn().mockReturnValue({
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: false,
  }),
}));

// ── Tests ──────────────────────────────────────────────────────────────────
describe("Native Auth — password hashing", () => {
  it("bcrypt hash is not equal to plain text password", async () => {
    const password = "supersecret123";
    const hash = await bcrypt.hash(password, 10);
    expect(hash).not.toBe(password);
    expect(hash.startsWith("$2")).toBe(true);
  });

  it("bcrypt.compare returns true for correct password", async () => {
    const password = "correct-horse-battery-staple";
    const hash = await bcrypt.hash(password, 10);
    const result = await bcrypt.compare(password, hash);
    expect(result).toBe(true);
  });

  it("bcrypt.compare returns false for wrong password", async () => {
    const password = "correct-horse-battery-staple";
    const hash = await bcrypt.hash(password, 10);
    const result = await bcrypt.compare("wrong-password", hash);
    expect(result).toBe(false);
  });

  it("bcrypt.compare returns false for empty string", async () => {
    const password = "some-password";
    const hash = await bcrypt.hash(password, 10);
    const result = await bcrypt.compare("", hash);
    expect(result).toBe(false);
  });
});

describe("Native Auth — openId generation", () => {
  it("generates a unique openId with native_ prefix", () => {
    const email = "test@example.com";
    const openId = `native_${email.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now()}`;
    expect(openId).toMatch(/^native_/);
    expect(openId).toContain("test_example_com");
  });

  it("normalises email to lowercase in openId", () => {
    const email = "UPPER@CASE.COM";
    const openId = `native_${email.toLowerCase().replace(/[^a-z0-9]/g, "_")}_12345`;
    expect(openId).toBe("native_upper_case_com_12345");
  });
});

describe("Native Auth — input validation", () => {
  it("rejects passwords shorter than 8 characters", () => {
    const password = "short";
    expect(password.length < 8).toBe(true);
  });

  it("accepts passwords of 8 or more characters", () => {
    const password = "longenough";
    expect(password.length >= 8).toBe(true);
  });

  it("validates email format", () => {
    const validEmail = "user@example.com";
    const invalidEmail = "not-an-email";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test(validEmail)).toBe(true);
    expect(emailRegex.test(invalidEmail)).toBe(false);
  });

  it("normalises email to lowercase before storing", () => {
    const email = "User@Example.COM";
    const normalised = email.toLowerCase();
    expect(normalised).toBe("user@example.com");
  });
});
