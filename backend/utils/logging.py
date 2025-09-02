"""
Enhanced logging utilities for YATAV Training System
"""

import logging
import logging.handlers
import json
import sys
from datetime import datetime
from typing import Any, Dict, Optional
from pathlib import Path
import os

class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging"""
    
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }
        
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields
        if hasattr(record, 'user_id'):
            log_data["user_id"] = record.user_id
        if hasattr(record, 'session_id'):
            log_data["session_id"] = record.session_id
        if hasattr(record, 'request_id'):
            log_data["request_id"] = record.request_id
        if hasattr(record, 'duration_ms'):
            log_data["duration_ms"] = record.duration_ms
        
        return json.dumps(log_data, ensure_ascii=False)

class YATAVLogger:
    """Enhanced logger for YATAV system"""
    
    def __init__(self, name: str, log_level: str = "INFO", log_dir: str = "./logs"):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(getattr(logging, log_level.upper()))
        
        # Create logs directory
        Path(log_dir).mkdir(exist_ok=True)
        
        # Clear existing handlers
        self.logger.handlers.clear()
        
        # Console handler with color
        console_handler = logging.StreamHandler(sys.stdout)
        console_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        console_handler.setFormatter(console_formatter)
        console_handler.setLevel(logging.INFO)
        
        # File handler for all logs (JSON format)
        file_handler = logging.handlers.RotatingFileHandler(
            filename=os.path.join(log_dir, f"{name}.log"),
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=5,
            encoding='utf-8'
        )
        file_handler.setFormatter(JSONFormatter())
        file_handler.setLevel(logging.DEBUG)
        
        # Error file handler (JSON format)
        error_handler = logging.handlers.RotatingFileHandler(
            filename=os.path.join(log_dir, f"{name}_errors.log"),
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=5,
            encoding='utf-8'
        )
        error_handler.setFormatter(JSONFormatter())
        error_handler.setLevel(logging.ERROR)
        
        # Add handlers
        self.logger.addHandler(console_handler)
        self.logger.addHandler(file_handler)
        self.logger.addHandler(error_handler)
    
    def info(self, message: str, extra: Optional[Dict[str, Any]] = None):
        """Log info message"""
        self.logger.info(message, extra=extra or {})
    
    def warning(self, message: str, extra: Optional[Dict[str, Any]] = None):
        """Log warning message"""
        self.logger.warning(message, extra=extra or {})
    
    def error(self, message: str, error: Optional[Exception] = None, extra: Optional[Dict[str, Any]] = None):
        """Log error message"""
        extra_data = extra or {}
        if error:
            extra_data["error_type"] = type(error).__name__
            extra_data["error_message"] = str(error)
        
        self.logger.error(message, exc_info=error is not None, extra=extra_data)
    
    def debug(self, message: str, extra: Optional[Dict[str, Any]] = None):
        """Log debug message"""
        self.logger.debug(message, extra=extra or {})
    
    def log_api_request(self, method: str, path: str, status_code: int, duration_ms: float, user_id: Optional[str] = None):
        """Log API request"""
        self.info(
            f"{method} {path} - {status_code}",
            extra={
                "type": "api_request",
                "method": method,
                "path": path,
                "status_code": status_code,
                "duration_ms": duration_ms,
                "user_id": user_id
            }
        )
    
    def log_ai_request(self, provider: str, model: str, tokens_used: int, duration_ms: float, session_id: Optional[str] = None):
        """Log AI service request"""
        self.info(
            f"AI Request: {provider}/{model} - {tokens_used} tokens in {duration_ms}ms",
            extra={
                "type": "ai_request",
                "provider": provider,
                "model": model,
                "tokens_used": tokens_used,
                "duration_ms": duration_ms,
                "session_id": session_id
            }
        )
    
    def log_user_action(self, user_id: str, action: str, details: Dict[str, Any]):
        """Log user action"""
        self.info(
            f"User Action: {action}",
            extra={
                "type": "user_action",
                "user_id": user_id,
                "action": action,
                **details
            }
        )
    
    def log_security_event(self, event_type: str, severity: str, details: Dict[str, Any]):
        """Log security event"""
        log_method = self.error if severity == "high" else self.warning if severity == "medium" else self.info
        
        log_method(
            f"Security Event: {event_type}",
            extra={
                "type": "security_event",
                "event_type": event_type,
                "severity": severity,
                **details
            }
        )

# Global logger instance
yatav_logger = YATAVLogger("yatav_backend")

def get_logger(name: str) -> YATAVLogger:
    """Get a logger instance"""
    return YATAVLogger(name)