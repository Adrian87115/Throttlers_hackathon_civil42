import styles from "./Index.module.css";
import { Link } from "react-router-dom";

function Index() {
  return (
    <div className={styles.container}>
      <h1>Welcome to BlogAPI</h1>
      <Link className={styles.button} to="/auth">
        Login
      </Link>
    </div>
  );
}

export default Index;