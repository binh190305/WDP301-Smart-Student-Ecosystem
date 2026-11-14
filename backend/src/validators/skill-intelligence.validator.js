/**
 * Joi validators for the Skill Intelligence API
 */
const Joi = require('joi');

const PROFICIENCY_LEVELS = ['beginner', 'elementary', 'intermediate', 'advanced', 'expert'];
const EVIDENCE_TYPES = ['PROJECT_DESCRIPTION', 'ACADEMIC_INTEREST', 'CERTIFICATE', 'WORK_EXPERIENCE', 'COURSE_COMPLETION', 'MANUAL'];

// POST /skill-intelligence/extract
const extractSchema = Joi.object({
  text: Joi.string().trim().min(10).max(5000).required().messages({
    'string.min': 'Nội dung phải có ít nhất 10 ký tự',
    'string.max': 'Nội dung không được vượt quá 5000 ký tự',
    'any.required': 'Nội dung là bắt buộc',
  }),
  evidenceType: Joi.string()
    .valid(...EVIDENCE_TYPES)
    .default('PROJECT_DESCRIPTION'),
  saveToProfile: Joi.boolean().default(false),
});

// POST /skill-intelligence/student-skills (manual add)
const addSkillSchema = Joi.object({
  skillName: Joi.string().trim().min(1).max(120).required(),
  proficiency: Joi.string()
    .valid(...PROFICIENCY_LEVELS)
    .default('beginner'),
  evidence: Joi.string().trim().max(500).optional().allow(''),
});

// PATCH /skill-intelligence/student-skills/:id
const updateSkillSchema = Joi.object({
  proficiency: Joi.string()
    .valid(...PROFICIENCY_LEVELS)
    .required(),
});

// POST /skill-intelligence/student-skills/:id/confirm
const confirmSkillSchema = Joi.object({
  proficiency: Joi.string()
    .valid(...PROFICIENCY_LEVELS)
    .optional(),
});

// GET /skill-intelligence/student-skills (list filter)
const listSkillsQuerySchema = Joi.object({
  status: Joi.string().valid('student_declared', 'ai_suggested', 'confirmed', 'rejected', 'active').optional(),
  category: Joi.string().optional(),
});

// GET /skill-intelligence/skills/search
const searchSkillsQuerySchema = Joi.object({
  q: Joi.string().trim().max(100).optional().allow(''),
  limit: Joi.number().integer().min(1).max(50).default(20),
});

// POST /skill-intelligence/gap-analysis
const gapAnalysisSchema = Joi.object({
  targetSkills: Joi.array()
    .items(
      Joi.alternatives().try(
        Joi.string(),
        Joi.object({
          name: Joi.string().required(),
          minProficiency: Joi.string().valid(...PROFICIENCY_LEVELS).optional(),
          minLevel: Joi.number().integer().min(1).max(5).optional(),
        })
      )
    )
    .min(1)
    .max(30)
    .required(),
  projectDescription: Joi.string().max(2000).optional().allow(''),
});

// objectId param
const objectIdSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[a-f\d]{24}$/i)
    .required()
    .messages({ 'string.pattern.base': 'ID không hợp lệ' }),
});

module.exports = {
  extractSchema,
  addSkillSchema,
  updateSkillSchema,
  confirmSkillSchema,
  listSkillsQuerySchema,
  searchSkillsQuerySchema,
  gapAnalysisSchema,
  objectIdSchema,
};

