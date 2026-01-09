from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import auth, archive, chat, user
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(user, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
app.include_router(archive, prefix=f"{settings.API_V1_STR}/archives", tags=["archives"])
app.include_router(chat, prefix=f"{settings.API_V1_STR}/chat", tags=["chat"])

@app.get("/")
def root():
    return {"message": "Ziping Zhenjun AI API is running"}
