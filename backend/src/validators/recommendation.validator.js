const Joi = require('joi');

const limitQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(20),
});

const chatSchema = Joi.object({
  message: Joi.string().trim().min(1).max(500).required(),
  history: Joi.array().items(Joi.string().max(500)).max(10).default([]),
  excludeTopics: Joi.array().items(Joi.string().max(200)).max(100).default([]),
  limit: Joi.number().integer().min(1).max(20),
});

const clickSchema = Joi.object({
  teamId: Joi.string().hex().length(24).required(),
  candidateId: Joi.string().hex().length(24),
  source: Joi.string().valid('profile', 'chat'),
});

module.exports = { limitQuerySchema, chatSchema, clickSchema };
