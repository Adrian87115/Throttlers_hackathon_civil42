from passlib.context import CryptContext
from typing import Optional
from datetime import datetime, timedelta
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import re

from app.db.session import get_db
from app.models.user import User

pwd_context = CryptContext(schemes = ["pbkdf2_sha256"], deprecated = "auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)

def validate_password(password: str):
    if len(password) < 8:
        return False
    if not re.search(r"[a-z]", password):
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"\d", password):
        return False
    if not re.search(r"[@$!%*?&]", password):
        return False
    return True

KEY = "rAnDoMkEy"
ALGORITHM = "HS256"

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta is not None:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes = 10)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, KEY, algorithm = ALGORITHM)
    return encoded_jwt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl = "auth/login")
optional_oauth2_scheme = OAuth2PasswordBearer(tokenUrl = "auth/login", auto_error = False)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(status_code = status.HTTP_401_UNAUTHORIZED, detail = "Invalid credentials", headers = {"WWW-Authenticate": "Bearer"})
    try:
        payload = jwt.decode(token, KEY, algorithms = ALGORITHM)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user


def get_optional_current_user(token: str | None = Depends(optional_oauth2_scheme),
                              db: Session = Depends(get_db)) -> User | None:
    if token is None:
        return None
    try:
        payload = jwt.decode(token, KEY, algorithms = ALGORITHM)
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
    except JWTError:
        return None
    return db.query(User).filter(User.id == int(user_id)).first()