import type { Express, Request } from "express";
import OpenAI from "openai";
import { Nightward } from "@nightwardhq/sdk";

/*
 * Runnable Express + Nightward example (Node). Set the actor ONCE at the edge of the request via the
 * middleware; every provider call inside the request is then attributed to it. The marked region is the
 * source for the Express framework snippet.
 *
 * `nw.middleware(extract)` types its `req` as `unknown` (it's framework-agnostic), so the extract casts to
 * your framework's request type — here Express's `Request`, augmented below with the `user` your auth
 * middleware attached. (A bare `req.user.id` would not compile in a strict project — the cast is the honest,
 * copy-pasteable form.)
 */

declare module "express" {
  interface Request {
    // set by your own auth middleware, upstream of Nightward
    user: { id: string; plan: string };
  }
}

export function instrumentExpress(app: Express, nw: Nightward): OpenAI {
  // >>> snippet: express.node.wrap
  app.use(nw.middleware((req) => ({ id: (req as Request).user.id })));
  const openai = new OpenAI({ fetch: nw.fetch });
  // <<< snippet: express.node.wrap
  return openai;
}

/** Middleware that also passes the caller's plan — a legitimacy signal read by the cold-start rules
 *  (express.node.middleware, the homepage "drop in middleware" path). */
export function mountActorWithPlan(app: Express, nw: Nightward): void {
  // >>> snippet: express.node.middleware
  app.use(
    nw.middleware((req) => {
      const { user } = req as Request;
      return { id: user.id, plan: user.plan };
    }),
  );
  // <<< snippet: express.node.middleware
}
