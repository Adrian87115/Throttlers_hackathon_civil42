import { Link } from "react-router-dom";
import styles from "./Header.module.css";

function Header() {
  return (
    <header className={styles.header}>
      <h2 className={styles.title}>BlogAPI</h2>
      <nav className={styles.nav}>
        <Link to="/" className={styles.link}>Start</Link>
        <Link to="/auth" className={styles.link}>Login</Link>
      </nav>
    </header>
  );
}

export default Header;