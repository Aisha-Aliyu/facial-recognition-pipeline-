from fastapi import Request, HTTPException
from jose import jwt, JWTError
import httpx
from functools import lru_cache
from app.core.config import get_settings

settings = get_settings()

CLERK_JWKS_URL = "https://api.clerk.dev/v1/jwks"


@lru_cache()
def get_jwks():
    response = httpx.get(CLERK_JWKS_URL, timeout=10)
    response.raise_for_status()
    return response.json()


async def verify_clerk_token(request: Request) -> dict:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header.")

    token = auth_header.split(" ")[1]

    try:
        jwks = get_jwks()
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
        return payload
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")
