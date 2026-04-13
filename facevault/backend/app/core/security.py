from fastapi import Request, HTTPException
import httpx
from jose import jwt, JWTError
from app.core.config import get_settings

settings = get_settings()


async def verify_clerk_token(request: Request) -> dict:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header.")

    token = auth_header.split(" ")[1]

    try:
        # Get the key id from the token header
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")

        # Fetch JWKS from your specific Clerk instance
        clerk_publishable_key = settings.clerk_publishable_key
        # Extract instance from publishable key e.g. pk_live_xxx -> fetch from clerk
        async with httpx.AsyncClient() as client:
            jwks_response = await client.get(
                "https://api.clerk.com/v1/jwks",
                headers={"Authorization": f"Bearer {settings.clerk_secret_key}"},
                timeout=10,
            )
            jwks_response.raise_for_status()
            jwks = jwks_response.json()

        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
        return payload

    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Auth error: {str(e)}")
