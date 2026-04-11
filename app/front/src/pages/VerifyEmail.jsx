import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import styles from "./VerifyEmail.module.css";

function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verify = async () => {
      try {
        const response = await fetch(`http://localhost:8000/auth/verify/${token}`);
        let data = {};
        try {
          data = await response.json();
        } catch {
          data.detail = response.statusText || "Unknown error";
        }

        if (!response.ok) {
          setStatus("error");
          setMessage(data.detail || "Verification failed");
          return;
        }

        setStatus("success");
        setMessage(data.detail || "Email verified successfully!");
      } catch (err) {
        setStatus("error");
        setMessage("Server error during verification");
      }
    };
    verify();
  }, [token]);

  return (
    <div className={styles.container}>
      {status === "loading" && <p className={styles.text}>Verifying your email...</p>}

      {status === "success" && (
        <div className={styles.success}>
          <h1 className={styles.title}>Email Verified!</h1>
          <p className={styles.text}>{message}</p>
          <Link to="/auth" className={styles.link}>Go to Login</Link>
        </div>
      )}

      {status === "error" && (
        <div className={styles.error}>
          <h1 className={styles.title}>Verification Failed</h1>
          <p className={styles.text}>{message}</p>
          <Link to="/auth" className={styles.link}>Go back to Login</Link>
        </div>
      )}
    </div>
  );
}

export default VerifyEmail;