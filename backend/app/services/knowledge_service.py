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
            query_sql = text("""
                SELECT content FROM memory_facts 
                WHERE archive_id = :archive_id
                ORDER BY embedding <=> :vector
                LIMIT :limit
            """)
            result = await session.execute(query_sql, {
                "archive_id": archive_id, 
                "vector": vector_str, 
                "limit": limit
            })
            return [row[0] for row in result.fetchall()]