from __future__ import annotations
from src.rag_bot.model import RetrieveEvidence


class PromptBuilder:
    @staticmethod
    def build_evidence_block(evidence_items: list[RetrieveEvidence]) -> str:
        if not evidence_items:
            return "No evidence retrieved"

        blocks:list[str]=[]
        for idx, item in enumerate(evidence_items, start=1):
            metadata = item.metadata or {}
            source_type = metadata.get("source_type", "")
            source_name = metadata.get("source_name", "")
            document_title = metadata.get("document_title", "")
            page = metadata.get("page", "")
            path = metadata.get("path", "")

            block=f"""
[EVIDENCE # {idx}]
Chunk ID: {item.chunk_id}
Distance: {item.distance}
Retrieved for query: {item.query_used}
source name: {source_name}
source_type:{source_type}
Document title: {document_title}
Page: {page}
Path: {path}
content: {item.text}
""".strip()
            blocks.append(block)

        return "\n\n".join(blocks)

    @staticmethod
    def build_chat_history_block(chat_history:list[str])->str:
        if not chat_history:
            return "No prior chat history."
        line=[]
        for idx,query in enumerate(chat_history,start=1):
            line.append(f"{idx}.{query}")
        return "\n".join(line)

    @staticmethod
    def build_rag_prompt(current_question:str,
                         chat_history:list[str],
                         evidence_items:list[RetrieveEvidence])->str:
        history_block=PromptBuilder.build_chat_history_block(chat_history)
        evidence_block=PromptBuilder.build_evidence_block(evidence_items)

        return f"""
        You are an evidence-grounded assistant.

Answer the user's current question using ONLY the retrieved evidence below.
Do not invent unsupported claims.
If the answer is not supported by the evidence, clearly say that the evidence does not confirm it.

Instructions:
- Prioritize the current question.
- Use recent chat history only for context.
- Base the answer on the retrieved evidence.
- If possible, mention which project, paper, resume section, or certificate supports the answer.
- Be concise but helpful.
- If the user asks to list projects, list them from the retrieved evidence only.

Current user question:
{current_question}

Recent chat history:
{history_block}

Retrieved evidence:
{evidence_block}

Now answer the current user question.
""".strip()


