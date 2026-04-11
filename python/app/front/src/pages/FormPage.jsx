import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./FormPage.module.css";

function FormPage({ 
  initialTitle = "", 
  initialContent = "", 
  method = "POST", 
  endpoint, 
  onSuccessRedirect, 
  headerText 
}) {
  const navigate = useNavigate();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in to submit a post.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to save post");
      }

      const savedPost = await res.json();
      setSuccess(`Post ${method === "POST" ? "created" : "updated"} successfully!`);

      if (onSuccessRedirect) {
        setTimeout(() => navigate(onSuccessRedirect(savedPost)), 1000);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2>{headerText}</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label>
          Title:
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
        <label>
          Content:
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading
            ? method === "POST"
              ? "Creating..."
              : "Updating..."
            : method === "POST"
            ? "Create Post"
            : "Update Post"}
        </button>
      </form>
      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}
    </div>
  );
}

export default FormPage;