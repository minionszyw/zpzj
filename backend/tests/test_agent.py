import pytest
from unittest.mock import AsyncMock, patch
from app.agent.graph import build_graph
from app.agent.state import AgentState
from app.models.user import User
from app.models.archive import Archive
from app.models.fact import MemoryFact
from sqlalchemy.future import select
from datetime import datetime
from uuid import uuid4
from langchain_core.messages import AIMessage, HumanMessage

@pytest.mark.asyncio
async def test_agent_interactive_diagnosis_workflow(db_session):
    """
    测试交互式诊断：当上下文不足时，Agent 应该走引导流程。
    """
    graph = build_graph()
    # Intent Node 返回内容
    m_intent = AsyncMock(content='{"intent": "事业", "context_sufficient": false, "needed_info": ["目前从事的行业", "学历"]} ')
    # Respond Node 返回 AIMessage
    m_respond = AIMessage(content="为了更准确地为您分析事业运势，请问您目前的学历和所处行业是什么？")
    m_memory = AsyncMock(content='[]')

    with patch("langchain_openai.ChatOpenAI.ainvoke") as mock_invoke:
        mock_invoke.side_effect = [m_intent, m_respond, m_memory]
        initial_state = {
            "archive_id": str(uuid4()),
            "query": "我想看看事业",
            "messages": [HumanMessage(content="我想看看事业")],
            "context_sufficient": True
        }
        result = await graph.ainvoke(initial_state)
        assert result["intent"] == "事业"
        assert result["context_sufficient"] is False
        assert "学历" in result["final_response"]

@pytest.mark.asyncio
async def test_agent_full_calculation_workflow(db_session):
    """
    测试完整流程：上下文充足时，应执行计算并返回分析。
    """
    # 真实 PostgreSQL 环境下必须先创建 User 以满足外键约束
    user = User(id=uuid4(), email=f"test_{uuid4().hex[:8]}@example.com", hashed_password="pw", nickname="test")
    db_session.add(user)
    await db_session.flush()

    archive = Archive(
        id=uuid4(),
        user_id=user.id,
        name="测试员",
        birth_time=datetime(1990, 1, 1, 12, 0, 0),
        lat=31.23,
        lng=121.47,
        location_name="上海"
    )
    db_session.add(archive)
    await db_session.commit()

    graph = build_graph()
    m_intent = AsyncMock(content='{"intent": "综合", "context_sufficient": true, "needed_info": []}')
    m_respond = AIMessage(content="您的命盘显示金水两旺...")
    m_memory = AsyncMock(content='[]')

    with patch("langchain_openai.ChatOpenAI.ainvoke") as mock_invoke:
        mock_invoke.side_effect = [m_intent, m_respond, m_memory]
        initial_state = {
            "archive_id": str(archive.id),
            "query": "全面分析一下我的命盘",
            "messages": [HumanMessage(content="全面分析一下我的命盘")],
            "context_sufficient": True
        }
        result = await graph.ainvoke(initial_state)
        assert "bazi_result" in result
        year_data = result["bazi_result"]["core"]["year"]
        assert f"{year_data['gan']}{year_data['zhi']}" == "己巳"
        assert "金水两旺" in result["final_response"]

@pytest.mark.asyncio
async def test_agent_memory_extraction(db_session):
    """
    测试记忆提取：咨询完成后，事实应存入数据库。
    """
    user = User(id=uuid4(), email=f"mem_{uuid4().hex[:8]}@example.com", hashed_password="pw", nickname="mem")
    db_session.add(user)
    await db_session.flush()

    archive = Archive(
        id=uuid4(), user_id=user.id, name="记忆测试",
        birth_time=datetime(1995, 5, 5, 10, 0, 0),
        lat=39.9, lng=116.4, location_name="北京"
    )
    db_session.add(archive)
    await db_session.commit()

    graph = build_graph()
    m_intent = AsyncMock(content='{"intent": "事业", "context_sufficient": true, "needed_info": []}')
    m_respond = AIMessage(content="你目前在金融行业工作，今年财运不错。")
    m_memory = AsyncMock(content='["用户目前在金融行业工作"]')

    # 注意：MemoryService 内部也会生成向量，需要 Patch Embedding
    with patch("langchain_openai.ChatOpenAI.ainvoke") as mock_invoke, \
         patch("app.services.embedding_service.EmbeddingService.get_embeddings", new_callable=AsyncMock) as mock_emb:
        
        mock_invoke.side_effect = [m_intent, m_respond, m_memory]
        mock_emb.return_value = [[0.1] * 1024]
        
        state = {
            "archive_id": str(archive.id),
            "query": "我是在金融行业工作的，帮我看看财运",
            "messages": [HumanMessage(content="我是在金融行业工作的，帮我看看财运")],
            "context_sufficient": True
        }
        await graph.ainvoke(state)
        
        stmt = select(MemoryFact).where(MemoryFact.archive_id == archive.id)
        res = await db_session.execute(stmt)
        facts = res.scalars().all()
        assert len(facts) == 1
        assert "金融行业" in facts[0].content