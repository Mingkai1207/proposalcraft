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
import { recommendationsRouter } from "./routers/recommendations";
import { importRouter } from "./routers/import";
import { nativeAuthProcedures } from "./routers/nativeAuth";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => {
      const user = opts.ctx.user;
      if (!user) return null;
      // Strip password-related fields — never send these to the client
      const { passwordHash, verificationToken, verificationTokenExpiresAt, passwordResetToken, passwordResetTokenExpiresAt, ...safeUser } = user;
      return safeUser;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    ...nativeAuthProcedures,
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
  recommendations: recommendationsRouter,
  import: importRouter,
});

export type AppRouter = typeof appRouter;
