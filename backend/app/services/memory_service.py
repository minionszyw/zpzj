from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.fact import MemoryFact
from app.services.embedding_service import EmbeddingService
from langchain_openai import ChatOpenAI
from app.core.config import settings
from sqlalchemy import delete

class MemoryService:
    @staticmethod
    async def extract_and_save_facts(db: AsyncSession, archive_id: str, messages: list):
        llm = ChatOpenAI(
            model=settings.LLM_MODEL,
            api_key=settings.LLM_API_KEY,
            base_url=settings.LLM_API_BASE,
            temperature=0
        )
        
        history_text = "\n".join([f"{m['role']}: {m['content']}" for m in messages[-5:]])
        
        prompt = f"""
        从以下对话中提取关于用户的持久性事实信息（如：职业、所在地、重大经历、性格偏好等）。
        仅提取事实，不要推导。如果没有任何新事实，返回空列表。
        
        对话内容：
        {history_text}
        
        请输出 JSON 数组格式，例如：["用户目前在上海工作", "用户是一名软件工程师"]
        """
        
        res = await llm.ainvoke(prompt)
        import json
        import re
        
        facts = []
        try:
            # 改进解析：提取第一个 [ ] 之间的内容
            json_match = re.search(r'\[.*\]', res.content, re.DOTALL)
            if json_match:
                facts = json.loads(json_match.group())
            else:
                # 尝试直接解析
                facts = json.loads(res.content.strip())
        except Exception as e:
            print(f"Failed to parse memory facts: {e}, content: {res.content}")
            facts = []
            
        for content in facts:
            # 查重逻辑可选
            vector = await EmbeddingService.get_query_embedding(content)
            new_fact = MemoryFact(
                archive_id=archive_id,
                content=content,
                embedding=vector
            )
            db.add(new_fact)
        
        await db.commit()
        return facts

    @staticmethod
    async def delete_fact(db: AsyncSession, fact_id: str):
        stmt = delete(MemoryFact).where(MemoryFact.id == fact_id)
        await db.execute(stmt)
        await db.commit()
