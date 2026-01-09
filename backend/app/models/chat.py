from typing import Optional, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime
from sqlmodel import SQLModel, Field, Column, JSON

class ChatSession(SQLModel, table=True):
    __tablename__ = "chat_sessions"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)
    archive_id: UUID = Field(foreign_key="archives.id", index=True)
    title: str
    last_summary: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Message(SQLModel, table=True):

    __tablename__ = "messages"

    

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    session_id: UUID = Field(foreign_key="chat_sessions.id", index=True)

    role: str # user, assistant, system

    content: str

    meta_data: Dict[str, Any] = Field(default_factory=dict, sa_column=Column("metadata", JSON))

    created_at: datetime = Field(default_factory=datetime.utcnow)
