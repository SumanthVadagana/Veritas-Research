from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routers import feedback, history, image_analysis, research, stream


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="Veritas Research API",
    description="Autonomous Multi-Agent Research & Fact-Verification System",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(research.router,        prefix="/api")
app.include_router(stream.router,          prefix="/api")
app.include_router(history.router,         prefix="/api")
app.include_router(feedback.router,        prefix="/api")
app.include_router(image_analysis.router,  prefix="/api")


@app.get("/health", tags=["system"])
async def health():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "llm": settings.GEMINI_FLASH_MODEL,
        "db": settings.DATABASE_URL.split("///")[0],
    }
