"""Instrument the Anthropic SDK with Nightward (Python).

Same idea as OpenAI: attach at the HTTP layer with ``nw.httpx_client()`` so Nightward sees each request's
usage, and name the caller with ``with nw.actor(...)``. Create nw once at startup:
    nw = Nightward(api_key=os.environ["NIGHTWARD_API_KEY"])
"""

from __future__ import annotations

from typing import Any, Protocol

from anthropic import Anthropic
from nightward import Nightward


class _User(Protocol):
    id: str


def call_anthropic(nw: Nightward, user: _User, model: str, messages: list[Any]) -> None:
    """Instrument an Anthropic call and attribute it to a user."""
    client = Anthropic(http_client=nw.httpx_client())
    with nw.actor(id=user.id):
        client.messages.create(model=model, max_tokens=1024, messages=messages)
