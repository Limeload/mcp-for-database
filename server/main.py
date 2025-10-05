"""
FastAPI application with centralized error handling, correlation IDs, and logging.
"""

import logging
from typing import Any, Dict

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette import status

from .errors import AppError, ErrorBody, ErrorResponse
from .middleware import CorrelationIdMiddleware, RequestLoggingMiddleware, correlation_id_ctx
from .logging_config import configure_logging


def create_app() -> FastAPI:
    configure_logging()
    app = FastAPI(title="MCP Server", version="1.0.0")

    # Middleware
    app.add_middleware(CorrelationIdMiddleware)
    app.add_middleware(RequestLoggingMiddleware)

    # Exception handlers
    register_exception_handlers(app)

    # Sample route group
    @app.get("/health")
    async def health() -> Dict[str, Any]:
        return {"status": "healthy"}

    @app.get("/error-demo")
    async def error_demo() -> Dict[str, Any]:
        raise AppError("Example application error", status_code=400, code="DEMO_ERROR")

    return app


def register_exception_handlers(app: FastAPI) -> None:
    logger = logging.getLogger("server.errors")

    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
        cid = correlation_id_ctx.get()
        logger.warning(
            "app.error",
            extra={"correlation_id": cid, "code": exc.code, "status": exc.status_code},
        )
        payload = ErrorResponse(
            error=ErrorBody(
                message=exc.message,
                code=exc.code,
                details=exc.details,
                correlationId=cid,
            )
        )
        return JSONResponse(status_code=exc.status_code, content=payload.model_dump())

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        cid = correlation_id_ctx.get()
        logger.info(
            "validation.error",
            extra={"correlation_id": cid, "errors": exc.errors()},
        )
        payload = ErrorResponse(
            error=ErrorBody(
                message="Validation failed",
                code="VALIDATION_ERROR",
                details={"errors": exc.errors()},
                correlationId=cid,
            )
        )
        return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content=payload.model_dump())

    @app.exception_handler(Exception)
    async def generic_error_handler(request: Request, exc: Exception) -> JSONResponse:
        cid = correlation_id_ctx.get()
        logger.exception("unhandled.error", extra={"correlation_id": cid})
        payload = ErrorResponse(
            error=ErrorBody(
                message="Internal server error",
                code="INTERNAL_SERVER_ERROR",
                details=None,
                correlationId=cid,
            )
        )
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=payload.model_dump())


app = create_app()


