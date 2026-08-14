import type { Express, Request } from "express";
import OpenAI from "openai";
import { Nightward } from "@nightwardhq/sdk";

/*
 * Set the caller once, at the edge of your Express request, with Nightward middleware. Every provider call
 * made while handling that request is then attributed to the caller — you don't repeat `withActor` in each
 * route. `nw.middleware(extract)` types its request as `unknown` (it's framework-agnostic), so cast it to
 * Express's `Request` inside your extractor. Below, `req.user` is whatever your own auth middleware attached
 * upstream.
 */

declare module "express" {
  interface Request {
    user: {
      id: string;
      plan: string;
      emailDomain: string;
      emailVerified: boolean;
      accountCreatedAt: string;
    };
    deviceId: string;
  }
}

/** Set actor context for every request, then use your provider client normally inside the request. */
export function instrumentExpress(app: Express, nw: Nightward): OpenAI {
  app.use(nw.middleware((req) => ({ id: (req as Request).user.id })));
  const openai = new OpenAI({ fetch: nw.fetch });
  return openai;
}

/** Pass more than just the id: extra fields like the caller's plan sharpen detection. */
export function mountActorWithPlan(app: Express, nw: Nightward): void {
  app.use(
    nw.middleware((req) => {
      const { user } = req as Request;
      return { id: user.id, plan: user.plan };
    }),
  );
}

/** The full recommended signal set, extracted once in the middleware — the same fields you'd pass to
 *  `withActor`, set for every request instead of per call. */
export function mountActorWithSignals(app: Express, nw: Nightward): void {
  app.use(
    nw.middleware((req) => {
      const { user, ip, deviceId } = req as Request;
      return {
        id: user.id,
        emailDomain: user.emailDomain,
        emailVerified: user.emailVerified,
        accountCreatedAt: user.accountCreatedAt,
        ip,
        deviceHint: deviceId,
      };
    }),
  );
}
