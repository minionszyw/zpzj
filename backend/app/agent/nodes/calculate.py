from app.agent.state import AgentState
from app.services.bazi_service import BaziService
from app.services.archive_service import ArchiveService
from app.db.session import get_async_session_maker
from uuid import UUID

async def calculate_node(state: AgentState):
    if state.get("bazi_result"):
        return {}

    archive_id = state["archive_id"]
    
    # 使用通用的 Session 获取方式
    SessionLocal = get_async_session_maker()
    async with SessionLocal() as db:
        archive = await ArchiveService.get(db, UUID(archive_id), None)
        bazi_result = await BaziService.get_result(archive)
        
    return {"bazi_result": bazi_result}