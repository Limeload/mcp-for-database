"""
Middleware for correlation IDs and request logging.
"""

import time
import uuid
import logging
import contextvars
from typing import Callable

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response


# Correlation ID context variable so logs can include it
correlation_id_ctx: contextvars.ContextVar[str] = contextvars.ContextVar(
    "correlation_id", default=""
)


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    """Assigns a correlation ID per request and exposes it in context and headers."""

    header_name = "X-Correlation-ID"

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        incoming = request.headers.get(self.header_name)
        correlation_id = incoming or str(uuid.uuid4())
        token = correlation_id_ctx.set(correlation_id)
        try:
            request.state.correlation_id = correlation_id
            response = await call_next(request)
            response.headers[self.header_name] = correlation_id
            return response
        finally:
            correlation_id_ctx.reset(token)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Logs request/response lifecycle with correlation ID."""

    def __init__(self, app) -> None:
        super().__init__(app)
        self.logger = logging.getLogger("server.request")

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start = time.time()
        cid = correlation_id_ctx.get()
        path = request.url.path
        method = request.method
        self.logger.info(
            "request.start",
            extra={"correlation_id": cid, "method": method, "path": path},
        )
        try:
            response = await call_next(request)
            duration_ms = int((time.time() - start) * 1000)
            self.logger.info(
                "request.end",
                extra={
                    "correlation_id": cid,
                    "method": method,
                    "path": path,
                    "status": response.status_code,
                    "duration_ms": duration_ms,
                },
            )
            return response
        except Exception as exc:  # Re-raise for exception handlers
            duration_ms = int((time.time() - start) * 1000)
            self.logger.exception(
                "request.error",
                extra={
                    "correlation_id": cid,
                    "method": method,
                    "path": path,
                    "duration_ms": duration_ms,
                },
            )
            raise exc


class CorrelationIdFilter(logging.Filter):
    """Injects correlation_id from context into log records if missing."""

    def filter(self, record: logging.LogRecord) -> bool:
        if not hasattr(record, "correlation_id") or not record.correlation_id:
            try:
                record.correlation_id = correlation_id_ctx.get()
            except Exception:
                record.correlation_id = ""
        return True


__all__ = [
    "CorrelationIdMiddleware",
    "RequestLoggingMiddleware",
    "CorrelationIdFilter",
    "correlation_id_ctx",
]


