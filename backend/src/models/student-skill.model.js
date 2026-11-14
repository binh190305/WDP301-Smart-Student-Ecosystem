const mongoose = require('mongoose');

const PROFICIENCY_LEVELS = ['beginner', 'elementary', 'intermediate', 'advanced', 'expert'];
const PROFICIENCY_NUMBERS = { beginner: 1, elementary: 2, intermediate: 3, advanced: 4, expert: 5 };
const EVIDENCE_TYPES = [
  'PROJECT_DESCRIPTION',
  'ACADEMIC_INTEREST',
  'CERTIFICATE',
  'WORK_EXPERIENCE',
  'COURSE_COMPLETION',
  'MANUAL',
];
const SKILL_STATUSES = ['student_declared', 'ai_suggested', 'confirmed', 'rejected'];
const ASSESSMENT_METHODS = ['self_reported', 'ai_extracted', 'verified'];

const evidenceSchema = new mongoose.Schema(
  {
    evidenceType: { type: String, enum: EVIDENCE_TYPES, required: true },
    description: { type: String, maxlength: 500, default: '' },
    sourceText: { type: String, maxlength: 2000, default: '' },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const studentSkillSchema = new mongoose.Schema(
  {
    // Ownership
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Skill identity
    skillName: { type: String, required: true, trim: true, maxlength: 120 },
    normalizedName: { type: String, required: true, maxlength: 120 },
    taxonomy: { type: mongoose.Schema.Types.ObjectId, ref: 'Taxonomy', default: null },

    // Proficiency (string label + numeric for scoring)
    proficiency: { type: String, enum: PROFICIENCY_LEVELS, default: 'beginner' },
    proficiencyLevel: { type: Number, min: 1, max: 5, default: 1 },

    // AI extraction confidence (0-1); null for manually added skills
    confidence: { type: Number, min: 0, max: 1, default: null },

    // Lifecycle status
    status: { type: String, enum: SKILL_STATUSES, default: 'student_declared' },

    // How proficiency was determined
    assessmentMethod: { type: String, enum: ASSESSMENT_METHODS, default: 'self_reported' },

    // Evidence trail
    evidence: { type: [evidenceSchema], default: [] },

    // AI batch tracking
    extractionBatchId: { type: String, default: null },
    aiCategory: { type: String, default: null },

    // Audit
    lastAssessedAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Normalise before save
studentSkillSchema.pre('validate', function normalise(next) {
  if (this.skillName) {
    this.normalizedName = this.skillName.trim().toLowerCase().replace(/\s+/g, ' ');
  }
  // Keep proficiencyLevel in sync with proficiency string
  if (this.proficiency) {
    this.proficiencyLevel = PROFICIENCY_NUMBERS[this.proficiency] || 1;
  }
  next();
});

// Unique per student per normalised skill name
studentSkillSchema.index({ student: 1, normalizedName: 1 }, { unique: true });
studentSkillSchema.index({ student: 1, status: 1, isActive: 1 });
studentSkillSchema.index({ student: 1, isActive: 1, proficiencyLevel: -1 });
studentSkillSchema.index({ taxonomy: 1 });
studentSkillSchema.index({ normalizedName: 1 });

module.exports = mongoose.model('StudentSkill', studentSkillSchema);
module.exports.PROFICIENCY_LEVELS = PROFICIENCY_LEVELS;
module.exports.PROFICIENCY_NUMBERS = PROFICIENCY_NUMBERS;
module.exports.EVIDENCE_TYPES = EVIDENCE_TYPES;
module.exports.SKILL_STATUSES = SKILL_STATUSES;

