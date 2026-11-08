const express = require('express');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authRateLimit } = require('../middleware/rate-limit');
const {
  registerSchema,
  loginSchema,
  googleLoginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../validators/auth.validator');
const authController = require('../controllers/auth.controller');

const router = express.Router();

router.post('/register', authRateLimit, validate(registerSchema), authController.register);
router.post('/login', authRateLimit, validate(loginSchema), authController.login);
router.get('/google/config', authController.googleConfig);
router.post('/google', authRateLimit, validate(googleLoginSchema), authController.googleLogin);
router.post('/forgot-password', authRateLimit, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authRateLimit, validate(resetPasswordSchema), authController.resetPassword);
router.get('/me', protect, authController.me);
router.post('/change-password', protect, validate(changePasswordSchema), authController.changePassword);
router.post('/logout', protect, authController.logout);

module.exports = router;
