"""Runnable Nightward + Google Vertex AI example (Python).

Vertex (the unified google-genai SDK) isn't an httpx client, so it uses the instrument() seam. Location is
read from the client at construction because Vertex prices by region. The marked region is the source for
the Vertex Python wrap snippet; mypy type-checks it against google-genai.
"""

from __future__ import annotations

from typing import Any, Protocol

from google import genai

from nightward import Nightward


class _User(Protocol):
    id: str


def call_vertex(nw: Nightward, user: _User, project: str, location: str, model: str, contents: Any) -> None:
    """Instrument a Vertex call and attribute it to a user (vertex.python.wrap)."""
    # >>> snippet: vertex.python.wrap
    client = nw.instrument(genai.Client(vertexai=True, project=project, location=location))
    with nw.actor(id=user.id):
        client.models.generate_content(model=model, contents=contents)
    # <<< snippet: vertex.python.wrap
