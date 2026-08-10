"""Instrument Amazon Bedrock with Nightward (Python).

Bedrock (boto3) isn't an httpx client, so instead of ``nw.httpx_client()`` you wrap the boto3 client with
``nw.instrument(client)`` — it registers Nightward on boto3's event system and returns the same client.
Because Bedrock prices by region, keep the region on the client. Then name the caller with ``nw.actor()``.
Create nw once at startup:
    nw = Nightward(api_key=os.environ["NIGHTWARD_API_KEY"])
"""

from __future__ import annotations

from typing import Protocol

import boto3

from nightward import Nightward


class _User(Protocol):
    id: str


def call_bedrock(nw: Nightward, user: _User, region: str, model_id: str, body: bytes) -> None:
    """Instrument a Bedrock call and attribute it to a user."""
    client = nw.instrument(boto3.client("bedrock-runtime", region_name=region))
    with nw.actor(id=user.id):
        client.invoke_model(modelId=model_id, body=body)
