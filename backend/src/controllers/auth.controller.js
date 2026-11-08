const asyncHandler = require('../utils/async-handler');
const authService = require('../services/auth.service');
const User = require('../models/user.model');
const { googleClientId } = require('../config/env');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json({ success: true, data: result });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.status(200).json({ success: true, data: result });
});

const googleLogin = asyncHandler(async (req, res) => {
  const result = await authService.loginWithGoogle(req.body);
  res.status(result.isNew ? 201 : 200).json({ success: true, data: result });
});

// Client ID là thông tin công khai; frontend lấy ở đây để chỉ cần cấu hình một chỗ (backend/.env).
const googleConfig = (req, res) => {
  res.status(200).json({ success: true, data: { clientId: googleClientId || null } });
};

const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.id, req.body);
  res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công, vui lòng đăng nhập lại' });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const data = await authService.forgotPassword(req.body.email);
  res.status(200).json({
    success: true,
    message: 'Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được tạo',
    data,
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body);
  res.status(200).json({ success: true, message: 'Đặt lại mật khẩu thành công, vui lòng đăng nhập' });
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user.id);
  res.status(200).json({ success: true, message: 'Đăng xuất thành công' });
});

const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ success: true, data: { user: user.toPublicJSON() } });
});

module.exports = { register, login, googleLogin, googleConfig, me, changePassword, forgotPassword, resetPassword, logout };
