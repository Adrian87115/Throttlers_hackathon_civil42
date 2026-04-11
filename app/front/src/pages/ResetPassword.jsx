import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import styles from "./Auth.module.css";

function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();

    if (password !== confirm) {
      setMessage("Passwords do not match");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/auth/reset-password/${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ new_password: password }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        setMessage(data.detail || "Failed to reset password");
        return;
      }

      setMessage("Password reset successfully! You can now login.");
      setPassword("");
      setConfirm("");
    } catch (err) {
      setMessage("Server error while resetting password");
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Set New Password</h1>
      <form className={styles.form} onSubmit={handleReset}>
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={styles.input}
        />
        <input
          type="password"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          className={styles.input}
        />
        <button type="submit" className={styles.primaryBtn}>
          Reset Password
        </button>
      </form>
      <div className={styles.bottomButtons} style={{ marginTop: "10px" }}>
        <Link to="/auth" className={styles.linkBtn}>
          Back to Login
        </Link>
      </div>
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
}

export default ResetPassword;