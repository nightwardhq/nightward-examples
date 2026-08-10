import { test } from "node:test";
import assert from "node:assert/strict";
import { Nightward } from "@nightwardhq/sdk";

/*
 * Offline smoke test: the middleware from the snippet must establish actor context so a provider call made
 * inside the request is attributed. We drive the middleware handler directly with a mock request + a `next`
 * that stands in for an in-request provider call (report()); if the context isn't set, the event wouldn't
 * be attributed and the seam would be pointless.
 */
test("express.node.wrap — the middleware scopes actor context for the request", () => {
  const nw = new Nightward({
    apiKey: "k",
    hashSalt: "s",
    fetchImpl: async () => ({ ok: true, status: 200 }), // mock ingest
    flushIntervalMs: 10_000_000,
    clock: { now: () => 1_751_328_000_000 },
  });
  const handler = nw.middleware((req) => ({ id: (req as { user: { id: string } }).user.id }));
  handler({ user: { id: "user_123" } }, {}, () => {
    nw.report({ usage: { inputTokens: 1, outputTokens: 1 } });
  });
  assert.ok(nw.queueSize > 0, "a call inside the middleware-scoped request should enqueue an attributed event");
});
