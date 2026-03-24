import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("import.importProposals", () => {
  it(
    "should import proposals and extract data",
    async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const testFile = {
        name: "test-proposal.txt",
        type: "text/plain",
        content:
          "data:text/plain;base64," +
          Buffer.from(
            "Client: John Doe\nAddress: 123 Main St\nTrade: HVAC\nScope: Install new AC unit\nPrice: $5000"
          ).toString("base64"),
      };

      const result = await caller.import.importProposals({
        files: [testFile],
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.templatesCreated).toBeGreaterThanOrEqual(0);
      expect(result.extractedData).toBeDefined();
    },
    { timeout: 10000 }
  );

  it(
    "should handle multiple files",
    async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const files = [
        {
          name: "proposal1.txt",
          type: "text/plain",
          content:
            "data:text/plain;base64," +
            Buffer.from("Client: John Doe\nPrice: $5000").toString("base64"),
        },
        {
          name: "proposal2.txt",
          type: "text/plain",
          content:
            "data:text/plain;base64," +
            Buffer.from("Client: Jane Smith\nPrice: $3000").toString("base64"),
        },
      ];

      const result = await caller.import.importProposals({
        files,
      });

      expect(result.success).toBe(true);
      expect(result.extractedData).toBeDefined();
    },
    { timeout: 15000 }
  );

  it("should handle empty files gracefully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.import.importProposals({
      files: [],
    });

    expect(result.success).toBe(true);
    expect(result.templatesCreated).toBe(0);
  });
});
