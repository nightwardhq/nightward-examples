import { Nightward } from "@nightwardhq/sdk";
import OpenAI, { AzureOpenAI } from "openai";

/*
 * Instrument the OpenAI SDK with Nightward (Node).
 *
 * You keep your existing OpenAI client and calls. Nightward attaches at the transport (`nw.fetch`) so it
 * sees each request's model and token usage, and `withActor` names the user the call belongs to — that's
 * how spend gets attributed and abuse gets caught. Nightward sits beside the call, never in front of it: no
 * proxy, no extra network hop, and no prompt content ever leaves your process.
 *
 * Create the client once at startup and reuse it:
 *   const nw = new Nightward({ apiKey: process.env.NIGHTWARD_API_KEY })
 */

/** Instrument an OpenAI call and attribute it to a user. */
export async function callOpenAI(
  nw: Nightward,
  user: { id: string; plan: string; emailVerified: boolean },
  model: string,
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
): Promise<void> {
  const openai = new OpenAI({ fetch: nw.fetch });
  // plan and emailVerified are what keep your paying customers out of the flagged list
  await nw.withActor({ id: user.id, plan: user.plan, emailVerified: user.emailVerified }, () =>
    openai.chat.completions.create({ model, messages }),
  );
}

/** Attribute a call to a user AND their organisation — pass `orgId` if your product has teams or workspaces
 *  (adding it later means re-keying your data, so it's worth passing from the start). */
export async function callOpenAIWithOrg(
  nw: Nightward,
  user: { id: string; orgId: string; plan: string; emailVerified: boolean },
  model: string,
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
): Promise<void> {
  const openai = new OpenAI({ fetch: nw.fetch });
  await nw.withActor(
    { id: user.id, orgId: user.orgId, plan: user.plan, emailVerified: user.emailVerified },
    () => openai.chat.completions.create({ model, messages }),
  );
}

/** Step 5 — the caller signals. `withActor({ id })` attributes a call; these signals are what let Nightward
 *  tell your users apart. Pass what you have — each one unlocks a class of detection (disposable-domain
 *  checks, datacenter/proxy classification, linkage). An integration that carries `id` and nothing else emits
 *  events that are valid and diagnostically thin. */
export async function callOpenAIWithSignals(
  nw: Nightward,
  user: { id: string; emailDomain: string; emailVerified: boolean; accountCreatedAt: string },
  req: { ip: string; deviceId: string },
  model: string,
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
): Promise<void> {
  const openai = new OpenAI({ fetch: nw.fetch });
  await nw.withActor(
    {
      id: user.id,
      emailDomain: user.emailDomain, // the domain only — Nightward never receives the full address
      emailVerified: user.emailVerified,
      accountCreatedAt: user.accountCreatedAt,
      ip: req.ip, // the caller's IP — datacenter / proxy classification (hashed at ingest, never stored raw)
      deviceHint: req.deviceId, // a stable device fingerprint, if you have one — drives linkage
    },
    () => openai.chat.completions.create({ model, messages }),
  );
}

/** Ask Nightward how to handle a request before you call the provider, and act on the recommendation in your
 *  own code. `check()` is synchronous, in-process, and makes no network call — it resolves the actor from
 *  the surrounding `withActor` scope. (Acting on verdicts is a paid feature; on the free plan it records the
 *  recommendation but reports `available: false`.) */
export function decide(nw: Nightward): "block" | "allow" {
  const verdict = nw.check();
  if (verdict.available && verdict.recommendedAction === "block") {
    return "block"; // your code decides what to do — Nightward only recommends
  }
  return "allow";
}

/** Azure OpenAI — the same seam, pointed at your Azure deployment. */
export async function callAzure(
  nw: Nightward,
  user: { id: string },
  endpoint: string,
  apiVersion: string,
  deployment: string,
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
): Promise<void> {
  const azure = new AzureOpenAI({ fetch: nw.fetch, endpoint, apiVersion });
  await nw.withActor({ id: user.id }, () =>
    azure.chat.completions.create({ model: deployment, messages }),
  );
}

/** Any OpenAI-compatible endpoint (Groq, Together, OpenRouter, a self-hosted vLLM) — the OpenAI client
 *  pointed at a custom base URL. */
export async function callCompatible(
  nw: Nightward,
  user: { id: string },
  model: string,
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
): Promise<void> {
  const client = new OpenAI({ fetch: nw.fetch, baseURL: "https://api.groq.com/openai/v1" });
  await nw.withActor({ id: user.id }, () =>
    client.chat.completions.create({ model, messages }),
  );
}
