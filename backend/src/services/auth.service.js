const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/user.model');
const AppError = require('../utils/app-error');
const { signToken } = require('../utils/token');
const { nodeEnv, googleClientId, googleAllowedDomains } = require('../config/env');

const googleClient = new OAuth2Client();

const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;

const createAccessToken = (user) =>
  signToken({ sub: user._id.toString(), role: user.role, tokenVersion: user.tokenVersion });

const register = async ({ name, email, password, major }) => {
  const existing = await User.findOne({ email }).select('_id').lean();
  if (existing) {
    throw new AppError('Email này đã được đăng ký', 409);
  }

  const user = await User.create({ name, email, password, major, role: 'student' });
  const token = createAccessToken(user);
  return { token, user: user.toPublicJSON() };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Email hoặc mật khẩu không chính xác', 401);
  }
  if (!user.isActive) {
    throw new AppError('Tài khoản của bạn đã bị vô hiệu hóa', 403);
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const token = createAccessToken(user);
  return { token, user: user.toPublicJSON() };
};

// Xác thực ID token do Google Identity Services trả về (chữ ký, hạn dùng, audience = client ID của mình).
const verifyGoogleCredential = async (credential) => {
  if (!googleClientId) throw new AppError('Đăng nhập Google chưa được cấu hình', 503);
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: googleClientId });
    payload = ticket.getPayload();
  } catch {
    throw new AppError('Phiên đăng nhập Google không hợp lệ, vui lòng thử lại', 401);
  }
  if (!payload?.email || !payload.email_verified) {
    throw new AppError('Email Google của bạn chưa được xác minh', 401);
  }
  const email = payload.email.toLowerCase();
  const domain = email.split('@')[1];
  if (googleAllowedDomains.length && !googleAllowedDomains.includes(domain)) {
    throw new AppError(`Chỉ chấp nhận email thuộc: ${googleAllowedDomains.join(', ')}`, 403);
  }
  return { googleId: payload.sub, email, name: payload.name || email.split('@')[0], picture: payload.picture || '' };
};

// Đăng nhập (hoặc tự đăng ký) bằng Google. Email đã có tài khoản thì liên kết vào tài khoản đó.
const loginWithGoogle = async ({ credential }) => {
  const profile = await verifyGoogleCredential(credential);

  let user = await User.findOne({ googleId: profile.googleId }).select('+googleId');
  if (!user) user = await User.findOne({ email: profile.email }).select('+googleId');
  if (user?.googleId && user.googleId !== profile.googleId) {
    throw new AppError('Email này đã liên kết với một tài khoản Google khác', 409);
  }

  let isNew = false;
  if (!user) {
    isNew = true;
    user = new User({
      name: profile.name.slice(0, 100),
      email: profile.email,
      // Mật khẩu ngẫu nhiên không ai biết; muốn đăng nhập bằng mật khẩu thì dùng "Quên mật khẩu"
      password: crypto.randomBytes(32).toString('hex'),
      avatarUrl: profile.picture,
      role: 'student',
      googleId: profile.googleId,
    });
  } else {
    if (!user.isActive) throw new AppError('Tài khoản của bạn đã bị vô hiệu hóa', 403);
    user.googleId = profile.googleId;
    if (!user.avatarUrl && profile.picture) user.avatarUrl = profile.picture;
  }
  user.lastLoginAt = new Date();
  // Giống đăng nhập thường: không chặn tài khoản cũ vì dữ liệu hồ sơ chưa hợp lệ
  await user.save(isNew ? {} : { validateBeforeSave: false });

  const token = createAccessToken(user);
  return { token, user: user.toPublicJSON(), isNew };
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId).select('+password');
  if (!user || !(await user.comparePassword(currentPassword))) {
    throw new AppError('Mật khẩu hiện tại không chính xác', 400);
  }

  user.password = newPassword;
  user.tokenVersion += 1;
  await user.save();
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email, isActive: true });
  let resetToken;

  if (user) {
    resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await user.save({ validateBeforeSave: false });
  }

  return nodeEnv !== 'production' && resetToken ? { resetToken } : {};
};

const resetPassword = async ({ resetToken, newPassword }) => {
  const passwordResetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  const user = await User.findOne({
    passwordResetTokenHash,
    passwordResetExpiresAt: { $gt: new Date() },
    isActive: true,
  }).select('+passwordResetTokenHash +passwordResetExpiresAt');

  if (!user) {
    throw new AppError('Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn', 400);
  }

  user.password = newPassword;
  user.passwordResetTokenHash = null;
  user.passwordResetExpiresAt = null;
  user.tokenVersion += 1;
  await user.save();
};

const logout = async (userId) => {
  await User.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } });
};

module.exports = { register, login, loginWithGoogle, changePassword, forgotPassword, resetPassword, logout };
