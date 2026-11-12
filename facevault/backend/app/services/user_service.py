import logging
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.user import User

logger = logging.getLogger(__name__)

# Clerk's session token doesn't carry the email, and the email column is required and
# unique. Until the dashboard sends the real address, each user gets a placeholder that
# can never clash or receive mail (.invalid is reserved for exactly this).
PLACEHOLDER_DOMAIN = "@users.facevault.invalid"


def _email_taken(db: Session, email: str, except_user_id: Optional[str] = None) -> bool:
    query = db.query(User).filter(User.email == email)
    if except_user_id:
        query = query.filter(User.id != except_user_id)
    return query.first() is not None


def get_or_create_user(
    db: Session,
    payload: dict,
    email: Optional[str] = None,
    name: Optional[str] = None,
) -> User:
    """Finds the user for a verified Clerk token, creating them on first use.

    The Clerk id always comes from the verified token. The email and name only fill in
    profile details, so they may come from the request body.
    """
    clerk_id = payload.get("sub")
    if not clerk_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    email = (payload.get("email") or email or "").strip().lower() or None
    name = (payload.get("name") or name or "").strip() or None

    user = db.query(User).filter(User.clerk_id == clerk_id).first()
    if user:
        changed = False
        if email and user.email.endswith(PLACEHOLDER_DOMAIN) and not _email_taken(db, email, user.id):
            user.email = email
            changed = True
        if name and not user.name:
            user.name = name
            changed = True
        if changed:
            db.commit()
            db.refresh(user)
        return user

    if not email or _email_taken(db, email):
        email = f"{clerk_id}{PLACEHOLDER_DOMAIN}".lower()

    user = User(clerk_id=clerk_id, email=email, name=name)
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        # Another request created this user at the same moment
        db.rollback()
        user = db.query(User).filter(User.clerk_id == clerk_id).first()
        if not user:
            raise
        return user
    db.refresh(user)
    logger.info("Created user for clerk_id=%s", clerk_id)
    return user
