from fastapi import APIRouter, Request, HTTPException, Depends
from slowapi import Limiter
from app.core.client_ip import client_ip
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from app.db.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserOut
from app.core.security import verify_clerk_token
from app.services.user_service import get_or_create_user

router = APIRouter()


class SyncIn(BaseModel):
    clerk_id: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None

limiter = Limiter(key_func=client_ip)


@router.post("/sync", response_model=UserOut)
@limiter.limit("100/hour")
async def sync_user(
    request: Request,
    body: Optional[SyncIn] = None,
    db: Session = Depends(get_db),
):
    """
    Called after Clerk sign-in to save the user's email and name. The Clerk id comes
    from the verified token, never from the body.
    """
    payload = await verify_clerk_token(request)
    return get_or_create_user(
        db,
        payload,
        email=body.email if body else None,
        name=body.full_name if body else None,
    )


@router.get("/me", response_model=UserOut)
@limiter.limit("100/hour")
async def get_me(
    request: Request,
    db: Session = Depends(get_db),
):
    payload = await verify_clerk_token(request)
    clerk_id = payload.get("sub")

    user = db.query(User).filter(User.clerk_id == clerk_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found. Please sync first.")

    return user
