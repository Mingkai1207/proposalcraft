import { describe, expect, it, vi } from "vitest";
import {
  authReturnUrl,
  clearPendingAuthReturn,
  getAuthReturn,
  readPendingAuthReturn,
  rememberPendingAuthReturn,
  safeAuthReturn,
} from "../client/src/lib/authReturn";

// Regression: ISSUE-001 - signup discarded the page requested before sign-in.
// Found by /qa on 2026-10-08
// Report: .gstack/qa-reports/qa-report-proposai-org-2026-10-08.md

function createStorage() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
    removeItem: vi.fn((key: string) => values.delete(key)),
  };
}

describe("auth return destination", () => {
  it("keeps the requested page when switching between sign-in and signup", () => {
    const requested = "/proposals/new?template=7#scope";
    const loginSearch = `?return=${encodeURIComponent(requested)}`;
    const registerUrl = authReturnUrl("/register", getAuthReturn(loginSearch));
    const registerSearch = new URL(registerUrl, "https://proposai.example")
      .search;
    const backToLoginUrl = authReturnUrl(
      "/login",
      getAuthReturn(registerSearch)
    );
    const backToLoginSearch = new URL(
      backToLoginUrl,
      "https://proposai.example"
    ).search;

    expect(getAuthReturn(registerSearch)).toBe(requested);
    expect(getAuthReturn(backToLoginSearch)).toBe(requested);
  });

  it("preserves email and the local destination through the check-email link", () => {
    const url = authReturnUrl("/check-your-email", "/proposals/new", {
      email: "contractor+qa@example.test",
    });
    const params = new URL(url, "https://proposai.example").searchParams;

    expect(params.get("email")).toBe("contractor+qa@example.test");
    expect(params.get("return")).toBe("/proposals/new");
  });

  it.each([
    "https://outside.example/path",
    "//outside.example/path",
    "/\\outside.example/path",
    "/proposals\\new",
    "/\n/outside.example",
    "/\r/outside.example",
    "/proposals\u0000new",
    "/proposals\u007fnew",
    "proposals/new",
    "",
    null,
    undefined,
  ])("falls back for an unsafe destination %j", destination => {
    expect(safeAuthReturn(destination)).toBe("/dashboard");
  });

  it("uses an explicit return query before stored pending state", () => {
    expect(getAuthReturn("?return=%2Ftemplates", "/proposals/new")).toBe(
      "/templates"
    );
  });

  it("does not revive pending state for an explicitly unsafe or empty return", () => {
    expect(
      getAuthReturn("?return=%2F%2Foutside.example", "/proposals/new")
    ).toBe("/dashboard");
    expect(getAuthReturn("?return=", "/proposals/new")).toBe("/dashboard");
  });

  it("uses validated pending state only when no return query was supplied", () => {
    expect(getAuthReturn("?token=sample-token", "/proposals/new")).toBe(
      "/proposals/new"
    );
    expect(getAuthReturn("?token=sample-token", "//outside.example")).toBe(
      "/dashboard"
    );
    expect(getAuthReturn("?token=sample-token")).toBe("/dashboard");
  });

  it("cannot put an unsafe return into account-switch links", () => {
    const url = authReturnUrl("/register", "//outside.example");
    expect(
      new URL(url, "https://proposai.example").searchParams.get("return")
    ).toBe("/dashboard");
  });
});

describe("pending verification destination", () => {
  const now = 1000000;
  const ttl = 30 * 60 * 1000;

  it("recovers the target in another verification tab before expiry", () => {
    const storage = createStorage();
    rememberPendingAuthReturn("/proposals/new?template=7", storage, now);

    expect(
      getAuthReturn(
        "?token=sample-token",
        readPendingAuthReturn(storage, now + ttl - 1)
      )
    ).toBe("/proposals/new?template=7");
  });

  it("discards pending state at the exact expiry boundary", () => {
    const storage = createStorage();
    rememberPendingAuthReturn("/proposals/new", storage, now);

    expect(readPendingAuthReturn(storage, now + ttl)).toBeNull();
    expect(storage.values.size).toBe(0);
  });

  it("clears the target after successful authentication consumes it", () => {
    const storage = createStorage();
    rememberPendingAuthReturn("/proposals/new", storage, now);
    expect(readPendingAuthReturn(storage, now)).toBe("/proposals/new");

    clearPendingAuthReturn(storage);

    expect(readPendingAuthReturn(storage, now)).toBeNull();
    expect(storage.values.size).toBe(0);
  });

  it("does not store an unsafe destination", () => {
    const storage = createStorage();
    rememberPendingAuthReturn("//outside.example", storage, now);

    expect(storage.setItem).not.toHaveBeenCalled();
    expect(readPendingAuthReturn(storage, now)).toBeNull();
  });

  it.each([
    { path: "//outside.example", expiresAt: now + ttl },
    { path: "/\\outside.example", expiresAt: now + ttl },
    { path: "/proposals\nnew", expiresAt: now + ttl },
    { path: "/proposals/new", expiresAt: "later" },
    { path: "/proposals/new", expiresAt: now + ttl + 1 },
    { path: "/proposals/new" },
    null,
  ])("discards unsafe stored data %j", pending => {
    const storage = createStorage();
    rememberPendingAuthReturn("/proposals/new", storage, now);
    const key = [...storage.values.keys()][0];
    storage.values.set(key, JSON.stringify(pending));

    expect(readPendingAuthReturn(storage, now)).toBeNull();
    expect(storage.values.size).toBe(0);
  });

  it("discards malformed stored JSON", () => {
    const storage = createStorage();
    rememberPendingAuthReturn("/proposals/new", storage, now);
    const key = [...storage.values.keys()][0];
    storage.values.set(key, "{broken");

    expect(readPendingAuthReturn(storage, now)).toBeNull();
    expect(storage.values.size).toBe(0);
  });

  it("falls back safely when storage cannot be read", () => {
    const storage = createStorage();
    storage.getItem.mockImplementation(() => {
      throw new Error("Storage disabled");
    });

    expect(
      getAuthReturn("?token=sample-token", readPendingAuthReturn(storage, now))
    ).toBe("/dashboard");
  });

  it("does not block authentication when pending storage cannot be written", () => {
    const storage = createStorage();
    storage.setItem.mockImplementation(() => {
      throw new Error("Storage full");
    });

    expect(() =>
      rememberPendingAuthReturn("/proposals/new", storage, now)
    ).not.toThrow();
    expect(readPendingAuthReturn(storage, now)).toBeNull();
  });

  it("does not block authentication when pending storage cannot be cleared", () => {
    const storage = createStorage();
    storage.removeItem.mockImplementation(() => {
      throw new Error("Storage disabled");
    });

    expect(() => clearPendingAuthReturn(storage)).not.toThrow();
  });
});
