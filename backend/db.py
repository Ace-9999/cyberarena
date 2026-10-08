"""Thin Postgres (Supabase) access layer.

The backend connects as the privileged `postgres` role via DATABASE_URL,
so it bypasses Row Level Security and can read/write everything. The browser
never connects here — it talks to Flask, and only uses the Supabase anon key
for read-only realtime subscriptions on the `solves` table.
"""
import os
from contextlib import contextmanager

import psycopg2
from psycopg2.pool import ThreadedConnectionPool
from psycopg2.extras import RealDictCursor

_pool = None


def init_pool():
    """Create the connection pool. Called lazily on first query."""
    global _pool
    if _pool is not None:
        return
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        raise RuntimeError(
            "DATABASE_URL is not set. Copy backend/.env.example to backend/.env "
            "and paste your Supabase connection string."
        )
    # ThreadedConnectionPool is safe for the parallel leaderboard queries.
    # keepalives stop the remote DB from dropping idle connections (which was
    # causing 2s+ reconnects on every navigation).
    _pool = ThreadedConnectionPool(
        1, 10, dsn=db_url,
        connect_timeout=10,
        keepalives=1,
        keepalives_idle=30,
        keepalives_interval=10,
        keepalives_count=5,
    )


@contextmanager
def get_cursor(commit=False):
    init_pool()
    conn = _pool.getconn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            yield cur
        if commit:
            conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        _pool.putconn(conn)


def query_all(sql, params=None):
    with get_cursor() as cur:
        cur.execute(sql, params or ())
        return cur.fetchall()


def query_one(sql, params=None):
    with get_cursor() as cur:
        cur.execute(sql, params or ())
        return cur.fetchone()


def execute(sql, params=None, returning=False):
    """Run a write. If returning=True, returns the first row of RETURNING."""
    with get_cursor(commit=True) as cur:
        cur.execute(sql, params or ())
        if returning:
            return cur.fetchone()
        return None
