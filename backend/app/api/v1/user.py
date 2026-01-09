from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.models.user import User, UserUpdate
from app.db.session import get_session

router = APIRouter()

@router.get("/me")
async def read_user_me(current_user: User = Depends(deps.get_current_user)):
    return current_user

@router.patch("/me")
async def update_user_me(
    obj_in: UserUpdate,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_session),
):
    update_data = obj_in.dict(exclude_unset=True)
    for field in update_data:
        setattr(current_user, field, update_data[field])
    
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user
