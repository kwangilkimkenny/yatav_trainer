"""
Error handling middleware for YATAV Training System
"""

import time
import traceback
from typing import Callable, Any, Dict
from fastapi import Request, Response, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from ..utils.logging import get_logger

logger = get_logger("error_handler")

class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """Middleware to handle errors and log requests"""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        request_id = f"{int(start_time * 1000)}-{hash(str(request.url)) % 10000}"
        
        try:
            # Add request ID to request state
            request.state.request_id = request_id
            
            # Process request
            response = await call_next(request)
            
            # Calculate duration
            duration_ms = (time.time() - start_time) * 1000
            
            # Log successful request
            user_id = getattr(request.state, 'user_id', None)
            logger.log_api_request(
                method=request.method,
                path=str(request.url.path),
                status_code=response.status_code,
                duration_ms=duration_ms,
                user_id=user_id
            )
            
            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id
            
            return response
            
        except HTTPException as e:
            # Handle HTTP exceptions
            duration_ms = (time.time() - start_time) * 1000
            
            logger.warning(
                f"HTTP Exception: {e.status_code} - {e.detail}",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": str(request.url.path),
                    "status_code": e.status_code,
                    "duration_ms": duration_ms
                }
            )
            
            return JSONResponse(
                status_code=e.status_code,
                content={
                    "error": {
                        "type": "http_exception",
                        "message": e.detail,
                        "status_code": e.status_code,
                        "request_id": request_id
                    }
                },
                headers={"X-Request-ID": request_id}
            )
            
        except Exception as e:
            # Handle unexpected errors
            duration_ms = (time.time() - start_time) * 1000
            
            error_details = {
                "request_id": request_id,
                "method": request.method,
                "path": str(request.url.path),
                "duration_ms": duration_ms,
                "error_type": type(e).__name__,
                "error_message": str(e),
                "traceback": traceback.format_exc()
            }
            
            logger.error("Unhandled exception", error=e, extra=error_details)
            
            # Log security event for potential attacks
            if self._is_security_related_error(e):
                logger.log_security_event(
                    event_type="unhandled_exception",
                    severity="medium",
                    details=error_details
                )
            
            return JSONResponse(
                status_code=500,
                content={
                    "error": {
                        "type": "internal_server_error",
                        "message": "An unexpected error occurred",
                        "request_id": request_id
                    }
                },
                headers={"X-Request-ID": request_id}
            )
    
    def _is_security_related_error(self, error: Exception) -> bool:
        """Check if error might be security-related"""
        error_message = str(error).lower()
        security_keywords = [
            "sql injection",
            "xss",
            "csrf",
            "unauthorized",
            "forbidden",
            "authentication",
            "permission denied"
        ]
        return any(keyword in error_message for keyword in security_keywords)

class ValidationErrorHandler:
    """Handler for validation errors"""
    
    @staticmethod
    def format_validation_error(validation_error: Any) -> Dict[str, Any]:
        """Format pydantic validation error"""
        errors = []
        
        for error in validation_error.errors():
            errors.append({
                "field": " -> ".join(str(loc) for loc in error["loc"]),
                "message": error["msg"],
                "type": error["type"]
            })
        
        return {
            "error": {
                "type": "validation_error",
                "message": "Input validation failed",
                "details": errors
            }
        }

def create_error_handlers() -> Dict[int, Callable]:
    """Create error handlers for different HTTP status codes"""
    
    async def not_found_handler(request: Request, exc: HTTPException):
        return JSONResponse(
            status_code=404,
            content={
                "error": {
                    "type": "not_found",
                    "message": "The requested resource was not found",
                    "path": str(request.url.path)
                }
            }
        )
    
    async def method_not_allowed_handler(request: Request, exc: HTTPException):
        return JSONResponse(
            status_code=405,
            content={
                "error": {
                    "type": "method_not_allowed",
                    "message": f"Method {request.method} not allowed for this endpoint",
                    "allowed_methods": exc.headers.get("Allow", "").split(", ") if exc.headers else []
                }
            }
        )
    
    async def unauthorized_handler(request: Request, exc: HTTPException):
        logger.log_security_event(
            event_type="unauthorized_access_attempt",
            severity="medium",
            details={
                "path": str(request.url.path),
                "method": request.method,
                "user_agent": request.headers.get("user-agent"),
                "ip_address": request.client.host if request.client else None
            }
        )
        
        return JSONResponse(
            status_code=401,
            content={
                "error": {
                    "type": "unauthorized",
                    "message": "Authentication required",
                    "details": "Please provide valid authentication credentials"
                }
            }
        )
    
    async def forbidden_handler(request: Request, exc: HTTPException):
        logger.log_security_event(
            event_type="forbidden_access_attempt",
            severity="high",
            details={
                "path": str(request.url.path),
                "method": request.method,
                "user_id": getattr(request.state, 'user_id', None),
                "ip_address": request.client.host if request.client else None
            }
        )
        
        return JSONResponse(
            status_code=403,
            content={
                "error": {
                    "type": "forbidden",
                    "message": "Access forbidden",
                    "details": "You don't have permission to access this resource"
                }
            }
        )
    
    async def rate_limit_handler(request: Request, exc: HTTPException):
        logger.log_security_event(
            event_type="rate_limit_exceeded",
            severity="medium",
            details={
                "path": str(request.url.path),
                "ip_address": request.client.host if request.client else None
            }
        )
        
        return JSONResponse(
            status_code=429,
            content={
                "error": {
                    "type": "rate_limit_exceeded",
                    "message": "Too many requests",
                    "details": "Please slow down your request rate"
                }
            }
        )
    
    return {
        404: not_found_handler,
        405: method_not_allowed_handler,
        401: unauthorized_handler,
        403: forbidden_handler,
        429: rate_limit_handler
    }