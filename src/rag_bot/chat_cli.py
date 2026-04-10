from __future__ import annotations
from dataclasses import dataclass, field
from typing import List
from src.rag_bot.config import config
from src.rag_bot.retrieval.knowledge_retriever import KnowledgeRetriever
from src.rag_bot.model import RetrieveEvidence
from src.rag_bot.llm.rag_generator import RAGGenerator


@dataclass
class ChatState:
    """
    This keeps the newest query at the index 0
    """
    query_history: list[str] = field(default_factory=list)
    max_history_queries: int = 6

    def add_query(self, query: str) -> None:
        query = query.strip()
        if not query:
            return
        self.query_history.insert(0, query)
        self.query_history = self.query_history[:self.max_history_queries]

    def get_queries_for_retrieval(self) -> list[str]:
        return self.query_history[:]


class RetrievalChatCLI:
    def __init__(self) -> None:
        self.retriever = KnowledgeRetriever()
        self.state = ChatState()
        self.rag_generator = RAGGenerator()

    def _dynamix_top_k_per_query(self) -> int:
        """
        Increase retrieval breadth slightly as conversation grows
        """
        history_length = len(self.state.query_history)
        base = 5
        bonus = min(history_length // 2, 4)
        return base + bonus

    def _dynamic_final_top_k(self) -> int:
        """
        Increase the final evidence budget slightly as the conversation grows.
        """
        history_lenth = len(self.state.query_history)
        base = getattr(config, "top_k_results", 5)
        bonus = min(history_lenth, 5)
        return base + bonus

    def _print_banner(self) -> None:
        print("RAG bot CLI")
        print("Type your question normally.")
        print("Enter 'qt' to quit. ")

    def _print_queries_used(self, queries: list[str], top_k_per_query: int, final_top_k: int) -> None:
        print("[INFO] Queries used for retrival")
        for i, query in enumerate(queries, start=1):
            print(f"{i}.{query}")

        print("[INFO] Top k per query: ", top_k_per_query)
        print("[INFO] Print final top k: ", final_top_k)

    def _print_results(self, evidence_items: list[RetrieveEvidence]) -> None:
        if not evidence_items:
            print("\n[INFO] Evidence not found.")
        print(f"\n[INFO] Retrieved {len(evidence_items)} evidence chunks")

        for idx, item in enumerate(evidence_items, start=1):
            metadata = item.metadata or {}
            source_type = metadata.get("source_type", "")
            source_name = metadata.get("source_name", "")
            document_title = metadata.get("document_title", "")
            page_number = metadata.get("page_number", "")
            file_path = metadata.get("path", "")
            distance = item.distance

            print(f"Result #{idx}")
            print(f"Chunk ID: {item.chunk_id}")
            print(f"Distance: {distance}")
            print(f"Query Used: {item.query_used}")

            if source_type:
                print(f"Source type: {source_type}")
            if source_name:
                print(f"Source Name: {source_name}")
            if document_title:
                print(f"Document title: {document_title}")
            if page_number:
                print(f"Page Number: {page_number}")
            if file_path:
                print(f"File path: {file_path}")
            preview = item.text[:700].strip()
            print("Text Preview:")
            print(preview)
            print()

    def run_cli(self) -> None:
        self._print_banner()
        while True:
            user_input = input("\nYou: ").strip()
            if not user_input:
                continue
            if user_input.lower() == "qt":
                print("\nExiting chat. Goodbye")
                break
            self.state.add_query(user_input)
            queries = self.state.get_queries_for_retrieval()
            top_k_per_query = self._dynamix_top_k_per_query()
            final_top_k = self._dynamic_final_top_k()

            self._print_queries_used(queries=queries,
                                     top_k_per_query=top_k_per_query,
                                     final_top_k=final_top_k)

            evidence_items = self.retriever.query_builder(question=queries,
                                                          top_k_per_query=top_k_per_query,
                                                          final_top_k=final_top_k)
            # self._print_results(evidence_items)
            answer = self.rag_generator.answer(current_question=user_input,
                                               chat_history=queries,
                                               evidence_items=evidence_items)
            print("\nAssistant:")
            print(answer)

    def communicate_api(self, message: str) -> (str, int):
        user_input = message.strip()
        self.state.add_query(user_input)
        queries = self.state.get_queries_for_retrieval()
        top_k_per_query = self._dynamix_top_k_per_query()
        final_top_k = self._dynamic_final_top_k()
        self._print_queries_used(queries=queries,
                                 top_k_per_query=top_k_per_query,
                                 final_top_k=final_top_k)

        evidence_items = self.retriever.query_builder(question=queries,
                                                      top_k_per_query=top_k_per_query,
                                                      final_top_k=final_top_k)
        answer = self.rag_generator.answer(current_question=user_input,
                                           chat_history=queries,
                                           evidence_items=evidence_items)

        return answer, evidence_items


if __name__ == "__main__":
    cli = RetrievalChatCLI()
    cli.run_cli()
