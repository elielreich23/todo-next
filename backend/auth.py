from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import UserSignupRequest, SignupResponse, UserLoginRequest, LoginResponse
from passlib.context import CryptContext

router = APIRouter()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

@router.post("/login", response_model=LoginResponse)
async def login(user_data: UserLoginRequest, db: Session = Depends(get_db)):
    """User login endpoint"""
    
    # Find user by email
    user = db.query(User).filter(User.email == user_data.email.lower()).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(user_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated"
        )
    
    return LoginResponse(
        success=True,
        message="Login successful",
        user={
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name
        },
        token=None  # Simple session for now, can be enhanced later
    )

@router.post("/signup", response_model=SignupResponse)
async def signup(user_data: UserSignupRequest, db: Session = Depends(get_db)):
    """User signup endpoint"""
    
    existing_user = db.query(User).filter(User.email == user_data.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    existing_username = db.query(User).filter(User.username == user_data.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    
    new_user = User(
        email=user_data.email.lower(),
        username=user_data.username,
        password=hashed_password,
        full_name=user_data.full_name,
        is_active=True
    )
    
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return SignupResponse(
            success=True,
            message="User created successfully",
            user={
                "id": new_user.id,
                "username": new_user.username,
                "email": new_user.email,
                "full_name": new_user.full_name
            }
        )
        
    except Exception as e:
        db.rollback()
        print(f"Error creating user: {e}")  # Add logging
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )
