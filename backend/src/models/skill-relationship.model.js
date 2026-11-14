const mongoose = require('mongoose');

const RELATIONSHIP_TYPES = [
  'PREREQUISITE_OF',
  'RELATED_TO',
  'PART_OF',
  'COMPLEMENTARY_TO',
  'APPLIED_IN',
];
const NODE_TYPES = ['skill', 'category'];
const SOURCES = ['system', 'admin', 'ai_suggested'];

const skillRelationshipSchema = new mongoose.Schema(
  {
    fromType: { type: String, enum: NODE_TYPES, required: true },
    fromId: { type: mongoose.Schema.Types.ObjectId, required: true },
    toType: { type: String, enum: NODE_TYPES, required: true },
    toId: { type: mongoose.Schema.Types.ObjectId, required: true },
    relationshipType: { type: String, enum: RELATIONSHIP_TYPES, required: true },
    weight: { type: Number, min: 0, max: 1, default: 0.5 },
    source: { type: String, enum: SOURCES, default: 'system' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// No duplicate edges
skillRelationshipSchema.index(
  { fromId: 1, toId: 1, relationshipType: 1 },
  { unique: true }
);
skillRelationshipSchema.index({ fromType: 1, fromId: 1, relationshipType: 1, isActive: 1 });
skillRelationshipSchema.index({ toType: 1, toId: 1, relationshipType: 1, isActive: 1 });

module.exports = mongoose.model('SkillRelationship', skillRelationshipSchema);
module.exports.RELATIONSHIP_TYPES = RELATIONSHIP_TYPES;

