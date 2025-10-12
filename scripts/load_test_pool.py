#!/usr/bin/env python3
"""
Simple load test for SQLAlchemy connection pool behavior.

Spawns multiple worker threads that rapidly acquire and release connections
and execute trivial queries, to exercise pool size, overflow, and timeouts.

Usage:
    python scripts/load_test_pool.py [num_workers] [duration_seconds]

Environment:
    DATABASE_URL, POOL_SIZE, POOL_MAX_OVERFLOW, POOL_TIMEOUT, etc. (see db_pool.py)
"""

import os
import sys
import threading
import time
from typing import List

from sqlalchemy import text

from scripts.db_pool import create_pooled_engine, log_pool_status, start_periodic_pool_logger


def worker_thread(idx: int, stop_flag: threading.Event, engine):
    while not stop_flag.is_set():
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
        except Exception as e:
            print(f"[worker {idx}] error: {e}")


def main() -> int:
    num_workers = int(sys.argv[1]) if len(sys.argv) > 1 else 20
    duration = int(sys.argv[2]) if len(sys.argv) > 2 else 20

    db_url = os.getenv("DATABASE_URL", "sqlite:///local_dev.db")
    print(f"Starting pool load test -> url={db_url} workers={num_workers} duration={duration}s")

    engine = create_pooled_engine(db_url)
    start_periodic_pool_logger(engine, interval_seconds=5, label="load_test")

    stop_flag = threading.Event()
    threads: List[threading.Thread] = []
    for i in range(num_workers):
        t = threading.Thread(target=worker_thread, args=(i, stop_flag, engine), daemon=True)
        threads.append(t)
        t.start()

    start = time.time()
    try:
        while time.time() - start < duration:
            time.sleep(1)
    finally:
        stop_flag.set()

    # Let threads wind down
    time.sleep(1)
    log_pool_status(engine, label="load_test")
    print("Load test complete.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


