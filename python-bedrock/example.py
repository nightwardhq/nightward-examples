"""Runnable Nightward + Amazon Bedrock example (Python).

Bedrock (boto3) isn't an httpx client, so it uses the instrument() seam — Nightward registers on boto3's
event system. Region travels with the client because Bedrock prices by region. The marked region is the
source for the Bedrock Python wrap snippet; mypy type-checks it against boto3.
"""

from __future__ import annotations

from typing import Any, Protocol

import boto3

from nightward import Nightward


class _User(Protocol):
    id: str


def call_bedrock(nw: Nightward, user: _User, region: str, model_id: str, body: bytes) -> None:
    """Instrument a Bedrock call and attribute it to a user (bedrock.python.wrap)."""
    # >>> snippet: bedrock.python.wrap
    client = nw.instrument(boto3.client("bedrock-runtime", region_name=region))
    with nw.actor(id=user.id):
        client.invoke_model(modelId=model_id, body=body)
    # <<< snippet: bedrock.python.wrap
