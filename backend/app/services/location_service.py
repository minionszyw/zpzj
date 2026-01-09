import json
import os
from typing import List, Dict, Any

# 假设 latlng.json 在 zpbz/data 目录下
LATLNG_PATH = os.path.join(os.path.dirname(__file__), "../../../zpbz/data/latlng.json")

class LocationService:
    _data: Dict[str, Any] = {}

    @classmethod
    def _load_data(cls):
        if not cls._data and os.path.exists(LATLNG_PATH):
            with open(LATLNG_PATH, "r", encoding="utf-8") as f:
                cls._data = json.load(f)

    @classmethod
    def search(cls, query: str) -> List[Dict[str, Any]]:
        cls._load_data()
        results = []
        for province, cities in cls._data.items():
            for city, coords in cities.items():
                if query in city or query in province:
                    results.append({
                        "display_name": f"{province} - {city}",
                        "province": province,
                        "city": city,
                        "lat": coords["lat"],
                        "lng": coords["lng"]
                    })
        return results[:10]  # 返回前 10 个匹配项
