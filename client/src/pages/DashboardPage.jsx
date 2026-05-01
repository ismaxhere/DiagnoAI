import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function DashboardPage() {
  const { user } = useAuth();

  return (
    <section className="container card">
      <h2>Welcome, {user?.name}</h2>
      <p className="muted">Role: {user?.role}</p>
      <div className="grid-three">
        <article className="mini-card">
          <h3>Symptom Checker</h3>
          <p>Submit symptoms and get top probable diseases with confidence.</p>
          <Link className="btn btn-small" to="/symptom-checker">
            Start Check
          </Link>
        </article>
        <article className="mini-card">
          <h3>Patient History</h3>
          <p>View previous prediction records and match trends.</p>
          <Link className="btn btn-small" to="/history">
            View History
          </Link>
        </article>
        <article className="mini-card">
          <h3>Admin Panel</h3>
          <p>Manage and review platform master data and statistics.</p>
          <Link className="btn btn-small" to="/admin">
            Open Admin
          </Link>
        </article>
      </div>
    </section>
  );
}

export default DashboardPage;
