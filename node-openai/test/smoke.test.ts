import { test } from "node:test";
import assert from "node:assert/strict";
import { Nightward } from "@nightwardhq/sdk";
import { callOpenAI, callOpenAIWithOrg, decide, callAzure, callCompatible } from "../src/index.js";

/*
 * Offline smoke test — proves the snippet actually instruments a call without touching the network:
 *   - `baseFetch` is the mock OpenAI endpoint (what nw.fetch wraps),
 *   - `fetchImpl` is the mock ingest transport (so nothing reaches api.nightward.io).
 * If the wrap stops emitting a telemetry event, this fails and the extracted snippet can't ship.
 */
function mockNightward(): Nightward {
  return new Nightward({
    apiKey: "k",
    hashSalt: "s",
    fetchImpl: async () => ({ ok: true, status: 200 }), // mock ingest — nothing reaches the network
    baseFetch: async () =>
      new Response(
        JSON.stringify({
          id: "chatcmpl-x",
          object: "chat.completion",
          model: "gpt-4o",
          choices: [{ index: 0, message: { role: "assistant", content: "hi" }, finish_reason: "stop" }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    flushIntervalMs: 10_000_000,
    clock: { now: () => 1_751_328_000_000 },
  });
}

test("openai.node.wrap instruments a call offline and enqueues a telemetry event", async () => {
  process.env.OPENAI_API_KEY = "sk-test-not-used";
  const nw = mockNightward();
  await callOpenAI(nw, { id: "user_123" }, "gpt-4o", [{ role: "user", content: "hi" }]);
  assert.ok(nw.queueSize > 0, "the instrumented OpenAI call should enqueue a Nightward event");
});

test("openai.node.wrapOrg attributes to a user + organisation", async () => {
  process.env.OPENAI_API_KEY = "sk-test-not-used";
  const nw = mockNightward();
  await callOpenAIWithOrg(nw, { id: "user_123", orgId: "org_42" }, "gpt-4o", [{ role: "user", content: "hi" }]);
  assert.ok(nw.queueSize > 0, "the org-attributed call should enqueue a Nightward event");
});

test("check.node — check() is synchronous, never throws, and returns an actionable string", () => {
  const nw = mockNightward();
  // No policy fetched → unavailable/local-only; decide() must still return cleanly (check never throws).
  assert.ok(["block", "allow"].includes(decide(nw)));
});

test("azure.node.wrap instruments an Azure OpenAI call offline", async () => {
  process.env.AZURE_OPENAI_API_KEY = "az-test-not-used";
  const nw = mockNightward();
  await callAzure(nw, { id: "user_123" }, "https://example.openai.azure.com", "2024-06-01", "gpt-4o", [
    { role: "user", content: "hi" },
  ]);
  assert.ok(nw.queueSize > 0, "the instrumented Azure call should enqueue a Nightward event");
});

test("compatible.node.wrap instruments an OpenAI-compatible endpoint call offline", async () => {
  process.env.OPENAI_API_KEY = "sk-test-not-used";
  const nw = mockNightward();
  await callCompatible(nw, { id: "user_123" }, "llama-3.1-70b", [{ role: "user", content: "hi" }]);
  assert.ok(nw.queueSize > 0, "the instrumented compatible-endpoint call should enqueue a Nightward event");
});
