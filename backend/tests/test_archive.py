import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import settings

@pytest.mark.asyncio
async def test_archive_lifecycle_and_bazi(db_session, mock_redis):
    email = "archive_test@example.com"
    await mock_redis.set(f"auth_code:{email}", "123456", ex=300)
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Login
        login_res = await ac.post(
            f"{settings.API_V1_STR}/auth/login",
            json={"email": email, "code": "123456"}
        )
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Create Archive
        archive_data = {
            "name": "张三",
            "gender": 1,
            "birth_time": "1990-01-01T12:00:00",
            "calendar_type": "SOLAR",
            "lat": 31.23,
            "lng": 121.47,
            "location_name": "上海",
            "is_self": True,
            "relation": "自己",
            "algorithms_config": {
                "time_mode": "TRUE_SOLAR",
                "month_mode": "SOLAR_TERM",
                "zi_shi_mode": "LATE_ZI_IN_DAY"
            }
        }
        create_res = await ac.post(
            f"{settings.API_V1_STR}/archives/",
            json=archive_data,
            headers=headers
        )
        assert create_res.status_code == 200
        archive_id = create_res.json()["id"]
        
        # 3. Get Bazi Chart
        bazi_res = await ac.get(
            f"{settings.API_V1_STR}/archives/{archive_id}/bazi",
            headers=headers
        )
        assert bazi_res.status_code == 200
        bazi_data = bazi_res.json()
        assert "core" in bazi_data
        assert bazi_data["request"]["name"] == "张三"
        
        # 4. Update Algorithm Config
        update_res = await ac.patch(
            f"{settings.API_V1_STR}/archives/{archive_id}",
            json={
                "algorithms_config": {
                    "time_mode": "MEAN_SOLAR", # 修改为平太阳时
                    "month_mode": "SOLAR_TERM",
                    "zi_shi_mode": "LATE_ZI_IN_DAY"
                }
            },
            headers=headers
        )
        assert update_res.status_code == 200
        
        # 5. Verify Bazi Chart updated (Time mode should be MEAN_SOLAR)
        bazi_res_v2 = await ac.get(
            f"{settings.API_V1_STR}/archives/{archive_id}/bazi",
            headers=headers
        )
        assert bazi_res_v2.json()["request"]["time_mode"] == "MEAN_SOLAR"
