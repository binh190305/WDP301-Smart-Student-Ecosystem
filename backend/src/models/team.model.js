const mongoose = require('mongoose');
const { ROLES: PROJECT_ROLES } = require('../recommendation/skill-catalog');

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['leader', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', maxlength: 2000 },
    topic: { type: String, default: '', trim: true },
    major: { type: String, default: '', trim: true },
    skillsNeeded: { type: [String], default: [] },
    leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: { type: [memberSchema], default: [] },
    maxMembers: {
      type: Number,
      default: 5,
      min: 1,
      max: 20,
      validate: {
        validator(value) {
          return !this.members || value >= this.members.length;
        },
        message: 'Số thành viên tối đa không thể nhỏ hơn số thành viên hiện tại',
      },
    },
    status: { type: String, enum: ['recruiting', 'full', 'closed'], default: 'recruiting' },
    // Dữ liệu cho module gợi ý nhóm (tùy chọn)
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
    skillRequirements: {
      type: [
        {
          _id: false,
          name: { type: String, required: true, trim: true, maxlength: 40 },
          minLevel: { type: Number, required: true, min: 1, max: 5 },
        },
      ],
      default: [],
    },
    rolesNeeded: { type: [{ type: String, enum: Object.keys(PROJECT_ROLES) }], default: [] },
    goal: { type: String, enum: ['excellent', 'good', 'pass', null], default: null },
  },
  { timestamps: true }
);

teamSchema.index({ name: 'text', description: 'text', topic: 'text' });
teamSchema.index({ major: 1, status: 1 });
teamSchema.index({ skillsNeeded: 1 });
teamSchema.index({ leader: 1 });
teamSchema.index({ course: 1, status: 1 });
teamSchema.index({ 'members.user': 1 });
teamSchema.index({ createdAt: -1 });

teamSchema.methods.isMember = function isMember(userId) {
  return this.members.some((m) => m.user.toString() === userId.toString());
};

teamSchema.methods.syncStatus = function syncStatus() {
  if (this.status !== 'closed') {
    this.status = this.members.length >= this.maxMembers ? 'full' : 'recruiting';
  }
};

module.exports = mongoose.model('Team', teamSchema);
