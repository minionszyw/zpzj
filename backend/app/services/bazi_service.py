import sys
import os
from datetime import datetime

# 将 zpbz 源代码路径添加到 sys.path
ENGINE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../zpbz"))
if ENGINE_PATH not in sys.path:
    sys.path.append(ENGINE_PATH)

from src.engine.core import BaziEngine
from src.engine.models import BaziRequest, Gender, CalendarType, TimeMode, MonthMode, ZiShiMode
from app.models.archive import Archive

class BaziService:
    @staticmethod
    def get_result(archive: Archive):
        engine = BaziEngine()
        
        # 转换模型
        request = BaziRequest(
            name=archive.name,
            gender=Gender.MALE if archive.gender == 1 else Gender.FEMALE,
            calendar_type=CalendarType.SOLAR if archive.calendar_type == "SOLAR" else CalendarType.LUNAR,
            birth_datetime=archive.birth_time.strftime("%Y-%m-%d %H:%M:%S"),
            birth_location=archive.location_name,
            time_mode=TimeMode[archive.algorithms_config.get("time_mode", "TRUE_SOLAR")],
            month_mode=MonthMode[archive.algorithms_config.get("month_mode", "SOLAR_TERM")],
            zi_shi_mode=ZiShiMode[archive.algorithms_config.get("zi_shi_mode", "LATE_ZI_IN_DAY")]
        )
        
        result = engine.arrange(request)
        return result.dict()
