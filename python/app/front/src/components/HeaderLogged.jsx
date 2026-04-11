import { Link } from "react-router-dom";
import styles from "./HeaderLogged.module.css";

function HeaderLogged({ user, onLogout }) {
  if (!user) return null;

  const showAdvanced = user.isAdmin || user.isModerator || user.isOwner;

  return (
    <header className={styles.header}>
      <h2 className={styles.title}>BlogAPI</h2>
      <nav className={styles.nav}>
        <Link to="/home" className={styles.link}>Home</Link>
        <Link to="/posts" className={styles.link}>Posts</Link>
        <Link to="/my-posts" className={styles.link}>My Posts</Link>
        <Link to="/add-post" className={styles.link}>Add Post</Link>
        <Link to="/settings" className={styles.link}>Settings</Link>
        {showAdvanced && (
          <Link to="/advanced-settings" className={styles.link}>
            Advanced Settings
          </Link>
        )}
        <button onClick={onLogout} className={styles.logoutBtn}>
          Log Out
        </button>
      </nav>
    </header>
  );
}

export default HeaderLogged;