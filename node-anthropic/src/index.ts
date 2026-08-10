import { Nightward } from "@nightwardhq/sdk";
import Anthropic from "@anthropic-ai/sdk";

/*
 * Runnable Anthropic + Nightward example (Node). Same seam as OpenAI — `nw.fetch` drops into the client —
 * proving the wrap generalises across HTTP providers. Marked region is extracted into @nightwardhq/snippets
 * and smoke-tested offline in CI.
 */

/** Instrument an Anthropic call and attribute it to a user (anthropic.node.wrap). */
export async function callAnthropic(
  nw: Nightward,
  user: { id: string },
  model: string,
  messages: Anthropic.MessageParam[],
): Promise<void> {
  // >>> snippet: anthropic.node.wrap
  const anthropic = new Anthropic({ fetch: nw.fetch });
  await nw.withActor({ id: user.id }, () =>
    anthropic.messages.create({ model, max_tokens: 1024, messages }),
  );
  // <<< snippet: anthropic.node.wrap
}
