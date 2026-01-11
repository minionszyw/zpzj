from typing import Optional
from uuid import UUID, uuid4
from datetime import datetime
from sqlmodel import SQLModel, Field, Column, JSON
from sqlalchemy import ForeignKey

class ArchiveBase(SQLModel):
    name: str
    gender: int = Field(default=1, description="0:女, 1:男")
    birth_time: datetime
    calendar_type: str = Field(default="SOLAR", description="SOLAR/LUNAR")
    lat: float
    lng: float
    location_name: str
    is_self: bool = False
    relation: str = Field(default="自己", description="自己/配偶/父母等")
    algorithms_config: dict = Field(
        default_factory=lambda: {
            "time_mode": "TRUE_SOLAR",
            "month_mode": "SOLAR_TERM",
            "zi_shi_mode": "LATE_ZI_IN_DAY"
        },
        sa_column=Column(JSON)
    )

class Archive(ArchiveBase, table=True):
    __tablename__ = "archives"
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(
        sa_column=Column(
            ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True
        )
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)