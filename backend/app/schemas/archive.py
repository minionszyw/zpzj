from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

class ArchiveBase(BaseModel):
    name: str
    gender: int
    birth_time: datetime
    calendar_type: str
    lat: float
    lng: float
    location_name: str
    is_self: bool = False
    relation: str = "自己"
    algorithms_config: Dict[str, Any] = {
        "time_mode": "TRUE_SOLAR",
        "month_mode": "SOLAR_TERM",
        "zi_shi_mode": "LATE_ZI_IN_DAY"
    }

class ArchiveCreate(ArchiveBase):
    pass

class ArchiveUpdate(BaseModel):
    name: Optional[str] = None
    gender: Optional[int] = None
    birth_time: Optional[datetime] = None
    calendar_type: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    location_name: Optional[str] = None
    is_self: Optional[bool] = None
    relation: Optional[str] = None
    algorithms_config: Optional[Dict[str, Any]] = None

class ArchiveRead(ArchiveBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
