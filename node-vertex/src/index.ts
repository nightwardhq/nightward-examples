import { GoogleGenAI } from "@google/genai";
import { Nightward } from "@nightwardhq/sdk";

/*
 * Runnable Google Vertex AI + Nightward example (Node). Vertex (the unified @google/genai SDK) isn't an
 * HTTP-fetch client, so it uses the instrument() seam. Location is read from the client at construction
 * because Vertex prices by region. The marked region is the source for the Vertex wrap snippet; the smoke
 * test verifies the seam offline (instrument is total + idempotent).
 */
export async function callVertex(
  nw: Nightward,
  user: { id: string },
  project: string,
  location: string,
  model: string,
  contents: string,
): Promise<void> {
  // >>> snippet: vertex.node.wrap
  const client = nw.instrument(new GoogleGenAI({ vertexai: true, project, location }));
  await nw.withActor({ id: user.id }, () =>
    client.models.generateContent({ model, contents }),
  );
  // <<< snippet: vertex.node.wrap
}
