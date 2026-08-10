import { Nightward } from "@nightwardhq/sdk";
import OpenAI, { AzureOpenAI } from "openai";

/*
 * Runnable OpenAI + Nightward example (Node). The marked regions below are the SINGLE SOURCE for the
 * OpenAI / onboarding / quickstart wrap snippets: `scripts/extract-snippets.mjs` lifts them into
 * @nightwardhq/snippets, and `test/smoke.test.ts` runs them offline against a mock provider + mock ingest.
 * A snippet therefore can't drift from the SDK — if the wrap stops compiling or the call stops emitting a
 * telemetry event, CI fails.
 *
 * `nw` is constructed by the caller (the customer passes only `apiKey`; the hash salt is resolved from the
 * signed policy package). The wrap assumes `nw`, `user`, `model`, `messages` are in scope — exactly what
 * the docs snippet shows.
 */

/** Instrument an OpenAI call and attribute it to a user (openai.node.wrap). */
export async function callOpenAI(
  nw: Nightward,
  user: { id: string },
  model: string,
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
): Promise<void> {
  // >>> snippet: openai.node.wrap
  const openai = new OpenAI({ fetch: nw.fetch });
  await nw.withActor({ id: user.id }, () =>
    openai.chat.completions.create({ model, messages }),
  );
  // <<< snippet: openai.node.wrap
}

/** The same, attributed to a user AND their organisation (openai.node.wrapOrg — the ONB-17 org variant). */
export async function callOpenAIWithOrg(
  nw: Nightward,
  user: { id: string; orgId: string },
  model: string,
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
): Promise<void> {
  // >>> snippet: openai.node.wrapOrg
  const openai = new OpenAI({ fetch: nw.fetch });
  await nw.withActor({ id: user.id, orgId: user.orgId }, () =>
    openai.chat.completions.create({ model, messages }),
  );
  // <<< snippet: openai.node.wrapOrg
}

/** Decide mode (Starter+): read the cached verdict and let YOUR code act on it (check.node). Synchronous,
 *  in-process, no network — resolves the actor from the surrounding withActor scope. */
export function decide(nw: Nightward): "block" | "allow" {
  // >>> snippet: check.node
  const verdict = nw.check();
  if (verdict.available && verdict.recommendedAction === "block") {
    return "block"; // your code decides — Nightward recommends, you act
  }
  // <<< snippet: check.node
  return "allow";
}

/** Azure OpenAI — same fetch seam, pointed at your deployment (azure.node.wrap). */
export async function callAzure(
  nw: Nightward,
  user: { id: string },
  endpoint: string,
  apiVersion: string,
  deployment: string,
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
): Promise<void> {
  // >>> snippet: azure.node.wrap
  const azure = new AzureOpenAI({ fetch: nw.fetch, endpoint, apiVersion });
  await nw.withActor({ id: user.id }, () =>
    azure.chat.completions.create({ model: deployment, messages }),
  );
  // <<< snippet: azure.node.wrap
}

/** Any OpenAI-compatible endpoint (Groq/Together/vLLM) — the OpenAI client at a custom base URL
 *  (compatible.node.wrap). */
export async function callCompatible(
  nw: Nightward,
  user: { id: string },
  model: string,
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
): Promise<void> {
  // >>> snippet: compatible.node.wrap
  const client = new OpenAI({ fetch: nw.fetch, baseURL: "https://api.groq.com/openai/v1" });
  await nw.withActor({ id: user.id }, () =>
    client.chat.completions.create({ model, messages }),
  );
  // <<< snippet: compatible.node.wrap
}
