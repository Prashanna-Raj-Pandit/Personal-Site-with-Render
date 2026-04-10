from __future__ import annotations
from src.rag_bot.llm.cohere_client import CohereClient
from src.rag_bot.llm.prompt_builder import PromptBuilder
from src.rag_bot.model import RetrieveEvidence


class RAGGenerator:
    def __init__(self) -> None:
        self.client = CohereClient()

    def answer(self,
               current_question: str,
               chat_history: list[str],
               evidence_items: list[RetrieveEvidence]) -> str:
        prompt = PromptBuilder.build_rag_prompt(current_question=current_question, chat_history=chat_history,
                                                evidence_items=evidence_items)
        ans = self.client.generate_text(prompt=prompt, temperature=0.2)

        return ans
