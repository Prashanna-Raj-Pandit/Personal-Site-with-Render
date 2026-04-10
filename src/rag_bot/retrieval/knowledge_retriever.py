from __future__ import annotations

from src.rag_bot.config import config
from src.rag_bot.indexing.embeddings import EmbeddingStore
from src.rag_bot.model import RetrieveEvidence
from typing import Any


class KnowledgeRetriever:
    def __init__(self) -> None:
        self.embedding_store = EmbeddingStore()

    def query_builder(self, question: list[str], top_k_per_query: int = 5,
                      final_top_k: int | None = None) -> list[RetrieveEvidence]:
        """
                Multi-query retrieval with:
                - duplicate chunk removal
                - best-score retention
                - recency-aware ranking
                """

        queries = [q.strip() for q in question if q and q.strip()]
        if not queries:
            return []
        final_top_k = final_top_k or config.top_k_results
        # keep the best version of each chunk by chunk id
        # score= lower is better
        best_hits: dict[str, tuple[float, RetrieveEvidence]] = {}  # chunk_id : (score, evidence_object)

        seen_chunk_ids: set[str] = set()
        evidence_items: list[RetrieveEvidence] = []
        for query_idx, query in enumerate(queries):
            results = self.embedding_store.query(query_text=query, top_k=top_k_per_query)
            ids = results.get("ids", [[]])[0]
            docs = results.get("documents", [[]])[0]
            metadatas = results.get("metadatas", [[]])[0]
            distances = results.get("distances", [[]])[0]
            # newer query should matter slightly more than the older queries.
            # queries [0] is the newest one
            recency_penalty = query_idx * 0.03
            for idx, chunk_id in enumerate(ids):
                if chunk_id in seen_chunk_ids:
                    continue
                seen_chunk_ids.add(chunk_id)
                text = docs[idx] if idx < len(docs) else ""
                metadata = metadatas[idx] if idx < len(metadatas) else {}
                distance = distances[idx] if idx < len(distances) else 9999.0
                evidence = RetrieveEvidence(
                    chunk_id=chunk_id,
                    distance=float(distance),
                    text=text,
                    metadata=metadata,
                    query_used=query,
                )
                evidence_items.append(evidence)

                # Lower score is better
                adjusted_score = float(distance) + recency_penalty
                existing = best_hits.get(chunk_id)  # existing = (1.62, RetrieveEvidence(...))
                if existing is None or adjusted_score < existing[0]:
                    best_hits[chunk_id] = (adjusted_score, evidence)
        # sort globally by best adjusted score
        ranked = sorted(best_hits.values(), key=lambda item: item[0])
        return [evidence for _, evidence in ranked[:final_top_k]]

# Testing knowledge retrival by querying vector database
# if __name__ == "__main__":
#     kr = KnowledgeRetriever()
#     results = kr.query_builder(question=["do i have machine learning experience?", "do i have any certifications?"])
#     print(results)
