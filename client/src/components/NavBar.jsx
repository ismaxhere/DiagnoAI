import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="logo">
          DiagnoAI
        </Link>
        <nav className="nav-links">
          <Link to="/symptom-checker">Symptom Checker</Link>
          {!user && <Link to="/login">Login</Link>}
          {!user && <Link to="/signup">Signup</Link>}
          {user && <Link to="/dashboard">Dashboard</Link>}
          {user && <Link to="/history">History</Link>}
          {user?.role === "ADMIN" && <Link to="/admin">Admin</Link>}
          {user && (
            <button type="button" className="link-button" onClick={handleLogout}>
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

export default NavBar;
