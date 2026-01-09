import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import settings
from app.core.redis import redis_client

@pytest.mark.asyncio
async def test_send_code(mock_redis):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            f"{settings.API_V1_STR}/auth/send-code",
            json={"email": "test@example.com"}
        )
    assert response.status_code == 200
    assert response.json()["message"] == "验证码已发送"
    
    # 检查 Mock Redis 是否存入了验证码
    code = await mock_redis.get("auth_code:test@example.com")
    assert code is not None
    assert len(code) == 6

@pytest.mark.asyncio
async def test_login_success(db_session, mock_redis):
    email = "test_login@example.com"
    # 先伪造一个验证码到 Mock Redis
    await mock_redis.set(f"auth_code:{email}", "123456", ex=300)
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            f"{settings.API_V1_STR}/auth/login",
            json={"email": email, "code": "123456"}
        )
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    
    # 检查 Mock Redis 验证码是否已删除
    code = await mock_redis.get(f"auth_code:{email}")
    assert code is None

@pytest.mark.asyncio
async def test_update_user_settings(db_session, mock_redis):
    email = "test_user@example.com"
    await mock_redis.set(f"auth_code:{email}", "111111", ex=300)
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. 登录获取 Token
        login_res = await ac.post(
            f"{settings.API_V1_STR}/auth/login",
            json={"email": email, "code": "111111"}
        )
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. 更新设置
        update_res = await ac.patch(
            f"{settings.API_V1_STR}/users/me",
            json={
                "nickname": "新昵称",
                "settings": {"depth": 15, "response_mode": "professional"}
            },
            headers=headers
        )
        assert update_res.status_code == 200
        data = update_res.json()
        assert data["nickname"] == "新昵称"
        assert data["settings"]["depth"] == 15
        assert data["settings"]["response_mode"] == "professional"
        
        # 3. 再次获取验证持久化
        me_res = await ac.get(f"{settings.API_V1_STR}/users/me", headers=headers)
        assert me_res.json()["settings"]["response_mode"] == "professional"