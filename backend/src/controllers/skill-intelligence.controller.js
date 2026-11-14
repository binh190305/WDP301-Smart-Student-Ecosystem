/**
 * SkillIntelligenceController
 * Thin controller layer – delegates to specialized services.
 */
const asyncHandler = require('../utils/async-handler');
const AppError = require('../utils/app-error');
const extractionService = require('../skill-intelligence/extraction.service');
const profileService = require('../skill-intelligence/profile.service');
const kgService = require('../skill-intelligence/knowledge-graph.service');
const gapService = require('../skill-intelligence/gap-analysis.service');
const classificationService = require('../skill-intelligence/classification.service');
const templateService = require('../skill-intelligence/template.service');
const unifiedReqService = require('../skill-intelligence/unified-requirement.service');
const Taxonomy = require('../models/taxonomy.model');
const Team = require('../models/team.model');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const resolveStudentId = (req) => {
  const { id } = req.params;
  if (!id || id === 'me' || id === req.user.id) return req.user.id;
  if (['admin', 'lecturer'].includes(req.user.role)) return id;
  throw new AppError('Bạn không có quyền truy cập hồ sơ của sinh viên khác', 403);
};

// ─── SI-01: Skill Extraction & Unified Requirements ───────────────────────────
const extractSkills = asyncHandler(async (req, res) => {
  const { text, evidenceType, saveToProfile } = req.body;
  const studentId = req.user.id;

  const result = await extractionService.extractSkills(text, evidenceType, studentId);

  if (saveToProfile && result.skills.length > 0) {
    await profileService.upsertAISuggestions(studentId, result.skills);
  }

  res.status(200).json({
    success: true,
    data: {
      skills: result.skills,
      fallback: result.fallback,
      fallbackReason: result.fallbackReason,
      source: result.source,
      batchId: result.batchId,
      gapAnalysis: result.gapAnalysis || null,
      savedToProfile: saveToProfile && !result.fallback,
    },
  });
});

const buildProjectRequirements = asyncHandler(async (req, res) => {
  const result = await unifiedReqService.buildProjectRequirements(req.body);
  res.status(200).json({ success: true, data: result });
});

// ─── Project Templates ────────────────────────────────────────────────────────
const getTemplates = asyncHandler(async (req, res) => {
  const templates = await templateService.getTemplates();
  res.status(200).json({ success: true, data: templates });
});

const getTemplateByIdOrCode = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const template = await templateService.getTemplateByIdOrCode(id);
  if (!template) throw new AppError('Không tìm thấy dự án mẫu', 404);
  res.status(200).json({ success: true, data: template });
});

// ─── SI-03: Evidence-Based Skill Profile ──────────────────────────────────────
const getMyProfile = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const data = await profileService.getProfile(studentId, req.query);
  res.status(200).json({ success: true, data });
});

const getProfileMetrics = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const metrics = await profileService.getProfileMetrics(studentId);
  res.status(200).json({ success: true, data: metrics });
});

const getStudentProfile = asyncHandler(async (req, res) => {
  const studentId = resolveStudentId(req);
  const data = await profileService.getProfile(studentId, req.query);
  res.status(200).json({ success: true, data });
});

const addSkill = asyncHandler(async (req, res) => {
  const skill = await profileService.addManualSkill(req.user.id, req.body);
  res.status(201).json({ success: true, data: skill });
});

const submitEvidence = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const skill = await profileService.submitEvidence(req.user.id, id, req.body);
  res.status(200).json({ success: true, data: skill });
});

const reviewEvidence = asyncHandler(async (req, res) => {
  const { id, evidenceId } = req.params;
  const skill = await profileService.reviewEvidence(req.user, id, evidenceId, req.body);
  res.status(200).json({ success: true, data: skill });
});

const updateSkill = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const skill = await profileService.updateProficiency(req.user.id, id, req.body.proficiency);
  res.status(200).json({ success: true, data: skill });
});

const confirmSkill = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const skill = await profileService.confirmSkill(req.user.id, id, req.body);
  res.status(200).json({ success: true, data: skill });
});

const rejectSkill = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const skill = await profileService.rejectSkill(req.user.id, id);
  res.status(200).json({ success: true, data: skill });
});

const removeSkill = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await profileService.removeSkill(req.user.id, id);
  res.status(204).send();
});

const getPendingReview = asyncHandler(async (req, res) => {
  const skills = await profileService.getPendingReview(req.user.id);
  res.status(200).json({ success: true, data: skills });
});

// Admin: list all pending evidences across students
const listPendingEvidence = asyncHandler(async (req, res) => {
  const pending = await profileService.listPendingEvidence();
  res.status(200).json({ success: true, data: pending });
});

const saveSuggestions = asyncHandler(async (req, res) => {
  const { skills } = req.body;
  if (!Array.isArray(skills) || skills.length === 0) {
    throw new AppError('Danh sách kỹ năng không hợp lệ', 422);
  }
  const result = await profileService.upsertAISuggestions(req.user.id, skills);
  res.status(200).json({ success: true, data: result });
});

// ─── SI-02: Taxonomy / Categories ────────────────────────────────────────────
const getCategories = asyncHandler(async (req, res) => {
  const tree = await classificationService.getCategoryTree();
  res.status(200).json({ success: true, data: tree });
});

const searchSkillsTaxonomy = asyncHandler(async (req, res) => {
  const { q, limit } = req.query;
  const skills = await kgService.searchSkills({ q, type: 'skill', limit: Number(limit) || 20 });
  res.status(200).json({ success: true, data: skills });
});

// ─── SI-04: Knowledge Graph ───────────────────────────────────────────────────
const getStudentGraph = asyncHandler(async (req, res) => {
  const studentId = resolveStudentId(req);
  const graph = await kgService.getStudentGraph(studentId);
  res.status(200).json({ success: true, data: graph });
});

const getRelatedSkills = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const related = await kgService.getRelatedSkills(id, { limit: Number(req.query.limit) || 10 });
  res.status(200).json({ success: true, data: related });
});

const getPrerequisites = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const depth = Math.min(Number(req.query.depth) || 1, 3);
  const prereqs = await kgService.getPrerequisites(id, depth);
  res.status(200).json({ success: true, data: prereqs });
});

// ─── SI-05: Unified Skill Gap Analysis ────────────────────────────────────────
const analyzeGap = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const result = await gapService.analyzeGap(studentId, req.body);
  res.status(200).json({ success: true, data: result });
});

const analyzeGapVsTeam = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const { teamId } = req.params;

  const team = await Team.findById(teamId).lean();
  if (!team) throw new AppError('Không tìm thấy nhóm', 404);

  const targetSkills = [
    ...(team.skillRequirements || []).map((r) => ({
      name: r.name,
      minLevel: r.minLevel,
      importance: 'high',
      weight: 1.5,
    })),
    ...(team.skillsNeeded || []).map((s) => ({
      name: s,
      minLevel: 3,
      importance: 'medium',
      weight: 1.0,
    })),
  ];

  const result = await gapService.analyzeGap(studentId, {
    targetSkills,
    projectDescription: `${team.topic || ''} ${team.description || ''}`.trim(),
  });

  res.status(200).json({
    success: true,
    data: { team: { _id: team._id, name: team.name, topic: team.topic }, ...result },
  });
});

/**
 * POST /api/skill-intelligence/quiz-assessment
 * Save interactive quiz assessment result into student's Evidence-Based Skill Profile.
 */
const recordQuizAssessment = asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const { skillName, score, correctCount, totalQuestions, projectCode } = req.body;

  const result = await profileService.recordQuizAssessment(studentId, {
    skillName,
    score,
    correctCount,
    totalQuestions,
    projectCode,
  });

  res.status(200).json({
    success: true,
    message: result.message,
    data: result,
  });
});

module.exports = {
  extractSkills,
  buildProjectRequirements,
  getTemplates,
  getTemplateByIdOrCode,
  getMyProfile,
  getProfileMetrics,
  getStudentProfile,
  addSkill,
  submitEvidence,
  reviewEvidence,
  updateSkill,
  confirmSkill,
  rejectSkill,
  removeSkill,
  getPendingReview,
  saveSuggestions,
  getCategories,
  searchSkillsTaxonomy,
  getStudentGraph,
  getRelatedSkills,
  getPrerequisites,
  analyzeGap,
  analyzeGapVsTeam,
  recordQuizAssessment,
  listPendingEvidence,
};
