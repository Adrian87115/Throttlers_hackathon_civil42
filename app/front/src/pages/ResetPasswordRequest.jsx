import React, { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./Auth.module.css";

function ResetPasswordRequest() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleRequest = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:8000/auth/reset-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        setMessage(data.detail || "Failed to request password reset");
        return;
      }

      setMessage("Password reset link sent! Check your email.");
      setEmail("");
    } catch (err) {
      setMessage("Server error while requesting password reset");
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Reset Password</h1>
      <form className={styles.form} onSubmit={handleRequest}>
        <input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={styles.input}
        />
        <button type="submit" className={styles.primaryBtn}>
          Send Reset Link
        </button>
      </form>
      {message && <p className={styles.message}>{message}</p>}
      <div className={styles.bottomButtons} style={{ marginTop: "10px" }}>
        <Link to="/auth" className={styles.linkBtn}>
          Back to Login
        </Link>
      </div>
    </div>
  );
}

export default ResetPasswordRequest;