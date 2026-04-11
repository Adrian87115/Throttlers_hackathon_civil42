from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict

from app.schemas.comment import CommentOut, CommentCreate
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.post import Post
from app.models.user import User
from app.models.comment import Comment
from app.schemas.comment import CommentUpdate
from app.core.logging_config import logger

router = APIRouter(tags = ["Comments"])

def map_comment_to_out(comment: Comment, db: Session) -> CommentOut:
    owner = db.query(User).filter(User.id == comment.owner_id).first()
    owner_username = owner.username if owner else "Anonymous"
    owner_role = owner.role if owner else "user"
    has_replies = db.query(Comment).filter(Comment.parent_id == comment.id).count() > 0
    return CommentOut(id = comment.id,
                      content = comment.content,
                      created_at = comment.created_at,
                      post_id = comment.post_id,
                      owner_id = comment.owner_id,
                      username = owner_username,
                      parent_id = comment.parent_id,
                      was_modified = comment.was_modified,
                      is_deleted = comment.is_deleted,
                      depth = comment.depth,
                      has_replies = has_replies,
                      role = owner_role)

@router.post("/posts/{post_id}/comments", response_model = CommentOut)
def create_comment(post_id: int,
                   comment: CommentCreate,
                   db: Session = Depends(get_db),
                   current_user = Depends(get_current_user)):
    try:
        if not current_user.is_active:
            logger.warning(f"Inactive user id = {current_user.id} attempted to comment on post id = {post_id}")
            raise HTTPException(status_code = 403, detail = "Inactive accounts can not comment")
        post = db.query(Post).filter(Post.id == post_id).first()
        if post.is_deleted:
            logger.warning(f"User id = {current_user.id} tried commenting on deleted post id = {post_id}")
            raise HTTPException(status_code = 403, detail = "Can not comment deleted post")
        depth = 0
        if comment.parent_id is not None:
            parent_comment = db.query(Comment).filter(Comment.id == comment.parent_id).first()
            if not parent_comment:
                logger.warning(f"User id = {current_user.id} referenced invalid parent comment id = {comment.parent_id}")
                raise HTTPException(status_code = 404, detail = "Parent comment not found")
            if parent_comment.is_deleted:
                logger.warning(f"User id = {current_user.id} attempted reply to deleted comment id = {parent_comment.id}")
                raise HTTPException(status_code = 403, detail = "Parent comment was deleted, can not comment deleted comments")
            if parent_comment.post_id != post_id:
                logger.warning(f"Cross-post reply attempt: user id = {current_user.id}, parent comment id = {parent_comment.id}, target post id = {post_id}")
                raise HTTPException(status_code = 400, detail = "Parent comment does not belong to this post")
            if parent_comment.depth >= 6:
                logger.warning(f"User id = {current_user.id} attempted nesting beyond max depth on post id = {post_id}")
                raise HTTPException(status_code = 400, detail = "Maximum nesting depth (6) reached")
            depth = parent_comment.depth + 1
        new_comment = Comment(content = comment.content,
                            owner_id = current_user.id,
                            post_id = post.id,
                            parent_id = comment.parent_id,
                            depth = depth)
        db.add(new_comment)
        db.commit()
        db.refresh(new_comment)
        logger.info(f"User id = {current_user.id} added comment id = {new_comment.id} on post id = {post_id}")
        return map_comment_to_out(new_comment, db)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error while creating comment on post id = {post_id}: {e}", exc_info = True)
        raise HTTPException(status_code = 500, detail = "Internal server error")

@router.get("/posts/{post_id}/comments", response_model = List[CommentOut])
def get_post_comments(post_id: int,
                      db: Session = Depends(get_db)):
    
    try:
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            logger.warning(f"Attempt to fetch comments from non-existent post id = {post_id}")
            raise HTTPException(status_code = 404, detail = "Post not found")
        comments = db.query(Comment).filter(Comment.post_id == post_id, Comment.parent_id == None).all()
        logger.info(f"Fetched root comments for post id = {post_id}")
        return [map_comment_to_out(comment, db) for comment in comments]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error while retrieving comments for post id = {post_id}: {e}", exc_info = True)
        raise HTTPException(status_code = 500, detail = "Internal server error")

@router.get("/posts/{post_id}/comments/{comment_id}/replies", response_model = List[CommentOut])
def get_comment_replies(post_id: int, comment_id: int, db: Session = Depends(get_db)):
    try:
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            logger.warning(f"Attempt to fetch replies from non-existent post id = {post_id}")
            raise HTTPException(status_code = 404, detail = "Post not found")
        comment = db.query(Comment).filter(Comment.id == comment_id, Comment.post_id == post_id).first()
        if not comment:
            logger.warning(f"Attempt to fetch replies for invalid comment id = {comment_id} in post id = {post_id}")
            raise HTTPException(status_code = 404, detail="Comment not found in this post")
        replies = db.query(Comment).filter(Comment.parent_id == comment_id).all()
        logger.info(f"Fetched {len(replies)} replies for comment id = {comment_id} on post id = {post_id}")
        return [map_comment_to_out(c, db) for c in replies]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error while retrieving replies to comment id = {comment_id}, post id = {post_id}: {e}", exc_info = True)
        raise HTTPException(status_code = 500, detail = "Internal server error")

# !!! only for tests as it may crash for large trees !!! - DO NOT USE FOR FINAL API
def build_comment_tree(comments: List[Comment], db: Session) -> List[Dict]:
    comment_map: Dict[int, Dict] = {}
    for comment in comments:
        comment_map[comment.id] = {**map_comment_to_out(comment, db).dict(), "children": []}
    tree: List[Dict] = []
    for comment in comments:
        node = comment_map[comment.id]
        if comment.parent_id:
            parent_node = comment_map.get(comment.parent_id)
            if parent_node:
                parent_node["children"].append(node)
        else:
            tree.append(node)
    return tree

# !!! only for tests as it may crash for large trees !!! - DO NOT USE FOR FINAL API
@router.get("/posts/{post_id}/comments/tree", response_model=List[Dict])
def get_post_comment_tree(post_id: int, db: Session = Depends(get_db)):
    db_post = db.query(Post).filter(Post.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")
    comments = db.query(Comment).filter(Comment.post_id == post_id).all()
    return build_comment_tree(comments, db)

@router.delete("/{comment_id}")
def delete_comment(comment_id: int,
                   db: Session = Depends(get_db),
                   current_user = Depends(get_current_user)):
    try:
        comment_to_delete = db.query(Comment).filter(Comment.id == comment_id).first()
        if not comment_to_delete:
            logger.warning(f"Delete attempt for non-existent comment id = {comment_id}")
            raise HTTPException(status_code = 404, detail = "Comment not found")
        post = db.query(Post).filter(Post.id == comment_to_delete.post_id).first()
        if not post or post.is_deleted:
            logger.warning(f"User id = {current_user.id} attempted to delete comment id = {comment_id} on deleted/non-existent post id = {comment_to_delete.post_id}")
            raise HTTPException(status_code = 403, detail="Can not delete comments on deleted posts")
        if comment_to_delete.is_deleted:
            logger.warning(f"User id = {current_user.id} tried deleting already deleted comment id = {comment_id}")
            raise HTTPException(status_code = 403, detail = "Comment is already deleted")
        comment_owner = db.query(User).filter(User.id == comment_to_delete.owner_id).first()
        if not comment_owner:
            logger.error(f"Comment id = {comment_id} has no valid owner in DB")
            raise HTTPException(status_code = 404, detail = "Comment owner not found")
        if not comment_owner.is_active:
            logger.warning(f"Inactive owner id = {comment_owner.id} linked to comment id = {comment_id}")
            raise HTTPException(status_code = 403, detail = "Inactive accounts can not delete comments")
        if comment_owner.role == "owner" and current_user.role != "owner":
            logger.warning(f"User id = {current_user.id} tried deleting owner's comment id = {comment_id}")
            raise HTTPException(status_code = 403, detail = "Owner's comments can not be deleted")
        if comment_owner.id == current_user.id:
            comment_to_delete.content = "[deleted]"
            comment_to_delete.is_deleted = True
            db.commit()
            logger.info(f"User id = {current_user.id} deleted own comment id = {comment_id}")
            return {"detail": f"Comment id {comment_id} marked as deleted by its owner"}
        
        hierarchy = {"user": 1, "moderator": 2, "admin": 3, "owner": 4}
        current_rank = hierarchy.get(current_user.role, 0)
        post_rank = hierarchy.get(comment_owner.role, 0)
        if current_rank > post_rank:
            comment_to_delete.content = "[deleted]"
            comment_to_delete.is_deleted = True
            db.commit()
            logger.info(f"User id = {current_user.id}, role = {current_user.role} deleted comment id = {comment_id} of user = {comment_owner.id}")
            return {"detail": f"Comment id {comment_id} marked as deleted by {current_user.role}: {current_user.username}"}
        logger.warning(f"Unauthorized delete attempt by user id = {current_user.id} on comment id = {comment_id}")
        raise HTTPException(status_code = 403, detail = "Not authorized to delete this comment")
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Error while deleting comment id = {comment_id}, by user id = {current_user.id}: {e}", exc_info = True)
        raise HTTPException(status_code = 500, detail = "Internal server error")

@router.patch("/{comment_id}", response_model = CommentOut)
def update_comment(comment_id: int,
                   comment_update: CommentUpdate,
                   db: Session = Depends(get_db),
                   current_user: User = Depends(get_current_user)):
    try:
        comment = db.query(Comment).filter(Comment.id == comment_id).first()
        if not comment:
            logger.warning(f"Update attempt for non-existent comment id = {comment_id}")
            raise HTTPException(status_code = 404, detail = "Comment not found")
        post = db.query(Post).filter(Post.id == comment.post_id).first()
        if not post or post.is_deleted:
            logger.warning(f"User id = {current_user.id} attempted to update comment id = {comment_id} on deleted/non-existent post id = {comment.post_id}")
            raise HTTPException(status_code = 403, detail="Can not update comments on deleted posts")
        if comment.owner_id != current_user.id:
            logger.warning(f"Unauthorized update attempt by user id = {current_user.id} on comment id = {comment_id}")
            raise HTTPException(status_code = 403, detail = "Not authorized to update this comment")
        if comment.is_deleted:
            logger.warning(f"User id = {current_user.id} attempted to edit deleted comment id = {comment_id}")
            raise HTTPException(status_code = 403, detail = "The comment is deleted")
        comment_owner = db.query(User).filter(User.id == current_user.id).first()
        if not comment_owner or not comment_owner.is_active:
            logger.warning(f"Inactive user id = {current_user.id} tried updating comment id = {comment_id}")
            raise HTTPException(status_code = 403, detail = "Inactive accounts can not update comments")
        if comment_update.content is not None:
            comment.content = comment_update.content
            comment.was_modified = True
        db.commit()
        db.refresh(comment)
        logger.info(f"User id = {current_user.id} updated comment id = {comment_id}")
        return map_comment_to_out(comment, db)
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Error while updating comment id = {comment_id}, by user id = {current_user.id}: {e}", exc_info = True)
        raise HTTPException(status_code = 500, detail = "Internal server error")