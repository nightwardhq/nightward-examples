"""Runnable Nightward + Anthropic example (Python).

Same transport seam as OpenAI — ``nw.httpx_client()`` drops into the client — proving the wrap generalises.
The marked region is the source for the Anthropic Python wrap snippet; ``tests/test_smoke.py`` runs it
offline via ``httpx.MockTransport``, and mypy type-checks it against the real SDK (so a rename fails CI).
"""

from __future__ import annotations

from typing import Any, Protocol

from anthropic import Anthropic
from nightward import Nightward


class _User(Protocol):
    id: str


def call_anthropic(nw: Nightward, user: _User, model: str, messages: list[Any]) -> None:
    """Instrument an Anthropic call and attribute it to a user (anthropic.python.wrap)."""
    # >>> snippet: anthropic.python.wrap
    client = Anthropic(http_client=nw.httpx_client())
    with nw.actor(id=user.id):
        client.messages.create(model=model, max_tokens=1024, messages=messages)
    # <<< snippet: anthropic.python.wrap
