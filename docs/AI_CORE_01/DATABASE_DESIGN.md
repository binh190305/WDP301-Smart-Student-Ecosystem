# AI CORE 01 – Database Design
_Smart Student Ecosystem (STE) — 2026-11-03_

---

## 1. Design Principles

- **Preserve all existing collections** — no drops, no resets.
- **Extend `Taxonomy`** (add optional `parentId`, `aliases[]`) via a backward-compatible schema update.
- **New collections**: `StudentSkill`, `SkillRelationship`.
- All new fields are **optional or have defaults** to maintain backward compatibility.
- Soft-delete via `isActive` flag; no hard deletes.

---

## 2. Taxonomy Model (Extended)

**Existing model**: `backend/src/models/taxonomy.model.js`

**Backward-compatible additions**:
```js
parentId:    { type: ObjectId, ref: 'Taxonomy', default: null }
aliases:     { type: [String], default: [] }
metadata:    { type: Mixed, default: {} }   // extensible
```

**Updated indexes**:
```js
{ type: 1, parentId: 1, isActive: 1 }  // for category tree traversal
{ type: 1, aliases: 1 }                // alias lookup
```

---

## 3. StudentSkill Model (New)

**Collection**: `student_skills`

```js
{
  _id: ObjectId,

  // Ownership
  student:         { type: ObjectId, ref: 'User', required: true },

  // Skill reference
  skillName:       { type: String, required: true, trim: true, maxlength: 120 },
  normalizedName:  { type: String, required: true, maxlength: 120 },
  taxonomy:        { type: ObjectId, ref: 'Taxonomy', default: null },

  // Proficiency
  proficiency: {
    type: String,
    enum: ['beginner','elementary','intermediate','advanced','expert'],
    default: 'beginner'
  },
  proficiencyLevel: { type: Number, min: 1, max: 5, default: 1 },
  // 1=beginner 2=elementary 3=intermediate 4=advanced 5=expert

  // Confidence (AI extraction quality, not proficiency)
  confidence:      { type: Number, min: 0, max: 1, default: null },

  // Status lifecycle
  status: {
    type: String,
    enum: ['student_declared','ai_suggested','confirmed','rejected'],
    default: 'student_declared'
  },

  // Assessment method
  assessmentMethod: {
    type: String,
    enum: ['self_reported','ai_extracted','verified'],
    default: 'self_reported'
  },

  // Evidence array (inline – simplifies queries)
  evidence: [{
    _id: false,
    evidenceType: {
      type: String,
      enum: ['PROJECT_DESCRIPTION','ACADEMIC_INTEREST','CERTIFICATE',
             'WORK_EXPERIENCE','COURSE_COMPLETION','MANUAL'],
      required: true
    },
    description: { type: String, maxlength: 500 },
    sourceText:  { type: String, maxlength: 2000 },
    addedAt:     { type: Date, default: Date.now }
  }],

  // AI extraction metadata
  extractionBatchId: { type: String, default: null },
  aiCategory:        { type: String, default: null },

  // Audit
  lastAssessedAt: { type: Date, default: null },
  isActive:       { type: Boolean, default: true },
  createdAt:      Date,
  updatedAt:      Date
}
```

**Indexes**:
```js
{ student: 1, normalizedName: 1 }       // unique per student per skill
{ student: 1, status: 1 }               // list by status
{ student: 1, isActive: 1, proficiency: 1 }
{ taxonomy: 1 }
{ normalizedName: 1 }
```

> **Unique constraint**: `{ student, normalizedName }` — prevents duplicate skills per student.

---

## 4. SkillRelationship Model (New – Knowledge Graph Edges)

**Collection**: `skill_relationships`

```js
{
  _id: ObjectId,

  // Source node
  fromType: { type: String, enum: ['skill','category','student'], required: true },
  fromId:   { type: ObjectId, required: true },

  // Target node
  toType:   { type: String, enum: ['skill','category'], required: true },
  toId:     { type: ObjectId, required: true },

  // Edge type
  relationshipType: {
    type: String,
    enum: ['PREREQUISITE_OF','RELATED_TO','PART_OF','COMPLEMENTARY_TO','APPLIED_IN'],
    required: true
  },

  // Edge weight (for ranking related skills)
  weight:    { type: Number, min: 0, max: 1, default: 0.5 },

  // Provenance
  source:    { type: String, enum: ['system','admin','ai_suggested'], default: 'system' },

  isActive:  { type: Boolean, default: true },
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
```js
{ fromType: 1, fromId: 1, relationshipType: 1 }   // outgoing edges
{ toType: 1, toId: 1, relationshipType: 1 }        // incoming edges
{ fromId: 1, toId: 1, relationshipType: 1 }, { unique: true }  // no duplicate edges
```

> **Note**: `HAS_SKILL` edges (student → skill) are implicit from `StudentSkill` documents and do not require separate `SkillRelationship` records. This keeps the KG lean.

---

## 5. Entity Relationship Diagram

```
┌───────────┐         ┌──────────────┐        ┌──────────────────┐
│   User    │ 1     * │ StudentSkill │ * ──── 1│   Taxonomy       │
│           │─────────│              │         │  (skill/category)│
│ _id       │         │ student ─────┘         │                  │
│ skills[]  │         │ normalizedName          │ parentId ────────┐
│ skillLevels│        │ proficiency             │ aliases[]        │
│ ...       │         │ status                  └──────────────────┘
└───────────┘         │ confidence                       │
                      │ evidence[]                        │
                      │ taxonomy ────────────────────────┘
                      └──────────────┘

┌──────────────────┐
│ SkillRelationship│
│                  │
│ fromType         │  fromId ─→ Taxonomy (skill or category)
│ fromId           │  toId   ─→ Taxonomy (skill or category)
│ toType           │
│ toId             │
│ relationshipType │
│ weight           │
└──────────────────┘
```

---

## 6. Initial Knowledge Graph Seed Data

The following relationships will be seeded at startup if the collection is empty:

```
JavaScript   → PREREQUISITE_OF → React
JavaScript   → PREREQUISITE_OF → Node.js
JavaScript   → PREREQUISITE_OF → TypeScript
Python       → PREREQUISITE_OF → Machine Learning
Python       → PREREQUISITE_OF → Deep Learning
Java         → PREREQUISITE_OF → Spring Boot
SQL          → RELATED_TO      → PostgreSQL
SQL          → RELATED_TO      → MySQL
SQL          → RELATED_TO      → SQL Server
React        → COMPLEMENTARY_TO → Node.js
Spring Boot  → COMPLEMENTARY_TO → SQL Server
Docker       → COMPLEMENTARY_TO → Kubernetes
```

---

## 7. Migration Strategy

1. **Taxonomy extension** — Add `parentId`, `aliases` fields with `default: null / []`. No migration needed (Mongoose handles missing fields gracefully via defaults).
2. **StudentSkill** — New collection; no data migration needed.
3. **SkillRelationship** — New collection; seeded with initial graph data via `seed-skill-graph.js` utility.

**Rollback strategy**:
- Drop `student_skills` and `skill_relationships` collections.
- Remove the `parentId` and `aliases` indexes from `taxonomies`.
- No changes to existing collections means rollback is safe.

---

## 8. Indexing Strategy

| Collection | Index | Rationale |
|------------|-------|-----------|
| `student_skills` | `{student,normalizedName}` unique | Prevent duplicates |
| `student_skills` | `{student,status,isActive}` | Profile list queries |
| `student_skills` | `{taxonomy}` | Category drill-down |
| `skill_relationships` | `{fromId,toId,relationshipType}` unique | No duplicate edges |
| `skill_relationships` | `{fromType,fromId,relationshipType}` | Outgoing traversal |
| `skill_relationships` | `{toType,toId,relationshipType}` | Incoming traversal |
| `taxonomies` | `{type,parentId,isActive}` | Category tree |

---

## 9. Proficiency Level Definitions

| Level | Number | Label | Criteria |
|-------|--------|-------|---------|
| Beginner | 1 | Người mới bắt đầu | Awareness of the skill; little or no practical experience |
| Elementary | 2 | Cơ bản | Can perform simple tasks with guidance |
| Intermediate | 3 | Trung cấp | Can work independently on standard tasks |
| Advanced | 4 | Nâng cao | Can solve complex problems; mentors others |
| Expert | 5 | Chuyên gia | Industry-recognized expertise; produces novel solutions |

> **Rule**: AI extraction may suggest proficiency ≤ 3 (Intermediate) unless the evidence explicitly describes advanced/expert-level work. Students may escalate their own proficiency level.

