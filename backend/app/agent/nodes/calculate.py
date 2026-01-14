from app.agent.state import AgentState
from app.services.bazi_service import BaziService
from app.services.archive_service import ArchiveService
from app.db.session import get_async_session_maker
from uuid import UUID

async def calculate_node(state: AgentState):
    # 结果容器
    updates = {}
    
    # 1. 计算主命盘 (如果尚未计算)
    if not state.get("bazi_result"):
        archive_id = state["archive_id"]
        SessionLocal = get_async_session_maker()
        async with SessionLocal() as db:
            archive = await ArchiveService.get(db, UUID(archive_id), None)
            updates["bazi_result"] = await BaziService.get_result(archive)

    # 2. 处理关联命盘
    related_ids = state.get("related_archive_ids", [])
    if related_ids:
        related_results = state.get("related_bazi_results", {}) or {}
        SessionLocal = get_async_session_maker()
        async with SessionLocal() as db:
            for rid in related_ids:
                # 排除主命盘
                if rid == state["archive_id"]:
                    continue
                # 排除已计算过的
                if rid in related_results:
                    continue
                try:
                    r_archive = await ArchiveService.get(db, UUID(rid), None)
                    r_bazi = await BaziService.get_result(r_archive)
                    related_results[rid] = r_bazi
                except Exception as e:
                    print(f"Failed to calculate related archive {rid}: {e}")
        
        updates["related_bazi_results"] = related_results
        
    return updates
