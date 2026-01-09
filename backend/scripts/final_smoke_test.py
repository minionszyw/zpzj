import asyncio
import httpx
import sys
import os
from uuid import UUID

# 确保能找到 app 目录以获取 settings
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.core.config import settings

BASE_URL = "http://localhost:8000/api/v1"

async def smoke_test():
    print("=== Starting Final Smoke Test (Phase 1-3) ===")
    
    # 我们需要在后台启动 uvicorn
    # 但由于当前是在脚本中，我们假设后端已经在 8000 端口启动
    # 或者我们直接使用 httpx 的 ASGITransport
    from app.main import app
    from httpx import ASGITransport
    
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test/api/v1") as client:
        
        # 1. Auth: Send Code
        email = "smoke_test@example.com"
        print(f"1. Testing Auth (Send Code) for {email}...")
        res = await client.post("/auth/send-code", json={"email": email})
        assert res.status_code == 200
        
        # 2. Auth: Login (We need to manually get code from Redis for this test)
        import redis.asyncio as redis
        r = redis.from_url(settings.REDIS_URL, decode_responses=True)
        code = await r.get(f"auth_code:{email}")
        print(f"   Got code from Redis: {code}")
        
        print("2. Testing Auth (Login)...")
        res = await client.post("/auth/login", json={"email": email, "code": code})
        assert res.status_code == 200
        token = res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 3. Archive: Create
        print("3. Creating Archive...")
        archive_data = {
            "name": "烟测试员",
            "gender": 1,
            "birth_time": "1988-08-08T08:08:08",
            "calendar_type": "SOLAR",
            "lat": 39.9,
            "lng": 116.4,
            "location_name": "北京",
            "relation": "自己",
            "algorithms_config": {"time_mode": "TRUE_SOLAR", "month_mode": "SOLAR_TERM", "zi_shi_mode": "LATE_ZI_IN_DAY"}
        }
        res = await client.post("/archives/", json=archive_data, headers=headers)
        assert res.status_code == 200
        archive_id = res.json()["id"]
        
        # 4. Chat: Create Session
        print("4. Creating Chat Session...")
        res = await client.post("/chat/sessions", params={"archive_id": archive_id}, headers=headers)
        assert res.status_code == 200
        session_id = res.json()["id"]
        
        # 5. AI Chat: Completion (This will call LLM and Embedding)
        print("5. Testing AI Chat Completion (Calling LLM)...")
        # 注意：这里会真实调用 DeepSeek 和 SiliconFlow，除非我们在运行前 Mock 了它们
        # 为了验证 Phase 1-3 真实性，我们保持真实调用
        res = await client.post("/chat/completions", params={"session_id": session_id, "content": "我的性格特点是什么？"}, headers=headers)
        
        if res.status_code == 200:
            print(f"   AI Response: {res.json()['content'][:100]}...")
        else:
            print(f"   AI Chat Failed: {res.text}")
            assert False
            
        # 6. Memory: Verify Fact Stored
        print("6. Verifying Fact Memory...")
        res = await client.get(f"/chat/sessions/{session_id}/facts", headers=headers)
        facts = res.json()
        print(f"   Stored Facts count: {len(facts)}")
        for f in facts:
            print(f"   - {f['content']}")
            
    print("=== Smoke Test Completed Successfully ===")

if __name__ == "__main__":
    asyncio.run(smoke_test())
