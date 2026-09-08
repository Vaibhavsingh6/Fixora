# Fixora

> **"Report it. Track it. Fix it."**

Fixora is an AI-powered campus issue reporting and resolution platform for students and campus administrators. Designed for universities and colleges, Fixora streamlines the lifecycle of facilities maintenance—from classroom tech failures and dorm plumbing leaks to campus-wide infrastructure repairs—ensuring transparent tracking and rapid resolution.

Prepared for **PromptWars Community 2026** under the rigorous criteria of Code Quality, Security, Efficiency, Testing, Accessibility, Google Services, and Problem Statement Alignment.

---

## The Problem Fixora Solves

Campus maintenance operations often rely on fragmented reporting channels: scattered emails, paper work orders, phone calls to facility desks, or unmonitored portals. This leads to:
1. **Reporting Friction**: Students lack a fast, accessible way to submit issues from their phone or laptop.
2. **Triaging Delays**: Administrators manually read through vague descriptions to guess urgency, location, and trade technician required.
3. **Black Box Tracking**: Students never know if an issue was seen, scheduled, or resolved, leading to duplicate reports.
4. **Campus Downtime**: Unaddressed minor issues escalate into expensive campus infrastructure failures.

Fixora bridges this gap with an intuitive modern web platform powered by Google Cloud services and Gemini AI.

---

## Phase 1 Scope vs. Future Roadmap

Fixora follows a disciplined multi-phase engineering roadmap:

### Phase 1: Secure Foundation (Current Scope)
- **Monorepo Architecture**: Clean separation into `client/`, `server/`, and `shared/` packages with unified TypeScript typing.
- **Authentication**: Firebase Authentication with Email/Password and persistent session hydration.
- **Strict Authorization & RBAC**: Role-based routing guarding `/student/*` and `/admin/*`. No client privilege escalation.
- **Firestore Security Rules**: Field-level validation, string size bounds (DoS mitigation), user ownership enforcement, and immutable role policies.
- **Express API Backend**: Hardened with Helmet security headers, CORS origin filtering, 10kb request body size limits, and centralized sanitized error handling.
- **Accessibility**: Semantic HTML5 elements, explicit `<label>` bindings, keyboard navigation, visible focus rings, high contrast ratios, and screen-reader polite status alerts.
- **Testing Foundation**: 18 automated tests covering health endpoints, route protection logic, role validation, and Zod input validation.

### Phase 2 Roadmap (Intentionally NOT Implemented in Phase 1)
- End-to-end Issue Reporting Form
- Gemini 3.8 Flash automated issue triage via `@google/genai` (`/api/analyze-issue`)
- AI urgency classification, category labeling, and trade dispatch suggestions
- Firebase Storage photo uploads for issue evidence
- Live ticket tracking and administrative status management
- Push/Email notifications, Campus issue heatmaps, and resolution velocity analytics

---

## Final System Architecture

```
                         FIXORA
                           │
             ┌─────────────┴─────────────┐
             │                           │
       Student Browser             Admin Browser
             │                           │
             └─────────────┬─────────────┘
                           │
                    Firebase Auth
                           │
                           ▼
                    ┌────────────┐
                    │  Frontend  │  (React + TypeScript + Vite)
                    └─────┬──────┘
                          │
             ┌────────────┴────────────┐
             │                         │
             ▼                         ▼
       Firestore SDK             Express API
       (users/{uid})                   │
                                /api/health
                                (Phase 2: /api/analyze-issue)
                                       │
                                       ▼
                                 @google/genai
                                       │
                                       ▼
                                Gemini 3.8 Flash
                                       │
                                       ▼
                                Structured JSON
                                       │
                                       ▼
                                Schema Validation (Zod)
                                       │
                                       ▼
                                    Firestore
```

---

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router v6
- **Backend**: Node.js, Express, TypeScript, Helmet, CORS, Dotenv
- **Database**: Google Cloud Firestore (Native Mode)
- **Authentication**: Firebase Authentication
- **AI Triage**: Google Gemini 3.8 Flash through `@google/genai` (prepared for Phase 2 backend pipeline)
- **Schema Validation**: Zod (shared across frontend and backend)
- **Testing**: Vitest, Supertest

---

## Project Structure

```
Fixora/
├── client/                      # React + Vite Frontend Application
│   ├── src/
│   │   ├── components/          # Navbar, ProtectedRoute, LoadingSpinner, ErrorAlert
│   │   ├── context/             # AuthContext (persistent Firebase Auth & Firestore sync)
│   │   ├── pages/               # Landing, Login, Register, StudentDashboard, AdminDashboard, 404
│   │   ├── services/            # Firebase SDK client initialization & auth service
│   │   ├── App.tsx              # React Router v6 routes & role guards
│   │   ├── main.tsx             # Application entrypoint
│   │   └── index.css            # Tailwind directives, focus-visible styles, skip-links
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── server/                      # Node.js + Express REST API
│   ├── src/
│   │   ├── config/              # Validated environment configuration (env.ts)
│   │   ├── middleware/          # Security (Helmet, CORS), Error handling, Request size limits
│   │   ├── routes/              # Routes: /api/health, /api/auth/verify-admin-code
│   │   ├── app.ts               # Express app factory
│   │   └── server.ts            # Server listener entrypoint
│   ├── tests/                   # Automated Vitest test suites (health, validation, authorization)
│   ├── package.json
│   └── tsconfig.json
├── shared/                      # Shared Code Package
│   ├── src/
│   │   ├── types/               # UserProfile, UserRole ('student' | 'admin'), ApiResponse
│   │   ├── validation/          # Zod schemas: loginSchema, registerSchema, userProfileSchema
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── firestore.rules              # Granular RBAC Firestore security rules
├── firestore.indexes.json       # Index configuration
├── firebase.json                # Firebase emulator & deployment configuration
├── .env.example                 # Root environment variable template
├── .gitignore                   # Comprehensive ignore rules
├── package.json                 # Monorepo workspace configuration
└── README.md                    # Project documentation
```

---

## Security Architecture & Decisions

1. **Privilege Escalation Prevention (RBAC)**:
   - Client applications can never assign the `admin` role arbitrarily.
   - Firestore security rules mandate:
     ```javascript
     allow create: if isOwner(userId) && isValidUser(request.resource.data) &&
                   (request.resource.data.role == 'student' || isAdmin());
     ```
   - On the registration form, requesting an `admin` role requires a valid `ADMIN_SECRET_KEY` verified server-side.
2. **Role Immutability**:
   - Once a user profile is created, Firestore rules strictly reject any updates modifying `role`, `uid`, or `createdAt`:
     ```javascript
     allow update: if isOwner(userId) && isValidUser(request.resource.data) &&
                   request.resource.data.role == resource.data.role &&
                   request.resource.data.uid == resource.data.uid &&
                   request.resource.data.createdAt == resource.data.createdAt;
     ```
3. **Strict Data Separation**:
   - Users can read only their own `/users/{uid}` document (`isOwner(userId)`). Unauthenticated or arbitrary reads are blocked.
4. **Resource Exhaustion / DoS Mitigation**:
   - Every string field in Firestore rules and Zod schemas has explicit length bounds (e.g. `name.size() <= 100`, `email.size() <= 100`).
   - Express backend limits incoming JSON and urlencoded request bodies to `10kb`.
5. **No Secret Leaks**:
   - Gemini API keys, server secrets, and private credentials reside solely on the backend (`server/.env`).
   - Frontend client bundles contain only public Firebase web client credentials.
6. **Defense in Depth**:
   - Front-end route protection (`<ProtectedRoute>`) stops unauthorized navigation.
   - Backend APIs enforce role clearances.
   - Firestore database rules enforce server-side authority regardless of client requests.

---

## Environment Variables

Copy the template to set up your environment:

```bash
cp .env.example .env
```

| Variable | Scope | Description |
| :--- | :--- | :--- |
| `PORT` | Server | HTTP port for Express API (default: `5000`) |
| `NODE_ENV` | Server | `development`, `production`, or `test` |
| `CORS_ORIGIN` | Server | Whitelisted frontend origin (default: `http://localhost:5173`) |
| `ADMIN_SECRET_KEY` | Server | Secret passcode for admin role enrollment verification |
| `GEMINI_API_KEY` | Server | Google Gemini API key (Phase 2 analysis - backend only) |
| `VITE_API_BASE_URL` | Client | Target API URL (default: `http://localhost:5000`) |
| `VITE_FIREBASE_API_KEY` | Client | Firebase Web Client API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Client | Firebase Authentication domain |
| `VITE_FIREBASE_PROJECT_ID` | Client | Firebase Project ID |
| `VITE_ADMIN_JOIN_CODE` | Client | Demo passcode for admin role UI demonstration |

---

## Local Setup & Getting Started

### Prerequisites
- Node.js >= 18 (tested on Node v20/v26)
- npm >= 9

### 1. Install Dependencies
Run from root to install dependencies across all workspaces:
```bash
npm install
```

### 2. Build the Shared Package
```bash
npm run build:shared
```

### 3. Run the Applications

#### Run the Express Backend:
```bash
npm run dev:server
```
The server will start on [http://localhost:5000](http://localhost:5000).
Check health: [http://localhost:5000/api/health](http://localhost:5000/api/health)

#### Run the React Client (in a separate terminal):
```bash
npm run dev:client
```
The frontend will open on [http://localhost:5173](http://localhost:5173).

---

## Running Tests

Automated test suites verify the health endpoint, security headers, role authorization helpers, and validation schemas:

```bash
npm test
```

To run tests in watch mode:
```bash
npm run test:watch
```

---

## Demo Credentials

For evaluation and testing, you can use the quick-fill buttons on the `/login` page or enter:

- **Student Account**:
  - Email: `student@campus.edu`
  - Password: `password123`
  - Role: `student` (accesses `/student/dashboard`, blocked from `/admin/*`)
- **Admin Account**:
  - Email: `admin@campus.edu`
  - Password: `password123`
  - Role: `admin` (accesses `/admin/dashboard`, has elevated facilities visibility)
- **Admin Join Code** (when registering a new admin):
  - Passcode: `campus-admin-2026-secret`
