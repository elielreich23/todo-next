from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Existing auth schemas
class UserSignupRequest(BaseModel):
    email: str
    username: str
    password: str
    full_name: Optional[str] = None

class UserLoginRequest(BaseModel):
    email: str
    password: str

class SignupResponse(BaseModel):
    success: bool
    message: str
    user: dict

class LoginResponse(BaseModel):
    success: bool
    message: str
    user: dict
    token: Optional[str] = None

# New project and task schemas
class ProjectBase(BaseModel):
    name: str
    category: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[str] = None
    contributors: Optional[List[str]] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[str] = None
    contributors: Optional[List[str]] = None

class Project(ProjectBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[str] = "todo"
    due_date: Optional[datetime] = None
    progress: Optional[int] = 0
    total_steps: Optional[int] = 0
    category: Optional[str] = None
    contributors: Optional[List[str]] = None
    duration: Optional[str] = None
    notes: Optional[str] = None
    attachments: Optional[List[dict]] = None
    comments: Optional[List[dict]] = None

class TaskCreate(TaskBase):
    project_id: int

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None
    progress: Optional[int] = None
    total_steps: Optional[int] = None
    category: Optional[str] = None
    contributors: Optional[List[str]] = None
    duration: Optional[str] = None
    notes: Optional[str] = None
    attachments: Optional[List[dict]] = None
    comments: Optional[List[dict]] = None

class Task(TaskBase):
    id: int
    project_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CommentBase(BaseModel):
    text: str
    author: str

class CommentCreate(CommentBase):
    pass

class CommentUpdate(BaseModel):
    text: str

class Comment(CommentBase):
    id: str
    created_at: str
    updated_at: Optional[str] = None
