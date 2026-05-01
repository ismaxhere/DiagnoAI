import { useEffect, useState } from "react";
import api from "../api";

function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadHistory() {
      try {
        const { data } = await api.get("/history");
        setHistory(data);
      } catch {
        setError("Failed to load history.");
      }
    }
    loadHistory();
  }, []);

  return (
    <section className="container card">
      <h2>Patient History</h2>
      {error && <p className="error">{error}</p>}
      {!history.length && <p className="muted">No prediction records yet.</p>}
      <div className="stack">
        {history.map((entry) => (
          <article className="mini-card" key={entry.id}>
            <h3>{entry.topDiseaseName}</h3>
            <p>Confidence: {entry.confidence}%</p>
            <p>Date: {new Date(entry.createdAt).toLocaleString()}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default HistoryPage;
