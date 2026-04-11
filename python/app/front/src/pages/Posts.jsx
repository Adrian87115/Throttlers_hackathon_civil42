import styles from "../components/PostsList.module.css";
import PostsList from "../components/PostsList";

async function fetchAllPosts() {
  const res = await fetch("http://localhost:8000/posts");
  return await res.json();
}

function Posts() {
  return (
    <PostsList
      fetchPosts={fetchAllPosts}
      className={styles.container}
      styles={styles}
    />
  );
}

export default Posts;