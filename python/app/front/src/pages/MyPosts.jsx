import styles from "../components/PostsList.module.css";
import PostsList from "../components/PostsList";

async function fetchMyPosts() {
  const res = await fetch("http://localhost:8000/posts/my", {
    headers: {
      "Authorization": "Bearer " + localStorage.getItem("token"),
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch posts: ${res.status}`);
  }

  return await res.json();
}

function MyPosts() {
  return (
    <PostsList
      fetchPosts={fetchMyPosts}
      className={styles.container}
      styles={styles}
    />
  );
}

export default MyPosts;