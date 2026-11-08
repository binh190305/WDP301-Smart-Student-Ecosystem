const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(72).required(),
  major: Joi.string().max(120).allow(''),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const googleLoginSchema = Joi.object({
  credential: Joi.string().max(4096).required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).max(72).required().invalid(Joi.ref('currentPassword')),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  resetToken: Joi.string().hex().length(64).required(),
  newPassword: Joi.string().min(8).max(72).required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  googleLoginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
