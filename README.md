# DiagnoAI

DiagnoAI is a BCA final-year major project in AI for Healthcare.  
It provides symptom-based disease triage with:

- Respiratory mode (specialized)
- General mode (broader)
- Situation-based risk analysis
- One-click PDF report generation

## Project Features

- Guest use (login not mandatory for checking symptoms)
- Login/Signup with JWT authentication
- Respiratory and General Symptom Checker
- Rule-based prediction with confidence and rationale
- Situation-based risk interpretation (age, duration, pain, exposure, etc.)
- Respiratory red-flag alerts
- Patient history (for logged-in users)
- Admin overview and master-data view
- PDF analysis report download

## Tech Stack

- Frontend: React + Vite + React Router + Axios
- Backend: Node.js + Express + Zod + JWT + bcryptjs
- Report: jsPDF
- Data: in-memory catalog (for easy local presentation/demo)

---

## Complete Setup Guide (New PC + VS Code)

Follow this from scratch if your PC is new.

## 1) Install required software

### A) Install Git
- Download: [https://git-scm.com/downloads](https://git-scm.com/downloads)
- Install with default options.

### B) Install Node.js (LTS)
- Download LTS: [https://nodejs.org](https://nodejs.org)
- During install, keep default options.
- Verify after install:
  - `node -v`
  - `npm -v`

### C) Install VS Code
- Download: [https://code.visualstudio.com](https://code.visualstudio.com)
- Install with default options.

### D) (Recommended) Install VS Code Extensions
- ESLint
- Prettier
- GitLens (optional)

---

## 2) Clone the project

Open terminal (PowerShell / CMD) and run:

```bash
git clone https://github.com/ismaxhere/DiagnoAI.git
cd DiagnoAI
```

Open in VS Code:

```bash
code .
```

---

## 3) Install dependencies

Install backend packages:

```bash
cd server
npm install
```

Install frontend packages:

```bash
cd ../client
npm install
```

Go back to root (optional):

```bash
cd ..
```

---

## 4) Environment setup (backend)

In `server`, create `.env` from `.env.example`:

```bash
cd server
copy .env.example .env
```

Default values are already fine for local run:

```env
PORT=5000
JWT_SECRET=diagnoai-dev-secret
```

---

## 5) Run the project locally

You need **two terminals** in VS Code.

### Terminal 1: Start backend

```bash
cd server
npm run dev
```

Backend URL: `http://localhost:5000`

### Terminal 2: Start frontend

```bash
cd client
npm run dev
```

Frontend URL: `http://localhost:5173`

---

## 6) How to use checker modes

- Respiratory checker:
  - `http://localhost:5173/symptom-checker?mode=respiratory`
- General checker:
  - `http://localhost:5173/symptom-checker?mode=general`

Or simply open the home page and click mode buttons.

---

## 7) Demo accounts

- Admin:
  - Email: `admin@diagnoai.local`
  - Password: `Admin@123`
- Patient:
  - Create from signup page

---

## 8) Common issues and quick fixes

- **Port already in use**
  - Close older running node process, then restart.
- **`npm` or `node` not recognized**
  - Reinstall Node.js LTS and restart terminal.
- **Frontend starts but API fails**
  - Ensure backend is running on `http://localhost:5000`.
- **Package install fails**
  - Delete `node_modules` and `package-lock.json`, reinstall with `npm install`.

---

## 9) Useful scripts

From `server`:

- `npm run dev` -> start backend in dev mode
- `npm start` -> start backend normally

From `client`:

- `npm run dev` -> start frontend
- `npm run build` -> production build

---

## 10) API Endpoints (Core)

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/symptoms?mode=respiratory|general`
- `POST /api/predict`
- `GET /api/history`
- `GET /api/admin/overview`
- `GET /api/admin/master-data`

---

## Academic Note

DiagnoAI is a preliminary decision-support system for educational purpose and does not replace clinical diagnosis by a licensed doctor.

## Future Scope

- PostgreSQL + Prisma integration
- ML model endpoint (`/predict-ml`)
- Better explainability charts
- Rich admin analytics


## Demonstration Video


https://github.com/user-attachments/assets/10e046e6-36be-490b-b29c-7f79b74d4e98


