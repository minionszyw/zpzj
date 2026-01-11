from typing import List
from uuid import UUID
from sqlalchemy import text
from app.db.session import get_async_session_maker
from app.services.embedding_service import EmbeddingService
from sqlalchemy.ext.asyncio import AsyncSession

class KnowledgeService:
    @staticmethod
    async def retrieve_ancient_books(query: str, limit: int = 3) -> List[str]:
        vector = await EmbeddingService.get_query_embedding(query)
        vector_str = f"[{','.join(map(str, vector))}]"
        
        SessionLocal = get_async_session_maker()
        async with SessionLocal() as session:
            query_sql = text("""
                SELECT content FROM ancient_knowledge 
                ORDER BY embedding <=> :vector
                LIMIT :limit
            """)
            result = await session.execute(query_sql, {"vector": vector_str, "limit": limit})
            return [row[0] for row in result.fetchall()]

    @staticmethod
    async def retrieve_user_facts(archive_id: UUID, query: str, limit: int = 5) -> List[str]:
        vector = await EmbeddingService.get_query_embedding(query)
        vector_str = f"[{','.join(map(str, vector))}]"
        
        SessionLocal = get_async_session_maker()
        async with SessionLocal() as session:
            # 权重逻辑：相似度 * 时间衰减系数
            # 衰减公式：0.99 ^ (天数)，每天衰减 1%
            query_sql = text("""
                SELECT content, created_at,
                (1 - (embedding <=> :vector)) * pow(0.99, EXTRACT(DAY FROM (CURRENT_TIMESTAMP - created_at))) as weight_score
                FROM memory_facts 
                WHERE archive_id = :archive_id
                ORDER BY weight_score DESC
                LIMIT :limit
            """)
            result = await session.execute(query_sql, {
                "archive_id": archive_id, 
                "vector": vector_str, 
                "limit": limit
            })
            # 返回带时间戳的事实，增强 AI 对“时效性”的感知
            return [f"[{row[1].strftime('%Y-%m-%d')}] {row[0]}" for row in result.fetchall()]