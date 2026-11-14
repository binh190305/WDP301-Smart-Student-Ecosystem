# Repository Audit – Smart Student Ecosystem (STE)

## 1. High‑Level Overview
- **Project name**: Smart Student Ecosystem (STE)
- **Primary languages**: JavaScript / TypeScript (frontend), JavaScript (backend)
- **Package managers**: `npm` for both frontend and backend
- **Frontend framework**: React 18 with Vite (module‑type, ES modules) and TailwindCSS for styling.
- **Backend framework**: Express 4, Node.js (CommonJS), Mongoose ODM for MongoDB.
- **Database**: MongoDB (NoSQL document store). Schemas are defined in `backend/src/models/*.js`.
- **AI components**: Located under `backend/src/recommendation/*`. Uses `@huggingface/transformers`, `onnxruntime-node` for embedding inference, and custom LLM client wrappers.
- **Authentication**: JWT‑based (`jsonwebtoken`), password hashing (`bcryptjs`), and basic auth middleware.
- **Testing**: Jest is present in `backend/test/` (e.g., recommendation tests). No explicit frontend test framework detected yet.
- **Dev tools**: `nodemon` for backend hot reload, `vite` for frontend dev server.

## 2. Directory Structure (excerpt)
```
ste/
├─ backend/
│  ├─ src/
│  │  ├─ app.js
│  │  ├─ server.js
│  │  ├─ config/   (env, db)
│  │  ├─ middleware/ (rate‑limit, auth)
│  │  ├─ models/   (user, team, recommendation, embedding…)
│  │  ├─ controllers/ (recommendation.controller.js …)
│  │  ├─ recommendation/ (config, service, skill‑catalog, ranking, scoring, llm, embedding)
│  │  └─ utils/ (seed‑recommendation.js, sync‑embeddings.js)
│  ├─ test/      (recommendation unit tests)
│  ├─ package.json
│  └─ .env (not committed)
├─ frontend/
│  ├─ src/
│  │  ├─ api/ (axios wrapper)
│  │  ├─ pages/ (student, lecturer, admin, auth)
│  │  ├─ utils/ (cn.js, constants.js, download.js, format.js)
│  │  └─ routes/ (guards.jsx, navigation.js)
│  ├─ public/
│  ├─ vite.config.js
│  ├─ tailwind.config.js
│  ├─ postcss.config.js
│  └─ package.json
└─ .git/, README.md, .gitignore
```

## 3. What Works
- Backend server starts (`npm run dev`) and connects to MongoDB (port 5000).
- Frontend dev server runs (`npm run dev`) and serves the React SPA (port 5173).
- AI recommendation service compiles, but **requires** `onnxruntime-node` (now installed) – no runtime errors after the forced install.
- Basic authentication flow works (login, register, JWT token issuance).
- Several UI pages render (Auth, Student Dashboard, Team pages, Admin Dashboard).
- Unit tests for recommendation logic run with Jest.

## 4. Incomplete / Potentially Missing Areas
| Area | Observation |
|------|-------------|
| **Front‑end tests** | No test framework (e.g., Jest/React Testing Library) detected. |
| **API documentation** | No Swagger/OpenAPI spec present. |
| **Environment variables** | `.env.example` not found – required vars: `PORT`, `MONGO_URI`, `JWT_SECRET`, possibly AI model keys. |
| **AI model configuration** | `backend/src/recommendation/config.js` contains placeholders for provider URLs/keys – actual credentials not committed. |
| **Security hardening** | Rate‑limit middleware present, but no CSP headers, input sanitization details unclear. |
| **Database migrations** | No migration tool (e.g., migrate-mongo) – schema changes are manual. |
| **CI/CD** | No workflow files (`.github/workflows/`) detected. |
| **Production build** | Frontend `npm run build` and backend Dockerfile missing. |
| **Real‑time chat** | Explicitly excluded by business constraints. |
| **AI core integration** | Core modules (Skill Intelligence, Project Intelligence, Contribution Intelligence) are scaffolded but not fully wired to UI. |

## 5. Duplications & Technical Debt
- Multiple `onnxruntime-node` versions installed (`1.30.0` and `1.31.1`) – can cause confusion; unify to a single version.
- Redundant `npm WARN install-scripts` entries – consider approving scripts or moving to postinstall safe alternatives.
- Large number of vulnerabilities (12 moderate, 4 high, 1 critical) – requires periodic `npm audit fix`.
- Hard‑coded strings for collection names in Mongoose models – consider centralizing.

## 6. Risks & Recommendations
- **Dependency security**: Run `npm audit fix --force` after reviewing breaking changes.
- **AI runtime**: Verify that `onnxruntime-node` binaries match the host OS (Windows) – current install includes Linux/Darwin binaries; may need Windows-specific build.
- **Schema consistency**: Document all Mongoose schemas in `docs/DATABASE_SCHEMA.md` for future migrations.
- **Testing coverage**: Add frontend unit/e2e tests and integration tests for API endpoints.
- **CI pipeline**: Set up GitHub Actions for linting, testing, and building.
- **Documentation completeness**: Populate `API_DOCUMENTATION.md` with existing routes (`backend/src/routes/*`).
- **Environment management**: Introduce `.env.example` with required keys.

---
*This audit was generated automatically by inspecting the repository on 2026‑11‑03. Items marked **TBD** require stakeholder clarification.*

