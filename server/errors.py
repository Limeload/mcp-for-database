"""
Error models and custom exception types for centralized API error handling.
"""

from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class ErrorBody(BaseModel):
    """Standard error payload returned under the `error` field."""

    message: str = Field(..., description="Human-readable error message")
    code: str = Field(..., description="Machine-readable error code")
    details: Optional[Dict[str, Any]] = Field(
        default=None, description="Optional structured details for debugging"
    )
    correlationId: str = Field(..., description="Request correlation identifier")


class ErrorResponse(BaseModel):
    """Standardized API error response envelope."""

    status: str = Field("error", const=True)
    data: None = None
    error: ErrorBody


class AppError(Exception):
    """Custom application error with HTTP status, code, and details."""

    def __init__(
        self,
        message: str,
        *,
        status_code: int = 400,
        code: str = "APP_ERROR",
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code
        self.details = details or {}


__all__ = [
    "ErrorBody",
    "ErrorResponse",
    "AppError",
]


