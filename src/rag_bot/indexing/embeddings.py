from __future__ import annotations

from typing import Any

import chromadb
import cohere

from src.rag_bot.config import config
from chromadb.api.models.Collection import Collection


class EmbeddingStore:
    def __init__(self) -> None:
        self.cohere_client = cohere.ClientV2(api_key=config.cohere_api_key)
        self.embed_model = config.cohere_embed_model
        self.client = chromadb.CloudClient(
            api_key=config.chroma_api_key,
            tenant=config.chroma_tenant,
            database=config.chroma_database
        )
        self.collection: Collection = self.client.get_or_create_collection(
            name=config.chroma_collection_name,
            metadata={"description": "RAG chatbot knowledge base"}
        )

    def embed_texts(self, texts: list[str], input_type: str = "search_query") -> list[list[float]]:
        response = self.cohere_client.embed(
            texts=texts,
            model=self.embed_model,
            input_type=input_type,
            embedding_types=["float"]
        )
        return response.embeddings.float_

    def query(self, query_text: str, top_k: int = config.top_k_results, where: dict[str, Any] | None = None) -> dict[str, Any]:
        query_embeddings = self.embed_texts([query_text], input_type="search_query")[0]
        return self.collection.query(
            query_embeddings=[query_embeddings],
            n_results=top_k,
            where=where
        )
