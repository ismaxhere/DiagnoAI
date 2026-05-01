# DiagnoAI

DiagnoAI is a BCA final-year major project in AI for Healthcare focused on respiratory medicine with a practical rule-based triage workflow.

## Tech Stack

- Frontend: React (Vite), React Router, Axios
- Backend: Node.js, Express, JWT auth, Zod validation
- Data layer: In-memory demo dataset (easy local presentation)

## Modules Included

- Landing page
- Login / Signup
- User dashboard
- Respiratory symptom checker
- Respiratory disease prediction (rule-based with deep analysis)
- General checker mode for all supported domains
- One-click PDF analysis report export
- Patient history
- Admin panel
- Situation-based risk analysis and respiratory red-flag alerts

## Demo Accounts

- Admin: `admin@diagnoai.local` / `Admin@123`
- Patient: create via signup page

## Run Locally

### 1) Backend

```bash
cd server
npm install
npm run dev
```

Server runs on `http://localhost:5000`

### 2) Frontend

```bash
cd client
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

## Checker Modes

- Respiratory mode: `http://localhost:5173/symptom-checker?mode=respiratory`
- General mode: `http://localhost:5173/symptom-checker?mode=general`

## API Routes (core)

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/symptoms`
- `POST /api/predict`
- `GET /api/history`
- `GET /api/admin/overview`
- `GET /api/admin/master-data`

## Important Academic Note

This is a preliminary decision-support system and does not replace medical diagnosis by professionals.

## Future Upgrade Path

- Replace in-memory store with PostgreSQL + Prisma
- Add ML model endpoint (`/predict-ml`)
- Add confidence explanation and richer analytics
