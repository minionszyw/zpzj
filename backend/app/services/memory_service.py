from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.fact import MemoryFact
from app.services.embedding_service import EmbeddingService
from langchain_openai import ChatOpenAI
from app.core.config import settings
from sqlalchemy import delete, text

class MemoryService:
    @staticmethod
    async def extract_and_save_facts(db: AsyncSession, archive_id: str, messages: list, existing_facts: List[str] = None):
        llm = ChatOpenAI(
            model=settings.LLM_MODEL,
            api_key=settings.LLM_API_KEY,
            base_url=settings.LLM_API_BASE,
            temperature=0
        )
        
        history_parts = []
        for m in messages[-5:]:
            if isinstance(m, dict):
                role = m.get("role", "unknown")
                content = m.get("content", "")
            else:
                role = getattr(m, "type", "unknown")
                content = getattr(m, "content", "")
            history_parts.append(f"{role}: {content}")
        history_text = "\n".join(history_parts)
        existing_facts_text = "\n".join(existing_facts) if existing_facts else "暂无"
        
        prompt = f"""
        你是一个记忆提取专家。请从以下对话中提取关于用户的持久性事实信息（如：职业、所在地、重大经历、性格偏好等）。
        
        【已有的事实记忆】（请不要重复提取这些信息）:
        {existing_facts_text}
        
        对话内容：
        {history_text}
        
        提取准则：
        1. 仅提取对话中新出现的、明确的事实。
        2. 不要提取临时的、随意的或命理推导出的结论。
        3. 如果信息是对已有事实的补充或修正，请提取完整的新事实。
        4. 如果没有任何新事实，返回空列表 []。
        
        请输出 JSON 数组格式，例如：["用户目前在上海工作", "用户是一名软件工程师"]
        """
        
        res = await llm.ainvoke(prompt)
        import json
        import re
        
        facts = []
        try:
            json_match = re.search(r'\[.*\]', res.content, re.DOTALL)
            if json_match:
                facts = json.loads(json_match.group())
            else:
                facts = json.loads(res.content.strip())
        except Exception as e:
            print(f"Failed to parse memory facts: {e}, content: {res.content}")
            facts = []
            
        new_saved_facts = []
        for content in facts:
            # 语义查重逻辑
            vector = await EmbeddingService.get_query_embedding(content)
            vector_str = f"[{','.join(map(str, vector))}]"
            
            # 使用向量余弦相似度查重 (1 - cosine_distance > 0.9)
            # pgvector 的 <=> 是欧式距离，<#> 是负内积，<=> 是余弦距离
            # 我们使用 <=> 余弦距离，距离越小越相似
            check_sql = text("""
                SELECT content FROM memory_facts 
                WHERE archive_id = :archive_id 
                AND embedding <=> :vector < 0.15
                LIMIT 1
            """)
            result = await db.execute(check_sql, {"archive_id": archive_id, "vector": vector_str})
            existing = result.fetchone()
            
            if not existing:
                new_fact = MemoryFact(
                    archive_id=archive_id,
                    content=content,
                    embedding=vector
                )
                db.add(new_fact)
                new_saved_facts.append(content)
            else:
                print(f"Detected duplicate fact: '{content}' is similar to existing '{existing[0]}'")
        
        await db.commit()
        return new_saved_facts

    @staticmethod
    async def delete_fact(db: AsyncSession, fact_id: str):
        stmt = delete(MemoryFact).where(MemoryFact.id == fact_id)
        await db.execute(stmt)
        await db.commit()
