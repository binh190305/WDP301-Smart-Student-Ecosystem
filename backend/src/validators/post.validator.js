const Joi = require('joi');

const createPostSchema = Joi.object({
  type: Joi.string().valid('academic_update', 'event').required(),
  title: Joi.string().min(3).max(200).required(),
  content: Joi.string().min(3).max(5000).required(),
  eventDate: Joi.date().when('type', { is: 'event', then: Joi.required(), otherwise: Joi.allow(null, '') }),
  endDate: Joi.date().allow(null, ''),
  location: Joi.string().max(300).allow(''),
  capacity: Joi.number().integer().min(1).allow(null, ''),
  registrationDeadline: Joi.date().allow(null, ''),
  onlineUrl: Joi.string().uri({ allowRelative: true }).max(2000).allow(''),
  tagsNeeded: Joi.array().items(Joi.string().max(40)).max(15),
});

const updatePostSchema = Joi.object({
  title: Joi.string().min(3).max(200),
  content: Joi.string().min(3).max(5000),
  eventDate: Joi.date().allow(null, ''),
  endDate: Joi.date().allow(null, ''),
  location: Joi.string().max(300).allow(''),
  capacity: Joi.number().integer().min(1).allow(null, ''),
  registrationDeadline: Joi.date().allow(null, ''),
  onlineUrl: Joi.string().uri({ allowRelative: true }).max(2000).allow(''),
  tagsNeeded: Joi.array().items(Joi.string().max(40)).max(15),
  status: Joi.string().valid('published', 'hidden'),
}).min(1);

const reactSchema = Joi.object({
  type: Joi.string().valid('like', 'love', 'clap').default('like'),
});

const listPostsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  type: Joi.string().valid('academic_update', 'event'),
  mine: Joi.string().valid('true', 'false'),
});

const postIdParamsSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

module.exports = { createPostSchema, updatePostSchema, reactSchema, listPostsQuerySchema, postIdParamsSchema };
