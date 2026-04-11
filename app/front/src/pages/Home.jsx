import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import styles from "./Home.module.css";
import authStyles from "./Auth.module.css";

function Home() {
  const [lastPost, setLastPost] = useState(null);
  const [recommendedPost, setRecommendedPost] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const intervalRef = useRef(null);

  const getTokenExp = (token) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp;
    } catch {
      return null;
    }
  };

  const startTimer = (exp) => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const diff = exp - now;
      if (diff <= 0) {
        clearInterval(intervalRef.current);
        localStorage.removeItem("token");
        localStorage.removeItem("tokenExp");
        window.location.href = "/auth";
      } else {
        setTimeLeft(diff);
      }
    }, 1000);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    let exp = parseInt(localStorage.getItem("tokenExp"), 10) || getTokenExp(token);
    if (!exp) return;

    localStorage.setItem("tokenExp", exp);
    startTimer(exp);

    return () => clearInterval(intervalRef.current);
  }, []);

  const extendSession = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:8000/auth/extend-session", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", data.access_token);

        const exp = getTokenExp(data.access_token);
        if (exp) {
          localStorage.setItem("tokenExp", exp);
          setTimeLeft(exp - Math.floor(Date.now() / 1000));
          startTimer(exp);
        }
      } else {
        console.error("Failed to extend session");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    async function fetchLastPost() {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch("http://localhost:8000/posts/my/last", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setLastPost(await res.json());
        else setLastPost(null);
      } catch (err) {
        console.error(err);
      }
    }

    async function fetchRecommendedPost() {
      try {
        const res = await fetch("http://localhost:8000/posts/random");
        if (res.ok) setRecommendedPost(await res.json());
      } catch (err) {
        console.error(err);
      }
    }

    fetchLastPost();
    fetchRecommendedPost();
  }, []);

  return (
    <div className={styles.homeContainer}>
      <div className={styles.panel}>
        <h2>Your Last Post</h2>
        {lastPost ? (
          <div className={styles.postPreview}>
            <Link to={`/posts/${lastPost.id}`} className={styles.postLink}>
              <h3>{lastPost.title}</h3>
              <p>{lastPost.content}</p>
            </Link>
          </div>
        ) : (
          <>
            <p>No Posts</p>
            <button
              className={authStyles.primaryBtn}
              onClick={() => (window.location.href = "/add-post")}
            >
              Create Post
            </button>
          </>
        )}
      </div>

      <div className={styles.panel}>
        <h2>Recommended</h2>
        {recommendedPost ? (
          <div className={styles.postPreview}>
            <Link
              to={`/posts/${recommendedPost.id}`}
              className={styles.postLink}
            >
              <h3>{recommendedPost.title}</h3>
              <p>{recommendedPost.content}</p>
            </Link>
          </div>
        ) : (
          <p>No Recommendations</p>
        )}
      </div>

      <div className={styles.panel}>
        <h2>Session</h2>
        <p>Auto logout in: {formatTime(timeLeft)}</p>
        <button className={authStyles.primaryBtn} onClick={extendSession}>
          Extend Session
        </button>
        <Calendar className={styles.calendar} value={new Date()} />
      </div>
    </div>
  );
}

export default Home;