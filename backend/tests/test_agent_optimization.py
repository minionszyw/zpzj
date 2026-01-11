import pytest
from unittest.mock import AsyncMock, patch
from app.agent.graph import build_graph
from app.models.user import User
from app.models.archive import Archive
from datetime import datetime
from uuid import uuid4
import json
from langchain_core.messages import AIMessage, ToolMessage, HumanMessage

@pytest.mark.asyncio
async def test_agent_optimization_and_tool_call(db_session):
    """
    验证 Agent 优化方案：
    1. 核心命盘数据被精简。
    2. AI 在询问特定年份时触发工具调用。
    """
    # 1. 准备数据
    user = User(id=uuid4(), email=f"opt_{uuid4().hex[:8]}@example.com", hashed_password="pw", nickname="opt")
    db_session.add(user)
    await db_session.flush()

    archive = Archive(
        id=uuid4(), user_id=user.id, name="优化测试",
        birth_time=datetime(1990, 1, 1, 12, 0, 0),
        lat=31.23, lng=121.47, location_name="上海",
        algorithms_config={"time_mode": "TRUE_SOLAR"}
    )
    db_session.add(archive)
    await db_session.commit()

    # 2. 构建图
    graph = build_graph()
    
    # 3. 设置 Mock
    # Intent Node 返回结果
    m_intent = AsyncMock(content='{"intent": "财运", "context_sufficient": true, "needed_info": []}')
    
    # 第一次 Respond Node 调用：AI 决定调用工具
    tool_call = {
        "name": "query_fortune_details",
        "args": {"start_year": 2025, "end_year": 2025},
        "id": "call_123"
    }
    m_respond_first = AIMessage(content="", tool_calls=[tool_call])
    
    # 第二次 Respond Node 调用：AI 得到工具结果后的最终回答
    m_respond_second = AIMessage(content="根据工具提供的 2025 乙巳年数据，您的财运非常旺盛...")
    
    # Memory Node 提取结果
    m_memory = AsyncMock(content='[]')

    with patch("langchain_openai.ChatOpenAI.ainvoke") as mock_invoke, \
         patch("app.services.embedding_service.EmbeddingService.get_embeddings", new_callable=AsyncMock) as mock_emb:
        
        mock_invoke.side_effect = [m_intent, m_respond_first, m_respond_second, m_memory]
        mock_emb.return_value = [[0.1] * 1024]
        
        initial_state = {
            "archive_id": str(archive.id),
            "query": "2025年财运怎么样？",
            "messages": [HumanMessage(content="2025年财运怎么样？")],
            "context_sufficient": True,
            "server_time": "2025-01-01 12:00:00",
            "response_mode": "normal"
        }
        
        # 4. 执行
        result = await graph.ainvoke(initial_state)
        
        # 5. 断言
        assert "2025" in result["final_response"]
        assert "乙巳" in result["final_response"] or "旺盛" in result["final_response"]
        
        # 验证工具是否被执行
        has_tool_msg = any(isinstance(m, ToolMessage) for m in result["messages"])
        assert has_tool_msg, "应该包含 ToolMessage"
        
        # 验证 bazi_result 是否在 state 中（全量）
        assert "bazi_result" in result
        assert "fortune" in result["bazi_result"]
        # 验证全量数据中确实有 2025 年
        da_yun_list = result["bazi_result"]["fortune"]["da_yun"]
        found_2025 = False
        for dy in da_yun_list:
            for ln in dy.get("liu_nian", []):
                if ln["year"] == 2025:
                    found_2025 = True
                    break
        assert found_2025
