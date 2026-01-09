import asyncio
import sys
import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel

# 确保加载所有模型
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.core.config import settings
from app.models.user import User
from app.models.archive import Archive
from app.models.knowledge import AncientBook
from app.models.fact import MemoryFact
from app.models.chat import ChatSession, Message

async def init_db():
    engine = create_async_engine(settings.async_database_url)
    async with engine.begin() as conn:
        print("Ensuring pgvector extension...")
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        print("Syncing tables...")
        await conn.run_sync(SQLModel.metadata.create_all)
    print("Database sync completed.")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(init_db())
