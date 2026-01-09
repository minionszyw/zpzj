import os
import sys
import asyncio
from typing import List
from docx import Document
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import httpx

# 确保能找到 app 目录
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.services.embedding_service import EmbeddingService

class BookIngestor:
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=600,
            chunk_overlap=60,
            separators=["\n\n", "\n", "。", "！", "？"]
        )
        self.engine = create_async_engine(settings.async_database_url)
        self.SessionLocal = sessionmaker(
            self.engine, class_=AsyncSession, expire_on_commit=False
        )

    # ... load functions ...

    async def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        return await EmbeddingService.get_embeddings(texts)

    async def ingest_file(self, file_path: str):
        file_name = os.path.basename(file_path)
        ext = os.path.splitext(file_name)[1].lower()
        
        print(f"--- Starting Ingestion: {file_name} ---")
        
        if ext == ".docx":
            content = self.load_docx(file_path)
        elif ext == ".pdf":
            content = self.load_pdf(file_path)
        elif ext == ".txt":
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
        else:
            return

        chunks = [c for c in self.text_splitter.split_text(content) if c.strip()]
        print(f"Total chunks to process: {len(chunks)}")
        
        print("Requesting embeddings from SiliconFlow...")
        embeddings = await self.get_embeddings(chunks)
        
        print("Writing to PostgreSQL (pgvector)...")
        async with self.SessionLocal() as session:
            for i, (chunk, emb) in enumerate(zip(chunks, embeddings)):
                book_entry = AncientBook(
                    book_name="渊海子平",
                    chapter="全书",
                    content=chunk,
                    embedding=emb
                )
                session.add(book_entry)
            await session.commit()
        
        print(f"Done! Ingested {len(chunks)} chunks from {file_name}")

async def main():
    ingestor = BookIngestor()
    books_dir = os.path.join(os.path.dirname(__file__), "../../data/books")
    
    if not os.path.exists(books_dir):
        print(f"Directory not found: {books_dir}")
        return

    files = [f for f in os.listdir(books_dir) if os.path.isfile(os.path.join(books_dir, f))]
    for file_name in files:
        await ingestor.ingest_file(os.path.join(books_dir, file_name))

if __name__ == "__main__":
    asyncio.run(main())