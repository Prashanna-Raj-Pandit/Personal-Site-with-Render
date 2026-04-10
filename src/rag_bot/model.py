from __future__ import annotations
from typing import Any
from pydantic import BaseModel, Field


class RetrieveEvidence(BaseModel):
    chunk_id: str
    distance: float
    text: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    query_used: str = ""
