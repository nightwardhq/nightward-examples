import { test } from "node:test";
import assert from "node:assert/strict";
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { Nightward } from "@nightwardhq/sdk";

/*
 * Offline check: nw.instrument() returns the same client (it wraps in place) and is safe to call more than
 * once. Constructing a BedrockRuntimeClient needs no AWS credentials — those resolve at call time — so this
 * runs offline with no real Bedrock call.
 */
test("bedrock.node.wrap — instrument returns the same client and is idempotent", () => {
  const nw = new Nightward({
    apiKey: "k",
    hashSalt: "s",
    fetchImpl: async () => ({ ok: true, status: 200 }),
    flushIntervalMs: 10_000_000,
    clock: { now: () => 1_751_328_000_000 },
  });
  const client = new BedrockRuntimeClient({ region: "us-east-1" });
  const a = nw.instrument(client);
  const b = nw.instrument(client); // idempotent
  assert.equal(a, client);
  assert.equal(b, client);
});
