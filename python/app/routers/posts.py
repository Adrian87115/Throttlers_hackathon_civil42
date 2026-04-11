from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from sqlalchemy.sql.expression import func

from app.schemas.post import PostOut, PostCreate, PostUpdate
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.post import Post
from app.models.user import User
from app.core.logging_config import logger

router = APIRouter(tags = ["Posts"])

def map_post_to_out(post: Post, db: Session) -> PostOut:
    owner = db.query(User).filter(User.id == post.owner_id).first()
    owner_username = owner.username if owner else "Anonymous"
    owner_role = owner.role if owner else "user"
    return PostOut(id = post.id,
                   title = post.title,
                   content = post.content,
                   created_at = post.created_at,
                   owner_id = post.owner_id,
                   username = owner_username,
                   role = owner_role)

@router.post("/", response_model = PostOut)
def create_post(post: PostCreate,
                db: Session = Depends(get_db),
                current_user = Depends(get_current_user)):
    try:
        if not current_user.is_active:
            logger.warning(f"Inactive user {current_user.id} attempted to create a post")
            raise HTTPException(status_code = 403, detail = "Inactive accounts can not create posts")
        new_post = Post(title = post.title, content = post.content, owner_id = current_user.id)
        db.add(new_post)
        db.commit()
        db.refresh(new_post)
        logger.info(f"User id = {current_user.id} created post id = {new_post.id} with title = '{new_post.title}', "
                    f"content_preview = '{new_post.content[:30]}'")
        return map_post_to_out(new_post, db)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error while creating post for user {getattr(current_user, 'id', None)}: {e}", exc_info = True)
        raise HTTPException(status_code = 500, detail = "Internal server error")

@router.get("/my", response_model = List[PostOut])
def get_my_posts(db: Session = Depends(get_db),
                    current_user = Depends(get_current_user)):
    try:
        posts = db.query(Post).filter(Post.owner_id == current_user.id).all()
        logger.info(f"User id = {current_user.id} retrieved their posts (count = {len(posts)})")
        return [map_post_to_out(p, db) for p in posts]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error while retrieving posts for user {getattr(current_user, 'id', None)}: {e}", exc_info = True)
        raise HTTPException(status_code = 500, detail = "Internal server error")
    
@router.get("/my/last", response_model = PostOut)
def get_my_last_post(db: Session = Depends(get_db),
                     current_user = Depends(get_current_user)):
    try:
        post = (db.query(Post).filter(Post.owner_id == current_user.id, Post.is_deleted == False).order_by(Post.created_at.desc()).first())
        if not post:
            logger.info(f"User id = {current_user.id} has no posts")
            raise HTTPException(status_code = 404, detail = "No posts found")
        logger.info(f"User id = {current_user.id} retrieved their last post (id = {post.id})")
        return map_post_to_out(post, db)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error while retrieving last post for user {getattr(current_user, 'id', None)}: {e}", exc_info = True)
        raise HTTPException(status_code = 500, detail = "Internal server error")

@router.get("/random", response_model = PostOut)
def get_random_post(db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.is_deleted == False).order_by(func.random()).first()
    if not post:
        raise HTTPException(status_code = 404, detail = "No posts found")
    return map_post_to_out(post, db)

@router.get("/{id}", response_model = PostOut)
def get_post(id: int,
             db: Session = Depends(get_db)):
    try:
        post = db.query(Post).filter(Post.id == id).first()
        if not post:
            logger.warning(f"Attempted access non-existent post id = {id}")
            raise HTTPException(status_code = 404, detail = "Post not found")
        logger.info(f"Retrieved post id = {post.id}")
        return map_post_to_out(post, db)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error while retrieving post id = {id}: {e}", exc_info = True)
        raise HTTPException(status_code = 500, detail = "Internal server error")

@router.get("/", response_model = List[PostOut])
def get_all_posts(db: Session = Depends(get_db)):
    try:
        posts = (db.query(Post).filter(Post.is_deleted == False).order_by(Post.created_at.desc()).all())
        logger.info(f"Retrieved all posts (count = {len(posts)})")
        return [map_post_to_out(p, db) for p in posts]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error while retrieving all posts: {e}", exc_info = True)
        raise HTTPException(status_code = 500, detail = "Internal server error")

class DeleteReason(BaseModel):
    reason: str | None = None

@router.delete("/{post_id}/delete")
def delete_post(post_id : int,
                reason: DeleteReason | None = None,
                db: Session = Depends(get_db),
                current_user = Depends(get_current_user)):
    try:
        post_to_delete = db.query(Post).filter(Post.id == post_id).first()
        if not post_to_delete:
            logger.warning(f"User id = {current_user.id} attempted to delete non-existent post id = {post_id}")
            raise HTTPException(status_code = 404, detail = "Post not found")
        if post_to_delete.is_deleted:
            logger.warning(f"User id = {current_user.id} attempted to delete already deleted post id = {post_id}")
            raise HTTPException(status_code = 403, detail = "Post already deleted")
        post_owner = db.query(User).filter(User.id == post_to_delete.owner_id).first()
        if not post_owner:
            logger.error(f"Post id = {post_id} has no valid owner in database")
            raise HTTPException(status_code = 404, detail = "Post owner not found")
        if not post_owner.is_active:
            logger.warning(f"Inactive user id = {post_owner.id} attempted deletion of post id = {post_id}")
            raise HTTPException(status_code = 403, detail = "Inactive accounts can not delete posts")
        if post_owner.role == "owner" and current_user.role != "owner":
            logger.warning(f"User id = {current_user.id} attempted to delete owner's post id = {post_id}")
            raise HTTPException(status_code = 403, detail = "Owner's posts can not be deleted")
        if post_to_delete.owner_id == current_user.id:
            post_to_delete.title = "[deleted]"
            post_to_delete.content = "[deleted]"
            post_to_delete.is_deleted = True
            post_to_delete.deletion_reason = "Deleted by post owner"
            db.commit()
            logger.info(f"User id = {current_user.id} deleted their own post id = {post_id}")
            return {"detail": f"Post deleted by the owner"}
        
        hierarchy = {"user": 1, "moderator": 2, "admin": 3, "owner": 4}
        current_rank = hierarchy.get(current_user.role, 0)
        post_rank = hierarchy.get(post_owner.role, 0)
        if current_rank > post_rank:
            if not reason or not reason.reason:
                    logger.warning(f"User id = {current_user.id} tried deleting post id = {post_id} without providing reason")
                    raise HTTPException(status_code = 400, detail = "You must provide a reason when deleting someone's post")
            post_to_delete.title = "[deleted]"
            post_to_delete.content = "[deleted]"
            post_to_delete.is_deleted = True
            post_to_delete.deletion_reason = reason.reason
            db.commit()
            logger.info(f"User id = {current_user.id} ({current_user.role}) deleted post id = {post_id} "
                        f"owned by user id = {post_owner.id} ({post_owner.role}), reason = '{reason.reason}'")
            return {"detail": f"Post id: {post_to_delete.id} deleted by {current_user.role} : {current_user.username}, reason: {reason.reason}"}
        logger.warning(f"User id = {current_user.id} is not authorized to delete post id = {post_id}")
        raise HTTPException(status_code = 403, detail = "Not authorized to delete this post")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error while deleting post id = {post_id} by user {getattr(current_user, 'id', None)}: {e}", exc_info = True)
        raise HTTPException(status_code = 500, detail = "Internal server error")

@router.put("/{post_id}/update", response_model = PostOut)
def update_post(post_id: int,
                post_update: PostUpdate,
                db: Session = Depends(get_db),
                current_user = Depends(get_current_user)):
    try:
        post_to_update = db.query(Post).filter(Post.id == post_id).first()
        if not post_to_update:
            logger.warning(f"User id = {current_user.id} attempted to update non-existent post id = {post_id}")
            raise HTTPException(status_code = 404, detail = "Post not found")
        if post_to_update.is_deleted:
            logger.warning(f"User id = {current_user.id} attempted to update deleted post id = {post_id}")
            raise HTTPException(status_code = 403, detail = "The post is deleted")
        if post_to_update.owner_id != current_user.id:
            logger.warning(f"User id = {current_user.id} attempted unauthorized update on post id = {post_id}")
            raise HTTPException(status_code = 403, detail = "Not authorized to update this post")
        post_owner = db.query(User).filter(User.id == current_user.id).first()
        if not post_owner:
            logger.error(f"Post id = {post_id} has no valid owner in database")
            raise HTTPException(status_code = 404, detail = "Post owner not found")
        if not post_owner.is_active:
            logger.warning(f"Inactive user id = {current_user.id} attempted to update post id = {post_id}")
            raise HTTPException(status_code = 403, detail = "Inactive accounts can not update posts")
        if post_update.title is not None:
            post_to_update.title = post_update.title
        if post_update.content is not None:
            post_to_update.content = post_update.content
        post_to_update.was_modified = True
        db.commit()
        db.refresh(post_to_update)
        logger.info(f"User id = {current_user.id} updated post id = {post_to_update.id} "
                    f"with title = '{post_to_update.title}', content_preview = '{post_to_update.content[:30]}'")
        return map_post_to_out(post_to_update, db)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error while updating post id = {post_id} by user {getattr(current_user, 'id', None)}: {e}", exc_info = True)
        raise HTTPException(status_code = 500, detail = "Internal server error")