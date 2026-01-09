import asyncio
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from sqlmodel import SQLModel
from app.main import app
from app.db.session import get_session
from app.core.config import settings
import redis.asyncio as redis

# 独立的测试引擎，确保每个测试会话逻辑清晰
TEST_DATABASE_URL = settings.async_database_url

@pytest.fixture(autouse=True)
def mock_env_vars(monkeypatch):
    monkeypatch.setenv("LLM_API_KEY", "fake-key")
    monkeypatch.setenv("EMBEDDING_API_KEY", "fake-key")
    monkeypatch.setenv("DATABASE_URL", TEST_DATABASE_URL)

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session", autouse=True)
async def setup_test_db():
    # Session 级别初始化：创建扩展和表
    engine = create_async_engine(TEST_DATABASE_URL)
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(SQLModel.metadata.drop_all)
        await conn.run_sync(SQLModel.metadata.create_all)
    await engine.dispose()

@pytest.fixture(scope="function")
async def db_session(monkeypatch):
    # Function 级别：提供干净的 Session
    engine = create_async_engine(TEST_DATABASE_URL)
    # 强制让业务代码中的全局 engine 也指向这个
    monkeypatch.setattr("app.db.session.engine", engine)
    
    SessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with SessionLocal() as session:
        yield session
        # 清理数据防止干扰下一个测试
        for table in reversed(SQLModel.metadata.sorted_tables):
            await session.execute(text(f"TRUNCATE TABLE {table.name} RESTART IDENTITY CASCADE"))
        await session.commit()
    await engine.dispose()

@pytest.fixture(autouse=True)
async def mock_redis(monkeypatch):
    # 动态创建 Redis 客户端绑定到当前 Loop
    client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    monkeypatch.setattr("app.core.redis.redis_client", client)
    monkeypatch.setattr("app.services.auth_service.redis_client", client)
    await client.flushdb()
    yield client
    await client.close()

@pytest.fixture(autouse=True)
async def override_get_session(db_session):
    app.dependency_overrides[get_session] = lambda: db_session
