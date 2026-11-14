# CHECKPOINT 0 – Repository Audit
# AI CORE 01: Skill Intelligence & Knowledge Graph
_Smart Student Ecosystem (STE) — Generated 2026-11-03_

---

## 1. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend runtime | Node.js | ≥ 18 (LTS) |
| Backend framework | Express | 4.x (CommonJS) |
| ODM | Mongoose | 8.x |
| Database | MongoDB | 7.x (local `mongodb://127.0.0.1:27017/ste`) |
| Frontend framework | React | 18.x |
| Frontend build | Vite | 5.x (ES module) |
| Frontend styling | TailwindCSS | 3.x + PostCSS |
| HTTP client | Axios | 1.x |
| Auth | JWT (`jsonwebtoken`) + bcryptjs | 9.x / 2.x |
| Validation | Joi | 17.x |
| AI provider (LLM) | Anthropic Claude (`@anthropic-ai/sdk`) | activated via `ANTHROPIC_API_KEY` |
| AI embeddings | `@huggingface/transformers` + `onnxruntime-node` | model: `Xenova/multilingual-e5-small` |
| Testing | Jest | detected in `backend/test/` |

---

## 2. Backend Directory Structure

```
backend/src/
├─ app.js               – Express app setup (Helmet, CORS, JSON, mongo-sanitize, morgan)
├─ server.js            – Startup: connect MongoDB → listen on PORT
├─ config/
│   ├─ env.js           – Reads process.env; requires MONGO_URI, JWT_SECRET
│   └─ db.js            – Mongoose connect wrapper
├─ models/              – 28 Mongoose schemas (see §4)
├─ routes/
│   ├─ index.js         – 20 route files registered under /api
│   └─ *.routes.js
├─ controllers/         – Thin controller layer (asyncHandler + AppError)
├─ middleware/
│   ├─ auth.js          – protect() / restrictTo()
│   ├─ error-handler.js – notFound + errorHandler
│   ├─ rate-limit.js    – authRateLimit, aiChatRateLimit, uploadRateLimit
│   ├─ upload.js        – multer avatar upload
│   └─ validate.js      – Joi middleware (body / query / params)
├─ recommendation/      – AI recommendation subsystem (see §6)
├─ utils/
│   ├─ async-handler.js – wraps async fns for Express
│   ├─ app-error.js     – AppError(message, statusCode, details)
│   ├─ token.js         – JWT sign / verify
│   ├─ uploads.js       – avatar storage config
│   └─ seed-*.js        – seed utilities
└─ validators/          – Joi schemas per domain
```

---

## 3. Frontend Directory Structure

```
frontend/src/
├─ api/
│   ├─ client.js        – Axios instance (baseURL, interceptors for Bearer token)
│   └─ index.js         – Named API groups (authApi, userApi, teamApi, recommendationApi, …)
├─ pages/
│   ├─ auth/            – Login, Register, ForgotPassword, ResetPassword, ChangePassword
│   ├─ student/         – Dashboard, Teams, Discover, AiTeamChat, GradesPage, …
│   ├─ lecturer/        – Dashboard, Courses, Assignments, Quizzes, Monitor
│   └─ admin/           – Dashboard, Users, Moderation, Workspace
├─ routes/
│   ├─ guards.jsx       – PrivateRoute / RoleRoute components
│   └─ navigation.js    – Role-keyed sidebar nav arrays (student / lecturer / admin / club_leader)
└─ utils/
    ├─ constants.js     – SKILL_LEVEL_LABELS, TEAM_STATUS_LABELS, etc.
    ├─ cn.js            – clsx helper
    ├─ format.js        – date/number formatters
    └─ download.js      – blob download helper
```

---

## 4. Existing MongoDB Models (Relevant to AI CORE 01)

### 4.1 User (`users` collection)
| Field | Type | Notes |
|-------|------|-------|
| `name` | String | required, maxlength 100 |
| `email` | String | unique |
| `role` | String enum | `student\|lecturer\|admin\|club_leader` |
| `major` | String | – |
| `gpa` | Number 0-4 | – |
| **`skills`** | [String] | free-text skill names |
| `interests` | [String] | – |
| `description` | String | maxlength 1000 |
| **`skillLevels`** | [{name, level 1-5}] | skill + numeric level pairs |
| **`preferredRoles`** | [String] | keys from `ROLES` in skill-catalog |
| `goal` | String enum | `excellent\|good\|pass\|null` |

### 4.2 Team (`teams` collection)
| Field | Type | Notes |
|-------|------|-------|
| `skillsNeeded` | [String] | free-text |
| **`skillRequirements`** | [{name, minLevel}] | structured |
| `rolesNeeded` | [String] | role keys |
| `topic`, `major`, `description` | String | – |
| `status` | String enum | `recruiting\|full\|closed` |

### 4.3 Taxonomy (`taxonomies` collection)
| Field | Type | Notes |
|-------|------|-------|
| `type` | String enum | `skill\|major\|category` |
| `name` | String | – |
| `normalizedName` | String | auto-lowercased (unique per type) |
| `description` | String | – |
| `isActive` | Boolean | – |

> **Key insight**: The `Taxonomy` model already provides a managed vocabulary for skills, majors, and categories. AI CORE 01 will extend this model rather than create a new one.

### 4.4 Embedding (`embeddings` collection)
Stores dense vectors for students and teams. Used by recommendation Layer 2 (semantic similarity).

### 4.5 RecommendationEvent / RecommendationExplanation
Telemetry and LLM explanation cache.

---

## 5. Authentication & Authorization

- **JWT Bearer token** stored in `Authorization` header.
- `protect` middleware: validates token, loads user from DB, attaches `req.user`.
- `restrictTo(...roles)`: role-based guard.
- Students can only modify **their own** profiles.
- AI CORE 01 endpoints will follow the same pattern.

---

## 6. Existing AI / Recommendation Infrastructure

The project already has a 3-layer recommendation engine:

| Layer | Technology | Purpose |
|-------|-----------|---------|
| L1 – Scoring | Pure JS logic | gap_fill, goal_match, level_balance |
| L2 – Semantic | Hugging Face E5 embeddings | cosine similarity between student/team vectors |
| L3 – LLM | Anthropic Claude | query parsing, explainability |

**Key reusable components for AI CORE 01:**

| File | Reusable for AI CORE 01 |
|------|-------------------------|
| `recommendation/llm/client.js` | `completeJson()` → will reuse for skill extraction |
| `recommendation/skill-catalog.js` | `normalizeSkill()`, `ALIASES`, `SKILL_ROLES` → skill normalization |
| `models/taxonomy.model.js` | skill/category vocabulary → extend for KG |
| `models/user.model.js` | `skills`, `skillLevels` fields already present |
| `middleware/auth.js` | `protect`, `restrictTo` |
| `middleware/validate.js` | Joi validation wrapper |
| `utils/async-handler.js` | async controller wrapper |
| `utils/app-error.js` | error class |

---

## 7. Environment Variables

| Variable | Status | Used by |
|----------|--------|---------|
| `MONGO_URI` | ✅ Set | DB connection |
| `JWT_SECRET` | ✅ Set | Auth |
| `ANTHROPIC_API_KEY` | ⚠️ Not set | LLM skill extraction |
| `EMBEDDING_ENABLED` | Optional | Embedding layer |
| `EMBEDDING_API_KEY` | Optional | Remote embedding |
| `LLM_ENABLED` | Optional | LLM toggle |
| `LLM_MODEL` | Optional (default `claude-haiku-5-5`) | LLM model |

---

## 8. What Already Works

- ✅ Auth (register, login, JWT, refresh)
- ✅ User profile with `skills[]` and `skillLevels[]`
- ✅ Team CRUD with `skillsNeeded[]` and `skillRequirements[]`
- ✅ Team recommendation (profile scoring + embeddings + LLM explain)
- ✅ Taxonomy model for managing skill/category vocabulary
- ✅ LLM client (`completeJson`) with structured JSON output
- ✅ Skill normalization (`normalizeSkill`, `ALIASES`)
- ✅ Role-to-skill mapping (`SKILL_ROLES`)

---

## 9. What is Incomplete / Missing

| Gap | Impact on AI CORE 01 |
|-----|----------------------|
| No `SkillCategory` hierarchy in Taxonomy (flat structure) | Need to add `parentId` field |
| No AI-extracted skill records (separate from `user.skills`) | Need `StudentSkill` model |
| No skill evidence tracking | Need `SkillEvidence` sub-document or model |
| No skill-to-skill relationship graph | Need `SkillRelationship` model |
| No Skill Gap Analysis logic | Need new service |
| No frontend pages for Skill Profile / KG / Gap Analysis | Need new pages |
| No `ANTHROPIC_API_KEY` configured | LLM extraction requires it |
| Frontend test framework absent | Need Jest + RTL setup |

---

## 10. Technical Limitations

- MongoDB does not have native graph traversal syntax (no `MATCH (a)-[]->(b)` style). Graph relationships will be modeled with adjacency documents and application-level BFS/DFS.
- `onnxruntime-node` installs but postinstall script is gated behind `npm install-scripts approve` — embedding inference may silently fail on first cold start.
- No CI/CD pipeline exists; tests must be run manually.

---

## 11. Recommended Implementation Strategy

1. **Reuse existing models** — extend `Taxonomy` and `User` rather than creating entirely new collections where possible.
2. **New models needed**: `StudentSkill`, `SkillRelationship` (graph edges).
3. **Reuse `completeJson()`** from the LLM client for skill extraction.
4. **Reuse `normalizeSkill()`** from skill-catalog for normalization.
5. **Build KG with MongoDB adjacency list** — no graph DB needed initially.
6. **Add graceful fallback** when `ANTHROPIC_API_KEY` is absent (return empty extraction with explanation).
7. **Extend navigation.js** to add AI Skill Profile section under the "Cá nhân" group.
8. **Follow existing API envelope**: `{ success: boolean, data: ... }`.

---

## 12. Risks

| Risk | Mitigation |
|------|-----------|
| LLM hallucinating non-existent skills | Validate against Taxonomy vocabulary; flag unrecognised skills as suggestions |
| Duplicate skill records | Unique index on (student, normalizedSkillName) |
| Slow embedding sync causing delay | Extraction runs async; profile endpoint returns immediately |
| Breaking existing recommendation engine | AI CORE 01 adds new routes/models; no existing files removed |

