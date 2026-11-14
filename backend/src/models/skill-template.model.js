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
    requiredProficiencyNumber: { type: Number, min: 1, max: 5, default: 3 },
    importance: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    weight: { type: Number, min: 0.1, max: 3.0, default: 1.0 },
    requiredCompetencies: { type: [String], default: [] },
    reasoning: { type: String, default: '' },
  },
  { _id: false }
);

const skillTemplateSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, lowercase: true },
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

skillTemplateSchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.model('SkillTemplate', skillTemplateSchema);
