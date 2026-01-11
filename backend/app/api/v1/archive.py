from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.db.session import get_session
from app.models.user import User
from app.schemas.archive import ArchiveCreate, ArchiveUpdate, ArchiveRead
from app.services.archive_service import ArchiveService
from app.services.bazi_service import BaziService
from app.services.location_service import LocationService

router = APIRouter()

@router.get("/", response_model=List[ArchiveRead])
async def list_archives(
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(deps.get_current_user),
):
    return await ArchiveService.get_multi(db, current_user.id)

@router.post("/", response_model=ArchiveRead)
async def create_archive(
    obj_in: ArchiveCreate,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(deps.get_current_user),
):
    return await ArchiveService.create(db, current_user.id, obj_in)

@router.get("/locations")
async def search_locations(query: str):
    return LocationService.search(query)

@router.get("/{id}", response_model=ArchiveRead)
async def get_archive(
    id: UUID,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(deps.get_current_user),
):
    return await ArchiveService.get(db, id, current_user.id)

@router.patch("/{id}", response_model=ArchiveRead)
async def update_archive(
    id: UUID,
    obj_in: ArchiveUpdate,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(deps.get_current_user),
):
    return await ArchiveService.update(db, id, current_user.id, obj_in)

@router.delete("/{id}")
async def delete_archive(
    id: UUID,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(deps.get_current_user),
):
    await ArchiveService.delete(db, id, current_user.id)
    return {"message": "Archive deleted"}

@router.get("/{id}/bazi")

async def get_bazi_chart(

    id: UUID,

    db: AsyncSession = Depends(get_session),

    current_user: User = Depends(deps.get_current_user),

):

    archive = await ArchiveService.get(db, id, current_user.id)

    return await BaziService.get_result(archive)
