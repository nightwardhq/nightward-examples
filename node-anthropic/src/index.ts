import { Nightward } from "@nightwardhq/sdk";
import Anthropic from "@anthropic-ai/sdk";

/*
 * Instrument the Anthropic SDK with Nightward (Node).
 *
 * Same idea as OpenAI: attach at the transport with `nw.fetch` so Nightward sees each request's usage, and
 * name the caller with `withActor`. Create `nw` once at startup:
 *   const nw = new Nightward({ apiKey: process.env.NIGHTWARD_API_KEY })
 */

/** Instrument an Anthropic call and attribute it to a user. */
export async function callAnthropic(
  nw: Nightward,
  user: { id: string },
  model: string,
  messages: Anthropic.MessageParam[],
): Promise<void> {
  const anthropic = new Anthropic({ fetch: nw.fetch });
  await nw.withActor({ id: user.id }, () =>
    anthropic.messages.create({ model, max_tokens: 1024, messages }),
  );
}
