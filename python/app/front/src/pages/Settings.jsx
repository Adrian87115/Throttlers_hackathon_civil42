import { useState } from "react";
import styles from "./Settings.module.css";

function Settings() {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const token = localStorage.getItem("token");

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/users/me/change-password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || "Failed to update password");
      } else {
        alert(data.detail);
        setShowChangePassword(false);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account?")) return;

    try {
      const res = await fetch("http://localhost:8000/users/me", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || "Failed to delete account");
      } else {
        alert(data.detail);
        localStorage.removeItem("token");
        window.location.href = "/";
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Settings</h1>
      <button onClick={() => setShowChangePassword(true)} className={styles.button}>
        Change Password
      </button>
      <button onClick={handleDeleteAccount} className={styles.buttonDelete}>
        Delete Account
      </button>

      {showChangePassword && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Change Password</h2>
            <input
              type="password"
              placeholder="Old Password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <div className={styles.modalButtons}>
              <button onClick={handleChangePassword}>Save</button>
              <button onClick={() => setShowChangePassword(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;