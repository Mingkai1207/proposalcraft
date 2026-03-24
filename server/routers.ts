import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { proposalRouter } from "./routers/proposals";
import { profileRouter } from "./routers/profile";
import { subscriptionRouter } from "./routers/subscription";
import { trackingRouter } from "./routers/tracking";
import { billingRouter } from "./routers/billing";
import { clientPortalRouter } from "./routers/clientPortal";
import { exportRouter } from "./routers/export";
import { templatesRouter } from "./routers/templates";
import { versionsRouter } from "./routers/versions";
import { feedbackRouter } from "./routers/feedback";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  proposals: proposalRouter,
  profile: profileRouter,
  subscription: subscriptionRouter,
  tracking: trackingRouter,
  billing: billingRouter,
  clientPortal: clientPortalRouter,
  export: exportRouter,
  templates: templatesRouter,
  versions: versionsRouter,
  feedback: feedbackRouter,
});

export type AppRouter = typeof appRouter;
