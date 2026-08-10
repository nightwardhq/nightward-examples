"""Runnable Nightward + OpenAI example (Python).

The marked region is the SINGLE SOURCE for the Python OpenAI wrap snippet (extracted into
@nightwardhq/snippets). The function is type-checked by mypy against the real SDK, so an API rename (the
F35 class: httpx_client vs http_client, or instrument-vs-transport) fails CI; ``tests/test_smoke.py``
additionally runs the seam offline via ``httpx.MockTransport``. ``nw`` is constructed by the caller (only
``api_key`` in real use; the hash salt comes from the signed policy package).
"""

from __future__ import annotations

from typing import Any, Protocol

from nightward import Nightward
from openai import AzureOpenAI, OpenAI


class _User(Protocol):
    id: str


class _OrgUser(Protocol):
    id: str
    org_id: str


def call_openai(nw: Nightward, user: _User, model: str, messages: list[Any]) -> None:
    """Instrument an OpenAI call and attribute it to a user (openai.python.wrap)."""
    # >>> snippet: openai.python.wrap
    client = OpenAI(http_client=nw.httpx_client())
    with nw.actor(id=user.id):
        client.chat.completions.create(model=model, messages=messages)
    # <<< snippet: openai.python.wrap


def call_openai_with_org(nw: Nightward, user: _OrgUser, model: str, messages: list[Any]) -> None:
    """The same, attributed to a user AND their organisation (openai.python.wrapOrg — ONB-17)."""
    # >>> snippet: openai.python.wrapOrg
    client = OpenAI(http_client=nw.httpx_client())
    with nw.actor(id=user.id, org_id=user.org_id):
        client.chat.completions.create(model=model, messages=messages)
    # <<< snippet: openai.python.wrapOrg


def decide(nw: Nightward) -> str:
    """Decide mode (Starter+): read the cached verdict and let YOUR code act on it (check.python)."""
    # >>> snippet: check.python
    verdict = nw.check()
    if verdict.available and verdict.recommended_action == "block":
        return "block"  # your code decides — Nightward recommends, you act
    # <<< snippet: check.python
    return "allow"


def call_azure(
    nw: Nightward, user: _User, endpoint: str, api_version: str, deployment: str, messages: list[Any]
) -> None:
    """Azure OpenAI — same transport seam, pointed at your deployment (azure.python.wrap)."""
    # >>> snippet: azure.python.wrap
    client = AzureOpenAI(http_client=nw.httpx_client(), azure_endpoint=endpoint, api_version=api_version)
    with nw.actor(id=user.id):
        client.chat.completions.create(model=deployment, messages=messages)
    # <<< snippet: azure.python.wrap


def call_compatible(nw: Nightward, user: _User, model: str, messages: list[Any]) -> None:
    """Any OpenAI-compatible endpoint (Groq/Together/vLLM) at a custom base URL (compatible.python.wrap)."""
    # >>> snippet: compatible.python.wrap
    client = OpenAI(base_url="https://api.groq.com/openai/v1", http_client=nw.httpx_client())
    with nw.actor(id=user.id):
        client.chat.completions.create(model=model, messages=messages)
    # <<< snippet: compatible.python.wrap
