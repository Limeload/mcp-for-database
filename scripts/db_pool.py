#!/usr/bin/env python3
"""
SQLAlchemy connection pooling utilities with event-based metrics and logging.

This module centralizes engine creation with a QueuePool, exposes simple
metrics, and wires SQLAlchemy event listeners to observe pool behavior.

Environment Variables:
    - DATABASE_URL: Database connection URL
    - POOL_SIZE: Number of persistent connections to keep in the pool (default: 5)
    - POOL_MAX_OVERFLOW: Max number of connections to allow in overflow (default: 10)
    - POOL_TIMEOUT: Seconds to wait before giving up on getting a connection (default: 30)
    - POOL_RECYCLE: Seconds after which a connection is recycled (default: 1800)
    - POOL_PRE_PING: Enable pre-ping to validate connections (default: true)
    - POOL_USE_LIFO: Use LIFO for pool checkout (default: false)
    - POOL_LOG_EVENTS: Log detailed pool events (default: true)

Notes for SQLite:
    - To use QueuePool with SQLite, we set poolclass=QueuePool and
      connect_args={"check_same_thread": False} for file-based databases.
      For in-memory SQLite (sqlite:///:memory:), pooling is not applicable.
"""

import os
import threading
import time
from dataclasses import dataclass, field
from typing import Any, Dict, Optional

from sqlalchemy import create_engine, event, text
from sqlalchemy.engine import Engine
from sqlalchemy.pool import QueuePool


# -------- Constants ---------
DEFAULT_POOL_SIZE = int(os.getenv("POOL_SIZE", "5"))
DEFAULT_MAX_OVERFLOW = int(os.getenv("POOL_MAX_OVERFLOW", "10"))
DEFAULT_POOL_TIMEOUT = int(os.getenv("POOL_TIMEOUT", "30"))
DEFAULT_POOL_RECYCLE = int(os.getenv("POOL_RECYCLE", "1800"))
DEFAULT_POOL_PRE_PING = os.getenv("POOL_PRE_PING", "true").lower() in {"1", "true", "yes", "on"}
DEFAULT_POOL_USE_LIFO = os.getenv("POOL_USE_LIFO", "false").lower() in {"1", "true", "yes", "on"}
DEFAULT_POOL_LOG_EVENTS = os.getenv("POOL_LOG_EVENTS", "true").lower() in {"1", "true", "yes", "on"}


@dataclass
class PoolMetrics:
    """Lightweight counters for monitoring pool activity."""

    connects: int = 0
    checkouts: int = 0
    checkins: int = 0
    closes: int = 0
    invalidations: int = 0
    timeouts: int = 0
    last_timeout_message: Optional[str] = None
    _lock: threading.Lock = field(default_factory=threading.Lock, repr=False)

    def increment(self, field_name: str) -> None:
        with self._lock:
            setattr(self, field_name, getattr(self, field_name) + 1)

    def record_timeout(self, message: str) -> None:
        with self._lock:
            self.timeouts += 1
            self.last_timeout_message = message


_global_metrics = PoolMetrics()


def _attach_pool_listeners(engine: Engine, metrics: PoolMetrics, log_events: bool) -> None:
    """Attach SQLAlchemy pool event listeners for metrics and optional logging."""

    @event.listens_for(engine, "connect")
    def _(dbapi_conn, connection_record):  # type: ignore
        metrics.increment("connects")
        if log_events:
            print(f"[pool] connect -> total_connects={metrics.connects}")

    @event.listens_for(engine, "checkout")
    def _(dbapi_conn, connection_record, connection_proxy):  # type: ignore
        metrics.increment("checkouts")
        if log_events:
            print(f"[pool] checkout -> checkouts={metrics.checkouts}")

    @event.listens_for(engine, "checkin")
    def _(dbapi_conn, connection_record):  # type: ignore
        metrics.increment("checkins")
        if log_events:
            print(f"[pool] checkin -> checkins={metrics.checkins}")

    @event.listens_for(engine, "close")
    def _(dbapi_conn, connection_record):  # type: ignore
        metrics.increment("closes")
        if log_events:
            print(f"[pool] close -> closes={metrics.closes}")

    @event.listens_for(engine, "invalidate")
    def _(dbapi_conn, connection_record, exception):  # type: ignore
        metrics.increment("invalidations")
        if log_events:
            print(f"[pool] invalidate -> invalidations={metrics.invalidations}, reason={exception}")


def _should_use_queue_pool(database_url: str) -> bool:
    # Use QueuePool for non-memory SQLite or any non-sqlite databases
    if database_url.startswith("sqlite:///:memory:"):
        return False
    if database_url.startswith("sqlite"):
        return True
    return True


def create_pooled_engine(
    database_url: Optional[str] = None,
    *,
    pool_size: int = DEFAULT_POOL_SIZE,
    max_overflow: int = DEFAULT_MAX_OVERFLOW,
    pool_timeout: int = DEFAULT_POOL_TIMEOUT,
    pool_recycle: int = DEFAULT_POOL_RECYCLE,
    pre_ping: bool = DEFAULT_POOL_PRE_PING,
    use_lifo: bool = DEFAULT_POOL_USE_LIFO,
    log_events: bool = DEFAULT_POOL_LOG_EVENTS,
    metrics: PoolMetrics = _global_metrics,
) -> Engine:
    """Create an SQLAlchemy Engine configured with a QueuePool and event metrics."""

    url = database_url or os.getenv("DATABASE_URL", "sqlite:///local_dev.db")
    is_sqlite = url.startswith("sqlite")

    create_kwargs: Dict[str, Any] = {
        "pool_pre_ping": pre_ping,
        "pool_recycle": pool_recycle,
    }

    if _should_use_queue_pool(url):
        create_kwargs.update(
            {
                "poolclass": QueuePool,
                "pool_size": pool_size,
                "max_overflow": max_overflow,
                "pool_timeout": pool_timeout,
                "pool_use_lifo": use_lifo,
            }
        )

    if is_sqlite and not url.startswith("sqlite:///:memory:"):
        # Ensure SQLite works across threads when using QueuePool
        create_kwargs["connect_args"] = {"check_same_thread": False}

    engine = create_engine(url, **create_kwargs)
    _attach_pool_listeners(engine, metrics, log_events)
    return engine


def log_pool_status(engine: Engine, *, label: str = "pool") -> None:
    """Log current pool statistics if available."""
    pool = getattr(engine, "pool", None)
    size_info = {}
    try:
        # QueuePool exposes checkedout() and overflow() methods
        size_info = {
            "checked_out": getattr(pool, "checkedout", lambda: None)(),
            "overflow": getattr(pool, "overflow", lambda: None)(),
            "size": getattr(pool, "size", lambda: None)(),
        }
    except Exception:
        size_info = {"info": "pool stats not available for this pool type"}

    print(
        f"[{label}] status -> size={size_info.get('size')} checked_out={size_info.get('checked_out')} overflow={size_info.get('overflow')} "
        f"metrics(connects={_global_metrics.connects} checkouts={_global_metrics.checkouts} checkins={_global_metrics.checkins} "
        f"closes={_global_metrics.closes} invalidations={_global_metrics.invalidations} timeouts={_global_metrics.timeouts})"
    )


def start_periodic_pool_logger(engine: Engine, interval_seconds: int = 10, *, label: str = "pool") -> threading.Thread:
    """Start a background thread that periodically logs pool status."""

    def _loop() -> None:
        while True:
            try:
                log_pool_status(engine, label=label)
            except Exception as e:
                print(f"[pool] error logging status: {e}")
            time.sleep(interval_seconds)

    t = threading.Thread(target=_loop, daemon=True)
    t.start()
    return t


def quick_healthcheck(engine: Engine) -> bool:
    """Execute a trivial query to validate connectivity."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        print(f"[pool] healthcheck failed: {e}")
        return False


__all__ = [
    "PoolMetrics",
    "create_pooled_engine",
    "log_pool_status",
    "start_periodic_pool_logger",
    "quick_healthcheck",
]


