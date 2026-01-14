import sys
import os
from datetime import datetime
import numpy as np
import json

# 将 zpbz 源代码路径添加到 sys.path
ENGINE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../zpbz"))
if ENGINE_PATH not in sys.path:
    sys.path.append(ENGINE_PATH)

from src.engine.core import BaziEngine
from src.engine.models import BaziRequest, Gender, CalendarType, TimeMode, MonthMode, ZiShiMode
from app.models.archive import Archive
from app.core.redis import redis_client

class BaziService:
    @staticmethod
    async def get_result(archive: Archive):
        # 1. 尝试从缓存获取
        # 缓存键必须包含所有影响排盘结果的变量
        cache_params = {
            "birth_time": archive.birth_time.strftime("%Y-%m-%d %H:%M:%S"),
            "calendar_type": archive.calendar_type,
            "gender": archive.gender,
            "lng": float(archive.lng),
            "lat": float(archive.lat),
            "config": archive.algorithms_config
        }
        cache_key = f"bazi_res:{archive.id}:{hash(json.dumps(cache_params, sort_keys=True))}"
        try:
            cached = await redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception as e:
            print(f"Redis error: {e}")

        engine = BaziEngine()
        
        # 转换模型
        request = BaziRequest(
            name=archive.name,
            gender=Gender.MALE if archive.gender == 1 else Gender.FEMALE,
            calendar_type=CalendarType.SOLAR if archive.calendar_type == "SOLAR" else CalendarType.LUNAR,
            birth_datetime=archive.birth_time.strftime("%Y-%m-%d %H:%M:%S"),
            birth_location=archive.location_name,
            longitude=archive.lng,
            latitude=archive.lat,
            time_mode=TimeMode[archive.algorithms_config.get("time_mode", "TRUE_SOLAR")],
            month_mode=MonthMode[archive.algorithms_config.get("month_mode", "SOLAR_TERM")],
            zi_shi_mode=ZiShiMode[archive.algorithms_config.get("zi_shi_mode", "LATE_ZI_IN_DAY")]
        )
        
        # 优化：跳过流月计算以加速初始排盘
        result = engine.arrange(request, skip_liu_yue=True)
        
        # 转换数据类型以支持 JSON 序列化
        processed_res = BaziService._convert_numpy(result.dict())
        
        # 2. 存入缓存 (有效期 24 小时)
        try:
            await redis_client.set(cache_key, json.dumps(processed_res), ex=86400)
        except Exception as e:
            print(f"Redis save error: {e}")
            
        return processed_res

    @staticmethod
    def _convert_numpy(obj):
        import uuid
        from datetime import datetime
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, uuid.UUID):
            return str(obj)
        elif isinstance(obj, datetime):
            return obj.strftime("%Y-%m-%d %H:%M:%S")
        elif isinstance(obj, dict):
            return {k: BaziService._convert_numpy(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [BaziService._convert_numpy(i) for i in obj]
        return obj

    @staticmethod
    def get_essential_data(full_result: dict):
        """
        裁剪全量数据，保留核心命盘、格局、能量、神煞和大运概览，
        移除 trace 和具体的流年流月数据以降低 Token 消耗。
        """
        essential = {
            "birth_solar_datetime": full_result.get("birth_solar_datetime"),
            "birth_lunar_datetime": full_result.get("birth_lunar_datetime"),
            "core": full_result.get("core"),
            "five_elements": full_result.get("five_elements"),
            "geju": full_result.get("geju"),
            "analysis": full_result.get("analysis"),
            "stars": full_result.get("stars"),
            "auxiliary": full_result.get("auxiliary"),
            "fortune": {
                "start_solar": full_result.get("fortune", {}).get("start_solar"),
                "start_age": full_result.get("fortune", {}).get("start_age"),
                "da_yun": []
            }
        }
        
        # 仅保留大运的时间和干支概览
        if "fortune" in full_result and "da_yun" in full_result["fortune"]:
            for dy in full_result["fortune"]["da_yun"]:
                essential["fortune"]["da_yun"].append({
                    "index": dy.get("index"),
                    "start_year": dy.get("start_year"),
                    "start_age": dy.get("start_age"),
                    "gan_zhi": dy.get("gan_zhi")
                })
                
        return essential
