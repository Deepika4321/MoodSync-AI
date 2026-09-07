from fastapi import APIRouter
from app.database import db
from app.models.user import UserSignup, UserLogin
from app.utils.security import hash_password, verify_password

router = APIRouter()


@router.post("/signup")
def signup(user: UserSignup):

    try:
        if db is None:
            return {
                "success": False,
                "message": "Database connection unavailable"
            }

        existing_user = db.users.find_one({
            "email": user.email
        })

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

        existing_user = db.users.find_one({
            "email": user.email
        })

        if not existing_user:
            return {
                "success": False,
                "message": "User not found"
            }

        if not verify_password(
            user.password,
            existing_user["password"]
        ):
            return {
                "success": False,
                "message": "Incorrect Password"
            }

        return {
            "success": True,
            "message": "Login Successful",
            "name": existing_user["name"],
            "email": existing_user["email"]
        }

    except Exception as e:

        print("LOGIN ERROR:", str(e))

        return {
            "success": False,
            "message": "Server temporarily unavailable. Please try again."
        }