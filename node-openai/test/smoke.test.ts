import { test } from "node:test";
import assert from "node:assert/strict";
import { Nightward } from "@nightwardhq/sdk";
import { callOpenAI, callOpenAIWithOrg, callOpenAIWithSignals, decide, callAzure, callCompatible } from "../src/index.js";

/*
 * Test your instrumentation offline — no real OpenAI or Nightward calls needed:
 *   - `baseFetch` is a mock OpenAI endpoint (the fetch that nw.fetch wraps),
 *   - `fetchImpl` is a mock Nightward transport, so nothing leaves your machine.
 * The assertion checks that the wrapped provider call enqueues a Nightward event.
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
  await callOpenAI(nw, { id: "user_123", plan: "free", emailVerified: true }, "gpt-4o", [{ role: "user", content: "hi" }]);
  assert.ok(nw.queueSize > 0, "the instrumented OpenAI call should enqueue a Nightward event");
});

test("openai.node.wrapOrg attributes to a user + organisation", async () => {
  process.env.OPENAI_API_KEY = "sk-test-not-used";
  const nw = mockNightward();
  await callOpenAIWithOrg(nw, { id: "user_123", orgId: "org_42", plan: "pro", emailVerified: true }, "gpt-4o", [{ role: "user", content: "hi" }]);
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

// OB-13.99 · the step-5 `identify` snippet populates the five signals it claims: emailDomain, emailVerified,
// accountCreatedAt, ip, deviceId (deviceHintHash). Mutation: drop one field from the identify snippet → this
// fails naming the missing field. Captures the actual NDJSON the transport would POST, so it exercises the
// rendered snippet end-to-end, not the event builder in isolation.
test("identify.node emits the full step-5 signal set (OB-13.99)", async () => {
  process.env.OPENAI_API_KEY = "sk-test-not-used";
  const bodies: string[] = [];
  const nw = new Nightward({
    apiKey: "k",
    hashSalt: "s",
    fetchImpl: async (_url: string, init?: { body?: unknown }) => {
      if (typeof init?.body === "string") bodies.push(init.body);
      return { ok: true, status: 200 };
    },
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
  await callOpenAIWithSignals(
    nw,
    { id: "user_123", emailDomain: "acme.com", emailVerified: true, accountCreatedAt: "2025-01-01T00:00:00Z" },
    { ip: "203.0.113.7", deviceId: "device_fingerprint_abc" },
    "gpt-4o",
    [{ role: "user", content: "hi" }],
  );
  await nw.flush();

  const events = bodies
    .join("\n")
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l) as { actor?: Record<string, unknown>; identifiers?: Record<string, unknown> });
  const ev = events.find((e) => e.actor && typeof e.actor.emailDomain === "string");
  assert.ok(ev, "an attributed request event was transmitted");
  assert.equal(ev!.actor!.emailDomain, "acme.com", "emailDomain present");
  assert.equal(ev!.actor!.emailVerified, true, "emailVerified present");
  assert.equal(ev!.actor!.accountCreatedAt, "2025-01-01T00:00:00Z", "accountCreatedAt present");
  assert.ok(ev!.identifiers && ev!.identifiers.ip, "ip present in identifiers");
  assert.ok(ev!.identifiers && ev!.identifiers.deviceHintHash, "deviceId present (as deviceHintHash) in identifiers");
});
