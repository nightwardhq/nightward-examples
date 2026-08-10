"""Instrument Google Vertex AI with Nightward (Python).

Vertex (the unified google-genai SDK) isn't an httpx client, so wrap it with ``nw.instrument(client)`` — it
returns the same client with Nightward hooked into its request methods. Because Vertex prices by region, the
location lives on the client. Then name the caller with ``nw.actor()``. Create nw once at startup:
    nw = Nightward(api_key=os.environ["NIGHTWARD_API_KEY"])
"""

from __future__ import annotations

from typing import Any, Protocol

from google import genai

from nightward import Nightward


class _User(Protocol):
    id: str


def call_vertex(nw: Nightward, user: _User, project: str, location: str, model: str, contents: Any) -> None:
    """Instrument a Vertex call and attribute it to a user."""
    client = nw.instrument(genai.Client(vertexai=True, project=project, location=location))
    with nw.actor(id=user.id):
        client.models.generate_content(model=model, contents=contents)
