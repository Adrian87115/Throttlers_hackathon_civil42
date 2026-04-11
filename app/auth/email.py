from datetime import datetime, timedelta
from jose import jwt
from fastapi import HTTPException
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr
from sqlalchemy.orm import Session
from app.models.user import User
from sqlalchemy.future import select
from fastapi import Depends
import json

from app.db.session import get_db

with open("app/auth/config.json") as f:
    config_data = json.load(f)

KEY = "rAnDoMkEy"
ALGORITHM = "HS256"
EMAIL_TOKEN_EXPIRE_HOURS = 1

def create_email_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours = EMAIL_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, KEY, algorithm = ALGORITHM)

def decode_email_token(token: str):
    try:
        return jwt.decode(token, KEY, algorithms = [ALGORITHM])
    except Exception:
        raise HTTPException(status_code = 400, detail = "Invalid or expired token")

conf = ConnectionConfig(MAIL_USERNAME = config_data["MAIL_USERNAME"],
                        MAIL_PASSWORD = config_data["MAIL_PASSWORD"],
                        MAIL_FROM = config_data["MAIL_USERNAME"],
                        MAIL_PORT = 587,
                        MAIL_SERVER = "smtp.gmail.com",
                        MAIL_FROM_NAME = "BlogAPI",
                        MAIL_STARTTLS = True,
                        MAIL_SSL_TLS = False,
                        USE_CREDENTIALS = True,
                        VALIDATE_CERTS = True)

async def send_verification_email(subject: str, email_to: EmailStr, token: str):
    verify_url = f"http://localhost:8000/auth/verify/{token}"
    body = f"""<h3>Welcome to BlogApi!</h3>
               <p>Please verify your email by clicking the link below:</p>
               <a href="{verify_url}">Verify Email</a>"""
    message = MessageSchema(subject = subject,
                            recipients = [email_to],
                            body = body,
                            subtype = "html")
    fm = FastMail(conf)
    await fm.send_message(message)

async def send_password_reset(subject: str, email_to: EmailStr, reset_url: str):
    body = f"""<h3>BlogApi Password Reset</h3>
               <p>To change your password, click the link below:</p>
               <a href="{reset_url}">Reset Password</a>
               <p>If you did not request this, you can safely ignore this email.</p>"""
    message = MessageSchema(subject = subject,
                            recipients = [email_to],
                            body = body,
                            subtype = "html")
    fm = FastMail(conf)
    await fm.send_message(message)

def is_email(email: str, db: Session = Depends(get_db)) -> bool:
    user = db.query(User).filter(User.email == email).first()
    return user is not None