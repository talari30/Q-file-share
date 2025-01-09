from datetime import datetime, timezone

from app.models.db_models import Users
from app.db.db_session import get_db_session
from app.auth.password_handler import hash_password, verify_password
from app.auth.jwt_handler import create_access_token


def authenticate_user(user_email: str, password: str) -> str:
    db = next(get_db_session())
    user = db.query(Users).filter(Users.email == user_email).first()

    if not user:
        raise ValueError("Email not registered. Please check the email address.")

    if not verify_password(password, user.password_hash):
        raise ValueError("Incorrect password. Kindly try again.")

    return create_access_token({"email": user.email})


def register_user(name: str, user_email: str, password: str) -> Users:
    db = next(get_db_session())
    existing_user = db.query(Users).filter(Users.email == user_email).first()

    if existing_user:
        raise ValueError("A user with this email already exists.")

    hashed_password = hash_password(password)
    new_user = Users(
        name=name,
        email=user_email,
        password_hash=hashed_password,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return new_user
    except Exception as exception:
        raise ValueError("Error when processing the request", str(exception))
