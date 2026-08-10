"""Runnable Nightward + FastAPI example (Python).

Set the actor once at the edge of the request via the Starlette/FastAPI middleware; every provider call in
the request is then attributed to it. The marked region is the source for the FastAPI framework snippet.
``req.state.user`` is whatever your own auth dependency attached upstream.
"""

from __future__ import annotations

from fastapi import FastAPI
from openai import OpenAI

from nightward import Nightward


def instrument_fastapi(app: FastAPI, nw: Nightward) -> OpenAI:
    """Attribute every provider call in a request to the request's actor (fastapi.python.wrap)."""
    # >>> snippet: fastapi.python.wrap
    app.add_middleware(nw.Middleware, actor=lambda req: {"id": req.state.user.id})
    client = OpenAI(http_client=nw.httpx_client())
    # <<< snippet: fastapi.python.wrap
    return client
