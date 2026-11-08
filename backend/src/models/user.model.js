const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES: PROJECT_ROLES } = require('../recommendation/skill-catalog');

const GOALS = ['excellent', 'good', 'pass'];

const ROLES = ['student', 'lecturer', 'admin', 'club_leader'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ROLES, default: 'student' },
    avatarUrl: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    major: { type: String, default: '', trim: true },
    gpa: { type: Number, min: 0, max: 4, default: null },
    skills: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    description: { type: String, default: '', maxlength: 1000 },
    // Dữ liệu cho module gợi ý nhóm (tùy chọn)
    skillLevels: {
      type: [
        {
          _id: false,
          name: { type: String, required: true, trim: true, maxlength: 40 },
          level: { type: Number, required: true, min: 1, max: 5 },
        },
      ],
      default: [],
    },
    preferredRoles: { type: [{ type: String, enum: Object.keys(PROJECT_ROLES) }], default: [] },
    goal: { type: String, enum: [...GOALS, null], default: null },
    pushTokens: { type: [String], default: [], select: false },
    lastLoginAt: { type: Date, default: null },
    // ID tài khoản Google (claim "sub") khi đã liên kết đăng nhập Google
    googleId: { type: String, default: undefined, select: false },
    tokenVersion: { type: Number, default: 0 },
    passwordResetTokenHash: { type: String, default: null, select: false },
    passwordResetExpiresAt: { type: Date, default: null, select: false },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ googleId: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1, isActive: 1, createdAt: -1 });
userSchema.index({ role: 1, isActive: 1, major: 1, createdAt: -1 });
userSchema.index({ role: 1, isActive: 1, skills: 1, createdAt: -1 });
userSchema.index({ passwordResetTokenHash: 1, passwordResetExpiresAt: 1 });
userSchema.index({ skills: 1 });
userSchema.index({ interests: 1 });
userSchema.index({ name: 'text', description: 'text' });
userSchema.index({ createdAt: -1 });

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    avatarUrl: this.avatarUrl,
    isActive: this.isActive,
    major: this.major,
    gpa: this.gpa,
    skills: this.skills,
    interests: this.interests,
    description: this.description,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;
