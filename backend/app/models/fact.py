from typing import Any
from uuid import UUID, uuid4
from datetime import datetime
from sqlmodel import SQLModel, Field, Column
from pgvector.sqlalchemy import Vector

class MemoryFact(SQLModel, table=True):
    __tablename__ = "memory_facts"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    archive_id: UUID = Field(foreign_key="archives.id", index=True)
    content: str
    embedding: Any = Field(sa_column=Column(Vector(1024)))
    created_at: datetime = Field(default_factory=datetime.utcnow)
