import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import { useLocation } from "react-router-dom";
import api from "../api";

function SymptomCheckerPage() {
  const location = useLocation();
  const mode = new URLSearchParams(location.search).get("mode") === "general" ? "general" : "respiratory";
  const [symptoms, setSymptoms] = useState([]);
  const [selected, setSelected] = useState([]);
  const [query, setQuery] = useState("");
  const [context, setContext] = useState({
    age: "",
    durationDays: "",
    painLevel: "3",
    hasChronicDisease: false,
    pregnant: false,
    recentTravel: false,
    knownExposure: false,
    notes: "",
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSymptoms() {
      try {
        const { data } = await api.get(`/symptoms?mode=${mode}`);
        setSymptoms(data);
        setSelected([]);
      } catch {
        setError("Failed to load symptoms.");
      }
    }
    loadSymptoms();
  }, [mode]);

  function toggleSymptom(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handlePredict() {
    setError("");
    setResult(null);
    try {
      const payload = {
        symptomIds: selected,
        mode,
        context: {
          age: context.age ? Number(context.age) : undefined,
          durationDays: context.durationDays ? Number(context.durationDays) : undefined,
          painLevel: context.painLevel ? Number(context.painLevel) : undefined,
          hasChronicDisease: context.hasChronicDisease,
          pregnant: context.pregnant,
          recentTravel: context.recentTravel,
          knownExposure: context.knownExposure,
          notes: context.notes || undefined,
        },
      };
      const { data } = await api.post("/predict", payload);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || "Prediction failed.");
    }
  }

  function downloadPdfReport() {
    if (!result) return;

    const doc = new jsPDF();
    let y = 15;
    const lineGap = 7;
    const pageHeight = doc.internal.pageSize.height;

    const addWrappedText = (text, indent = 10) => {
      const lines = doc.splitTextToSize(text, 185 - indent);
      lines.forEach((line) => {
        if (y > pageHeight - 12) {
          doc.addPage();
          y = 15;
        }
        doc.text(line, indent, y);
        y += lineGap;
      });
    };

    doc.setFontSize(16);
    doc.text(`DiagnoAI ${mode === "general" ? "General" : "Respiratory"} Analysis Report`, 10, y);
    y += 10;
    doc.setFontSize(11);
    addWrappedText(`Generated At: ${new Date(result.generatedAt || Date.now()).toLocaleString()}`);
    addWrappedText(`Selected Symptoms: ${(result.selectedSymptoms || []).join(", ") || "None"}`);
    addWrappedText(`Situation Risk Level: ${result.situationAnalysis?.riskLevel || "Baseline"}`);
    addWrappedText(`Situation Summary: ${result.situationAnalysis?.summary || "Not available"}`);
    addWrappedText(`Situation Advice: ${result.situationAnalysis?.advice || "Not available"}`);
    if (result.situationAnalysis?.keyFlags?.length) {
      addWrappedText(`Situation Flags: ${result.situationAnalysis.keyFlags.join(", ")}`);
    }
    if (mode === "respiratory" && result.respiratoryRedFlags?.length) {
      addWrappedText(`Respiratory Red Flags: ${result.respiratoryRedFlags.join(" | ")}`);
    }
    y += 3;
    addWrappedText(`Overall Note: ${result.message}`);
    y += 4;

    (result.predictions || []).forEach((prediction, index) => {
      doc.setFontSize(12);
      addWrappedText(`${index + 1}. ${prediction.diseaseName}`);
      doc.setFontSize(11);
      addWrappedText(`Confidence: ${prediction.confidence}% (${prediction.confidenceBand})`, 14);
      addWrappedText(`Severity: ${prediction.severity}`, 14);
      addWrappedText(`Recommended Specialist: ${prediction.specialist}`, 14);
      addWrappedText(`Urgency: ${prediction.urgency}`, 14);
      addWrappedText(`Situation Adjustment: ${prediction.situationAdjustment}`, 14);
      addWrappedText(`Matched Symptoms: ${(prediction.matchedSymptoms || []).join(", ") || "None"}`, 14);
      addWrappedText(
        `Missing Key Symptoms: ${(prediction.missingKeySymptoms || []).join(", ") || "None"}`,
        14
      );
      addWrappedText(`Rationale: ${prediction.rationale}`, 14);
      y += 2;
    });

    if (!(result.predictions || []).length) {
      addWrappedText("No strong disease match crossed threshold in this session.");
    }

    y += 3;
    addWrappedText(
      "Disclaimer: This report is for educational/preliminary support only and is not a final medical diagnosis."
    );
    doc.save(`DiagnoAI-${mode}-Report-${Date.now()}.pdf`);
  }

  const filteredSymptoms = symptoms.filter((item) =>
    item.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <section className="container card">
      <h2>{mode === "general" ? "General Symptom Checker" : "Respiratory Symptom Checker"}</h2>
      <p className="muted">
        {mode === "general"
          ? "Select symptoms for broad multi-domain triage analysis."
          : "Select respiratory symptoms and generate a focused triage analysis."}
      </p>
      {error && <p className="error">{error}</p>}
      <div className="tools-row">
        <input
          type="text"
          placeholder="Search symptoms..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="button" className="btn btn-outline" onClick={() => setSelected(symptoms.map((s) => s.id))}>
          Select All
        </button>
        <button type="button" className="btn btn-outline" onClick={() => setSelected([])}>
          Clear
        </button>
      </div>
      <div className="symptom-grid">
        {filteredSymptoms.map((item) => (
          <label key={item.id} className="checkbox-card">
            <input
              type="checkbox"
              checked={selected.includes(item.id)}
              onChange={() => toggleSymptom(item.id)}
            />
            <span>{item.name}</span>
          </label>
        ))}
      </div>
      <div className="context-box">
        <h3>Situation-Based Inputs</h3>
        <p className="muted">
          Add context so the analysis can estimate practical risk and urgency more accurately.
        </p>
        <div className="grid-two">
          <div>
            <label>Age</label>
            <input
              type="number"
              min="0"
              max="120"
              value={context.age}
              onChange={(e) => setContext((prev) => ({ ...prev, age: e.target.value }))}
            />
          </div>
          <div>
            <label>Symptom duration (days)</label>
            <input
              type="number"
              min="0"
              max="60"
              value={context.durationDays}
              onChange={(e) => setContext((prev) => ({ ...prev, durationDays: e.target.value }))}
            />
          </div>
          <div>
            <label>Pain/discomfort score (0-10)</label>
            <input
              type="number"
              min="0"
              max="10"
              value={context.painLevel}
              onChange={(e) => setContext((prev) => ({ ...prev, painLevel: e.target.value }))}
            />
          </div>
          <div>
            <label>Additional notes</label>
            <input
              type="text"
              maxLength={250}
              value={context.notes}
              onChange={(e) => setContext((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </div>
        </div>
        <div className="tools-row checks-row">
          <label className="checkbox-card">
            <input
              type="checkbox"
              checked={context.hasChronicDisease}
              onChange={(e) =>
                setContext((prev) => ({ ...prev, hasChronicDisease: e.target.checked }))
              }
            />
            <span>Chronic disease history</span>
          </label>
          <label className="checkbox-card">
            <input
              type="checkbox"
              checked={context.pregnant}
              onChange={(e) => setContext((prev) => ({ ...prev, pregnant: e.target.checked }))}
            />
            <span>Pregnant</span>
          </label>
          <label className="checkbox-card">
            <input
              type="checkbox"
              checked={context.recentTravel}
              onChange={(e) =>
                setContext((prev) => ({ ...prev, recentTravel: e.target.checked }))
              }
            />
            <span>Recent travel</span>
          </label>
          <label className="checkbox-card">
            <input
              type="checkbox"
              checked={context.knownExposure}
              onChange={(e) =>
                setContext((prev) => ({ ...prev, knownExposure: e.target.checked }))
              }
            />
            <span>Known exposure to infected person</span>
          </label>
        </div>
      </div>
      <button type="button" className="btn" onClick={handlePredict}>
        Predict Disease
      </button>
      {result && (
        <button type="button" className="btn btn-outline report-btn" onClick={downloadPdfReport}>
          Download Analysis Report (PDF)
        </button>
      )}

      {result && (
        <div className="result-box">
          <h3>{mode === "general" ? "General Analysis Result" : "Respiratory Analysis Result"}</h3>
          <p className="muted">{result.message}</p>
          {mode === "respiratory" && !!result.respiratoryRedFlags?.length && (
            <div className="notice">
              <strong>Respiratory Red Flags:</strong> {result.respiratoryRedFlags.join(" ")}
            </div>
          )}
          <div className="mini-card">
            <h4>Situation-Based Analysis</h4>
            <p>Risk Level: {result.situationAnalysis?.riskLevel || "Baseline"}</p>
            <p>{result.situationAnalysis?.summary}</p>
            <p>{result.situationAnalysis?.advice}</p>
            {!!result.situationAnalysis?.keyFlags?.length && (
              <p className="muted">Flags: {result.situationAnalysis.keyFlags.join(", ")}</p>
            )}
          </div>
          {!result.predictions?.length && (
            <p className="notice">No disease crossed confidence threshold.</p>
          )}
          {result.predictions?.map((prediction) => (
            <div className="prediction-item" key={prediction.diseaseId}>
              <h4>{prediction.diseaseName}</h4>
              <p>
                Confidence: {prediction.confidence}% ({prediction.confidenceBand})
              </p>
              <p>Specialist: {prediction.specialist}</p>
              <p>Severity: {prediction.severity}</p>
              <p>Urgency: {prediction.urgency}</p>
              <p>{prediction.situationAdjustment}</p>
              <p className="muted">
                Matched symptoms: {prediction.matchedSymptoms?.join(", ") || "None"}
              </p>
              <p className="muted">
                Missing key symptoms: {prediction.missingKeySymptoms?.join(", ") || "None"}
              </p>
              <p>{prediction.rationale}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default SymptomCheckerPage;
