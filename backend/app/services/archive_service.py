from typing import List, Optional
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.archive import Archive
from app.schemas.archive import ArchiveCreate, ArchiveUpdate
from fastapi import HTTPException

class ArchiveService:
    @staticmethod
    async def create(db: AsyncSession, user_id: UUID, obj_in: ArchiveCreate) -> Archive:
        db_obj = Archive(
            **obj_in.dict(),
            user_id=user_id
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    @staticmethod
    async def get_multi(db: AsyncSession, user_id: UUID) -> List[Archive]:
        result = await db.execute(select(Archive).where(Archive.user_id == user_id))
        return result.scalars().all()

    @staticmethod
    async def get(db: AsyncSession, id: UUID, user_id: Optional[UUID] = None) -> Archive:
        query = select(Archive).where(Archive.id == id)
        if user_id:
            query = query.where(Archive.user_id == user_id)
        result = await db.execute(query)
        db_obj = result.scalars().first()
        if not db_obj:
            raise HTTPException(status_code=404, detail="Archive not found")
        return db_obj

    @staticmethod
    async def update(
        db: AsyncSession, id: UUID, user_id: UUID, obj_in: ArchiveUpdate
    ) -> Archive:
        db_obj = await ArchiveService.get(db, id, user_id)
        update_data = obj_in.dict(exclude_unset=True)
        for field in update_data:
            setattr(db_obj, field, update_data[field])
        db_obj.updated_at = datetime.utcnow()
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    @staticmethod
    async def delete(db: AsyncSession, id: UUID, user_id: UUID) -> Archive:
        db_obj = await ArchiveService.get(db, id, user_id)
        await db.delete(db_obj)
        await db.commit()
        return db_obj
