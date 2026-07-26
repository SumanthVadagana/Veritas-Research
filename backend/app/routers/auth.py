"""
Authentication Router for Veritas Research.
Handles user registration (signup), authentication (login), and session verification.
"""

import hashlib
import logging
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User

logger = logging.getLogger(__name__)

router = APIRouter(tags=["auth"])

SALT = "veritas_secure_salt_2026"


def hash_password(password: str) -> str:
    """Hash password securely using SHA-256 with salt."""
    return hashlib.sha256((password + SALT).encode("utf-8")).hexdigest()


# ── Schemas ───────────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=4)
    name: str = Field(..., min_length=1)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class UserAuthResponse(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    role: str
    message: str


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/auth/signup", response_model=UserAuthResponse)
async def signup(body: SignupRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user account."""
    email_clean = body.email.strip().lower()

    # Check if email is already registered
    result = await db.execute(select(User).where(User.email == email_clean))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists. Please sign in instead.",
        )

    # Create new user
    user = User(
        id=str(uuid.uuid4()),
        email=email_clean,
        name=body.name.strip(),
        password_hash=hash_password(body.password),
        role="user",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return UserAuthResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        message="Account created successfully!",
    )


@router.post("/auth/login", response_model=UserAuthResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate an existing user account."""
    email_clean = body.email.strip().lower()

    result = await db.execute(select(User).where(User.email == email_clean))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email. Please check your email or click Sign Up.",
        )

    # If user registered before password_hash was required or password matches
    if user.password_hash:
        hashed_input = hash_password(body.password)
        if hashed_input != user.password_hash:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect password. Please try again.",
            )
    else:
        # Set password for legacy account
        user.password_hash = hash_password(body.password)
        await db.commit()

    return UserAuthResponse(
        id=user.id,
        email=user.email,
        name=user.name or user.email.split("@")[0],
        role=user.role,
        message="Signed in successfully!",
    )
