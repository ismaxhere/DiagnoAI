import { Link } from "react-router-dom";

function LandingPage() {
  return (
    <section className="container card">
      <h1>Respiratory Disease Risk Triage</h1>
      <p className="muted">
        DiagnoAI is a BCA major project focused on respiratory medicine for preliminary symptom-based
        triage and risk analysis.
      </p>
      <div className="grid-two">
        <div>
          <h3>What it solves</h3>
          <p>
            Users can quickly understand likely respiratory conditions from symptom combinations and
            decide when to consult a pulmonologist or physician.
          </p>
        </div>
        <div>
          <h3>Who can use it</h3>
          <p>Patients for self-assessment and admins for monitoring records and master data.</p>
        </div>
      </div>
      <div className="actions">
        <Link className="btn" to="/symptom-checker?mode=respiratory">
          Respiratory Checker
        </Link>
        <Link className="btn btn-outline" to="/symptom-checker?mode=general">
          General Checker
        </Link>
        <Link className="btn" to="/signup">
          Get Started
        </Link>
        <Link className="btn btn-outline" to="/login">
          Login
        </Link>
      </div>
      <p className="notice">
        Disclaimer: This tool is for educational and preliminary guidance only. It does not replace
        medical diagnosis.
      </p>
    </section>
  );
}

export default LandingPage;
