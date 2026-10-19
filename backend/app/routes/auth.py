import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from app.database import db
from app.models.user import UserSignup, UserLogin
from app.utils.security import hash_password, verify_password

router = APIRouter()


class GoogleLoginRequest(BaseModel):
    credential: str


@router.post("/signup")
def signup(user: UserSignup):
    try:
        if db is None:
            return {
                "success": False,
                "message": "Database connection unavailable"
            }

        existing_user = db.users.find_one({"email": user.email})

        if existing_user:
            return {
                "success": False,
                "message": "Email already exists"
            }

        new_user = {
            "name": user.name,
            "email": user.email,
            "password": hash_password(user.password)
        }

        db.users.insert_one(new_user)

        return {
            "success": True,
            "message": "Account Created Successfully"
        }

    except Exception as e:
        print("SIGNUP ERROR:", str(e))
        return {
            "success": False,
            "message": "Server temporarily unavailable. Please try again."
        }


@router.post("/login")
def login(user: UserLogin):
    try:
        if db is None:
            return {
                "success": False,
                "message": "Database connection unavailable"
            }

        existing_user = db.users.find_one({"email": user.email})

        if not existing_user:
            return {
                "success": False,
                "message": "User not found"
            }

        # Google-only accounts have no password hash; avoid a KeyError
        # and tell the user to use the Google sign-in button instead.
        stored_password = existing_user.get("password")
        if not stored_password:
            return {
                "success": False,
                "message": "This account uses Google sign-in. Please use Continue with Google."
            }

        if not verify_password(user.password, stored_password):
            return {
                "success": False,
                "message": "Incorrect Password"
            }

        return {
            "success": True,
            "message": "Login Successful",
            "name": existing_user.get("name", "User"),
            "email": existing_user.get("email", user.email)
        }

    except Exception as e:
        print("LOGIN ERROR:", str(e))
        return {
            "success": False,
            "message": "Server temporarily unavailable. Please try again."
        }


@router.post("/auth/google")
def google_login(payload: GoogleLoginRequest):
    """Verify a Google ID token, then find or create the MoodSync user."""
    client_id = os.getenv("GOOGLE_CLIENT_ID", "").strip()

    if not client_id:
        raise HTTPException(
            status_code=500,
            detail="Google sign-in is not configured on the server."
        )

    if db is None:
        raise HTTPException(
            status_code=503,
            detail="Database connection unavailable. Please try again."
        )

    try:
        google_user = id_token.verify_oauth2_token(
            payload.credential,
            google_requests.Request(),
            audience=client_id
        )
    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Google credential is invalid or expired. Please try again."
        )
    except Exception as exc:
        print("GOOGLE TOKEN VERIFICATION ERROR:", str(exc))
        raise HTTPException(
            status_code=503,
            detail="Google sign-in could not be verified. Please retry."
        )

    email = (google_user.get("email") or "").strip().lower()
    google_sub = google_user.get("sub")
    email_verified = google_user.get("email_verified") is True
    google_name = (google_user.get("name") or "").strip()

    if not email or not google_sub or not email_verified:
        raise HTTPException(
            status_code=401,
            detail="Google did not provide a verified email address."
        )

    if not google_name:
        google_name = email.split("@", 1)[0]

    try:
        # Prefer the stable Google subject ID if this account was already linked.
        existing_user = db.users.find_one({"google_sub": google_sub})

        # Also link an existing MoodSync account if its verified email matches.
        if existing_user is None:
            existing_user = db.users.find_one({"email": email})

        if existing_user:
            # Do not link a different Google identity to an already-linked account.
            saved_google_sub = existing_user.get("google_sub")
            if saved_google_sub and saved_google_sub != google_sub:
                raise HTTPException(
                    status_code=409,
                    detail="This MoodSync account is linked to a different Google account."
                )

            display_name = existing_user.get("name") or google_name
            db.users.update_one(
                {"_id": existing_user["_id"]},
                {
                    "$set": {
                        "google_sub": google_sub,
                        "auth_provider": "google"
                    }
                }
            )
        else:
            display_name = google_name
            db.users.insert_one({
                "name": display_name,
                "email": email,
                "password": None,
                "auth_provider": "google",
                "google_sub": google_sub
            })

        return {
            "success": True,
            "message": "Login Successful",
            "name": display_name,
            "email": email
        }

    except HTTPException:
        raise
    except Exception as exc:
        print("GOOGLE LOGIN DATABASE ERROR:", str(exc))
        raise HTTPException(
            status_code=503,
            detail="Google sign-in could not be completed. Please retry."
        )
