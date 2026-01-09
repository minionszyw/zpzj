from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_session
from app.services.auth_service import AuthService
from pydantic import BaseModel, EmailStr

router = APIRouter()

class EmailSchema(BaseModel):
    email: EmailStr

class LoginSchema(BaseModel):
    email: EmailStr
    code: str

@router.post("/send-code")
async def send_code(payload: EmailSchema):
    await AuthService.send_code(payload.email)
    return {"message": "验证码已发送"}

@router.post("/login")
async def login(payload: LoginSchema, db: AsyncSession = Depends(get_session)):
    return await AuthService.verify_code_and_login(db, payload.email, payload.code)