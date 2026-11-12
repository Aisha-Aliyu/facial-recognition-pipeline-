from fastapi import Request


def client_ip(request: Request) -> str:
    """The visitor's IP, used as the rate-limit key.

    Render's proxy appends the address it received the request from to X-Forwarded-For,
    so the last entry is the real client. Earlier entries come from the client itself and
    can be faked, so they are ignored.
    """
    forwarded = request.headers.get("x-forwarded-for", "")
    hops = [hop.strip() for hop in forwarded.split(",") if hop.strip()]
    if hops:
        return hops[-1]
    return request.client.host if request.client else "unknown"
