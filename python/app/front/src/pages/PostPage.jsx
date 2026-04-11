import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import styles from "./PostPage.module.css";
import UserPopup from "../components/UserPopup.jsx";

function CommentItem({
  comment,
  depth = 0,
  user,
  editingCommentId,
  editContent,
  setEditContent,
  startEditingComment,
  handleUpdateComment,
  handleDeleteComment,
  replyingTo,
  startReply,
  replyContent,
  setReplyContent,
  handleAddReply,
  replies,
  setReplies,
  expanded,
  setExpanded,
  fetchReplies,
  postId,
}) {
  const children = replies[comment.id] || [];
  const isExpanded = expanded[comment.id];

  const hierarchy = { user: 1, moderator: 2, admin: 3, owner: 4 };

  const canDeleteComment =
    user &&
    !comment.is_deleted &&
    (user.id === comment.owner_id ||
      hierarchy[user.role] > hierarchy[comment.role]);

  return (
    <li className={styles.commentItem} style={{ marginLeft: depth * 20 }}>
      <div className={styles.commentHeader}>
        <UserPopup
          currentUser={user}
          targetUser={{
            id: comment.owner_id,
            username: comment.username,
            role: comment.role,
          }}
        />
        <span className={styles.commentDate}>
          {new Date(comment.created_at).toLocaleString()}
        </span>
      </div>

      {editingCommentId === comment.id ? (
        <form
          onSubmit={(e) => handleUpdateComment(e, comment.id)}
          className={styles.editForm}
        >
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            required
          />
          <div className={styles.commentActions}>
            <button type="submit" className={styles.saveBtn}>
              Save
            </button>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => startEditingComment(null)}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <p
          className={`${styles.commentContent} ${
            comment.is_deleted ? styles.deletedComment : ""
          }`}
        >
          {comment.content}
        </p>
      )}

      <div className={styles.commentActions}>
        {user &&
          user.id === comment.owner_id &&
          !comment.is_deleted && (
            <button
              onClick={() => startEditingComment(comment)}
              className={styles.editBtn}
            >
              Edit
            </button>
          )}
        {canDeleteComment && (
          <button
            onClick={() => handleDeleteComment(comment.id, comment.parent_id)}
            className={styles.deleteBtn}
          >
            Delete
          </button>
        )}
        {user && !comment.is_deleted && (
          <button
            onClick={() => startReply(comment.id)}
            className={styles.replyBtn}
          >
            Reply
          </button>
        )}
      </div>

      {replyingTo === comment.id && (
        <form
          onSubmit={(e) => handleAddReply(e, comment.id)}
          className={styles.replyForm}
        >
          <textarea
            value={replyContent[comment.id] || ""}
            onChange={(e) =>
              setReplyContent((prev) => ({
                ...prev,
                [comment.id]: e.target.value,
              }))
            }
            required
          />
          <div className={styles.commentActions}>
            <button type="submit" className={styles.saveBtn}>
              Submit
            </button>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => startReply(null)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className={styles.repliesSection}>
        {comment.has_replies && (
          <button
            onClick={() => {
              if (!isExpanded) fetchReplies(postId, comment.id);
              setExpanded((prev) => ({
                ...prev,
                [comment.id]: !prev[comment.id],
              }));
            }}
            className={styles.toggleRepliesBtn}
          >
            {isExpanded ? "Hide Replies" : "Show Replies"}
          </button>
        )}

        {isExpanded && children.length > 0 && (
          <ul className={styles.commentList}>
            {children.map((child) => (
              <CommentItem
                key={child.id}
                comment={child}
                depth={depth + 1}
                user={user}
                editingCommentId={editingCommentId}
                editContent={editContent}
                setEditContent={setEditContent}
                startEditingComment={startEditingComment}
                handleUpdateComment={handleUpdateComment}
                handleDeleteComment={handleDeleteComment}
                replyingTo={replyingTo}
                startReply={startReply}
                replyContent={replyContent}
                setReplyContent={setReplyContent}
                handleAddReply={handleAddReply}
                replies={replies}
                setReplies={setReplies}
                expanded={expanded}
                setExpanded={setExpanded}
                fetchReplies={fetchReplies}
                postId={postId}
              />
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

function PostPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState("");

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState({});

  const [replies, setReplies] = useState({});
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    async function fetchData() {
      try {
        const [postRes, commentsRes] = await Promise.all([
          fetch(`http://localhost:8000/posts/${id}`),
          fetch(`http://localhost:8000/comments/posts/${id}/comments`),
        ]);
        const postData = await postRes.json();
        const commentsData = await commentsRes.json();
        setPost(postData);
        setComments(Array.isArray(commentsData) ? commentsData : []);
      } catch (err) {
        console.error("Failed to fetch post or comments:", err);
      }
    }
    fetchData();
  }, [id]);

  const handleEdit = () => navigate(`/posts/${id}/edit`);

  const hierarchy = { user: 1, moderator: 2, admin: 3, owner: 4 };

  const canDelete =
    user &&
    post &&
    (user.id === post.owner_id ||
      hierarchy[user.role] > hierarchy[post.role]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    let reason = null;
    if (user.id !== post.owner_id) {
      reason = prompt("Enter a reason for deleting this post:");
      if (!reason) {
        alert("You must provide a reason when deleting another user’s post.");
        return;
      }
    }

    const token = localStorage.getItem("token");
    if (!token) return setError("You must be logged in to delete posts.");

    try {
      const res = await fetch(`http://localhost:8000/posts/${id}/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (res.ok) {
        alert("Post deleted successfully.");
        navigate("/home");
      } else {
        const data = await res.json();
        setError(data.detail || "Failed to delete post.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to delete post.");
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const token = localStorage.getItem("token");
    if (!token) return setError("You must be logged in to comment.");

    try {
      const res = await fetch(
        `http://localhost:8000/comments/posts/${id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: newComment }),
        }
      );

      if (res.ok) {
        const comment = await res.json();
        setComments((prev) => [...prev, comment]);
        setNewComment("");
        setError("");
      } else {
        const data = await res.json();
        setError(data.detail || "Failed to add comment.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to add comment.");
    }
  };

  const startEditingComment = (comment) => {
    setEditingCommentId(comment ? comment.id : null);
    setEditContent(comment ? comment.content : "");
  };

  const handleUpdateComment = async (e, commentId) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return setError("You must be logged in to edit comments.");

    try {
      const res = await fetch(`http://localhost:8000/comments/${commentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: editContent }),
      });

      if (res.ok) {
        const updated = await res.json();

        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? updated : c))
        );

        setReplies((prev) => {
          const newReplies = { ...prev };
          Object.keys(newReplies).forEach((parentId) => {
            newReplies[parentId] = newReplies[parentId].map((r) =>
              r.id === commentId ? updated : r
            );
          });
          return newReplies;
        });

        setEditingCommentId(null);
        setEditContent("");
      } else {
        const data = await res.json();
        setError(data.detail || "Failed to update comment.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to update comment.");
    }
  };

  const handleDeleteComment = async (commentId, parentId = null) => {
    const token = localStorage.getItem("token");
    if (!token) return setError("You must be logged in to delete comments.");
    if (!window.confirm("Are you sure you want to delete this comment?")) return;

    try {
      const res = await fetch(`http://localhost:8000/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        if (!parentId) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === commentId
                ? { ...c, content: "[deleted]", is_deleted: true }
                : c
            )
          );
        }

        setReplies((prev) => {
          const newReplies = { ...prev };
          Object.keys(newReplies).forEach((pid) => {
            newReplies[pid] = newReplies[pid].map((r) =>
              r.id === commentId
                ? { ...r, content: "[deleted]", is_deleted: true }
                : r
            );
          });
          return newReplies;
        });
      } else {
        const data = await res.json();
        setError(data.detail || "Failed to delete comment.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to delete comment.");
    }
  };

  const fetchReplies = async (postId, commentId) => {
    try {
      const res = await fetch(
        `http://localhost:8000/comments/posts/${postId}/comments/${commentId}/replies`
      );
      if (res.ok) {
        const data = await res.json();
        setReplies((prev) => ({ ...prev, [commentId]: data }));
        setExpanded((prev) => ({ ...prev, [commentId]: true }));
      }
    } catch (err) {
      console.error("Failed to fetch replies:", err);
    }
  };

  const startReply = (commentId) => {
    setReplyingTo(commentId);
    if (commentId !== null) {
      setReplyContent((prev) => ({
        ...prev,
        [commentId]: prev[commentId] || "",
      }));
    }
  };

  const handleAddReply = async (e, parentId) => {
    e.preventDefault();
    const content = replyContent[parentId]?.trim();
    if (!content) return;

    const token = localStorage.getItem("token");
    if (!token) return setError("You must be logged in to reply.");

    try {
      const res = await fetch(
        `http://localhost:8000/comments/posts/${post.id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content, parent_id: parentId }),
        }
      );

      if (res.ok) {
        const reply = await res.json();
        setReplies((prev) => ({
          ...prev,
          [parentId]: [...(prev[parentId] || []), reply],
        }));
        setReplyContent((prev) => ({ ...prev, [parentId]: "" }));
        setReplyingTo(null);
        setExpanded((prev) => ({ ...prev, [parentId]: true }));
        setError("");
      } else {
        const data = await res.json();
        setError(data.detail || "Failed to add reply.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to add reply.");
    }
  };

  if (!post) return <p className={styles.loading}>Loading post...</p>;

  return (
    <div className={styles.container}>
      <div className={styles.postBox}>
        <div className={styles.postHeader}>
          <h1 className={styles.postTitle}>{post.title}</h1>
          <div className={styles.postMeta}>
            <UserPopup
              currentUser={user}
              targetUser={{ id: post.owner_id, username: post.username, role: post.role }}
            />
            <span className={styles.postDate}>
              {new Date(post.created_at).toLocaleString()}
            </span>
          </div>
          {user && canDelete && (
            <div>
              {user.id === post.owner_id && (
                <button onClick={handleEdit} className={styles.editButton}>
                  Edit Post
                </button>
              )}
              <button onClick={handleDelete} className={styles.deleteButton}>
                Delete Post
              </button>
            </div>
          )}
        </div>
        <p className={styles.postContent}>{post.content}</p>
      </div>

      <div className={styles.commentsSection}>
        <h2>Comments ({comments.length})</h2>
        <ul className={styles.commentList}>
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              depth={0}
              user={user}
              editingCommentId={editingCommentId}
              editContent={editContent}
              setEditContent={setEditContent}
              startEditingComment={startEditingComment}
              handleUpdateComment={handleUpdateComment}
              handleDeleteComment={handleDeleteComment}
              replyingTo={replyingTo}
              startReply={startReply}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              handleAddReply={handleAddReply}
              replies={replies}
              setReplies={setReplies}
              expanded={expanded}
              setExpanded={setExpanded}
              fetchReplies={fetchReplies}
              postId={post.id}
            />
          ))}
        </ul>

        <form onSubmit={handleAddComment} className={styles.commentForm}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write your comment..."
            required
          />
          <button type="submit">Add Comment</button>
        </form>

        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
}

export default PostPage;