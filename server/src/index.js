const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const {
  respiratorySymptoms,
  respiratoryDiseases,
  respiratoryDiseaseSymptomRules,
  generalSymptoms,
  generalDiseases,
  generalDiseaseSymptomRules,
  users,
  predictions,
  nextId,
} = require("./data/store");
const { calculatePredictions } = require("./lib/predictor");
const { requireAuth, requireAdmin } = require("./middleware/auth");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "diagnoai-dev-secret";

function getUserFromAuthHeader(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function resolveMode(modeInput) {
  return modeInput === "general" ? "general" : "respiratory";
}

function getCatalog(mode) {
  if (mode === "general") {
    return {
      symptoms: generalSymptoms,
      diseases: generalDiseases,
      rules: generalDiseaseSymptomRules,
    };
  }
  return {
    symptoms: respiratorySymptoms,
    diseases: respiratoryDiseases,
    rules: respiratoryDiseaseSymptomRules,
  };
}

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "DiagnoAI API" });
});

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

app.post("/api/auth/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid signup data." });
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();
  const exists = users.some((u) => u.email === normalizedEmail);
  if (exists) {
    return res.status(409).json({ message: "Email already registered." });
  }

  const newUser = {
    id: nextId(users),
    name,
    email: normalizedEmail,
    passwordHash: await bcrypt.hash(password, 10),
    role: "PATIENT",
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);

  return res.status(201).json({ message: "Signup successful." });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

app.post("/api/auth/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid login data." });
  }

  const { email, password } = parsed.data;
  const user = users.find((u) => u.email === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  const token = jwt.sign({ sub: user.id, role: user.role, name: user.name }, JWT_SECRET, {
    expiresIn: "1d",
  });

  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  const user = users.find((u) => u.id === req.user.sub);
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }
  return res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

app.get("/api/symptoms", (req, res) => {
  const mode = resolveMode(req.query.mode);
  const { symptoms } = getCatalog(mode);
  res.json(symptoms);
});

const predictSchema = z.object({
  symptomIds: z.array(z.number()).min(1),
  context: z
    .object({
      age: z.number().min(0).max(120).optional(),
      durationDays: z.number().min(0).max(60).optional(),
      painLevel: z.number().min(0).max(10).optional(),
      hasChronicDisease: z.boolean().optional(),
      pregnant: z.boolean().optional(),
      recentTravel: z.boolean().optional(),
      knownExposure: z.boolean().optional(),
      notes: z.string().max(250).optional(),
    })
    .optional(),
  mode: z.enum(["respiratory", "general"]).optional(),
});

function buildSituationAnalysis(context) {
  if (!context) {
    return {
      riskLevel: "Baseline",
      keyFlags: [],
      summary: "No additional situation details were provided.",
      advice: "Provide age, duration and risk conditions for deeper analysis.",
    };
  }

  let riskPoints = 0;
  const keyFlags = [];

  if ((context.age || 0) >= 60) {
    riskPoints += 2;
    keyFlags.push("Senior age group");
  }
  if ((context.age || 0) > 0 && (context.age || 0) <= 5) {
    riskPoints += 2;
    keyFlags.push("Very young age");
  }
  if ((context.durationDays || 0) >= 5) {
    riskPoints += 1;
    keyFlags.push("Symptoms persisting for 5+ days");
  }
  if ((context.painLevel || 0) >= 8) {
    riskPoints += 2;
    keyFlags.push("High pain score");
  }
  if (context.hasChronicDisease) {
    riskPoints += 2;
    keyFlags.push("Chronic disease history");
  }
  if (context.pregnant) {
    riskPoints += 2;
    keyFlags.push("Pregnancy");
  }
  if (context.recentTravel) {
    riskPoints += 1;
    keyFlags.push("Recent travel");
  }
  if (context.knownExposure) {
    riskPoints += 2;
    keyFlags.push("Known infectious exposure");
  }

  const riskLevel = riskPoints >= 6 ? "High" : riskPoints >= 3 ? "Moderate" : "Low";
  const advice =
    riskLevel === "High"
      ? "Please seek doctor consultation promptly and avoid self-medication."
      : riskLevel === "Moderate"
      ? "Consider clinical consultation in 24-48 hours if symptoms continue."
      : "Monitor symptoms, hydrate, rest, and consult doctor if worsening.";

  return {
    riskLevel,
    keyFlags,
    summary: `Situation-based risk assessment is ${riskLevel.toLowerCase()} with ${riskPoints} risk points.`,
    advice,
  };
}

function getRespiratoryRedFlags(symptomIds, context) {
  const selected = new Set(symptomIds);
  const flags = [];

  if (selected.has(7) && selected.has(8)) {
    flags.push("Breathlessness with chest pain is a respiratory emergency sign.");
  }
  if (selected.has(7) && selected.has(14)) {
    flags.push("Breathlessness with wheezing may indicate acute airway narrowing.");
  }
  if ((context?.painLevel || 0) >= 9 && selected.has(7)) {
    flags.push("Severe discomfort with breathlessness requires immediate clinical evaluation.");
  }
  if ((context?.age || 0) >= 60 && selected.has(7) && selected.has(1)) {
    flags.push("Senior patient with fever and breathlessness has elevated risk.");
  }
  if ((context?.durationDays || 0) >= 7 && selected.has(2) && selected.has(15)) {
    flags.push("Persistent cough with phlegm over a week needs chest evaluation.");
  }

  return flags;
}

app.post("/api/predict", (req, res) => {
  const parsed = predictSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Please select at least one symptom." });
  }

  const mode = resolveMode(parsed.data.mode);
  const { symptoms, diseases, rules } = getCatalog(mode);

  const topPredictions = calculatePredictions(
    parsed.data.symptomIds,
    diseases,
    rules,
    symptoms,
    parsed.data.context
  );
  const situationAnalysis = buildSituationAnalysis(parsed.data.context);
  const respiratoryRedFlags =
    mode === "respiratory" ? getRespiratoryRedFlags(parsed.data.symptomIds, parsed.data.context) : [];
  if (!topPredictions.length) {
    return res.status(200).json({
      message: "No strong match found. Please consult a doctor.",
      predictions: [],
      selectedSymptoms: parsed.data.symptomIds
        .map((id) => symptoms.find((s) => s.id === id)?.name)
        .filter(Boolean),
      context: parsed.data.context || null,
      mode,
      situationAnalysis,
      respiratoryRedFlags,
      generatedAt: new Date().toISOString(),
    });
  }

  const authUser = getUserFromAuthHeader(req);
  let recordId = null;

  // Save prediction history only for logged-in users.
  if (authUser?.sub) {
    const record = {
      id: nextId(predictions),
      userId: authUser.sub,
      symptomIds: parsed.data.symptomIds,
      context: parsed.data.context || null,
      mode,
      respiratoryRedFlags,
      topDiseaseId: topPredictions[0].diseaseId,
      topDiseaseName: topPredictions[0].diseaseName,
      confidence: topPredictions[0].confidence,
      allPredictions: topPredictions,
      createdAt: new Date().toISOString(),
    };
    predictions.push(record);
    recordId = record.id;
  }

  return res.json({
    message: authUser?.sub
      ? "Prediction generated and saved to history."
      : "Prediction generated. Login to save it in history.",
    predictions: topPredictions,
    savedRecordId: recordId,
    selectedSymptoms: parsed.data.symptomIds
      .map((id) => symptoms.find((s) => s.id === id)?.name)
      .filter(Boolean),
    context: parsed.data.context || null,
    mode,
    situationAnalysis,
    respiratoryRedFlags,
    generatedAt: new Date().toISOString(),
  });
});

app.get("/api/history", requireAuth, (req, res) => {
  const own = predictions
    .filter((p) => p.userId === req.user.sub)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(own);
});

app.get("/api/admin/overview", requireAuth, requireAdmin, (req, res) => {
  const mode = resolveMode(req.query.mode);
  const { symptoms, diseases } = getCatalog(mode);
  res.json({
    totalUsers: users.length,
    totalPredictions: predictions.length,
    totalDiseases: diseases.length,
    totalSymptoms: symptoms.length,
  });
});

app.get("/api/admin/master-data", requireAuth, requireAdmin, (req, res) => {
  const mode = resolveMode(req.query.mode);
  const { symptoms, diseases, rules } = getCatalog(mode);
  res.json({ diseases, symptoms, diseaseSymptomRules: rules, mode });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`DiagnoAI API running on http://localhost:${PORT}`);
});
