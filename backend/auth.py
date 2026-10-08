"""JWT session tokens + a require_auth decorator for protected routes."""
import os
import datetime
import functools

import jwt
from flask import request, jsonify

JWT_ALGO = "HS256"


def _secret():
    return os.environ.get("JWT_SECRET", "dev_insecure_secret_change_me")


def _expire_days():
    try:
        return int(os.environ.get("JWT_EXPIRE_DAYS", "7"))
    except ValueError:
        return 7


def make_token(user):
    payload = {
        "user_id": str(user["id"]),
        "username": user["username"],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=_expire_days()),
    }
    return jwt.encode(payload, _secret(), algorithm=JWT_ALGO)


def decode_token(token):
    return jwt.decode(token, _secret(), algorithms=[JWT_ALGO])


def _read_token():
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth.split(" ", 1)[1].strip()
    return None


def require_auth(f):
    """Reject the request unless a valid Bearer token is present.
    On success, sets request.user_id and request.username."""
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        token = _read_token()
        if not token:
            return jsonify({"error": "Authentication required"}), 401
        try:
            payload = decode_token(token)
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Session expired, please log in again"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid session token"}), 401
        request.user_id = payload["user_id"]
        request.username = payload["username"]
        return f(*args, **kwargs)
    return wrapper


def optional_auth(f):
    """Like require_auth but does not reject anonymous callers.
    Sets request.user_id to the user id or None."""
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        token = _read_token()
        request.user_id = None
        request.username = None
        if token:
            try:
                payload = decode_token(token)
                request.user_id = payload["user_id"]
                request.username = payload["username"]
            except jwt.InvalidTokenError:
                pass
        return f(*args, **kwargs)
    return wrapper
