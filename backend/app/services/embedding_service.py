import httpx
from typing import List
from app.core.config import settings

class EmbeddingService:
    @staticmethod
    async def get_embeddings(texts: List[str]) -> List[List[float]]:
        headers = {
            "Authorization": f"Bearer {settings.EMBEDDING_API_KEY}",
            "Content-Type": "application/json"
        }
        url = f"{settings.EMBEDDING_API_BASE}/embeddings"
        
        all_embeddings = []
        batch_size = 64
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]
                payload = {
                    "model": settings.EMBEDDING_MODEL,
                    "input": batch
                }
                response = await client.post(url, json=payload, headers=headers)
                if response.status_code != 200:
                    raise Exception(f"Embedding API error: {response.text}")
                
                data = response.json()
                # 确保按 index 排序并提取 embedding
                batch_embeddings = [item["embedding"] for item in sorted(data["data"], key=lambda x: x["index"])]
                all_embeddings.extend(batch_embeddings)
                
        return all_embeddings

    @staticmethod
    async def get_query_embedding(text: str) -> List[float]:
        headers = {
            "Authorization": f"Bearer {settings.EMBEDDING_API_KEY}",
            "Content-Type": "application/json"
        }
        url = f"{settings.EMBEDDING_API_BASE}/embeddings"
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            payload = {
                "model": settings.EMBEDDING_MODEL,
                "input": [text]
            }
            response = await client.post(url, json=payload, headers=headers)
            if response.status_code != 200:
                raise Exception(f"Embedding API error: {response.text}")
            
            data = response.json()
            return data["data"][0]["embedding"]