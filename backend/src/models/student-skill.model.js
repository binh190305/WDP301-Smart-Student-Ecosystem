const mongoose = require('mongoose');

const PROFICIENCY_LEVELS = ['beginner', 'elementary', 'intermediate', 'advanced', 'expert'];
const PROFICIENCY_NUMBERS = { beginner: 1, elementary: 2, intermediate: 3, advanced: 4, expert: 5 };

const CLASSIFICATIONS = ['self_reported', 'assessed', 'verified'];

const VERIFICATION_STATUSES = [
  'SELF_REPORTED',
  'EVIDENCE_SUBMITTED',
  'AI_ANALYZED',
  'PENDING_REVIEW',
  'ASSESSED',
  'VERIFIED',
  'REJECTED',
  'MORE_EVIDENCE_REQUIRED',
];

const EVIDENCE_TYPES = [
  'QUIZ_RESULT',
  'ASSIGNMENT',
  'PROJECT',
  'GITHUB_REPO',
  'COURSE_COMPLETION',
  'CERTIFICATE',
  'TEAM_CONTRIBUTION',
  'PRACTICAL_ASSESSMENT',
  'MANUAL',
  'PROJECT_DESCRIPTION',
  'WORK_EXPERIENCE',
  'ACADEMIC_INTEREST',
];

const SKILL_STATUSES = ['student_declared', 'ai_suggested', 'confirmed', 'rejected'];
const ASSESSMENT_METHODS = [
  'self_reported',
  'ai_extracted',
  'verified',
  'quiz_assessed',
  'assignment_graded',
  'practical_assessment',
];

const competencySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    requiredLevel: { type: Number, min: 1, max: 5, default: 3 },
    score: { type: Number, min: 0, max: 100, default: null },
    status: {
      type: String,
      enum: ['untested', 'developing', 'competent', 'mastered'],
      default: 'untested',
    },
    evidenceSnippet: { type: String, default: '' },
    strengths: { type: String, default: '' },
    weaknesses: { type: String, default: '' },
  },
  { _id: true }
);

const evidenceSchema = new mongoose.Schema(
  {
    evidenceId: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    evidenceType: { type: String, enum: EVIDENCE_TYPES, required: true },
    title: { type: String, maxlength: 200, default: '' },
    description: { type: String, maxlength: 2000, default: '' },
    source: { type: String, maxlength: 500, default: '' },
    sourceText: { type: String, maxlength: 5000, default: '' },
    sourceUrl: { type: String, maxlength: 2000, default: '' },
    fileUrl: { type: String, maxlength: 2000, default: '' },
    linkedEntity: {
      entityType: {
        type: String,
        enum: ['QuizAttempt', 'Submission', 'Team', 'Project', 'Certificate', 'External', 'None'],
        default: 'None',
      },
      entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
    },
    verificationStatus: {
      type: String,
      enum: VERIFICATION_STATUSES,
      default: 'PENDING_REVIEW',
    },
    assessmentResult: {
      score: { type: Number, min: 0, max: 100, default: null },
      rubric: { type: String, default: '' },
      feedback: { type: String, default: '' },
      competenciesDemonstrated: { type: [String], default: [] },
    },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    reviewerComments: { type: String, maxlength: 1000, default: '' },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const assessmentHistorySchema = new mongoose.Schema(
  {
    assessmentDate: { type: Date, default: Date.now },
    method: { type: String, required: true },
    score: { type: Number, min: 0, max: 100, default: null },
    rubric: { type: String, default: '' },
    proficiencyAssessed: { type: String, enum: PROFICIENCY_LEVELS, default: 'intermediate' },
    assessor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    notes: { type: String, default: '' },
  },
  { _id: true }
);

const verificationHistorySchema = new mongoose.Schema(
  {
    changedAt: { type: Date, default: Date.now },
    fromStatus: { type: String, required: true },
    toStatus: { type: String, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reason: { type: String, default: '' },
    comments: { type: String, default: '' },
  },
  { _id: true }
);

const studentSkillSchema = new mongoose.Schema(
  {
    // Ownership
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Skill identity
    skillName: { type: String, required: true, trim: true, maxlength: 120 },
    normalizedName: { type: String, required: true, maxlength: 120 },
    taxonomy: { type: mongoose.Schema.Types.ObjectId, ref: 'Taxonomy', default: null },

    // 3-Tier Classification (Self-reported, Assessed, Verified)
    classification: {
      type: String,
      enum: CLASSIFICATIONS,
      default: 'self_reported',
    },

    // Verification Workflow Status
    verificationStatus: {
      type: String,
      enum: VERIFICATION_STATUSES,
      default: 'SELF_REPORTED',
    },

    // Proficiency (string label + numeric for scoring)
    proficiency: { type: String, enum: PROFICIENCY_LEVELS, default: 'beginner' },
    proficiencyLevel: { type: Number, min: 1, max: 5, default: 1 },

    // Explicit Proficiency Score (0-100 based on rubrics/quizzes/assignments)
    proficiencyScore: { type: Number, min: 0, max: 100, default: null },

    // AI extraction confidence (0-1) - strictly model confidence, not student proficiency!
    aiConfidence: { type: Number, min: 0, max: 1, default: null },
    confidence: { type: Number, min: 0, max: 1, default: null }, // for backwards compatibility

    // Lifecycle status (legacy compatible)
    status: { type: String, enum: SKILL_STATUSES, default: 'student_declared' },

    // How proficiency was determined
    assessmentMethod: { type: String, enum: ASSESSMENT_METHODS, default: 'self_reported' },

    // Detailed Competency Breakdown
    competencies: { type: [competencySchema], default: [] },

    // Evidence trail
    evidence: { type: [evidenceSchema], default: [] },

    // History trails
    assessmentHistory: { type: [assessmentHistorySchema], default: [] },
    verificationHistory: { type: [verificationHistorySchema], default: [] },

    // AI batch tracking
    extractionBatchId: { type: String, default: null },
    aiCategory: { type: String, default: null },

    // Audit
    lastAssessedAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Normalise before save & keep fields synchronized
studentSkillSchema.pre('validate', function normalise(next) {
  if (this.skillName) {
    this.normalizedName = this.skillName.trim().toLowerCase().replace(/\s+/g, ' ');
  }
  // Keep proficiencyLevel in sync with proficiency string
  if (this.proficiency) {
    this.proficiencyLevel = PROFICIENCY_NUMBERS[this.proficiency] || 1;
  }
  // Keep confidence and aiConfidence aligned
  if (this.confidence !== null && this.confidence !== undefined && this.aiConfidence === null) {
    this.aiConfidence = this.confidence;
  } else if (this.aiConfidence !== null && this.aiConfidence !== undefined && this.confidence === null) {
    this.confidence = this.aiConfidence;
  }

  // Synchronize classification & verificationStatus
  if (this.verificationStatus === 'VERIFIED') {
    this.classification = 'verified';
    this.status = 'confirmed';
  } else if (this.verificationStatus === 'ASSESSED') {
    this.classification = 'assessed';
    this.status = 'confirmed';
  } else if (this.verificationStatus === 'SELF_REPORTED' && !this.classification) {
    this.classification = 'self_reported';
  }

  next();
});

// Indices
studentSkillSchema.index({ student: 1, normalizedName: 1 }, { unique: true });
studentSkillSchema.index({ student: 1, status: 1, isActive: 1 });
studentSkillSchema.index({ student: 1, classification: 1, isActive: 1 });
studentSkillSchema.index({ student: 1, verificationStatus: 1, isActive: 1 });
studentSkillSchema.index({ student: 1, isActive: 1, proficiencyLevel: -1 });
studentSkillSchema.index({ taxonomy: 1 });
studentSkillSchema.index({ normalizedName: 1 });

module.exports = mongoose.model('StudentSkill', studentSkillSchema);
module.exports.PROFICIENCY_LEVELS = PROFICIENCY_LEVELS;
module.exports.PROFICIENCY_NUMBERS = PROFICIENCY_NUMBERS;
module.exports.CLASSIFICATIONS = CLASSIFICATIONS;
module.exports.VERIFICATION_STATUSES = VERIFICATION_STATUSES;
module.exports.EVIDENCE_TYPES = EVIDENCE_TYPES;
module.exports.SKILL_STATUSES = SKILL_STATUSES;
module.exports.ASSESSMENT_METHODS = ASSESSMENT_METHODS;
