from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.core.security import hash_password, get_current_user, validate_password
from app.schemas.user import UserOut, SafeUserOut
from app.models.user import User
from app.core.security import verify_password, hash_password
from app.schemas.user import UserOutAdvanced
from app.core.logging_config import logger

router = APIRouter(tags = ["Users"])

@router.get("/me", response_model = SafeUserOut)
def read_user_me(current_user: User = Depends(get_current_user)):
    try:
        user_data = SafeUserOut(id = current_user.id,
                                username = current_user.username,
                                email = current_user.email,
                                role = current_user.role,
                                isAdmin = current_user.role == "admin",
                                isModerator = current_user.role == "moderator",
                                isOwner = current_user.role == "owner",)
        logger.info(f"User id = {current_user.id} requested their profile")
        return user_data
    except HTTPException:
        raise
    except Exception as e:
            logger.error(f"Error reading profile for user id = {getattr(current_user, 'id', None)}: {e}", exc_info=True)
            raise HTTPException(status_code = 500, detail = "Internal server error")

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

@router.patch("/me/change-password")
def change_password(payload: ChangePasswordRequest,
                    db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    try:
        old_password = payload.old_password
        new_password = payload.new_password
        if not validate_password(new_password):
            raise HTTPException(status_code = 400, detail = "Password must consist of: at least 8 characters, at least 1 small letter, at least 1 capital letter, at least 1 number, at least 1 special character")
        if not verify_password(old_password, current_user.hashed_password):
            raise HTTPException(status_code = 400, detail = "Invalid old password")
        current_user.hashed_password = hash_password(new_password)
        db.add(current_user)
        db.commit()
        logger.info(f"User id = {current_user.id} changed their password successfully")
        return {"detail": "Password updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error changing password for user id = {getattr(current_user, 'id', None)}: {e}", exc_info = True)
        raise HTTPException(status_code = 500, detail = "Internal server error")

@router.get("/", response_model = list[UserOut])
def list_users(db: Session = Depends(get_db)):
    try:
        users = db.query(User).all()
        logger.info(f"Retrieved list of all users, count = {len(users)}")
        return users
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing users: {e}", exc_info = True)
        raise HTTPException(status_code = 500, detail = "Internal server error")

def require_role(required_roles: list[str]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in required_roles:
            raise HTTPException(status_code = 403, detail = f"Operation requires one of the roles: {', '.join(required_roles)}")
        return current_user
    return role_checker

class RoleUpdate(BaseModel):
    role: str  # "user", "moderator", "admin", "owner"

@router.put("/{user_id}/role")
def update_user_role(user_id: int, role_update: RoleUpdate,
                     db: Session = Depends(get_db),
                     current_user: User = Depends(require_role(["admin", "owner"]))):
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not current_user.is_active:
            logger.warning(f"Inactive user id = {current_user.id} attempted to update roles")
            raise HTTPException(status_code = 403, detail = "Inactive accounts can not update roles")
        if not user:
            logger.warning(f"User id = {user_id} not found for role update")
            raise HTTPException(status_code = 404, detail = "User not found")
        if not user.is_verified:
            logger.warning(f"Attempt to update role of not verified account user id = {user.id}")
            raise HTTPException(status_code = 403, detail = "Account not verified")
        if user.is_deleted:
            logger.warning(f"Attempt to update role of deleted account user id = {user.id}")
            raise HTTPException(status_code = 403, detail = "Account was deleted")
        if role_update.role not in ["user", "moderator", "admin"]:
            logger.warning(f"Invalid role '{role_update.role}' provided by user id = {current_user.id}")
            raise HTTPException(status_code = 400, detail = "Invalid role")
        if user.role == "owner":
            logger.warning(f"Attempt to change owner's role user id = {user.id} by user id = {current_user.id}")
            raise HTTPException(status_code = 403, detail = "Owner's role can not be changed")
        if user.id == current_user.id and role_update.role != "admin": # admin can not demote themselves
            logger.warning(f"Admin user id = {current_user.id} tried to demote themselves")
            raise HTTPException(status_code = 403, detail = "Admin can not change their own role or the role of other admins")
        user.role = role_update.role
        db.commit()
        db.refresh(user)
        logger.info(f"User id = {current_user.id} updated role for user id = {user.id} to {user.role}, by user id = {current_user.id}")
        return {"id": user.id, "username": user.username, "role": user.role}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating role for user id = {user_id}: {e}", exc_info = True)
        raise HTTPException(status_code = 500, detail = "Internal server error")

@router.get("/advanced", response_model = list[UserOutAdvanced])
def list_users_advanced(db: Session = Depends(get_db),
                        _: User = Depends(require_role(["owner", "admin", "moderator"]))):
    try:
        users = db.query(User).all()
        logger.info(f"Retrieved advanced list of all users, count = {len(users)}")
        return users
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing users: {e}", exc_info = True)
        raise HTTPException(status_code = 500, detail = "Internal server error")

def soft_delete_user(db: Session, user: User):
    user.is_deleted = True
    user.is_active = False
    posts = db.query(Post).filter(Post.owner_id == user.id).all()
    for post in posts:
        post.is_deleted = True
        post.title = "[deleted]"
        post.content = "[deleted]"
    comments = db.query(Comment).filter(Comment.owner_id == user.id).all()
    for comment in comments:
        comment.is_deleted = True
        comment.content = "[deleted]"
    db.commit()

@router.delete("/me")
def delete_account(db: Session = Depends(get_db), 
                   current_user: User = Depends(get_current_user)):
    try:
        if current_user.role == "owner":
            logger.warning(f"Owner user id = {current_user.id} attempted to delete their own account")
            raise HTTPException(status_code = 403, detail = "Owner can not delete their own account")
        if current_user.is_deleted:
            logger.warning(f"User id = {current_user.id} attempted to delete an already deleted account")
            raise HTTPException(status_code = 403, detail = "Account is already deleted")
        soft_delete_user(db, current_user)  
        logger.info(f"User id = {current_user.id} deleted their account")
        return {"detail": "Your account has been deleted"}
    except HTTPException:
        raise
    except Exception as e:
            logger.error(f"Error deleting account for user id = {current_user.id}: {e}", exc_info = True)
            raise HTTPException(status_code = 500, detail = "Internal server error")
    
@router.delete("/{user_id}") # status_code = status.HTTP_204_NO_CONTENT no content for schema to display
def delete_user(user_id: int,
                db: Session = Depends(get_db),
                current_user: User = Depends(require_role(["admin", "owner"]))):
    try:
        user_to_delete = db.query(User).filter(User.id == user_id).first()
        if not current_user.is_active:
            logger.warning(f"Inactive user id = {current_user.id} attempted to delete user id = {user_id}")
            raise HTTPException(status_code = 403, detail = "Inactive accounts can not delete users")
        if not user_to_delete:
            logger.warning(f"User id = {user_id} not found for deletion by user id = {current_user.id}")
            raise HTTPException(status_code = 404, detail = "User not found")
        if user_to_delete.is_deleted:
            logger.warning(f"Attempt to delete already deleted account user id = {user_to_delete.id}")
            raise HTTPException(status_code = 403, detail = "Account is already deleted")
        if user_to_delete.role == "owner":
            logger.warning(f"Attempt to delete owner account user id = {user_to_delete.id}")
            raise HTTPException(status_code = 403, detail = "Owner can not be deleted")
        if user_to_delete.id == current_user.id: # to self delete there is another function
            logger.warning(f"User id = {current_user.id} attempted to delete their own account")
            raise HTTPException(status_code = 400, detail = "Can not delete your own account") # prevents admin and owner from deleting their own account and self locking
        if current_user.role == "admin" and user_to_delete.role == "admin":
            logger.warning(f"Admin user id = {current_user.id} attempted to delete another admin user id = {user_to_delete.id}")
            raise HTTPException(status_code = 403, detail = "Admins can not delete other admins")
        soft_delete_user(db, user_to_delete)
        logger.info(f"User id = {current_user.id} deleted user id = {user_to_delete.id}")
        return {"detail": "User deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
            logger.error(f"Error deleting account for user id = {current_user.id}: {e}", exc_info = True)
            raise HTTPException(status_code = 500, detail = "Internal server error")
    
@router.patch("/{user_id}/ban")
def ban_user(user_id: int,
             db: Session = Depends(get_db),
             current_user: User = Depends(require_role(["owner", "admin", "moderator"]))):
    try:
        if not current_user.is_active:
            logger.warning(f"Inactive user id = {current_user.id} attempted to ban user id = {user_id}")
            raise HTTPException(status_code = 403, detail = "Inactive accounts can not ban users")
        user_to_ban = db.query(User).filter(User.id == user_id).first()
        if not user_to_ban:
            logger.warning(f"User id = {user_id} not found for banning by user id = {current_user.id}")
            raise HTTPException(status_code = 404, detail = "User not found")
        if user_to_ban.is_deleted:
            logger.warning(f"Attempt to ban deleted user id = {user_to_ban.id}")
            raise HTTPException(status_code = 403, detail = "Account was deleted")
        if user_to_ban.role == "owner":
            logger.warning(f"Attempt to ban owner user id = {user_to_ban.id}")
            raise HTTPException(status_code = 403, detail = "Owner can not be banned")
        if user_to_ban.id == current_user.id:
            logger.warning(f"User id = {current_user.id} attempted to self-ban")
            raise HTTPException(status_code = 400, detail = "Cannot self ban")
        if not user_to_ban.is_active:
            logger.warning(f"User id = {user_to_ban.id} is already banned")
            raise HTTPException(status_code = 400, detail = "User is already banned")
        if current_user.role == "moderator" and user_to_ban.role in ["moderator", "admin", "owner"]:
            logger.warning(f"Moderator id = {current_user.id} attempted to ban higher or equal role user id = {user_to_ban.id}")
            raise HTTPException(status_code = 403, detail = "Moderators can not ban other moderators, admins and owner")
        if current_user.role == "admin" and user_to_ban.role == "admin":
            logger.warning(f"Admin id = {current_user.id} attempted to ban another admin user id = {user_to_ban.id}")
            raise HTTPException(status_code = 403, detail = "Admins can not ban other admins")
        user_to_ban.is_active = False
        db.commit()
        logger.info(f"User id = {current_user.id} banned user id = {user_to_ban.id}")
        return {"detail": f"User '{user_to_ban.username}' has been banned successfully"}
    except HTTPException:
        raise
    except Exception as e:
            logger.error(f"Error deleting account for user id = {current_user.id}: {e}", exc_info = True)
            raise HTTPException(status_code = 500, detail = "Internal server error")
       
@router.patch("/{user_id}/unban")
def unban_user(user_id: int,
               db: Session = Depends(get_db),
               current_user: User = Depends(require_role(["admin", "moderator", "owner"]))):
    try:
        if not current_user.is_active:
            logger.warning(f"Inactive user id = {current_user.id} attempted to unban user id = {user_id}")
            raise HTTPException(status_code = 403, detail = "Inactive accounts can not unban users")
        user_to_unban = db.query(User).filter(User.id == user_id).first()
        if not user_to_unban:
            logger.warning(f"User id = {user_id} not found for unbanning")
            raise HTTPException(status_code = 404, detail = "User not found")
        if user_to_unban.is_deleted:
            logger.warning(f"Attempt to unban deleted user id = {user_to_unban.id}")
            raise HTTPException(status_code = 403, detail = "Account was deleted")
        if user_to_unban.role == "owner": # since owner can not be banned, they can not be unbanned
            logger.warning(f"Attempt to unban owner user id = {user_to_unban.id}")
            raise HTTPException(status_code = 403, detail = "Owner can not be unbanned")
        if user_to_unban.id == current_user.id:
            logger.warning(f"User id = {current_user.id} attempted to self-unban")
            raise HTTPException(status_code = 400, detail = "Can not self unban")
        if user_to_unban.is_active:
            logger.warning(f"User id = {user_to_unban.id} is not banned")
            raise HTTPException(status_code = 400, detail = "User is not banned")
        if not user_to_unban.is_verified:
            logger.warning(f"User id = {user_to_unban.id} is not verified")
            raise HTTPException(status_code = 400, detail = "User is not verified")
        if current_user.role == "moderator" and user_to_unban.role in ["moderator", "admin", "owner"]:
            logger.warning(f"Moderator id = {current_user.id} attempted to unban higher or equal role user id = {user_to_unban.id}")
            raise HTTPException(status_code = 403, detail = "Moderators can not unban other moderators, admins and owner")
        if current_user.role == "admin" and user_to_unban.role == "admin":
            logger.warning(f"Admin id = {current_user.id} attempted to unban another admin user id = {user_to_unban.id}")
            raise HTTPException(status_code = 403, detail = "Admins can not unban other admins")
        user_to_unban.is_active = True
        db.commit()
        logger.info(f"User id = {current_user.id} unbanned user id = {user_to_unban.id}")
        return {"detail": f"User '{user_to_unban.username}' has been unbanned successfully"}
    except HTTPException:
        raise
    except Exception as e:
            logger.error(f"Error deleting account for user id = {current_user.id}: {e}", exc_info = True)
            raise HTTPException(status_code = 500, detail = "Internal server error")
    
@router.get("/user-management", response_model = list[UserOutAdvanced])
def user_management(show_role: str = "all",
                    db: Session = Depends(get_db), 
                    current_user: User = Depends(require_role(["admin", "moderator", "owner"]))):
    try:
        if show_role not in ["all", "user", "moderator", "admin", "owner"]:
            raise HTTPException(status_code = 400, detail = "Incorrect role to show")
        query = db.query(User)
        if current_user.role == "moderator":
            query = query.filter(User.role == "user")
        elif current_user.role == "admin":
            if show_role == "user":
                query = query.filter(User.role == "user")
            elif show_role == "moderator":
                query = query.filter(User.role == "moderator")
            elif show_role == "all":
                query = query.filter(User.role.in_(["user", "moderator"]))
            else:
                raise HTTPException(status_code = 403, detail = "Admins can only view users, moderators, or all")
        elif current_user.role == "owner":
            if show_role != "all":
                query = query.filter(User.role == show_role)
        users = query.all()
        logger.info(f"User id = {current_user.id}, role = {current_user.role}, requested {len(users)} users (show_role = {show_role})")
        return users
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error user management: {e}", exc_info = True)
        raise HTTPException(status_code = 500, detail = "Internal server error")
    
def get_username_from_id(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code = 404, detail = f"User with id {user_id} not found")
    return user.username

@router.get("/{id}", response_model=UserOut)
def get_user(id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
