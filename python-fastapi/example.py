"""Instrument a FastAPI app with Nightward (Python).

Set the caller once, at the edge of the request, with Nightward middleware. Every provider call made while
handling that request is then attributed to the caller — you don't repeat ``nw.actor(...)`` in each route.
``req.state.user`` is whatever your own auth dependency attached upstream. Create nw once at startup:
    nw = Nightward(api_key=os.environ["NIGHTWARD_API_KEY"])
"""

from __future__ import annotations

from fastapi import FastAPI
from openai import OpenAI

from nightward import Nightward


def instrument_fastapi(app: FastAPI, nw: Nightward) -> OpenAI:
    """Set actor context for every request, then use your provider client normally inside the route."""
    app.add_middleware(nw.Middleware, actor=lambda req: {"id": req.state.user.id})
    client = OpenAI(http_client=nw.httpx_client())
    return client
