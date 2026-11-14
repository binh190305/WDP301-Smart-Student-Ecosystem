const Joi = require('joi');

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  avatarUrl: Joi.string().uri({ allowRelative: true }).max(2048).allow('', null),
  major: Joi.string().max(120).allow(''),
  gpa: Joi.number().min(0).max(4).allow(null),
  skills: Joi.array().items(Joi.string().max(40)).max(30),
  interests: Joi.array().items(Joi.string().max(40)).max(30),
  description: Joi.string().max(1000).allow(''),
});

const adminCreateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(72).required(),
  role: Joi.string().valid('student', 'lecturer', 'admin', 'club_leader').required(),
  major: Joi.string().max(120).allow(''),
});

const adminUpdateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  role: Joi.string().valid('student', 'lecturer', 'admin', 'club_leader'),
  isActive: Joi.boolean(),
  major: Joi.string().max(120).allow(''),
  gpa: Joi.number().min(0).max(4).allow(null),
  skills: Joi.array().items(Joi.string().max(40)).max(30),
  interests: Joi.array().items(Joi.string().max(40)).max(30),
  description: Joi.string().max(1000).allow(''),
  avatarUrl: Joi.string().uri({ allowRelative: true }).max(2048).allow('', null),
}).min(1);

const pushTokenSchema = Joi.object({
  token: Joi.string().min(10).max(200).required(),
});

const listUsersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  role: Joi.string().valid('student', 'lecturer', 'admin', 'club_leader'),
  search: Joi.string().max(100).allow(''),
});

const searchStudentsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  search: Joi.string().max(100).allow(''),
  major: Joi.string().max(120).allow(''),
  skill: Joi.string().max(40).allow(''),
});

const userIdParamsSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

module.exports = {
  updateProfileSchema,
  adminCreateUserSchema,
  adminUpdateUserSchema,
  pushTokenSchema,
  listUsersQuerySchema,
  searchStudentsQuerySchema,
  userIdParamsSchema,
};
