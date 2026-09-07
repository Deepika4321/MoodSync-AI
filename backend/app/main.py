from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import db

from app.routes.auth import router as auth_router
from app.routes.emotion import router as emotion_router
from app.routes.chat import router as chat_router
from app.routes.spotify import router as spotify_router


# ============================================================
# MOODSYNC AI APPLICATION
# ============================================================

app = FastAPI(
    title="MoodSync AI",
    description="AI-powered Mood Detection and Music Recommendation System",
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():

    return {
        "message": "Welcome to MoodSync AI 🚀",
        "status": "Backend Running Successfully"
    }


# ============================================================
# DATABASE TEST
# ============================================================

@app.get("/db-test")
def test_database():

    if db is not None:

        return {
            "status": "MongoDB Connected Successfully",
            "database": db.name
        }

    return {
        "status": "MongoDB Connection Failed"
    }


# ============================================================
# ROUTES
# ============================================================

app.include_router(auth_router)

app.include_router(emotion_router)

app.include_router(chat_router)
app.include_router(spotify_router)
