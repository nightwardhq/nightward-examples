"""Instrument the OpenAI SDK with Nightward (Python).

You keep your existing OpenAI client and calls. Nightward attaches at the HTTP layer via
``nw.httpx_client()`` so it sees each request's model and token usage, and ``with nw.actor(...)`` names the
user the call belongs to — that's how spend gets attributed and abuse gets caught. Nightward sits beside
the call, never in front of it: no proxy, no extra network hop, and no prompt content leaves your process.

Create the client once at startup and reuse it:
    nw = Nightward(api_key=os.environ["NIGHTWARD_API_KEY"])
"""

from __future__ import annotations

from typing import Any, Protocol

from nightward import Nightward, Verdict
from openai import AzureOpenAI, OpenAI


class _User(Protocol):
    id: str
    plan: str
    email_verified: bool


class _OrgUser(Protocol):
    id: str
    org_id: str
    plan: str
    email_verified: bool


def call_openai(nw: Nightward, user: _User, model: str, messages: list[Any]) -> None:
    """Instrument an OpenAI call and attribute it to a user."""
    client = OpenAI(http_client=nw.httpx_client())
    # plan and email_verified are what keep your paying customers out of the flagged list
    with nw.actor(id=user.id, plan=user.plan, email_verified=user.email_verified):
        client.chat.completions.create(model=model, messages=messages)


def call_openai_with_org(nw: Nightward, user: _OrgUser, model: str, messages: list[Any]) -> None:
    """Attribute a call to a user AND their organisation — pass org_id if your product has teams/workspaces."""
    client = OpenAI(http_client=nw.httpx_client())
    with nw.actor(
        id=user.id,
        org_id=user.org_id,
        plan=user.plan,
        email_verified=user.email_verified,
    ):
        client.chat.completions.create(model=model, messages=messages)


def decide(nw: Nightward) -> str:
    """Ask Nightward how to handle a request and act on the recommendation in your own code. check() is
    synchronous and makes no network call. (Acting on verdicts is a paid feature; on the free plan check()
    returns a PlanGated result that records the recommendation without an actionable verdict.)"""
    verdict = nw.check()
    if isinstance(verdict, Verdict) and verdict.recommended_action == "block":
        return "block"  # your code decides what to do — Nightward only recommends
    return "allow"


def call_azure(
    nw: Nightward, user: _User, endpoint: str, api_version: str, deployment: str, messages: list[Any]
) -> None:
    """Azure OpenAI — the same seam, pointed at your Azure deployment."""
    client = AzureOpenAI(http_client=nw.httpx_client(), azure_endpoint=endpoint, api_version=api_version)
    with nw.actor(id=user.id):
        client.chat.completions.create(model=deployment, messages=messages)


def call_compatible(nw: Nightward, user: _User, model: str, messages: list[Any]) -> None:
    """Any OpenAI-compatible endpoint (Groq, Together, a self-hosted vLLM) at a custom base URL."""
    client = OpenAI(base_url="https://api.groq.com/openai/v1", http_client=nw.httpx_client())
    with nw.actor(id=user.id):
        client.chat.completions.create(model=model, messages=messages)
