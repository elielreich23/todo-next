from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, get_db
from models import Base, User, Project, Task
from auth import router as auth_router
from projects import router as projects_router
from tasks import router as tasks_router
from passlib.context import CryptContext

# Create all tables
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")
except Exception as e:
    print(f"Error creating database tables: {e}")

app = FastAPI(
    title="Taskero API",
    description="Backend API for Taskero task management application",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(projects_router, prefix="/api/projects", tags=["Projects"])
app.include_router(tasks_router, prefix="/api/tasks", tags=["Tasks"])

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str):
    return pwd_context.hash(password)

@app.get("/")
async def root():
    return {"message": "Taskero API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Backend is working!"}

@app.post("/create-test-users")
async def create_test_users(db: Session = Depends(get_db)):
    """Create three test users for testing purposes"""
    
    test_users = [
        {
            "email": "admin@taskero.com",
            "username": "admin",
            "password": "admin123",
            "full_name": "Admin User"
        },
        {
            "email": "user1@taskero.com",
            "username": "user1",
            "password": "user123",
            "full_name": "Regular User 1"
        },
        {
            "email": "user2@taskero.com",
            "username": "user2",
            "password": "user123",
            "full_name": "Regular User 2"
        }
    ]
    
    created_users = []
    
    for user_data in test_users:
        # Check if user already exists
        existing_user = db.query(User).filter(
            (User.email == user_data["email"]) | (User.username == user_data["username"])
        ).first()
        
        if not existing_user:
            hashed_password = get_password_hash(user_data["password"])
            
            new_user = User(
                email=user_data["email"],
                username=user_data["username"],
                password=hashed_password,
                full_name=user_data["full_name"],
                is_active=True
            )
            
            db.add(new_user)
            created_users.append({
                "username": new_user.username,
                "email": new_user.email,
                "full_name": new_user.full_name
            })
    
    try:
        db.commit()
        return {
            "success": True,
            "message": f"Created {len(created_users)} test users",
            "users": created_users
        }
    except Exception as e:
        db.rollback()
        print(f"Error creating test users: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create test users: {str(e)}"
        )

@app.get("/users")
async def get_users(db: Session = Depends(get_db)):
    """Get all users (for testing)"""
    users = db.query(User).all()
    return {
        "total_users": len(users),
        "users": [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "is_active": user.is_active,
                "created_at": user.created_at
            }
            for user in users
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3001)
