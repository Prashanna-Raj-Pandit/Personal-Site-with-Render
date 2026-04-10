from __future__ import annotations
import os
from dotenv import load_dotenv
from pathlib import Path
from dataclasses import dataclass

load_dotenv(Path(__file__).parent / ".env")


@dataclass
class Config:
    cohere_api_key: str = str(os.getenv("COHERE_API_KEY", ""))
    cohere_model: str = os.getenv("COHERE_MODEL", "command-r-plus-08-2024")
    cohere_embed_model: str = os.getenv("COHERE_EMBED_MODEL", "embed-english-v3.0")

    chroma_api_key: str = os.getenv("CHROMA_API_KEY", "")
    chroma_tenant: str = os.getenv("CHROMA_TENANT", "")
    chroma_database: str = os.getenv("CHROMA_DATABASE", "DocuChat")
    chroma_collection_name: str = os.getenv("CHROMA_COLLECTION_NAME", "knowledge_base")

    top_k_results: int = int(os.getenv("TOP_K_RESULTS", "12"))


config = Config()
