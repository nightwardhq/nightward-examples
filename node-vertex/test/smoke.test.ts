import { test } from "node:test";
import assert from "node:assert/strict";
import { GoogleGenAI } from "@google/genai";
import { Nightward } from "@nightwardhq/sdk";

/*
 * Offline check (mirrors Bedrock): nw.instrument() returns the same client and is safe to call more than
 * once. Constructing the client needs no Google credentials — those resolve at call time — so this runs
 * offline with no real Vertex call.
 */
test("vertex.node.wrap — instrument returns the same client and is idempotent", () => {
  const nw = new Nightward({
    apiKey: "k",
    hashSalt: "s",
    fetchImpl: async () => ({ ok: true, status: 200 }),
    flushIntervalMs: 10_000_000,
    clock: { now: () => 1_751_328_000_000 },
  });
  const client = new GoogleGenAI({ vertexai: true, project: "example-project", location: "us-central1" });
  const a = nw.instrument(client);
  const b = nw.instrument(client);
  assert.equal(a, client);
  assert.equal(b, client);
});
