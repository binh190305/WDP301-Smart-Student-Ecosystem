const fs = require('fs/promises');
const User = require('../models/user.model');
const AppError = require('../utils/app-error');
const { parsePagination, buildPageResult } = require('../utils/pagination');
const { avatarUrlFor, resolveUploadPath } = require('../utils/uploads');

const STUDENT_PUBLIC_FIELDS = 'name avatarUrl major gpa skills interests description createdAt';

const updateProfile = async (userId, updates) => {
  const user = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true });
  if (!user) throw new AppError('Không tìm thấy người dùng', 404);

  // Sync any newly declared skills into StudentSkill collection for student role
  if (user.role === 'student' && Array.isArray(updates.skills)) {
    try {
      const StudentSkill = require('../models/student-skill.model');
      for (const rawName of updates.skills) {
        const skillName = String(rawName).trim();
        const normalizedName = skillName.toLowerCase().replace(/\s+/g, ' ');
        if (!normalizedName) continue;
        const existing = await StudentSkill.findOne({ student: userId, normalizedName });
        if (!existing) {
          await StudentSkill.create({
            student: userId,
            skillName,
            normalizedName,
            proficiency: 'intermediate',
            proficiencyLevel: 3,
            status: 'student_declared',
            assessmentMethod: 'self_reported',
          });
        }
      }
    } catch {
      // Soft fail: do not block profile save if skill-sync throws
    }
  }

  return user.toPublicJSON();
};

const updateAvatar = async (userId, file) => {
  if (!file) throw new AppError('Vui lòng chọn ảnh đại diện', 422);

  const user = await User.findById(userId);
  if (!user) throw new AppError('Không tìm thấy người dùng', 404);

  const previousAvatarPath = resolveUploadPath(user.avatarUrl);
  user.avatarUrl = avatarUrlFor(file);
  await user.save();

  if (previousAvatarPath) await fs.unlink(previousAvatarPath).catch((error) => {
    if (error.code !== 'ENOENT') throw error;
  });

  return user.toPublicJSON();
};

const searchStudents = async (query) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = { role: 'student', isActive: true };
  if (query.search) filter.$text = { $search: query.search };
  if (query.major) filter.major = query.major;
  if (query.skill) filter.skills = query.skill;

  const sort = query.search ? { score: { $meta: 'textScore' } } : { createdAt: -1 };
  const projection = query.search ? { score: { $meta: 'textScore' } } : {};
  const [students, total] = await Promise.all([
    User.find(filter, projection).select(STUDENT_PUBLIC_FIELDS).sort(sort).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  return buildPageResult(students, total, page, limit);
};

const getStudentPublicProfile = async (studentId) => {
  const student = await User.findOne({ _id: studentId, role: 'student', isActive: true })
    .select(STUDENT_PUBLIC_FIELDS)
    .lean();
  if (!student) throw new AppError('Không tìm thấy hồ sơ sinh viên', 404);
  return student;
};

const listUsers = async (query) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};
  if (query.role) filter.role = query.role;
  if (query.search) filter.$text = { $search: query.search };

  const [users, total] = await Promise.all([
    User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  return buildPageResult(users, total, page, limit);
};

const createUser = async (payload) => {
  const existing = await User.findOne({ email: payload.email }).select('_id').lean();
  if (existing) throw new AppError('Email này đã được đăng ký', 409);
  const user = await User.create(payload);
  return user.toPublicJSON();
};

const assertAdminAccountCanChange = async (user, updates, requesterId) => {
  const isSelf = user._id.toString() === requesterId.toString();
  if (isSelf && (updates.role !== undefined || updates.isActive !== undefined)) {
    throw new AppError('Bạn không thể tự thay đổi vai trò hoặc trạng thái tài khoản của mình', 409);
  }
  const removesActiveAdmin = user.role === 'admin' && user.isActive &&
    ((updates.role !== undefined && updates.role !== 'admin') || updates.isActive === false);
  if (removesActiveAdmin) {
    const activeAdminCount = await User.countDocuments({ role: 'admin', isActive: true });
    if (activeAdminCount <= 1) throw new AppError('Hệ thống phải còn ít nhất một quản trị viên hoạt động', 409);
  }
};

const updateUserAsAdmin = async (userId, updates, requesterId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('Không tìm thấy người dùng', 404);
  await assertAdminAccountCanChange(user, updates, requesterId);
  Object.assign(user, updates);
  await user.save();
  return user.toPublicJSON();
};

const deleteUser = async (userId, requesterId) => {
  if (userId.toString() === requesterId.toString()) throw new AppError('Bạn không thể tự xóa tài khoản của mình', 409);
  const user = await User.findById(userId).select('role isActive').lean();
  if (!user) throw new AppError('Không tìm thấy người dùng', 404);
  await assertAdminAccountCanChange(user, { isActive: false }, requesterId);
  await User.updateOne({ _id: userId }, { $set: { isActive: false }, $inc: { tokenVersion: 1 } });
};

const addPushToken = async (userId, token) => {
  await User.updateOne({ _id: userId }, { $addToSet: { pushTokens: token } });
};

const removePushToken = async (userId, token) => {
  await User.updateOne({ _id: userId }, { $pull: { pushTokens: token } });
};

module.exports = {
  updateProfile,
  updateAvatar,
  searchStudents,
  getStudentPublicProfile,
  listUsers,
  createUser,
  updateUserAsAdmin,
  deleteUser,
  addPushToken,
  removePushToken,
};
