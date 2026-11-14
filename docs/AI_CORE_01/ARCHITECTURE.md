# AI CORE 01 – Architecture Design
# Skill Intelligence & Knowledge Graph
_Smart Student Ecosystem (STE) — 2026-11-03_

---

## 1. High-Level Processing Pipeline

```
STUDENT INFORMATION (free text / structured profile)
            │
            ▼
    ┌──────────────────┐
    │  INPUT PROCESSOR │  ← validate, sanitize, detect language
    └──────────────────┘
            │
            ▼
    ┌─────────────────────────┐
    │  SKILL EXTRACTION ENGINE│  ← LLM (Claude) → structured JSON
    └─────────────────────────┘
            │
            ▼
    ┌──────────────────────────────┐
    │  SKILL NORMALIZATION ENGINE  │  ← normalizeSkill(), ALIASES
    └──────────────────────────────┘
            │
            ▼
    ┌──────────────────────────────┐
    │  SKILL CLASSIFICATION ENGINE │  ← taxonomy lookup / create
    └──────────────────────────────┘
            │
            ▼
    ┌─────────────────────────┐
    │  EVIDENCE VALIDATOR     │  ← confidence score, evidenceType
    └─────────────────────────┘
            │
            ▼
    ┌──────────────────────────┐
    │  PROFICIENCY ASSESSMENT  │  ← deterministic rules (not LLM)
    └──────────────────────────┘
            │
            ▼
    ┌───────────────────────────┐
    │  KNOWLEDGE GRAPH ENGINE   │  ← persist nodes + edges
    └───────────────────────────┘
            │
            ▼
    ┌──────────────────────────┐
    │  STUDENT SKILL PROFILE   │  ← StudentSkill documents
    └──────────────────────────┘
            │
            ▼
    ┌──────────────────────────┐
    │  SKILL GAP ANALYSIS      │  ← compare profile vs. target
    └──────────────────────────┘
```

---

## 2. Logical Components

### 2.1 SkillExtractionService
**Responsibility**: Accept raw student text (bio, project descriptions, certificates) and return a list of candidate skills with confidence scores and evidence.

**LLM call**: `completeJson()` from existing `recommendation/llm/client.js`.

**Input**:
```js
{ text: String, studentId: ObjectId, evidenceType: EvidenceType }
```

**Output**:
```js
[{
  name: String,            // raw LLM output
  confidence: Number,      // 0-1
  evidence: String,        // excerpt from input
  suggestedProficiency: ProficiencyLevel,
  category: String
}]
```

**Fallback**: If LLM unavailable, return `{ skills: [], fallback: true, message: 'LLM chưa được cấu hình' }`.

---

### 2.2 SkillNormalizationService
**Responsibility**: Map raw skill names → canonical names using existing `normalizeSkill()` + ALIASES dictionary. Flag unknown skills.

**Input**: Raw skill name (String)
**Output**: `{ normalizedName: String, isKnown: Boolean, aliasUsed: Boolean }`

**Deterministic logic only** — no LLM.

---

### 2.3 SkillClassificationService
**Responsibility**: Map normalized skill names to Taxonomy categories. Create new taxonomy entries for approved unknown skills.

**Input**: Normalized skill name
**Output**: `{ taxonomyId: ObjectId, category: String, parentCategory: String | null }`

**Database**: `Taxonomy` collection (reused and extended with `parentId` support).

---

### 2.4 SkillProfileService
**Responsibility**: CRUD operations on a student's `StudentSkill` records. Enforces that AI suggestions do not overwrite student-confirmed skills.

**Key rules**:
- `status: 'ai_suggested'` → student must confirm before status changes to `confirmed`.
- `status: 'student_declared'` → set directly by student, never auto-overwritten.
- `status: 'rejected'` → hidden from display and AI CORE 02 / 03.

**Database**: `StudentSkill` collection (new).

---

### 2.5 SkillEvidenceService
**Responsibility**: Track the source material for each extracted skill.

**Input**: `{ studentSkillId, evidenceType, description, sourceText }`
**Output**: Persisted evidence sub-document.

**Evidence types**: `PROJECT_DESCRIPTION | ACADEMIC_INTEREST | CERTIFICATE | WORK_EXPERIENCE | MANUAL`

---

### 2.6 KnowledgeGraphService
**Responsibility**: Persist and query graph nodes (skills, categories, students) and edges (relationships).

**Database**: `SkillRelationship` collection (adjacency list) — MongoDB, no graph DB required.

**Relationship types**:
- `PREREQUISITE_OF` — e.g. JavaScript → React
- `RELATED_TO` — bidirectional
- `PART_OF` — child category → parent category
- `COMPLEMENTARY_TO` — skills that work well together
- `APPLIED_IN` — skill applied in a project context
- `HAS_SKILL` — student → skill (stored in StudentSkill, virtual edge)

**Graph traversal**: Application-level BFS using MongoDB `$in` queries (sufficient for initial depth ≤ 3 traversals).

---

### 2.7 SkillGapAnalysisService
**Responsibility**: Compare a student's confirmed skills against a target (project / team requirements) and produce explainable gap analysis.

**Input**: `{ studentId, targetSkills: [{name, minProficiency}] }`
**Output**:
```js
{
  matched: [...],      // skills student has at or above required level
  partial: [...],      // skills present but below required level
  missing: [...],      // skills not in student profile
  learningPriority: [...],  // ordered list of skills to acquire
  explanation: String  // LLM-generated narrative (optional)
}
```

**Deterministic scoring** for matched/partial/missing; LLM only for explanation text.

---

## 3. Data Flow Diagram

```
Student submits profile text
            │
POST /api/skill-intelligence/extract
            │
            ▼
SkillExtractionService.extract(text)
    LLM → raw skill list
            │
SkillNormalizationService.normalize(rawSkills)
            │
SkillClassificationService.classify(normalizedSkills)
    → Taxonomy lookup/create
            │
SkillProfileService.upsertSuggestions(studentId, skills)
    → writes StudentSkill {status:'ai_suggested'}
            │
Response: preview of extracted skills
            │
Student reviews, confirms/rejects via UI
            │
PATCH /api/skill-intelligence/student-skills/:id/confirm
    → StudentSkill {status:'confirmed'}
            │
KnowledgeGraphService.sync(studentId)
    → writes SkillRelationship edges
            │
Student requests gap analysis
            │
GET /api/skill-intelligence/gap-analysis?target=...
    → SkillGapAnalysisService.analyze(studentId, target)
    → returns matched / partial / missing + priorities
```

---

## 4. API Boundaries

All routes under `/api/skill-intelligence/`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/extract` | student | Extract skills from free text |
| GET | `/student-skills` | student | List my skill profile |
| POST | `/student-skills` | student | Add skill manually |
| PATCH | `/student-skills/:id` | student | Update proficiency / status |
| DELETE | `/student-skills/:id` | student | Remove (soft-delete) |
| POST | `/student-skills/:id/confirm` | student | Confirm AI suggestion |
| POST | `/student-skills/:id/reject` | student | Reject AI suggestion |
| GET | `/categories` | any | List taxonomy categories |
| GET | `/skills` | any | Search skills |
| GET | `/graph/student/:id` | student/admin | Student sub-graph |
| GET | `/graph/skill/:id/related` | any | Related skills |
| GET | `/graph/skill/:id/prerequisites` | any | Prerequisite skills |
| GET | `/gap-analysis` | student | Skill gap vs. target |
| GET | `/gap-analysis/team/:teamId` | student | Skill gap vs. specific team |

---

## 5. Database Interactions

| Service | Model(s) | Operations |
|---------|---------|-----------|
| SkillExtractionService | (none persisted at extraction) | — |
| SkillNormalizationService | `Taxonomy` | read |
| SkillClassificationService | `Taxonomy` | read + conditional create |
| SkillProfileService | `StudentSkill` | CRUD |
| SkillEvidenceService | embedded in `StudentSkill.evidence[]` | create + read |
| KnowledgeGraphService | `SkillRelationship`, `Taxonomy` | CRUD |
| SkillGapAnalysisService | `StudentSkill`, `Taxonomy` | read |

---

## 6. AI Provider Integration

| Task | Provider | Function |
|------|---------|---------|
| Skill extraction from text | Anthropic Claude | `completeJson({ system, user, schema })` |
| Skill gap explanation | Anthropic Claude | `completeJson(...)` |
| Skill classification suggestion | Rule-based first; LLM fallback | `completeJson(...)` |

**Guard**: `isLlmEnabled()` check before every LLM call; graceful fallback if false.

---

## 7. Error Handling Strategy

| Error | Handling |
|-------|---------|
| LLM timeout | Return extraction result = empty list with `fallback: true` |
| LLM malformed JSON | Log error, throw AppError 502 |
| Taxonomy not found | Create pending taxonomy entry; flag for admin review |
| Duplicate skill | Upsert (update if exists) rather than insert |
| Unauthorized access | `protect` + `restrictTo` middleware |
| Invalid proficiency level | Joi validation rejects at boundary |

---

## 8. Integration Points for AI CORE 02 & 03

AI CORE 01 exposes stable read APIs that downstream modules consume:

| Consumer | Data Contract |
|---------|--------------|
| AI CORE 02 (Project Intelligence) | `GET /api/skill-intelligence/student-skills?status=confirmed` returns `[{skillName, proficiency, category}]` |
| AI CORE 02 | `GET /api/skill-intelligence/gap-analysis?targetSkills=...` |
| AI CORE 03 (Contribution Intelligence) | `GET /api/skill-intelligence/student-skills/:studentId` for capability profile |

These contracts must remain stable; breaking changes require versioning (`/v2/`).

---

## 9. Security Considerations

- Students access only their own `StudentSkill` records (enforced by `protect` + userId check).
- Admin can read any student's profile for moderation.
- Skill taxonomy management (create/update/delete) restricted to `admin`.
- LLM-extracted data is **not** auto-applied; student must confirm.
- Evidence text stored verbatim — no PII beyond what student provided.

