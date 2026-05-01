import { useEffect, useState } from "react";
import api from "../api";

function AdminPage() {
  const [overview, setOverview] = useState(null);
  const [masterData, setMasterData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAdminData() {
      try {
        const [overviewRes, masterRes] = await Promise.all([
          api.get("/admin/overview"),
          api.get("/admin/master-data"),
        ]);
        setOverview(overviewRes.data);
        setMasterData(masterRes.data);
      } catch (err) {
        setError(err.response?.data?.message || "Admin access failed.");
      }
    }
    loadAdminData();
  }, []);

  return (
    <section className="container card">
      <h2>Admin Panel</h2>
      {error && <p className="error">{error}</p>}
      {overview && (
        <div className="grid-four">
          <article className="mini-card">
            <h3>{overview.totalUsers}</h3>
            <p>Total Users</p>
          </article>
          <article className="mini-card">
            <h3>{overview.totalPredictions}</h3>
            <p>Total Predictions</p>
          </article>
          <article className="mini-card">
            <h3>{overview.totalDiseases}</h3>
            <p>Total Diseases</p>
          </article>
          <article className="mini-card">
            <h3>{overview.totalSymptoms}</h3>
            <p>Total Symptoms</p>
          </article>
        </div>
      )}

      {masterData && (
        <>
          <h3>Disease Catalog</h3>
          <div className="stack">
            {masterData.diseases.map((disease) => (
              <article className="mini-card" key={disease.id}>
                <h4>{disease.name}</h4>
                <p>Specialist: {disease.specialist}</p>
                <p>Severity: {disease.severity}</p>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default AdminPage;
