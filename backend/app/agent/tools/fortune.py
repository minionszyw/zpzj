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
    
    found_years = []
    fortune = bazi_result.get("fortune", {})
    da_yun_list = fortune.get("da_yun", [])
    
    for dy in da_yun_list:
        for ln in dy.get("liu_nian", []):
            year = ln.get("year")
            if start_year <= year <= end_year:
                # 构造简洁的返回结构，减少 Token
                found_years.append({
                    "year": year,
                    "gan_zhi": ln.get("gan_zhi"),
                    "liu_yue": ln.get("liu_yue")
                })
                
    if not found_years:
        return f"未查询到 {start_year} 到 {end_year} 之间的详细流年信息。"
        
    return json.dumps(found_years, ensure_ascii=False)
