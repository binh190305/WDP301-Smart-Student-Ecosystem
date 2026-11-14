/**
 * SkillProfileService
 * CRUD for StudentSkill documents.
 * Enforces the rule: AI suggestions never auto-overwrite student-confirmed skills.
 */
const StudentSkill = require('../models/student-skill.model');
const { PROFICIENCY_LEVELS, PROFICIENCY_NUMBERS } = StudentSkill;
const AppError = require('../utils/app-error');

/**
 * Get a student's active skill profile.
 * @param {string} studentId
 * @param {{ status?, category? }} filters
 * @returns {Promise<StudentSkill[]>}
 */
const getProfile = async (studentId, filters = {}) => {
  const query = { student: studentId, isActive: true };
  if (filters.status) query.status = filters.status;
  if (filters.taxonomyId) query.taxonomy = filters.taxonomyId;
  return StudentSkill.find(query)
    .populate('taxonomy', 'name normalizedName type description')
    .sort({ proficiencyLevel: -1, updatedAt: -1 })
    .lean();
};

/**
 * Add a skill manually by the student.
 * If the skill already exists (any status), upsert the proficiency if higher.
 */
const addManualSkill = async (studentId, { skillName, proficiency, evidence }) => {
  const normalizedName = skillName.trim().toLowerCase().replace(/\s+/g, ' ');
  const proficiencyLevel = PROFICIENCY_NUMBERS[proficiency] || 1;

  const existing = await StudentSkill.findOne({ student: studentId, normalizedName });

  if (existing) {
    // Student can always update their own declared skill
    // But cannot "confirm" a rejected skill with a simple add — must use confirm endpoint
    if (existing.status === 'rejected') {
      throw new AppError('Kỹ năng này đã bị từ chối. Sử dụng endpoint confirm để khôi phục.', 409);
    }
    existing.status = 'student_declared';
    existing.assessmentMethod = 'self_reported';
    if (proficiencyLevel > existing.proficiencyLevel) {
      existing.proficiency = proficiency;
      existing.proficiencyLevel = proficiencyLevel;
    }
    if (evidence) {
      existing.evidence.push({
        evidenceType: 'MANUAL',
        description: evidence,
        sourceText: '',
      });
    }
    existing.lastAssessedAt = new Date();
    await existing.save();
    return existing;
  }

  const skill = await StudentSkill.create({
    student: studentId,
    skillName,
    normalizedName,
    proficiency,
    proficiencyLevel,
    status: 'student_declared',
    assessmentMethod: 'self_reported',
    evidence: evidence
      ? [{ evidenceType: 'MANUAL', description: evidence, sourceText: '' }]
      : [],
    lastAssessedAt: new Date(),
  });
  return skill;
};

/**
 * Upsert AI-extracted skill suggestions.
 * RULE: Never overwrite student_declared or confirmed status.
 * @param {string} studentId
 * @param {Array} extractedSkills – from SkillExtractionService
 */
const upsertAISuggestions = async (studentId, extractedSkills) => {
  const results = { created: [], updated: [], skipped: [] };

  for (const s of extractedSkills) {
    const existing = await StudentSkill.findOne({
      student: studentId,
      normalizedName: s.normalizedName,
    });

    if (existing) {
      if (['student_declared', 'confirmed'].includes(existing.status)) {
        // Only add evidence, never change status or proficiency
        existing.evidence.push({
          evidenceType: s.evidenceType,
          description: s.reasoning || '',
          sourceText: s.evidence || '',
        });
        await existing.save();
        results.skipped.push(s.normalizedName);
        continue;
      }
      if (existing.status === 'rejected') {
        results.skipped.push(s.normalizedName);
        continue;
      }
      // Status is ai_suggested → update metadata
      existing.confidence = s.confidence;
      existing.extractionBatchId = s.batchId;
      existing.aiCategory = s.category;
      existing.evidence.push({
        evidenceType: s.evidenceType,
        description: s.reasoning || '',
        sourceText: s.evidence || '',
      });
      await existing.save();
      results.updated.push(s.normalizedName);
      continue;
    }

    // Create new ai_suggested record
    await StudentSkill.create({
      student: studentId,
      skillName: s.skillName,
      normalizedName: s.normalizedName,
      taxonomy: s.taxonomyId || null,
      proficiency: s.suggestedProficiency || 'beginner',
      proficiencyLevel: PROFICIENCY_NUMBERS[s.suggestedProficiency] || 1,
      confidence: s.confidence,
      status: 'ai_suggested',
      assessmentMethod: 'ai_extracted',
      aiCategory: s.category,
      extractionBatchId: s.batchId,
      evidence: [
        {
          evidenceType: s.evidenceType,
          description: s.reasoning || '',
          sourceText: s.evidence || '',
        },
      ],
      lastAssessedAt: new Date(),
    });
    results.created.push(s.normalizedName);
  }

  return results;
};

/**
 * Confirm an AI-suggested skill. Status → 'confirmed'.
 * Student may also update proficiency during confirmation.
 */
const confirmSkill = async (studentId, skillId, { proficiency } = {}) => {
  const skill = await StudentSkill.findOne({ _id: skillId, student: studentId });
  if (!skill) throw new AppError('Không tìm thấy kỹ năng', 404);
  if (skill.status === 'confirmed') return skill;

  skill.status = 'confirmed';
  skill.assessmentMethod = skill.assessmentMethod === 'ai_extracted' ? 'ai_extracted' : 'self_reported';
  if (proficiency && PROFICIENCY_LEVELS.includes(proficiency)) {
    skill.proficiency = proficiency;
    skill.proficiencyLevel = PROFICIENCY_NUMBERS[proficiency];
  }
  skill.lastAssessedAt = new Date();
  await skill.save();
  return skill;
};

/**
 * Reject an AI-suggested skill.
 */
const rejectSkill = async (studentId, skillId) => {
  const skill = await StudentSkill.findOne({ _id: skillId, student: studentId });
  if (!skill) throw new AppError('Không tìm thấy kỹ năng', 404);
  if (['student_declared', 'confirmed'].includes(skill.status)) {
    throw new AppError('Không thể từ chối kỹ năng do sinh viên tự khai hoặc đã xác nhận', 400);
  }
  skill.status = 'rejected';
  await skill.save();
  return skill;
};

/**
 * Update proficiency of an owned skill.
 */
const updateProficiency = async (studentId, skillId, proficiency) => {
  if (!PROFICIENCY_LEVELS.includes(proficiency)) {
    throw new AppError(`Mức độ không hợp lệ: ${proficiency}`, 422);
  }
  const skill = await StudentSkill.findOne({ _id: skillId, student: studentId });
  if (!skill) throw new AppError('Không tìm thấy kỹ năng', 404);
  if (skill.status === 'rejected') throw new AppError('Kỹ năng đã bị từ chối', 400);

  skill.proficiency = proficiency;
  skill.proficiencyLevel = PROFICIENCY_NUMBERS[proficiency];
  skill.lastAssessedAt = new Date();
  await skill.save();
  return skill;
};

/**
 * Soft-delete (deactivate) a skill.
 */
const removeSkill = async (studentId, skillId) => {
  const skill = await StudentSkill.findOne({ _id: skillId, student: studentId });
  if (!skill) throw new AppError('Không tìm thấy kỹ năng', 404);
  skill.isActive = false;
  await skill.save();
};

/**
 * Get AI-suggested skills pending review.
 */
const getPendingReview = async (studentId) =>
  StudentSkill.find({ student: studentId, status: 'ai_suggested', isActive: true })
    .populate('taxonomy', 'name normalizedName')
    .sort({ confidence: -1 })
    .lean();

module.exports = {
  getProfile,
  addManualSkill,
  upsertAISuggestions,
  confirmSkill,
  rejectSkill,
  updateProficiency,
  removeSkill,
  getPendingReview,
};

