import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";

import Index from "./pages/Index";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Posts from "./pages/Posts";
import MyPosts from "./pages/MyPosts";
import PostPage from "./pages/PostPage";
import AddPost from "./pages/AddPost";
import VerifyEmail from "./pages/VerifyEmail";
import ResetPasswordRequest from "./pages/ResetPasswordRequest";
import ResetPassword from "./pages/ResetPassword";
import Settings from "./pages/Settings";
import SettingsAdvanced from "./pages/SettingsAdvanced";
import UpdatePage from "./pages/UpdatePage";
import Header from "./components/Header";
import HeaderLogged from "./components/HeaderLogged";
import ProtectedRoute from "./components/ProtectedRoute";
import SessionManager from "./components/SessionManager";
import "./App.css";

function PublicLayout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
    </>
  );
}

function PrivateLayout({ user, onLogout }) {
  return (
    <>
      <HeaderLogged user={user} onLogout={onLogout} />
      <main>
        <Outlet />
      </main>
    </>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    window.location.href = "/auth";
  };

  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem("token");
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("http://localhost:8000/users/me", {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        if (!res.ok) {
          setUser(null);
          setToken(null);
        } else {
          const data = await res.json();
          setUser({ ...data, isAuthenticated: true });
        }
      } catch (err) {
        console.error(err);
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <Router>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth setUser={setUser} />} />
          <Route path="/verify/:token" element={<VerifyEmail />} />
          <Route path="/reset-password" element={<ResetPasswordRequest />} />
          <Route path="/auth/reset-password/:token" element={<ResetPassword />} />
        </Route>

        <Route element={<ProtectedRoute user={user} />}>
          <Route element={<PrivateLayout user={user} onLogout={handleLogout} />}>
            <Route path="/home" element={<Home />} />
            <Route path="/posts" element={<Posts />} />
            <Route path="/my-posts" element={<MyPosts />} />
            <Route path="/posts/:id" element={<PostPage user={user} />} />
            <Route path="/add-post" element={<AddPost />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/posts/:id/edit" element={<UpdatePage />} />
          </Route>
        </Route>

        <Route
          element={
            <ProtectedRoute
              user={user}
              checkRole={(u) => u.isAdmin || u.isModerator || u.isOwner}
            />
          }
        >
          <Route element={<PrivateLayout user={user} onLogout={handleLogout} />}>
            <Route path="/advanced-settings" element={<SettingsAdvanced />} />
          </Route>
        </Route>
      </Routes>

      {user && token && <SessionManager token={token} onLogout={handleLogout} />}
    </Router>
  );
}

export default App;