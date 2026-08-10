import { GoogleGenAI } from "@google/genai";
import { Nightward } from "@nightwardhq/sdk";

/*
 * Instrument Google Vertex AI with Nightward (Node).
 *
 * Vertex (the unified `@google/genai` SDK) isn't an HTTP-fetch client, so wrap it with
 * `nw.instrument(client)` — it returns the same client with Nightward hooked into its request methods.
 * Because Vertex prices by region, the location lives on the client. Then name the caller with `withActor`.
 * Create `nw` once at startup:
 *   const nw = new Nightward({ apiKey: process.env.NIGHTWARD_API_KEY })
 */

/** Instrument a Vertex call and attribute it to a user. */
export async function callVertex(
  nw: Nightward,
  user: { id: string },
  project: string,
  location: string,
  model: string,
  contents: string,
): Promise<void> {
  const client = nw.instrument(new GoogleGenAI({ vertexai: true, project, location }));
  await nw.withActor({ id: user.id }, () =>
    client.models.generateContent({ model, contents }),
  );
}
