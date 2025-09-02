"""
Security validators and sanitizers for YATAV Training System
"""

import re
import html
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field, validator
from email_validator import validate_email, EmailNotValidError

class SecurityValidator:
    """Security validation utilities"""
    
    # Common patterns for security validation
    SQL_INJECTION_PATTERNS = [
        r"(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE)?|INSERT|SELECT|UNION|UPDATE)\b)",
        r"(\b(OR|AND)\s+\d+\s*=\s*\d+)",
        r"(--|\/\*|\*\/|'|\")",
        r"(\bxp_\w+)"
    ]
    
    XSS_PATTERNS = [
        r"<script[^>]*>.*?</script>",
        r"javascript:",
        r"on\w+\s*=",
        r"<iframe[^>]*>.*?</iframe>",
        r"<object[^>]*>.*?</object>",
        r"<embed[^>]*>.*?</embed>"
    ]
    
    @classmethod
    def sanitize_string(cls, value: str, max_length: int = 1000) -> str:
        """Sanitize string input"""
        if not isinstance(value, str):
            raise ValueError("Input must be a string")
        
        # Truncate if too long
        if len(value) > max_length:
            value = value[:max_length]
        
        # HTML encode
        value = html.escape(value)
        
        # Remove null bytes
        value = value.replace('\x00', '')
        
        # Normalize whitespace
        value = re.sub(r'\s+', ' ', value).strip()
        
        return value
    
    @classmethod
    def validate_no_sql_injection(cls, value: str) -> str:
        """Check for SQL injection patterns"""
        if not isinstance(value, str):
            return value
        
        value_lower = value.lower()
        for pattern in cls.SQL_INJECTION_PATTERNS:
            if re.search(pattern, value_lower, re.IGNORECASE):
                raise ValueError("Potentially malicious SQL pattern detected")
        
        return value
    
    @classmethod
    def validate_no_xss(cls, value: str) -> str:
        """Check for XSS patterns"""
        if not isinstance(value, str):
            return value
        
        value_lower = value.lower()
        for pattern in cls.XSS_PATTERNS:
            if re.search(pattern, value_lower, re.IGNORECASE):
                raise ValueError("Potentially malicious XSS pattern detected")
        
        return value
    
    @classmethod
    def validate_email_format(cls, email: str) -> str:
        """Validate email format"""
        try:
            validation = validate_email(email)
            return validation.email
        except EmailNotValidError as e:
            raise ValueError(f"Invalid email format: {str(e)}")
    
    @classmethod
    def validate_password_strength(cls, password: str) -> str:
        """Validate password strength"""
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters long")
        
        if len(password) > 128:
            raise ValueError("Password must be less than 128 characters long")
        
        # Check for at least one uppercase letter
        if not re.search(r'[A-Z]', password):
            raise ValueError("Password must contain at least one uppercase letter")
        
        # Check for at least one lowercase letter
        if not re.search(r'[a-z]', password):
            raise ValueError("Password must contain at least one lowercase letter")
        
        # Check for at least one digit
        if not re.search(r'\d', password):
            raise ValueError("Password must contain at least one digit")
        
        # Check for at least one special character
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            raise ValueError("Password must contain at least one special character")
        
        return password
    
    @classmethod
    def validate_filename(cls, filename: str) -> str:
        """Validate and sanitize filename"""
        if not isinstance(filename, str):
            raise ValueError("Filename must be a string")
        
        # Remove path separators and dangerous characters
        filename = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '', filename)
        
        # Remove leading/trailing spaces and dots
        filename = filename.strip(' .')
        
        # Limit length
        if len(filename) > 255:
            filename = filename[:255]
        
        # Ensure not empty
        if not filename:
            raise ValueError("Filename cannot be empty")
        
        # Check for reserved names (Windows)
        reserved_names = ['CON', 'PRN', 'AUX', 'NUL'] + [f'COM{i}' for i in range(1, 10)] + [f'LPT{i}' for i in range(1, 10)]
        if filename.upper() in reserved_names:
            raise ValueError(f"'{filename}' is a reserved filename")
        
        return filename
    
    @classmethod
    def validate_json_depth(cls, data: Any, max_depth: int = 10) -> Any:
        """Validate JSON structure depth to prevent DoS attacks"""
        def check_depth(obj, depth=0):
            if depth > max_depth:
                raise ValueError(f"JSON structure too deep (max depth: {max_depth})")
            
            if isinstance(obj, dict):
                for value in obj.values():
                    check_depth(value, depth + 1)
            elif isinstance(obj, list):
                for item in obj:
                    check_depth(item, depth + 1)
        
        check_depth(data)
        return data

class SecureBaseModel(BaseModel):
    """Base model with security validations"""
    
    @validator('*', pre=True)
    def sanitize_strings(cls, value):
        """Auto-sanitize string fields"""
        if isinstance(value, str):
            return SecurityValidator.sanitize_string(value)
        return value

class SecureUserInput(SecureBaseModel):
    """Secure user input validation"""
    
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., max_length=254)
    password: Optional[str] = Field(None, min_length=8, max_length=128)
    
    @validator('username')
    def validate_username(cls, value):
        # Only allow alphanumeric, underscore, and hyphen
        if not re.match(r'^[a-zA-Z0-9_-]+$', value):
            raise ValueError("Username can only contain letters, numbers, underscore, and hyphen")
        
        # Check for SQL injection and XSS
        SecurityValidator.validate_no_sql_injection(value)
        SecurityValidator.validate_no_xss(value)
        
        return value
    
    @validator('email')
    def validate_email(cls, value):
        return SecurityValidator.validate_email_format(value)
    
    @validator('password')
    def validate_password(cls, value):
        if value is not None:
            return SecurityValidator.validate_password_strength(value)
        return value

class SecureFileUpload(SecureBaseModel):
    """Secure file upload validation"""
    
    filename: str = Field(..., max_length=255)
    content_type: str = Field(..., max_length=100)
    size_bytes: int = Field(..., ge=1)
    
    # Allowed file types
    ALLOWED_CONTENT_TYPES = {
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm',
        'video/mp4', 'video/webm', 'video/ogg',
        'application/pdf', 'text/plain',
        'application/json'
    }
    
    # Maximum file size (100MB)
    MAX_FILE_SIZE = 100 * 1024 * 1024
    
    @validator('filename')
    def validate_filename(cls, value):
        return SecurityValidator.validate_filename(value)
    
    @validator('content_type')
    def validate_content_type(cls, value):
        if value not in cls.ALLOWED_CONTENT_TYPES:
            raise ValueError(f"File type '{value}' not allowed")
        return value
    
    @validator('size_bytes')
    def validate_file_size(cls, value):
        if value > cls.MAX_FILE_SIZE:
            raise ValueError(f"File too large (max size: {cls.MAX_FILE_SIZE} bytes)")
        return value

class SecureAPIRequest(SecureBaseModel):
    """Secure API request validation"""
    
    @validator('*', pre=True)
    def validate_input_security(cls, value):
        """Validate all string inputs for security"""
        if isinstance(value, str):
            # Check length limits
            if len(value) > 10000:  # Reasonable limit for most fields
                raise ValueError("Input too long")
            
            # Validate against common attacks
            SecurityValidator.validate_no_sql_injection(value)
            SecurityValidator.validate_no_xss(value)
        
        return value

def validate_rate_limit_key(key: str) -> str:
    """Validate rate limiting key"""
    # Only allow alphanumeric, dots, colons, and hyphens
    if not re.match(r'^[a-zA-Z0-9.:-]+$', key):
        raise ValueError("Invalid rate limit key format")
    
    if len(key) > 100:
        raise ValueError("Rate limit key too long")
    
    return key

def sanitize_log_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Sanitize data before logging to prevent log injection"""
    sanitized = {}
    
    for key, value in data.items():
        if isinstance(value, str):
            # Remove control characters and newlines to prevent log injection
            value = re.sub(r'[\r\n\t\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', value)
            # Limit length
            value = value[:1000]
        
        sanitized[key] = value
    
    return sanitized