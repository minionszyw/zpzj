from datetime import timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.redis import redis_client
from app.core.mail import send_verification_email, generate_verification_code
from app.core.security import create_access_token
from app.models.user import User
from app.core.config import settings
from fastapi import HTTPException, status

class AuthService:
    @staticmethod
    async def send_code(email: str):
        # 1. 速率限制：1 分钟内同一邮箱限制发送 3 次
        limit_key = f"rate_limit:send_code:{email}"
        count = await redis_client.incr(limit_key)
        if count == 1:
            await redis_client.expire(limit_key, 60)
        
        if count > 3:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="请求过于频繁，请稍后再试"
            )

        # 2. 生成并存储验证码
        code = generate_verification_code()
        # 存入 Redis，有效期 5 分钟
        await redis_client.set(f"auth_code:{email}", code, ex=300)
        await send_verification_email(email, code)
        return True

    @staticmethod
    async def verify_code_and_login(db: AsyncSession, email: str, code: str):
        saved_code = await redis_client.get(f"auth_code:{email}")
        if not saved_code or saved_code != code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="验证码错误或已过期"
            )
        
        # 验证码正确，删除验证码
        await redis_client.delete(f"auth_code:{email}")
        
        # 检查用户是否存在，不存在则创建
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().first()
        
        if not user:
            user = User(
                email=email,
                hashed_password="verified_by_email", # 邮件验证码登录不需要传统密码
                nickname=email.split("@")[0]
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        
        access_token = create_access_token(subject=user.id)
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }