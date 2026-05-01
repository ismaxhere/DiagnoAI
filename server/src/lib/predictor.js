function getConfidenceBand(confidence) {
  if (confidence >= 70) return "High Match";
  if (confidence >= 50) return "Moderate Match";
  return "Low Match";
}

function getUrgency(severity, confidence) {
  if (severity === "High" && confidence >= 60) return "Consult doctor within 24 hours";
  if (severity === "High") return "Monitor closely and seek medical advice soon";
  if (severity === "Medium" && confidence >= 60) return "Book consultation in 1-2 days";
  return "Home care may help, consult doctor if symptoms persist";
}

function getSituationAdjustment(context, severity) {
  if (!context) return "No additional situational modifiers provided.";

  const flags = [];
  if (context.age >= 60) flags.push("age above 60 raises complication risk");
  if (context.age > 0 && context.age <= 5) flags.push("very young age needs closer monitoring");
  if (context.durationDays >= 5) flags.push("long symptom duration suggests medical review");
  if (context.painLevel >= 8) flags.push("high pain score indicates urgent evaluation");
  if (context.hasChronicDisease) flags.push("chronic disease history can worsen outcomes");
  if (context.pregnant) flags.push("pregnancy needs physician-guided treatment");
  if (context.recentTravel) flags.push("recent travel may increase infectious exposure");
  if (context.knownExposure) flags.push("known exposure increases infectious probability");

  if (!flags.length) return "Situation profile does not significantly alter baseline risk.";
  if (severity === "High") return `High-severity context note: ${flags.join("; ")}.`;
  return `Situation modifiers: ${flags.join("; ")}.`;
}

function calculatePredictions(selectedSymptomIds, diseases, rules, symptoms, context = null) {
  const selectedSet = new Set(selectedSymptomIds);
  const symptomMap = new Map(symptoms.map((s) => [s.id, s.name]));

  const scored = diseases
    .map((disease) => {
      const diseaseRules = rules.filter((rule) => rule.diseaseId === disease.id);
      const totalPossibleScore = diseaseRules.reduce((sum, rule) => sum + rule.weight, 0);
      const matchedScore = diseaseRules.reduce((sum, rule) => {
        return selectedSet.has(rule.symptomId) ? sum + rule.weight : sum;
      }, 0);

      const confidence =
        totalPossibleScore > 0 ? Number(((matchedScore / totalPossibleScore) * 100).toFixed(2)) : 0;
      const matchedSymptoms = diseaseRules
        .filter((rule) => selectedSet.has(rule.symptomId))
        .sort((a, b) => b.weight - a.weight)
        .map((rule) => symptomMap.get(rule.symptomId) || `Symptom ${rule.symptomId}`);
      const missingKeySymptoms = diseaseRules
        .filter((rule) => !selectedSet.has(rule.symptomId))
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 3)
        .map((rule) => symptomMap.get(rule.symptomId) || `Symptom ${rule.symptomId}`);
      const confidenceBand = getConfidenceBand(confidence);
      const urgency = getUrgency(disease.severity, confidence);
      const situationAdjustment = getSituationAdjustment(context, disease.severity);
      const rationale =
        matchedSymptoms.length > 0
          ? `Prediction leans toward ${disease.name} due to symptom overlap: ${matchedSymptoms.join(", ")}.`
          : `Insufficient symptom overlap for strong ${disease.name} association.`;

      return {
        diseaseId: disease.id,
        diseaseName: disease.name,
        confidence,
        matchedScore,
        totalPossibleScore,
        specialist: disease.specialist,
        severity: disease.severity,
        confidenceBand,
        urgency,
        situationAdjustment,
        rationale,
        matchedSymptoms,
        missingKeySymptoms,
      };
    })
    .filter((item) => item.confidence >= 35)
    .sort((a, b) => b.confidence - a.confidence);

  return scored.slice(0, 3);
}

module.exports = { calculatePredictions };
