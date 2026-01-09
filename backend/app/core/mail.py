import random
import string
from aiosmtplib import send
from email.message import EmailMessage
from app.core.config import settings

async def send_verification_email(email_to: str, code: str):
    message = EmailMessage()
    message["From"] = settings.EMAILS_FROM_EMAIL
    message["To"] = email_to
    message["Subject"] = f"{settings.PROJECT_NAME} 登录验证码"
    message.set_content(f"您的登录验证码是: {code}，有效期为5分钟。")

    if settings.SMTP_HOST:
        await send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            use_tls=settings.SMTP_TLS,
        )
    else:
        # 开发模式下仅打印
        print(f"DEBUG: Email to {email_to} with code {code}")

def generate_verification_code() -> str:
    return "".join(random.choices(string.digits, k=6))
