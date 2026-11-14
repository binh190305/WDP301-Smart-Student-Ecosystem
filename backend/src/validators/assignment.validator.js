const Joi = require('joi');

const createAssignmentSchema = Joi.object({
  course: Joi.string().hex().length(24).required(),
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().max(5000).allow(''),
  dueDate: Joi.date().iso().allow(null, ''),
  maxScore: Joi.number().min(1).max(100),
  isPublished: Joi.boolean(),
});

const updateAssignmentSchema = Joi.object({
  title: Joi.string().min(3).max(200),
  description: Joi.string().max(5000).allow(''),
  dueDate: Joi.date().iso().allow(null, ''),
  maxScore: Joi.number().min(1).max(100),
  isPublished: Joi.boolean(),
}).min(1);

const submitSchema = Joi.object({
  content: Joi.string().max(5000).allow(''),
});

const gradeSchema = Joi.object({
  score: Joi.number().min(0).required(),
  feedback: Joi.string().max(2000).allow(''),
});

const listAssignmentsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  course: Joi.string().hex().length(24),
  mine: Joi.string().valid('true', 'false'),
});

module.exports = {
  createAssignmentSchema,
  updateAssignmentSchema,
  submitSchema,
  gradeSchema,
  listAssignmentsQuerySchema,
};
