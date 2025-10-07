"""
Application logging configuration with correlation ID support.
"""

import logging
import sys
from .middleware import CorrelationIdFilter


def configure_logging(level: int = logging.INFO) -> None:
    """Configure root and app-specific loggers."""
    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter(
        fmt=(
            "%(asctime)s %(levelname)s %(name)s "
            "cid=%(correlation_id)s %(message)s"
        ),
        datefmt="%Y-%m-%dT%H:%M:%S%z",
    )
    handler.setFormatter(formatter)
    handler.addFilter(CorrelationIdFilter())

    root = logging.getLogger()
    root.setLevel(level)
    # Clear existing handlers to avoid duplicate logs in reload scenarios
    root.handlers = []
    root.addHandler(handler)

    # Example of namespaced loggers
    logging.getLogger("server.request").setLevel(level)
    logging.getLogger("server.errors").setLevel(level)


__all__ = ["configure_logging"]


