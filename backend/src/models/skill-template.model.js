const mongoose = require('mongoose');

const skillTemplateRequirementSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true, trim: true },
    category: { type: String, default: 'General' },
    requiredLevel: {
      type: String,
      enum: ['beginner', 'elementary', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate',
    },
    minProficiency: {
      type: String,
      enum: ['beginner', 'elementary', 'intermediate', 'advanced', 'expert'],
    },
    requiredProficiencyNumber: { type: Number, min: 1, max: 5, default: 3 },
    minProficiencyLevel: { type: Number, min: 1, max: 5 },
    importance: {
      type: String,
      enum: ['high', 'medium', 'low', 'core', 'important', 'nice_to_have'],
      default: 'medium',
      set: (val) => {
        if (val === 'core') return 'high';
        if (val === 'important') return 'medium';
        if (val === 'nice_to_have') return 'low';
        return val;
      },
    },
    weight: { type: Number, min: 0.1, max: 3.0, default: 1.0 },
    requiredCompetencies: { type: [String], default: [] },
    reasoning: { type: String, default: '' },
  },
  { _id: false }
);

const skillTemplateSchema = new mongoose.Schema(
  {
    templateId: { type: String, trim: true },
    code: { type: String, required: true, trim: true, lowercase: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    sampleProjectText: { type: String, default: '' },
    roleRequirements: { type: [String], default: [] },
    requiredSkills: { type: [skillTemplateRequirementSchema], default: [] },
    tags: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

skillTemplateSchema.pre('validate', function syncTemplateIdentifiers(next) {
  if (!this.templateId && this.code) {
    this.templateId = this.code;
  }
  if (!this.code && this.templateId) {
    this.code = this.templateId.toLowerCase();
  }
  next();
});

skillTemplateSchema.index({ code: 1 }, { sparse: true });
skillTemplateSchema.index({ templateId: 1 }, { sparse: true });
skillTemplateSchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.model('SkillTemplate', skillTemplateSchema);
