from langchain_core.tools import tool
from typing import Annotated
from langgraph.prebuilt import InjectedState
import json

@tool
def query_fortune_details(start_year: int, end_year: int, state: Annotated[dict, InjectedState]):
    """
    查询特定年份范围内的流年、流月运程详情。
    当用户询问特定年份（如：'2025年财运如何'、'明年运气怎么样'）时，必须调用此工具。
    参数:
        start_year: 开始年份 (int)
        end_year: 结束年份 (int)
    """
    bazi_result = state.get("bazi_result")
    if not bazi_result:
        return "未找到命盘数据。"
    
    # 检查是否有详细的流月数据，如果没有，说明是优化过的结果，需要完整重新推演
    fortune = bazi_result.get("fortune", {})
    da_yun_list = fortune.get("da_yun", [])
    
    # 简单的启发式检查：看第一年的第一个流月是否存在
    has_details = False
    if da_yun_list and da_yun_list[0].get("liu_nian"):
        first_ln = da_yun_list[0]["liu_nian"][0]
        if first_ln.get("liu_yue"):
            has_details = True

    if not has_details:
        # 触发完整推演
        print("--- Re-calculating full Bazi for tool details ---")
        from app.services.bazi_service import BaziService
        from app.models.archive import Archive
        from uuid import UUID
        # 注意：此处需要构造一个 mock archive 或者从 DB 获取，为了性能我们尽量复用配置
        # 这里最稳妥的是根据 archive_id 重新获取
        # 由于我们是在 tool 里，可以通过 state 拿 archive_id
        archive_id = state.get("archive_id")
        if archive_id:
            from app.db.session import get_async_session_maker
            import asyncio
            SessionLocal = get_async_session_maker()
            
            # 由于工具通常是同步运行环境（除非是 async tool），这里需要处理异步
            # 但 langchain @tool 默认是同步的。我们将重新计算逻辑写在 service 里
            from src.engine.core import BaziEngine
            from src.engine.models import BaziRequest, Gender, CalendarType, TimeMode, MonthMode, ZiShiMode
            
            engine = BaziEngine()
            cfg = state.get("archive_config", {})
            # 构造 request
            request = BaziRequest(
                name=cfg.get("name", "Unknown"),
                gender=Gender.MALE if cfg.get("gender") == 1 else Gender.FEMALE,
                calendar_type=CalendarType.SOLAR if cfg.get("calendar_type") == "SOLAR" else CalendarType.LUNAR,
                birth_datetime=cfg.get("birth_time"),
                birth_location="北京", # 简化的坐标
                longitude=cfg.get("lng", 116.4),
                latitude=cfg.get("lat", 39.9),
                time_mode=TimeMode.TRUE_SOLAR,
                month_mode=MonthMode.SOLAR_TERM,
                zi_shi_mode=ZiShiMode.LATE_ZI_IN_DAY
            )
            full_res = engine.arrange(request, skip_liu_yue=False)
            bazi_result = full_res.dict()
            fortune = bazi_result.get("fortune", {})
            da_yun_list = fortune.get("da_yun", [])

    found_years = []
    for dy in da_yun_list:
        for ln in dy.get("liu_nian", []):
            year = ln.get("year")
            if start_year <= year <= end_year:
                found_years.append({
                    "year": year,
                    "gan_zhi": ln.get("gan_zhi"),
                    "liu_yue": ln.get("liu_yue")
                })
                
    if not found_years:
        return f"未查询到 {start_year} 到 {end_year} 之间的详细流年信息。"
        
    return json.dumps(found_years, ensure_ascii=False)