import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-brand">
        <div className="logo">T</div>
        <span>Task<span style={{ color: "var(--accent-violet)" }}>M</span></span>
      </div>

      <div className="navbar-links">
        <NavLink to="/" className={({ isActive }) => isActive ? "active" : ""}>
          Dashboard
        </NavLink>
        <NavLink to="/projects" className={({ isActive }) => isActive ? "active" : ""}>
          Projects
        </NavLink>
      </div>

      <div className="navbar-user">
        <span className="navbar-name">{user?.name}</span>
        <div className="navbar-avatar">{initials}</div>
        <button className="btn btn-secondary btn-sm" onClick={handleLogout} id="logout-btn">
          Logout
        </button>
      </div>
    </nav>
  );
}
