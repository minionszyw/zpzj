import json
import os
from typing import List, Dict, Any

LATLNG_PATH = os.path.join(os.path.dirname(__file__), "../../../zpbz/data/latlng.json")

class LocationService:
    _flat_data: List[Dict[str, Any]] = []

    @classmethod
    def _load_data(cls):
        if not cls._flat_data and os.path.exists(LATLNG_PATH):
            with open(LATLNG_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                cls._flat_data = []
                
                def traverse(node, path=""):
                    name = node.get("name", "")
                    current_path = f"{path} {name}".strip() if path else name
                    
                    # If it has coordinates, add to flat data
                    if "lat" in node and "lng" in node:
                        # Note: In latlng.json, lat seems to be around 116 (which is longitude) 
                        # and lng is around 39 (which is latitude).
                        # We will treat them as labeled but be aware of the values.
                        # Actually, let's look at the values:
                        # Beijing: lat 116.4, lng 39.9
                        # Correct Lat/Lng for Beijing is Lat 39.9, Lng 116.4.
                        # So they ARE swapped in the JSON keys.
                        cls._flat_data.append({
                            "display_name": current_path,
                            "name": name,
                            "lat": float(node["lng"]), # Real Latitude
                            "lng": float(node["lat"])  # Real Longitude
                        })
                    
                    for child in node.get("children", []):
                        traverse(child, current_path)

                traverse(data)

    @classmethod
    def search(cls, query: str) -> List[Dict[str, Any]]:
        cls._load_data()
        if not query:
            return []
        
        query = query.lower()
        results = []
        for item in cls._flat_data:
            if query in item["display_name"].lower():
                results.append(item)
                if len(results) >= 15:
                    break
        return results