from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.db.database import get_db
from app.models.models import User
from app.schemas.schemas import UserCreate, UserOut

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/sync", response_model=UserOut, status_code=status.HTTP_200_OK)
@limiter.limit("100/hour")
async def sync_user(request: Request, payload: UserCreate, db: Session = Depends(get_db)):
    """
    Called after Clerk sign-in/sign-up to sync user into our DB.
    Uses parameterized queries via SQLAlchemy ORM — safe from SQL injection.
    """
    existing = db.query(User).filter(User.clerk_id == payload.clerk_id).first()

    if existing:
        existing.email = payload.email
        existing.full_name = payload.full_name
        db.commit()
        db.refresh(existing)
        return existing

    user = User(
        clerk_id=payload.clerk_id,
        email=payload.email,
        full_name=payload.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
