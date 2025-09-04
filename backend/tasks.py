from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Task
from schemas import TaskCreate, TaskUpdate, Task as TaskSchema, CommentCreate, CommentUpdate, Comment
from typing import List
import json
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[TaskSchema])
async def get_tasks(project_id: int = Query(None), db: Session = Depends(get_db)):
    """Get tasks, optionally filtered by project_id"""
    query = db.query(Task)
    if project_id:
        query = query.filter(Task.project_id == project_id)
    tasks = query.all()
    return tasks

@router.post("/", response_model=TaskSchema, status_code=status.HTTP_201_CREATED)
async def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    """Create a new task"""
    db_task = Task(**task.dict())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@router.put("/", response_model=TaskSchema)
async def update_task(task_id: int, task: TaskUpdate, db: Session = Depends(get_db)):
    """Update a task"""
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = task.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_task, field, value)
    
    db.commit()
    db.refresh(db_task)
    return db_task

@router.delete("/")
async def delete_task(task_id: int, db: Session = Depends(get_db)):
    """Delete a task"""
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(db_task)
    db.commit()
    return {"message": "Task deleted successfully"}

# Task comments endpoints
@router.get("/{task_id}/comments", response_model=List[Comment])
async def get_task_comments(task_id: int, db: Session = Depends(get_db)):
    """Get comments for a specific task"""
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    comments = db_task.comments or []
    return comments

@router.post("/{task_id}/comments", response_model=Comment, status_code=status.HTTP_201_CREATED)
async def create_task_comment(task_id: int, comment: CommentCreate, db: Session = Depends(get_db)):
    """Add a comment to a task"""
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    new_comment = {
        "id": str(int(datetime.now().timestamp() * 1000)),
        "text": comment.text,
        "author": comment.author,
        "created_at": datetime.now().isoformat()
    }
    
    comments = db_task.comments or []
    comments.append(new_comment)
    db_task.comments = comments
    
    db.commit()
    db.refresh(db_task)
    return new_comment

@router.put("/{task_id}/comments", response_model=Comment)
async def update_task_comment(task_id: int, comment_id: str, comment: CommentUpdate, db: Session = Depends(get_db)):
    """Update a comment on a task"""
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    comments = db_task.comments or []
    comment_index = None
    for i, c in enumerate(comments):
        if c.get("id") == comment_id:
            comment_index = i
            break
    
    if comment_index is None:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    comments[comment_index]["text"] = comment.text
    comments[comment_index]["updated_at"] = datetime.now().isoformat()
    db_task.comments = comments
    
    db.commit()
    db.refresh(db_task)
    return comments[comment_index]

@router.delete("/{task_id}/comments")
async def delete_task_comment(task_id: int, comment_id: str, db: Session = Depends(get_db)):
    """Delete a comment from a task"""
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    comments = db_task.comments or []
    comments = [c for c in comments if c.get("id") != comment_id]
    db_task.comments = comments
    
    db.commit()
    return {"message": "Comment deleted successfully"}
