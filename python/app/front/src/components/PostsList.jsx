import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function truncateText(text, maxLength) {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength) + "…" : text;
}

function PostsList({ fetchPosts, className, styles }) {
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 5;
  const navigate = useNavigate();

  useEffect(() => {
    async function loadPosts() {
      try {
        const data = await fetchPosts();
        setPosts(data);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    }
    loadPosts();
  }, [fetchPosts]);

  const totalPages = Math.ceil(posts.length / postsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);

  return (
    <div className={styles.container}>
      {currentPosts.length === 0 ? (
        <p className={styles.empty}>No posts found</p>
      ) : (
        currentPosts.map((post) => (
          <div
            key={post.id}
            className={styles.postCard}
            onClick={() => navigate(`/posts/${post.id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && navigate(`/posts/${post.id}`)}
          >
            <h3 className={styles.postTitle}>
              {truncateText(post.title, 30)}
            </h3>
            <p className={styles.postContent}>
              {truncateText(post.content, 60)}
            </p>
          </div>
        ))
      )}

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>

          <span>
            Page{" "}
            <input
              type="number"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={(e) => handlePageChange(Number(e.target.value))}
              className={styles.pageInput}
            />{" "}
            of {totalPages}
          </span>

          <button
            className={styles.pageBtn}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default PostsList;