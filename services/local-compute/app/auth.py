"""Session token authentication (Authorization: Bearer)."""

from __future__ import annotations

import os
import secrets
from dataclasses import dataclass

from fastapi import Header, HTTPException, status


@dataclass(frozen=True)
class AuthState:
    token: str
    generated: bool


_AUTH: AuthState | None = None


def init_auth() -> AuthState:
    """Load LOCAL_COMPUTE_TOKEN from env or generate a random one at startup (shown once)."""
    global _AUTH
    env = (os.environ.get("LOCAL_COMPUTE_TOKEN") or "").strip()
    if env:
        _AUTH = AuthState(token=env, generated=False)
    else:
        _AUTH = AuthState(token=secrets.token_urlsafe(32), generated=True)
    return _AUTH


def get_auth() -> AuthState:
    if _AUTH is None:
        return init_auth()
    return _AUTH


async def require_token(
    authorization: str | None = Header(default=None),
) -> None:
    """Reject unauthenticated requests. Protocol: Authorization: Bearer <session-token>."""
    expected = get_auth().token
    provided: str | None = None
    if authorization:
        parts = authorization.split(" ", 1)
        if len(parts) == 2 and parts[0].lower() == "bearer":
            provided = parts[1].strip()
    if not provided or not secrets.compare_digest(provided, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing Bearer session token",
            headers={"WWW-Authenticate": "Bearer"},
        )
