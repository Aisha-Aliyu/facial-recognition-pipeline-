from fastapi import APIRouter, Request, HTTPException, Depends
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserOut
from app.core.security import verify_clerk_token

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/sync", response_model=UserOut)
@limiter.limit("100/hour")
async def sync_user(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Called after Clerk sign-in to sync the user into our database.
    Clerk JWT is passed in Authorization header.
    """
    payload = await verify_clerk_token(request)
    clerk_id = payload.get("sub")
    email = payload.get("email", "")
    name = payload.get("name", "")

    if not clerk_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    existing = db.query(User).filter(User.clerk_id == clerk_id).first()

    if existing:
        return existing

    user = User(
        clerk_id=clerk_id,
        email=email,
        name=name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


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
