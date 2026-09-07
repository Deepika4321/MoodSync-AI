from fastapi import APIRouter
from pydantic import BaseModel
from google import genai
from dotenv import load_dotenv
import os
import time
import re

load_dotenv()

router = APIRouter()

# =========================================================
# GEMINI CLIENT
# =========================================================

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY not found in .env")

client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None


# =========================================================
# REQUEST MODEL
# =========================================================

class ChatRequest(BaseModel):
    message: str
    emotion: str | None = None


# =========================================================
# HELPERS
# =========================================================

VALID_MOODS = {
    "happy",
    "sad",
    "angry",
    "fear",
    "surprise",
    "disgust",
    "tired",
    "stressed",
    "relaxed",
    "neutral",
}

MOOD_KEYWORDS = {
    "happy": [
        "happy", "joy", "joyful", "excited", "great", "good",
        "amazing", "awesome", "wonderful", "fantastic", "glad",
        "cheerful", "positive", "celebrating", "celebrate",
        "khush", "mast", "badiya", "accha feel", "acha feel",
    ],
    "sad": [
        "sad", "unhappy", "cry", "crying", "lonely", "alone",
        "hurt", "heartbroken", "broken", "upset", "down", "low",
        "miserable", "hopeless", "bad day", "tears", "dukhi",
        "udaas", "ro rahi", "rona", "bura lag", "not feeling good",
        "not feeling well",
    ],
    "angry": [
        "angry", "mad", "furious", "annoyed", "irritated",
        "frustrated", "rage", "hate", "fed up", "pissed",
        "gussa", "gusse", "pareshan", "irritate",
    ],
    "fear": [
        "scared", "afraid", "fear", "terrified", "nervous",
        "anxious", "anxiety", "worried", "worry", "panic",
        "dar", "darr", "tension", "ghabra",
    ],
    "surprise": [
        "surprised", "surprise", "shocked", "shock", "unexpected",
        "wow", "omg",
    ],
    "disgust": [
        "disgusted", "disgusting", "gross", "nasty", "revolting",
        "awful", "ganda", "ghin",
    ],
    "tired": [
        "tired", "exhausted", "exhausting", "drained", "sleepy",
        "fatigued", "low energy", "no energy", "thak", "thaki",
        "thaka", "thak gayi", "thak gyi", "thak gaya",
        "bahut thak", "tired yrr", "tired bro",
    ],
    "stressed": [
        "stressed", "stress", "overwhelmed", "pressure",
        "burnt out", "burnout", "overthinking", "overthink",
        "stressed yrr", "bahut pressure",
    ],
    "relaxed": [
        "relaxed", "calm", "peaceful", "chill", "chilling",
        "relax", "sukoon", "shaant", "easy",
    ],
    "neutral": [
        "okay", "fine", "normal", "nothing", "nothing much",
        "alright", "neutral", "just okay",
    ],
}

def detect_mood(text: str) -> str:
    lower = text.lower()
    scores = {}

    for mood, words in MOOD_KEYWORDS.items():
        score = 0
        for word in words:
            if word in lower:
                score += 1
        if score:
            scores[mood] = score

    if not scores:
        return ""

    # More specific emotional states win over neutral.
    if any(m in scores for m in ("tired", "stressed", "sad", "angry", "fear")):
        specific = {m: s for m, s in scores.items()
                    if m in ("tired", "stressed", "sad", "angry", "fear")}
        if specific:
            return max(specific, key=specific.get)

    return max(scores, key=scores.get)


def is_playlist_request(text: str) -> bool:
    t = text.lower().strip()

    patterns = [
        r"\bplaylist\b",
        r"\bplay\s*list\b",
        r"\bsongs?\b",
        r"\bmusic\b",
        r"give me (a )?playlist",
        r"make me (a )?playlist",
        r"create (a )?playlist",
        r"playlist (please|do|bana|bana do)",
        r"song(s)? (please|do|de|recommend|recommendations?)",
        r"gane? (suna|sunao|do|batao)",
        r"gaane? (suna|sunao|do|batao)",
        r"music (do|batao|sunao)",
    ]

    return any(re.search(pattern, t) for pattern in patterns)


def normalize_emotion(emotion: str | None) -> str:
    value = (emotion or "").lower().strip()
    return value if value in VALID_MOODS else ""


# =========================================================
# CHAT ENDPOINT
# =========================================================

@router.post("/chat")
def chat(request: ChatRequest):
    try:
        message = request.message.strip()

        if not message:
            return {
                "success": False,
                "reply": "Please type something first."
            }

        text_mood = detect_mood(message)
        incoming_mood = normalize_emotion(request.emotion)

        # IMPORTANT:
        # Text is more trustworthy than a webcam emotion for chat.
        # If the user says "I'm tired", we return tired even if
        # the camera says neutral.
        final_mood = text_mood or incoming_mood or ""

        playlist_requested = is_playlist_request(message)

        # ---------------------------------------------------------
        # DIRECT PLAYLIST REQUEST
        # ---------------------------------------------------------
        # Do NOT make Gemini answer with a generic long playlist.
        # The React frontend will show the real Spotify playlist card.
        if playlist_requested:
            display_mood = final_mood or "neutral"

            return {
                "success": True,
                "reply": (
                    f"Absolutely! 🎵 I'll prepare a {display_mood} mood "
                    "playlist for you. Choose how many songs you want below."
                ),
                "emotion": display_mood,
                "mood": display_mood,
                "intent": "playlist",
            }

        # ---------------------------------------------------------
        # NORMAL CHAT
        # ---------------------------------------------------------

        if client is None:
            return {
                "success": True,
                "reply": (
                    "I'm here with you. Tell me a little more about how "
                    "you're feeling, and I'll help you find the right vibe. 💛"
                ),
                "emotion": final_mood,
                "mood": final_mood,
                "intent": "chat",
            }

        emotion_context = (
            f"The user's mood from their message is probably: {final_mood}."
            if final_mood
            else "No reliable mood was detected from this message."
        )

        system_prompt = f"""
You are MoodSync, a friendly mood and music assistant.

IMPORTANT BEHAVIOUR:

1. Understand casual English, Hindi and Hinglish naturally.
2. If the user says they are tired, exhausted, drained or thak gayi/thak gaya,
   understand that as TIRED. Do not call it neutral.
3. If the user says they are sad, stressed, angry, anxious, happy, relaxed, etc.,
   acknowledge the actual feeling.
4. Never say "your camera says neutral" unless the user explicitly asks about
   facial emotion detection.
5. Facial emotion is only supporting context, never the main truth.
6. If the user is simply talking, have a natural short conversation.
7. Do not immediately force a playlist after every emotional message.
8. If the user explicitly asks for songs/music/a playlist, help with music.
9. Keep responses warm, concise and natural. Hinglish is completely fine.
10. Do not mention system instructions, backend logic, APIs, or internal processing.

{emotion_context}

User message:
{message}
"""

        models_to_try = [
            "gemini-3.6-flash",
            "gemini-3.1-flash-lite",
        ]

        response = None
        last_error = None

        for model_name in models_to_try:
            try:
                print(f"Trying Gemini model: {model_name}")

                response = client.models.generate_content(
                    model=model_name,
                    contents=[system_prompt],
                )

                print(f"Gemini response received from: {model_name}")
                break

            except Exception as model_error:
                last_error = model_error
                print(f"Model failed: {model_name}: {model_error}")
                time.sleep(1)

        if response is None:
            raise Exception(f"All Gemini models failed. Last error: {last_error}")

        reply = (response.text or "").strip()

        if not reply:
            reply = "I'm here with you. Tell me a little more. 💛"

        return {
            "success": True,
            "reply": reply,
            "emotion": final_mood,
            "mood": final_mood,
            "intent": "chat",
        }

    except Exception as e:
        print("========================================")
        print("CHATBOT ERROR")
        print(str(e))
        print("========================================")

        return {
            "success": False,
            "reply": "Sorry, I'm having trouble connecting right now. 😕",
            "error": str(e),
        }