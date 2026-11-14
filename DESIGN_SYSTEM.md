# STE – AI-Native Academic SaaS Design System (UI/UX Pro Max)

Established: November 2026
Style Direction: **AI-Native Glass & Data-Dense + Modern Bento Box Grid** (Linear + Vercel + Notion inspiration)

---

## 1. Color Palette Tokens

| Token Name | Hex Code | Purpose & Semantic Role |
|---|---|---|
| **Midnight Navy** | `#0B1220` | Core dark canvas, Knowledge Graph background, high-contrast headers |
| **Deep Navy** | `#172554` | Primary brand anchors, deep sidebar accents, academic authority |
| **Indigo 600** | `#4F46E5` | Primary action button, focused active states, key interactive highlights |
| **Violet 500** | `#8B5CF6` | AI features, NLP extraction highlights, AI-generated match chips |
| **Cyan 500** | `#06B6D4` | Real-time indicators, stream pipelines, tech skill category accents |
| **Slate 50 (Bg)** | `#F8FAFC` | Primary light canvas background, reduces eye strain for long study sessions |
| **Slate 900 (Text)**| `#0F172A` | Primary typography color, AAA accessible contrast against Slate 50/White |
| **Emerald 500** | `#10B981` | Verified skills (Evidence-Based), passing quizzes, high match rates (>=80%) |
| **Amber 500** | `#F59E0B` | Pending reviews, moderate gap alerts, warnings |
| **Rose 500** | `#EF4444` | Rejected evidence, critical skill missing alerts, error states |

---

## 2. Elevation, Surfaces & Border Radius

```css
/* Surface Tokens */
--card-radius: 20px;          /* rounded-2.5xl */
--badge-radius: 9999px;        /* rounded-full */
--button-radius: 12px;        /* rounded-xl */

/* Shadow Tokens */
--shadow-bento: 0 4px 20px -2px rgba(15, 23, 42, 0.04), 0 2px 6px -1px rgba(15, 23, 42, 0.02);
--shadow-bento-hover: 0 16px 32px -4px rgba(79, 70, 229, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.04);
--shadow-glass: 0 8px 32px 0 rgba(31, 38, 135, 0.08);

/* Borders */
--border-subtle: 1px solid rgba(226, 232, 240, 0.85);
--border-ai: 1px solid rgba(199, 210, 254, 0.6);
```

---

## 3. Module-Specific Treatment Rules

1. **Student Dashboard:** Bento Box Grid (2x2 KPI metrics, 2x1 AI recommended teams with MatchScoreBadges, 1x1 upcoming academic events & announcements).
2. **Skill Intelligence (`MySkillProfilePage` & `AiSkillAnalysisPage`):**
   - Data-Dense & Evidence-centric.
   - Distinct 3-tier visual badges: `Verified (Emerald)`, `Assessed (Sky)`, `Self-reported (Slate)`, `Needs Evidence (Amber)`.
   - AI Extraction with streaming confidence pills.
3. **Knowledge Graph (`KnowledgeGraphPage`):**
   - Dark Obsidian viewport (`#0B1220`) for maximum visual immersion.
   - Node clusters radiating glow effects with legible labels and connecting lines.
4. **AI Team Matching & Discovery (`DiscoverTeamsPage` & `TeamDetailPage`):**
   - Structured comparison cards.
   - Compatibility progress gauges and missing role pill badges.
5. **Admin / Lecturer Moderation (`AdminEvidenceReviewPage`):**
   - Clean operational layout with quick filters (`Project`, `GitHub`, `Certificates`).
   - Detailed rubric slider and 1-click status actions (`Verified`, `More Evidence`, `Reject`).

---

## 4. Interaction & Motion Rules

- **Hover state:** All interactive cards lift by `-2px` with a 200ms cubic-bezier ease (`transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1)`).
- **Buttons:** `active:scale-[0.98]` tactile depression with focus ring `focus:ring-4 focus:ring-indigo-500/15`.
- **Loading states:** Always use pulse skeleton placeholders reserving layout dimensions to avoid CLS (Cumulative Layout Shift < 0.1).

