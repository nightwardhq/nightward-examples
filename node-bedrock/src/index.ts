import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { Nightward } from "@nightwardhq/sdk";

/*
 * Runnable Amazon Bedrock + Nightward example (Node). Bedrock isn't an HTTP-fetch client, so it uses the
 * instrument() seam (Nightward threads a middleware into the AWS SDK's own stack). Region travels with the
 * client because Bedrock prices by region. The marked region is the source for the Bedrock wrap snippet;
 * the smoke test verifies the seam offline (instrument is total + idempotent).
 */
export async function callBedrock(
  nw: Nightward,
  user: { id: string },
  region: string,
  modelId: string,
  body: Uint8Array,
): Promise<void> {
  // >>> snippet: bedrock.node.wrap
  const client = nw.instrument(new BedrockRuntimeClient({ region }));
  await nw.withActor({ id: user.id }, () =>
    client.send(new InvokeModelCommand({ modelId, body })),
  );
  // <<< snippet: bedrock.node.wrap
}
