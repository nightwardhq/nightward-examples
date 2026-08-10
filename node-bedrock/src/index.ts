import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { Nightward } from "@nightwardhq/sdk";

/*
 * Instrument Amazon Bedrock with Nightward (Node).
 *
 * Bedrock isn't an HTTP-fetch client, so instead of the `fetch` seam you wrap the AWS SDK client with
 * `nw.instrument(client)` — it threads a Nightward hook into the AWS SDK's own middleware stack and returns
 * the same client. Because Bedrock prices by region, keep the region on the client. Then name the caller
 * with `withActor` as usual. Create `nw` once at startup:
 *   const nw = new Nightward({ apiKey: process.env.NIGHTWARD_API_KEY })
 */

/** Instrument a Bedrock call and attribute it to a user. */
export async function callBedrock(
  nw: Nightward,
  user: { id: string },
  region: string,
  modelId: string,
  body: Uint8Array,
): Promise<void> {
  const client = nw.instrument(new BedrockRuntimeClient({ region }));
  await nw.withActor({ id: user.id }, () =>
    client.send(new InvokeModelCommand({ modelId, body })),
  );
}
