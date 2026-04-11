import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "./Auth.module.css";

function Auth({ setUser }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const body = new URLSearchParams();
      body.append("username", formData.username);
      body.append("password", formData.password);

      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      if (!response.ok) {
        const error = await response.json();
        setMessage(error.detail || "Login failed");
        return;
      }

      const data = await response.json();
      localStorage.setItem("token", data.access_token);

      const userRes = await fetch("http://localhost:8000/users/me", {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });

      if (!userRes.ok) {
        setMessage("Failed to fetch user info");
        return;
      }

      const userData = await userRes.json();
      setUser({ ...userData, isAuthenticated: true });

      setMessage("Login successful!");
      navigate("/home");
    } catch (err) {
      setMessage("Server error during login");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    const { username, email, password, confirmPassword } = formData;

    if (!username || !email || !password || !confirmPassword) {
      setMessage("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setMessage(
        "Password must be at least 8 characters, include uppercase, lowercase, number, and special character"
      );
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        setMessage(error.detail || "Registration failed");
        return;
      }

      await response.json();
      setMessage("Registration successful! You can now login.");
      setIsRegistering(false);
      setFormData({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      setMessage("Server error during registration");
    }
  };

  const handleRegisterClick = () => {
    setFormData({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setMessage("");
    setIsRegistering(true);
  };

  const handleBackToLogin = () => {
    setFormData({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setMessage("");
    setIsRegistering(false);
  };

  return (
    <div className={styles.container}>
      {isRegistering ? (
        <div>
          <h1 className={styles.heading}>Register</h1>
          <form className={styles.form} onSubmit={handleRegister}>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Username"
              className={styles.input}
            />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              className={styles.input}
            />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              className={styles.input}
            />
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm Password"
              className={styles.input}
            />
            <button type="submit" className={styles.primaryBtn}>
              Register
            </button>
            <div className={styles.bottomButtons}>
              <button
                type="button"
                onClick={handleBackToLogin}
                className={styles.secondaryBtn}
              >
                Back to Login
              </button>
            </div>
          </form>
          {message && <p className={styles.message}>{message}</p>}
        </div>
      ) : (
        <div>
          <h1 className={styles.heading}>Login</h1>
          <form className={styles.form} onSubmit={handleLogin}>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Username"
              className={styles.input}
            />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              className={styles.input}
            />
            <button type="submit" className={styles.primaryBtn}>
              Login
            </button>
            <div className={styles.bottomButtons}>
              <button
                type="button"
                onClick={handleRegisterClick}
                className={styles.secondaryBtn}
              >
                Register
              </button>
              <Link to="/reset-password" className={styles.linkBtn}>
                Reset password
              </Link>
            </div>
          </form>
          {message && <p className={styles.message}>{message}</p>}
        </div>
      )}
    </div>
  );
}

export default Auth;