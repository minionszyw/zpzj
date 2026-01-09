from typing import Any
from uuid import UUID, uuid4
from datetime import datetime
from sqlmodel import SQLModel, Field, Column
from pgvector.sqlalchemy import Vector

class AncientBook(SQLModel, table=True):
    __tablename__ = "ancient_knowledge"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    book_name: str = Field(index=True)
    chapter: str = Field(index=True)
    content: str
    embedding: Any = Field(sa_column=Column(Vector(1024)))
    created_at: datetime = Field(default_factory=datetime.utcnow)