import { useState, useEffect, useRef } from "react";
import styles from "./SessionManager.module.css";

const SessionManager = ({ onLogout }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const intervalRef = useRef(null);

  const getToken = () => localStorage.getItem("token");
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
        onLogout();
      } else {
        setTimeLeft(diff);
      }
    }, 1000);
  };

  const extendSession = async () => {
    const token = getToken();
    if (!token) return onLogout();

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
        onLogout();
      }
    } catch {
      onLogout();
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) return onLogout();

    const storedExp = parseInt(localStorage.getItem("tokenExp"), 10);
    const tokenExp = getTokenExp(token);
    const exp = storedExp || tokenExp;

    if (!exp) return onLogout();

    localStorage.setItem("tokenExp", exp);
    setTimeLeft(exp - Math.floor(Date.now() / 1000));
    startTimer(exp);

    return () => clearInterval(intervalRef.current);
  }, []);

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  if (timeLeft <= 0 || timeLeft > 120) return null;

  return (
    <div className={styles.sessionManager}>
      <p>Session expires in {formatTime(timeLeft)}</p>
      <button onClick={extendSession}>Extend Session</button>
    </div>
  );
};

export default SessionManager;