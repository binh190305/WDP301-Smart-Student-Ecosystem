/**
 * Skill Intelligence Routes
 * Mounted at /api/skill-intelligence
 */
const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  extractSchema,
  addSkillSchema,
  updateSkillSchema,
  confirmSkillSchema,
  listSkillsQuerySchema,
  searchSkillsQuerySchema,
  gapAnalysisSchema,
} = require('../validators/skill-intelligence.validator');
const ctrl = require('../controllers/skill-intelligence.controller');

const router = express.Router();

// All routes require authentication
router.use(protect);

// ── Project Templates (DB-backed) ─────────────────────────────────────────────
// GET /api/skill-intelligence/templates
router.get('/templates', ctrl.getTemplates);

// GET /api/skill-intelligence/templates/:id
router.get('/templates/:id', ctrl.getTemplateByIdOrCode);

// ── Unified Project Requirement Engine ────────────────────────────────────────
// POST /api/skill-intelligence/project-requirements/analyze
router.post('/project-requirements/analyze', ctrl.buildProjectRequirements);

// ── SI-01: AI Skill Extraction ────────────────────────────────────────────────
// POST /api/skill-intelligence/extract
router.post('/extract', restrictTo('student'), validate(extractSchema), ctrl.extractSkills);

// POST /api/skill-intelligence/student-skills/suggestions (save batch)
router.post('/student-skills/suggestions', restrictTo('student'), ctrl.saveSuggestions);

// ── SI-03: Evidence-Based Skill Profile ────────────────────────────────────────
// GET  /api/skill-intelligence/profile/metrics
router.get('/profile/metrics', restrictTo('student'), ctrl.getProfileMetrics);

// GET  /api/skill-intelligence/student-skills  (my own profile)
router.get('/student-skills', restrictTo('student'), validate(listSkillsQuerySchema, 'query'), ctrl.getMyProfile);

// POST /api/skill-intelligence/student-skills  (add manual skill)
router.post('/student-skills', restrictTo('student'), validate(addSkillSchema), ctrl.addSkill);

// POST /api/skill-intelligence/student-skills/:id/evidence (submit evidence)
router.post('/student-skills/:id/evidence', restrictTo('student'), ctrl.submitEvidence);

// POST /api/skill-intelligence/student-skills/:id/evidence/:evidenceId/review (reviewer verify)
router.post(
  '/student-skills/:id/evidence/:evidenceId/review',
  restrictTo('lecturer', 'admin'),
  ctrl.reviewEvidence
);

// PATCH /api/skill-intelligence/student-skills/:id  (update proficiency)
router.patch('/student-skills/:id', restrictTo('student'), validate(updateSkillSchema), ctrl.updateSkill);

// POST /api/skill-intelligence/student-skills/:id/confirm
router.post('/student-skills/:id/confirm', restrictTo('student'), validate(confirmSkillSchema), ctrl.confirmSkill);

// POST /api/skill-intelligence/student-skills/:id/reject
router.post('/student-skills/:id/reject', restrictTo('student'), ctrl.rejectSkill);

// DELETE /api/skill-intelligence/student-skills/:id
router.delete('/student-skills/:id', restrictTo('student'), ctrl.removeSkill);

// GET /api/skill-intelligence/student-skills/pending
router.get('/student-skills/pending', restrictTo('student'), ctrl.getPendingReview);

// Admin / Lecturer: view any student's profile
// GET /api/skill-intelligence/students/:id/skills
router.get(
  '/students/:id/skills',
  restrictTo('admin', 'lecturer'),
  validate(listSkillsQuerySchema, 'query'),
  ctrl.getStudentProfile
);

// ── SI-02: Taxonomy / Categories ──────────────────────────────────────────────
// GET /api/skill-intelligence/categories
router.get('/categories', ctrl.getCategories);

// GET /api/skill-intelligence/skills/search?q=react
router.get('/skills/search', validate(searchSkillsQuerySchema, 'query'), ctrl.searchSkillsTaxonomy);

// ── SI-04: Knowledge Graph ────────────────────────────────────────────────────
// GET /api/skill-intelligence/graph/me
router.get('/graph/me', restrictTo('student'), ctrl.getStudentGraph);

// GET /api/skill-intelligence/graph/students/:id (admin/lecturer)
router.get('/graph/students/:id', restrictTo('admin', 'lecturer'), ctrl.getStudentGraph);

// GET /api/skill-intelligence/graph/skills/:id/related
router.get('/graph/skills/:id/related', ctrl.getRelatedSkills);

// GET /api/skill-intelligence/graph/skills/:id/prerequisites
router.get('/graph/skills/:id/prerequisites', ctrl.getPrerequisites);

// ── SI-05: Skill Gap Analysis ─────────────────────────────────────────────────
// POST /api/skill-intelligence/gap-analysis
router.post('/gap-analysis', restrictTo('student'), validate(gapAnalysisSchema), ctrl.analyzeGap);

// GET /api/skill-intelligence/gap-analysis/team/:teamId
router.get('/gap-analysis/team/:teamId', restrictTo('student'), ctrl.analyzeGapVsTeam);

module.exports = router;
