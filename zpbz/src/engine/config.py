import json
import os
from typing import Dict, Any, Optional

class BaziConfig:
    def __init__(self, config_path: str = "data/latlng.json"):
        self.config_path = config_path
        self.flat_latlng: Dict[str, float] = {}
        self._load_config()

    def _load_config(self):
        if not os.path.exists(self.config_path):
            return

        with open(self.config_path, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
                self._flatten_data(data)
            except json.JSONDecodeError:
                pass

    def _flatten_data(self, item: Any):
        """
        递归地将树形结构的城市数据扁平化。
        注意：观察 data/latlng.json 发现 'lat' 字段存的是经度 (116.40...)，
        'lng' 字段存的是纬度 (39.90...)。我们需要经度进行真太阳时校正。
        """
        if isinstance(item, dict):
            name = item.get("name")
            # 这里的 'lat' 实际上存储的是经度数据（如北京 116.40）
            lon_str = item.get("lat")
            if name and lon_str:
                try:
                    self.flat_latlng[name] = float(lon_str)
                except ValueError:
                    pass
            
            # 递归处理子节点
            children = item.get("children", [])
            for child in children:
                self._flatten_data(child)
        elif isinstance(item, list):
            for sub_item in item:
                self._flatten_data(sub_item)

    def get_longitude(self, location: str) -> float:
        """
        根据地名获取经度。
        若找不到，则返回东八区基准 120.0
        """
        return self.flat_latlng.get(location, 120.0)

# 创建默认配置实例
config = BaziConfig()