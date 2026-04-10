from __future__ import annotations
from src.rag_bot.config import config
import re
import cohere
import json
from typing import Any


class CohereClient:
    def __init__(self) -> None:
        if not config.cohere_api_key:
            raise ValueError("COHERE_API_KEY is missing in .env")
        self.client = cohere.ClientV2(api_key=config.cohere_api_key)
        self.model_name = config.cohere_model

    def generate_text(self, prompt: str, temperature: float = 0.2) -> str:
        response = self.client.chat(
            model=self.model_name,
            messages=[{
                "role": "user",
                "content": prompt,
            }],
            temperature=temperature
        )
        text = self._extract_text(response)
        return text.strip()

    @staticmethod
    def _extract_text(response: Any) -> str:
        parts: list[str] = []
        for item in getattr(response, "message", {}).content:
            if getattr(item, "type", "") == "text":
                parts.append(item.text)
        return "\n".join(parts)


if __name__ == "__main__":
    client = CohereClient()
    client.generate_text(prompt="Hi")
