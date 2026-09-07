from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse, JSONResponse
from dotenv import load_dotenv

import os
import json
import secrets
import urllib.parse
import requests
import time


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv()

SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
SPOTIFY_REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI")

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173"
).rstrip("/")


# ============================================================
# ROUTER
# ============================================================

router = APIRouter()


# ============================================================
# SPOTIFY SCOPES
# ============================================================

SPOTIFY_SCOPES = [
    "playlist-modify-public",
    "playlist-modify-private",
]


# ============================================================
# OAUTH STATE STORAGE
# ============================================================

oauth_states = {}


# ============================================================
# PERSISTENT SPOTIFY SESSION STORAGE
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

SPOTIFY_SESSION_FILE = os.path.join(
    BASE_DIR,
    "spotify_sessions.json"
)

spotify_sessions = {}


# ============================================================
# LOAD SPOTIFY SESSIONS
# ============================================================

def load_spotify_sessions():

    global spotify_sessions

    try:

        if not os.path.exists(
            SPOTIFY_SESSION_FILE
        ):
            spotify_sessions = {}
            return

        with open(
            SPOTIFY_SESSION_FILE,
            "r",
            encoding="utf-8"
        ) as f:

            data = json.load(f)

        if isinstance(data, dict):

            spotify_sessions = data

        else:

            spotify_sessions = {}

        print(
            f"Spotify sessions loaded: "
            f"{len(spotify_sessions)}"
        )

    except Exception as e:

        print(
            "SPOTIFY SESSION LOAD ERROR:",
            e
        )

        spotify_sessions = {}


# ============================================================
# SAVE SPOTIFY SESSIONS
# ============================================================

def save_spotify_sessions():

    temp_file = (
        SPOTIFY_SESSION_FILE +
        ".tmp"
    )

    try:

        with open(
            temp_file,
            "w",
            encoding="utf-8"
        ) as f:

            json.dump(
                spotify_sessions,
                f,
                indent=2
            )

        os.replace(
            temp_file,
            SPOTIFY_SESSION_FILE
        )

    except Exception as e:

        print(
            "SPOTIFY SESSION SAVE ERROR:",
            e
        )

        try:

            if os.path.exists(
                temp_file
            ):
                os.remove(
                    temp_file
                )

        except Exception:
            pass


# ============================================================
# LOAD SESSIONS WHEN SERVER STARTS
# ============================================================

load_spotify_sessions()


# ============================================================
# CREATE SPOTIFY SESSION
# ============================================================

def create_spotify_session(
    access_token,
    refresh_token,
    expires_in
):

    session_id = secrets.token_urlsafe(32)

    spotify_sessions[session_id] = {

        "access_token": access_token,

        "refresh_token": refresh_token,

        "expires_at":
            time.time()
            + int(expires_in or 3600)

    }

    save_spotify_sessions()

    return session_id


# ============================================================
# LOGIN WITH SPOTIFY
# ============================================================

@router.get("/spotify/login")
def spotify_login():

    if not SPOTIFY_CLIENT_ID:

        return {
            "success": False,
            "error":
                "SPOTIFY_CLIENT_ID is missing in .env"
        }

    if not SPOTIFY_CLIENT_SECRET:

        return {
            "success": False,
            "error":
                "SPOTIFY_CLIENT_SECRET is missing in .env"
        }

    if not SPOTIFY_REDIRECT_URI:

        return {
            "success": False,
            "error":
                "SPOTIFY_REDIRECT_URI is missing in .env"
        }

    # --------------------------------------------------------
    # CREATE OAUTH STATE
    # --------------------------------------------------------

    state = secrets.token_urlsafe(32)

    oauth_states[state] = {
        "created_at": time.time()
    }

    # --------------------------------------------------------
    # SPOTIFY AUTHORIZATION PARAMETERS
    # --------------------------------------------------------

    params = {

        "client_id":
            SPOTIFY_CLIENT_ID,

        "response_type":
            "code",

        "redirect_uri":
            SPOTIFY_REDIRECT_URI,

        "scope":
            " ".join(
                SPOTIFY_SCOPES
            ),

        "state":
            state,

        # IMPORTANT:
        # Force Spotify to show authorization screen.
        # This helps ensure refresh token is returned
        # during a fresh authorization.
        "show_dialog":
            "true"
    }

    spotify_authorize_url = (

        "https://accounts.spotify.com/authorize?"

        + urllib.parse.urlencode(
            params
        )
    )

    return RedirectResponse(
        url=spotify_authorize_url
    )


# ============================================================
# SPOTIFY CALLBACK
# ============================================================

@router.get("/spotify/callback")
def spotify_callback(

    code: str = None,

    state: str = None,

    error: str = None

):

    # --------------------------------------------------------
    # USER DENIED ACCESS
    # --------------------------------------------------------

    if error:

        return RedirectResponse(

            url=(
                FRONTEND_URL
                + "?spotify_error="
                + urllib.parse.quote(
                    error
                )
            )
        )

    # --------------------------------------------------------
    # CHECK CODE
    # --------------------------------------------------------

    if not code:

        return RedirectResponse(

            url=(
                FRONTEND_URL
                + "?spotify_error=no_code"
            )
        )

    # --------------------------------------------------------
    # CHECK STATE
    # --------------------------------------------------------

    if (
        not state
        or state not in oauth_states
    ):

        return RedirectResponse(

            url=(
                FRONTEND_URL
                + "?spotify_error=invalid_state"
            )
        )

    # --------------------------------------------------------
    # STATE IS SINGLE USE
    # --------------------------------------------------------

    del oauth_states[state]

    # ========================================================
    # EXCHANGE AUTHORIZATION CODE
    # ========================================================

    token_url = (
        "https://accounts.spotify.com/api/token"
    )

    data = {

        "grant_type":
            "authorization_code",

        "code":
            code,

        "redirect_uri":
            SPOTIFY_REDIRECT_URI
    }

    try:

        response = requests.post(

            token_url,

            data=data,

            auth=(

                SPOTIFY_CLIENT_ID,

                SPOTIFY_CLIENT_SECRET
            ),

            headers={

                "Content-Type":
                    "application/x-www-form-urlencoded"
            },

            timeout=15
        )

    except Exception as e:

        print(
            "SPOTIFY TOKEN REQUEST ERROR:",
            e
        )

        return RedirectResponse(

            url=(
                FRONTEND_URL
                + "?spotify_error="
                + "token_request_failed"
            )
        )

    # ========================================================
    # CHECK TOKEN RESPONSE
    # ========================================================

    if response.status_code != 200:

        print(
            "SPOTIFY TOKEN ERROR:",
            response.status_code
        )

        print(
            response.text
        )

        return RedirectResponse(

            url=(
                FRONTEND_URL
                + "?spotify_error="
                + "token_exchange_failed"
            )
        )

    try:

        token_data = response.json()

    except Exception:

        return RedirectResponse(

            url=(
                FRONTEND_URL
                + "?spotify_error="
                + "invalid_token_response"
            )
        )

    # ========================================================
    # READ TOKENS
    # ========================================================

    access_token = (
        token_data.get(
            "access_token"
        )
    )

    refresh_token = (
        token_data.get(
            "refresh_token"
        )
    )

    expires_in = (
        token_data.get(
            "expires_in",
            3600
        )
    )

    # ========================================================
    # ACCESS TOKEN REQUIRED
    # ========================================================

    if not access_token:

        return RedirectResponse(

            url=(
                FRONTEND_URL
                + "?spotify_error="
                + "no_access_token"
            )
        )

    # ========================================================
    # REFRESH TOKEN REQUIRED
    # ========================================================

    if not refresh_token:

        print(
            "WARNING: Spotify did not return refresh token."
        )

        return RedirectResponse(

            url=(
                FRONTEND_URL
                + "?spotify_error="
                + "no_refresh_token"
            )
        )

    # ========================================================
    # CREATE BACKEND SESSION
    # ========================================================

    session_id = create_spotify_session(

        access_token=access_token,

        refresh_token=refresh_token,

        expires_in=expires_in
    )

    # ========================================================
    # LOG SUCCESS
    # ========================================================

    print(
        "========================================"
    )

    print(
        "SPOTIFY LOGIN SUCCESSFUL"
    )

    print(
        "Access token received: YES"
    )

    print(
        "Refresh token received: YES"
    )

    print(
        "Spotify session created: YES"
    )

    print(
        "Expires in:",
        expires_in,
        "seconds"
    )

    print(
        "========================================"
    )

    # ========================================================
    # SEND ONLY ACCESS TOKEN + SESSION ID
    # ========================================================

    frontend_url = (

        FRONTEND_URL

        + "#spotify_access_token="

        + urllib.parse.quote(
            access_token
        )

        + "&spotify_session="

        + urllib.parse.quote(
            session_id
        )
    )

    return RedirectResponse(
        url=frontend_url
    )


# ============================================================
# GET SESSION ID
# ============================================================

def get_session_id(

    request: Request = None,

    session_id: str = None,

    body: dict = None

):

    # 1. Query parameter

    if session_id:

        return session_id

    # 2. Header

    if request:

        header_session = (
            request.headers.get(
                "X-Spotify-Session"
            )
        )

        if header_session:

            return header_session

    # 3. JSON body

    if body:

        body_session = (
            body.get(
                "session_id"
            )
        )

        if body_session:

            return body_session

    return None


# ============================================================
# REFRESH ACCESS TOKEN
# ============================================================

@router.post("/spotify/refresh")
async def spotify_refresh(

    request: Request,

    session_id: str = None

):

    # --------------------------------------------------------
    # READ BODY
    # --------------------------------------------------------

    body = {}

    try:

        body = await request.json()

    except Exception:

        body = {}

    # --------------------------------------------------------
    # GET SESSION ID
    # --------------------------------------------------------

    session_id = get_session_id(

        request=request,

        session_id=session_id,

        body=body
    )

    # --------------------------------------------------------
    # SESSION ID REQUIRED
    # --------------------------------------------------------

    if not session_id:

        return JSONResponse(

            status_code=400,

            content={

                "success":
                    False,

                "error":
                    "Spotify session is missing."
            }
        )

    # --------------------------------------------------------
    # FIND SESSION
    # --------------------------------------------------------

    session = (
        spotify_sessions.get(
            session_id
        )
    )

    if not session:

        return JSONResponse(

            status_code=401,

            content={

                "success":
                    False,

                "error":
                    "Spotify session not found. Please connect Spotify again.",

                "needs_reconnect":
                    True
            }
        )

    # --------------------------------------------------------
    # GET REFRESH TOKEN
    # --------------------------------------------------------

    refresh_token = (
        session.get(
            "refresh_token"
        )
    )

    if not refresh_token:

        return JSONResponse(

            status_code=401,

            content={

                "success":
                    False,

                "error":
                    "Spotify refresh token is missing.",

                "needs_reconnect":
                    True
            }
        )

    # ========================================================
    # ASK SPOTIFY FOR NEW ACCESS TOKEN
    # ========================================================

    token_url = (
        "https://accounts.spotify.com/api/token"
    )

    data = {

        "grant_type":
            "refresh_token",

        "refresh_token":
            refresh_token
    }

    try:

        response = requests.post(

            token_url,

            data=data,

            auth=(

                SPOTIFY_CLIENT_ID,

                SPOTIFY_CLIENT_SECRET
            ),

            headers={

                "Content-Type":
                    "application/x-www-form-urlencoded"
            },

            timeout=15
        )

    except Exception as e:

        print(
            "SPOTIFY REFRESH REQUEST ERROR:",
            e
        )

        return JSONResponse(

            status_code=500,

            content={

                "success":
                    False,

                "error":
                    "Unable to contact Spotify."
            }
        )

    # ========================================================
    # HANDLE REFRESH FAILURE
    # ========================================================

    if response.status_code != 200:

        print(
            "========================================"
        )

        print(
            "SPOTIFY REFRESH FAILED"
        )

        print(
            "Status:",
            response.status_code
        )

        print(
            "Response:",
            response.text
        )

        print(
            "========================================"
        )

        # ----------------------------------------------------
        # INVALID REFRESH TOKEN
        # ----------------------------------------------------

        try:

            error_data = (
                response.json()
            )

        except Exception:

            error_data = {}

        if (
            error_data.get(
                "error"
            )
            == "invalid_grant"
        ):

            # IMPORTANT:
            # Only delete session when Spotify
            # explicitly says refresh token is invalid.

            spotify_sessions.pop(
                session_id,
                None
            )

            save_spotify_sessions()

            return JSONResponse(

                status_code=401,

                content={

                    "success":
                        False,

                    "error":
                        "Spotify authorization expired. Please reconnect Spotify.",

                    "needs_reconnect":
                        True
                }
            )

        return JSONResponse(

            status_code=500,

            content={

                "success":
                    False,

                "error":
                    "Spotify token refresh failed."
            }
        )

    # ========================================================
    # READ REFRESH RESPONSE
    # ========================================================

    try:

        refresh_data = (
            response.json()
        )

    except Exception:

        return JSONResponse(

            status_code=500,

            content={

                "success":
                    False,

                "error":
                    "Invalid response from Spotify."
            }
        )

    # --------------------------------------------------------
    # NEW ACCESS TOKEN
    # --------------------------------------------------------

    new_access_token = (
        refresh_data.get(
            "access_token"
        )
    )

    new_expires_in = (
        refresh_data.get(
            "expires_in",
            3600
        )
    )

    if not new_access_token:

        return JSONResponse(

            status_code=500,

            content={

                "success":
                    False,

                "error":
                    "Spotify did not return a new access token."
            }
        )

    # --------------------------------------------------------
    # SPOTIFY MAY RETURN NEW REFRESH TOKEN
    # --------------------------------------------------------

    new_refresh_token = (
        refresh_data.get(
            "refresh_token"
        )
    )

    if new_refresh_token:

        session[
            "refresh_token"
        ] = new_refresh_token

    # ========================================================
    # UPDATE SESSION
    # ========================================================

    session[
        "access_token"
    ] = new_access_token

    session[
        "expires_at"
    ] = (
        time.time()
        + int(new_expires_in)
    )

    spotify_sessions[
        session_id
    ] = session

    save_spotify_sessions()

    # ========================================================
    # LOG SUCCESS
    # ========================================================

    print(
        "========================================"
    )

    print(
        "SPOTIFY ACCESS TOKEN REFRESHED"
    )

    print(
        "New access token: YES"
    )

    print(
        "New refresh token:",
        bool(new_refresh_token)
    )

    print(
        "Expires in:",
        new_expires_in,
        "seconds"
    )

    print(
        "========================================"
    )

    return {

        "success":
            True,

        "access_token":
            new_access_token,

        "expires_in":
            new_expires_in,

        "needs_reconnect":
            False
    }


# ============================================================
# GET CURRENT SPOTIFY ACCESS TOKEN
# ============================================================
#
# FRONTEND CAN CALL THIS BEFORE CREATING PLAYLIST.
#
# If access token is still valid:
#     return existing token
#
# If access token is close to expiry:
#     automatically refresh it
#
# ============================================================

@router.post("/spotify/token")
async def spotify_token(

    request: Request,

    session_id: str = None

):

    body = {}

    try:

        body = await request.json()

    except Exception:

        body = {}

    session_id = get_session_id(

        request=request,

        session_id=session_id,

        body=body
    )

    if not session_id:

        return JSONResponse(

            status_code=400,

            content={

                "success":
                    False,

                "error":
                    "Spotify session is missing."
            }
        )

    session = (
        spotify_sessions.get(
            session_id
        )
    )

    if not session:

        return JSONResponse(

            status_code=401,

            content={

                "success":
                    False,

                "error":
                    "Spotify session not found.",

                "needs_reconnect":
                    True
            }
        )

    access_token = (
        session.get(
            "access_token"
        )
    )

    expires_at = float(
        session.get(
            "expires_at",
            0
        )
    )

    # --------------------------------------------------------
    # Refresh 60 seconds BEFORE expiry.
    # --------------------------------------------------------

    if (

        access_token

        and expires_at
        > time.time() + 60

    ):

        return {

            "success":
                True,

            "access_token":
                access_token,

            "expires_at":
                expires_at,

            "refreshed":
                False
        }

    # --------------------------------------------------------
    # ACCESS TOKEN IS EXPIRED / ABOUT TO EXPIRE
    # --------------------------------------------------------

    refresh_token = (
        session.get(
            "refresh_token"
        )
    )

    if not refresh_token:

        return JSONResponse(

            status_code=401,

            content={

                "success":
                    False,

                "error":
                    "Spotify refresh token is missing.",

                "needs_reconnect":
                    True
            }
        )

    # ========================================================
    # REFRESH DIRECTLY
    # ========================================================

    token_url = (
        "https://accounts.spotify.com/api/token"
    )

    data = {

        "grant_type":
            "refresh_token",

        "refresh_token":
            refresh_token
    }

    try:

        response = requests.post(

            token_url,

            data=data,

            auth=(

                SPOTIFY_CLIENT_ID,

                SPOTIFY_CLIENT_SECRET
            ),

            headers={

                "Content-Type":
                    "application/x-www-form-urlencoded"
            },

            timeout=15
        )

    except Exception as e:

        print(
            "SPOTIFY AUTO REFRESH ERROR:",
            e
        )

        return JSONResponse(

            status_code=500,

            content={

                "success":
                    False,

                "error":
                    "Unable to refresh Spotify token."
            }
        )

    if response.status_code != 200:

        try:

            error_data = (
                response.json()
            )

        except Exception:

            error_data = {}

        if (
            error_data.get(
                "error"
            )
            == "invalid_grant"
        ):

            spotify_sessions.pop(
                session_id,
                None
            )

            save_spotify_sessions()

            return JSONResponse(

                status_code=401,

                content={

                    "success":
                        False,

                    "error":
                        "Spotify authorization expired.",

                    "needs_reconnect":
                        True
                }
            )

        return JSONResponse(

            status_code=500,

            content={

                "success":
                    False,

                "error":
                    "Spotify token refresh failed."
            }
        )

    try:

        refresh_data = (
            response.json()
        )

    except Exception:

        return JSONResponse(

            status_code=500,

            content={

                "success":
                    False,

                "error":
                    "Invalid Spotify response."
            }
        )

    new_access_token = (
        refresh_data.get(
            "access_token"
        )
    )

    new_expires_in = (
        refresh_data.get(
            "expires_in",
            3600
        )
    )

    if not new_access_token:

        return JSONResponse(

            status_code=500,

            content={

                "success":
                    False,

                "error":
                    "Spotify returned no access token."
            }
        )

    new_refresh_token = (
        refresh_data.get(
            "refresh_token"
        )
    )

    if new_refresh_token:

        session[
            "refresh_token"
        ] = new_refresh_token

    session[
        "access_token"
    ] = new_access_token

    session[
        "expires_at"
    ] = (
        time.time()
        + int(new_expires_in)
    )

    spotify_sessions[
        session_id
    ] = session

    save_spotify_sessions()

    print(
        "Spotify token automatically refreshed."
    )

    return {

        "success":
            True,

        "access_token":
            new_access_token,

        "expires_at":
            session[
                "expires_at"
            ],

        "refreshed":
            True
    }


# ============================================================
# SPOTIFY STATUS
# ============================================================

@router.get("/spotify/status")
def spotify_status(

    request: Request,

    session_id: str = None

):

    session_id = get_session_id(

        request=request,

        session_id=session_id
    )

    if not session_id:

        return {

            "connected":
                False
        }

    session = (
        spotify_sessions.get(
            session_id
        )
    )

    if not session:

        return {

            "connected":
                False
        }

    expires_at = float(
        session.get(
            "expires_at",
            0
        )
    )

    return {

        "connected":
            True,

        "expires_at":
            expires_at,

        "expires_in":
            max(
                0,
                int(
                    expires_at
                    - time.time()
                )
            )
    }


# ============================================================
# SPOTIFY STORAGE STATUS
# ============================================================

@router.get("/spotify/storage-status")
def spotify_storage_status():

    return {

        "persistent_storage":
            True,

        "session_file_exists":
            os.path.exists(
                SPOTIFY_SESSION_FILE
            ),

        "session_count":
            len(
                spotify_sessions
            )
    }