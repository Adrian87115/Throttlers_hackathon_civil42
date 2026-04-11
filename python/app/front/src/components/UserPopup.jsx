import { useState, useRef, useEffect } from "react";
import styles from "./UserPopup.module.css";

const hierarchy = { user: 1, moderator: 2, admin: 3, owner: 4 };

function UserPopup({ currentUser, targetUser }) {
  const [open, setOpen] = useState(false);
  const popupRef = useRef(null);

  if (!targetUser) targetUser = { id: null, username: "Unknown", role: "user" };

  const canBan =
    currentUser &&
    targetUser &&
    hierarchy[currentUser.role] > hierarchy[targetUser.role] &&
    targetUser.role !== "owner";

  const handleBan = async () => {
    if (!window.confirm(`Ban user ${targetUser.username}?`)) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:8000/users/${targetUser.id}/ban`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        alert(`User ${targetUser.username} has been banned.`);
        setOpen(false);
      } else {
        const data = await res.json();
        alert(data.detail || "Failed to ban user.");
      }
    } catch (err) {
      console.error(err);
      alert("Error banning user.");
    }
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <span className={styles.userWrapper} ref={popupRef}>
      <span className={styles.username} onClick={() => setOpen((o) => !o)}>
        {targetUser.username || "Anonymous"}
      </span>
      {open && (
        <div className={styles.popup}>
          <p>{targetUser.username}</p>
          <p className={styles.role}>Role: {targetUser.role}</p>
          {canBan && (
            <button onClick={handleBan} className={styles.banBtn}>
              Ban User
            </button>
          )}
        </div>
      )}
    </span>
  );
}

export default UserPopup;