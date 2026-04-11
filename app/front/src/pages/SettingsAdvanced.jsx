import { useEffect, useState } from "react";
import styles from "./SettingsAdvanced.module.css";

function SettingsAdvanced() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("all");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [promoteTarget, setPromoteTarget] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const USERS_PER_PAGE = 5;

  const roles = ["all", "user", "moderator", "admin", "owner"];
  const roleHierarchy = ["user", "moderator", "admin", "owner"];

  useEffect(() => {
    const token = localStorage.getItem("token");
    async function fetchCurrentUser() {
      try {
        const res = await fetch("http://localhost:8000/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch current user");
        const data = await res.json();
        setCurrentUser(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchCurrentUser();
  }, []);

  const availableRoles = currentUser
    ? ["all", ...roleHierarchy.filter(
        r => roleHierarchy.indexOf(r) < roleHierarchy.indexOf(currentUser.role)
      )]
    : [];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:8000/users/user-management?show_role=${selectedRole}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      data.sort((a, b) => a.id - b.id);
      setUsers(data);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchUsers();
  }, [selectedRole, currentUser]);

  const handleRoleChange = (e) => setSelectedRole(e.target.value);

  const handleBanToggle = async (userId, isActive) => {
    const token = localStorage.getItem("token");
    const endpoint = isActive ? "ban" : "unban";

    try {
      const res = await fetch(
        `http://localhost:8000/users/${userId}/${endpoint}`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to update user status");
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_active: !isActive } : u
        )
      );
    } catch (err) {
      console.error("Ban/Unban error:", err);
      alert(err.message);
    }
  };

  const openPromotePopup = (user) => {
    setPromoteTarget(user);
    setNewRole("");
  };

  const confirmPromote = async () => {
    if (!promoteTarget || !newRole) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `http://localhost:8000/users/${promoteTarget.id}/role`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: newRole }),
        }
      );
      if (!res.ok) throw new Error("Failed to change role");
      await fetchUsers();
      setPromoteTarget(null);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:8000/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to delete user");
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_deleted: true, is_active: false } : u
        )
      );
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.message);
    }
  };

  if (!currentUser) return <p>Loading current user...</p>;

  const assignableRoles = currentUser
    ? roleHierarchy.filter(
        (r) => roleHierarchy.indexOf(r) < roleHierarchy.indexOf(currentUser.role)
      )
    : [];

  const totalPages = Math.ceil(users.length / USERS_PER_PAGE);
  const paginatedUsers = users.slice(
    (currentPage - 1) * USERS_PER_PAGE,
    currentPage * USERS_PER_PAGE
  );

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Advanced User Settings</h1>

      <div className={styles.roleSelector}>
        <label>Select Role: </label>
        <select value={selectedRole} onChange={handleRoleChange}>
          {availableRoles.map((role) => (
            <option key={role} value={role}>
              {role === "all" ? "All" : role.charAt(0).toUpperCase() + role.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading users...</p>
      ) : (
        <>
          <table className={styles.userTable}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Status</th>
                <th>Role</th>
                <th>Is verified</th>
                <th>Is deleted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{user.is_active ? "Active" : "Banned"}</td>
                    <td>{user.role}</td>
                    <td>{user.is_verified ? "Yes" : "No"}</td>
                    <td>{user.is_deleted ? "Yes" : "No"}</td>
                    <td className={styles.actions}>
                      <div className={styles.grouped}>
                        <button
                          onClick={() => handleBanToggle(user.id, user.is_active)}
                          disabled={user.is_deleted}
                          className={styles.banBtn}
                        >
                          {user.is_active ? "Ban" : "Unban"}
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={user.is_deleted}
                          className={styles.deleteBtn}
                        >
                          Delete
                        </button>
                      </div>
                      <button
                        onClick={() => openPromotePopup(user)}
                        disabled={user.is_deleted}
                        className={styles.roleBtn} 
                      >
                        Change Role
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center" }}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {users.length > USERS_PER_PAGE && (
            <div className={styles.pagination}>
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>

              <span>
                Page{" "}
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = Math.max(1, Math.min(totalPages, Number(e.target.value)));
                    setCurrentPage(page);
                  }}
                  className={styles.pageInput}
                />{" "}
                of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {promoteTarget && (
        <div className={styles.popupOverlay}>
          <div className={styles.popup}>
            <h2>Change Role for {promoteTarget.username}</h2>
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
              <option value="">-- Select Role --</option>
              {assignableRoles.map((role) => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
            <div className={styles.popupActions}>
              <button onClick={confirmPromote}>Confirm</button>
              <button onClick={() => setPromoteTarget(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsAdvanced;