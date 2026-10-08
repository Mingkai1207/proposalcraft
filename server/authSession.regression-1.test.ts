import { describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient } from "@trpc/client";
import { createTRPCQueryUtils } from "@trpc/react-query";
import { observable } from "@trpc/server/observable";
import type { AppRouter } from "./routers";

// Regression: ISSUE-001 - successful sign-in reused an inactive cached null session.
// Found by /qa on 2026-10-08
// Report: .gstack/qa-reports/qa-report-proposai-org-2026-10-08.md

function createSessionFixture() {
  const user = { id: 1, name: "QA Contractor", email: "qa@example.test" };
  const getSession = vi.fn(async () => user);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: false, gcTime: Infinity },
    },
  });
  const client = createTRPCClient<AppRouter>({
    links: [
      () => () =>
        observable(observer => {
          void getSession().then(
            data => {
              observer.next({ result: { data } });
              observer.complete();
            },
            error => observer.error(error)
          );
        }),
    ],
  });
  const utils = createTRPCQueryUtils({ client, queryClient });
  return { user, getSession, queryClient, utils };
}

describe("authentication session cache before navigation", () => {
  it("fetches the signed-in session when the previous signed-out query has no observers", async () => {
    const { user, getSession, queryClient, utils } = createSessionFixture();
    utils.auth.me.setData(undefined, null);
    expect(queryClient.getQueryCache().getAll()[0].getObserversCount()).toBe(0);

    // Invalidation alone leaves this inactive query's null result unchanged.
    await utils.auth.me.invalidate();
    expect(getSession).not.toHaveBeenCalled();
    expect(utils.auth.me.getData()).toBeNull();

    // Login/signup/verification now await this fetch before mounting the guard.
    await utils.auth.me.fetch(undefined, { staleTime: 0 });

    expect(getSession).toHaveBeenCalledTimes(1);
    expect(utils.auth.me.getData()).toEqual(user);
  });

  it("refreshes a recently cached null even without prior invalidation", async () => {
    const { user, getSession, utils } = createSessionFixture();
    utils.auth.me.setData(undefined, null);

    await utils.auth.me.fetch(undefined, { staleTime: 0 });

    expect(getSession).toHaveBeenCalledTimes(1);
    expect(utils.auth.me.getData()).toEqual(user);
  });

  it("fills an absent auth query after direct account entry", async () => {
    const { user, getSession, utils } = createSessionFixture();
    expect(utils.auth.me.getData()).toBeUndefined();

    await utils.auth.me.fetch(undefined, { staleTime: 0 });

    expect(getSession).toHaveBeenCalledTimes(1);
    expect(utils.auth.me.getData()).toEqual(user);
  });
});
