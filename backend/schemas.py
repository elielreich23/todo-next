from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserSignupRequest(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SignupResponse(BaseModel):
    success: bool
    message: str
    user: UserResponse
