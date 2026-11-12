import asyncio
import time

from fastapi import Request, HTTPException
import httpx
from jose import jwt, JWTError
from app.core.config import get_settings

settings = get_settings()

# Clerk's signing keys rarely change, so fetch them once an hour instead of on every request
JWKS_TTL_SECONDS = 60 * 60
# An unknown key id can trigger an early refresh, but never more than once a minute,
# so junk tokens can't make the server call Clerk over and over
MIN_REFRESH_SECONDS = 60
_jwks_cache: dict = {"keys": None, "fetched_at": 0.0}
_jwks_lock = asyncio.Lock()


def _known_kids(jwks) -> set:
    if not jwks:
        return set()
    return {key.get("kid") for key in jwks.get("keys", [])}


async def _get_jwks(kid=None) -> dict:
    async with _jwks_lock:
        age = time.time() - _jwks_cache["fetched_at"]
        cached = _jwks_cache["keys"]
        if cached and age < JWKS_TTL_SECONDS:
            if kid is None or kid in _known_kids(cached) or age < MIN_REFRESH_SECONDS:
                return cached

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
        kid = jwt.get_unverified_header(token).get("kid")
        # Refreshes the cached keys only when this key id isn't known yet
        return _decode(token, await _get_jwks(kid))
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Auth error: {str(e)}")
