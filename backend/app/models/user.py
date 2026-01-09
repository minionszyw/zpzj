from typing import Optional, List
from uuid import UUID, uuid4
from datetime import datetime
from sqlmodel import SQLModel, Field, Column, JSON

class UserBase(SQLModel):
    email: str = Field(index=True, unique=True)
    nickname: Optional[str] = None
    avatar_url: Optional[str] = None
    settings: dict = Field(default_factory=lambda: {"depth": 10, "response_mode": "normal"}, sa_column=Column(JSON))

class User(UserBase, table=True):
    __tablename__ = "users"
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(UserBase):
    password: str

class UserUpdate(SQLModel):
    email: Optional[str] = None
    nickname: Optional[str] = None
    avatar_url: Optional[str] = None
    settings: Optional[dict] = None
