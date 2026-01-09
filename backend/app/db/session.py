from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from app.core.config import settings

# 全局引擎（业务运行使用）
engine = create_async_engine(settings.async_database_url, echo=True, future=True)

def get_async_session_maker():
    # 始终基于当前的全局 engine 变量创建（方便测试 Patch）
    from app.db.session import engine as current_engine
    return sessionmaker(
        current_engine, class_=AsyncSession, expire_on_commit=False
    )

async def get_session() -> AsyncSession:
    SessionLocal = get_async_session_maker()
    async with SessionLocal() as session:
        yield session

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
