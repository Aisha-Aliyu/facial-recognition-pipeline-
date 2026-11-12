import time

from fastapi import Request, HTTPException
import httpx
from jose import jwt, JWTError
from app.core.config import get_settings

settings = get_settings()

# Clerk's signing keys rarely change, so fetch them once an hour instead of on every request
JWKS_TTL_SECONDS = 60 * 60
_jwks_cache: dict = {"keys": None, "fetched_at": 0.0}


async def _get_jwks(force_refresh: bool = False) -> dict:
    fresh = time.time() - _jwks_cache["fetched_at"] < JWKS_TTL_SECONDS
    if _jwks_cache["keys"] and fresh and not force_refresh:
        return _jwks_cache["keys"]

    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.clerk.com/v1/jwks",
            headers={"Authorization": f"Bearer {settings.clerk_secret_key}"},
            timeout=10,
        )
        response.raise_for_status()
        jwks = response.json()

    _jwks_cache.update(keys=jwks, fetched_at=time.time())
    return jwks


def _decode(token: str, jwks: dict) -> dict:
    return jwt.decode(
        token,
        jwks,
        algorithms=["RS256"],
        options={"verify_aud": False},
    )


async def verify_clerk_token(request: Request) -> dict:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header.")

    token = auth_header.split(" ")[1]

    try:
        try:
            return _decode(token, await _get_jwks())
        except JWTError:
            # The keys may have rotated since they were cached, so try once with fresh ones
            return _decode(token, await _get_jwks(force_refresh=True))
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Auth error: {str(e)}")
