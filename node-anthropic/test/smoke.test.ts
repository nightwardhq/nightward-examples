import { test } from "node:test";
import assert from "node:assert/strict";
import { Nightward } from "@nightwardhq/sdk";
import { callAnthropic } from "../src/index.js";

test("anthropic.node.wrap instruments a call offline and enqueues a telemetry event", async () => {
  process.env.ANTHROPIC_API_KEY = "sk-ant-test-not-used";
  const nw = new Nightward({
    apiKey: "k",
    hashSalt: "s",
    fetchImpl: async () => ({ ok: true, status: 200 }), // mock ingest
    baseFetch: async () =>
      new Response(
        JSON.stringify({
          id: "msg_x",
          type: "message",
          role: "assistant",
          model: "claude-3-5-sonnet-20241022",
          content: [{ type: "text", text: "hi" }],
          stop_reason: "end_turn",
          usage: { input_tokens: 10, output_tokens: 5 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    flushIntervalMs: 10_000_000,
    clock: { now: () => 1_751_328_000_000 },
  });
  await callAnthropic(nw, { id: "user_123" }, "claude-3-5-sonnet-20241022", [{ role: "user", content: "hi" }]);
  assert.ok(nw.queueSize > 0, "the instrumented Anthropic call should enqueue a Nightward event");
});
