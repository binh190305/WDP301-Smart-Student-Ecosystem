const Joi = require('joi');

const objectId = Joi.string().hex().length(24);
const pagination = {
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
};

const idParamsSchema = Joi.object({ id: objectId.required() });

const createClubSchema = Joi.object({
  name: Joi.string().min(2).max(150).required(),
  description: Joi.string().max(3000).allow(''),
  category: objectId.allow(null),
  leader: objectId.required(),
  contactEmail: Joi.string().email().required(),
  logoUrl: Joi.string().uri({ allowRelative: true }).max(2048).allow('', null),
  status: Joi.string().valid('active', 'inactive'),
});

const updateClubSchema = Joi.object({
  name: Joi.string().min(2).max(150),
  description: Joi.string().max(3000).allow(''),
  category: objectId.allow(null),
  leader: objectId,
  contactEmail: Joi.string().email(),
  logoUrl: Joi.string().uri({ allowRelative: true }).max(2048).allow('', null),
  status: Joi.string().valid('active', 'inactive'),
}).min(1);

const listClubsQuerySchema = Joi.object({
  ...pagination,
  search: Joi.string().max(100).allow(''),
  status: Joi.string().valid('active', 'inactive'),
  category: objectId,
});

const createClubRegistrationSchema = Joi.object({
  clubName: Joi.string().min(2).max(150).required(),
  description: Joi.string().min(20).max(3000).required(),
  category: objectId.allow(null),
  contactEmail: Joi.string().email().required(),
  logoUrl: Joi.string().uri({ allowRelative: true }).max(2048).allow('', null),
});

const listClubRegistrationsQuerySchema = Joi.object({
  ...pagination,
  status: Joi.string().valid('pending', 'approved', 'rejected'),
});

const rejectClubRegistrationSchema = Joi.object({
  rejectionReason: Joi.string().min(5).max(1000).required(),
});

const createTaxonomySchema = Joi.object({
  type: Joi.string().valid('skill', 'major', 'category').required(),
  name: Joi.string().min(1).max(120).required(),
  description: Joi.string().max(500).allow(''),
  isActive: Joi.boolean(),
});

const updateTaxonomySchema = Joi.object({
  name: Joi.string().min(1).max(120),
  description: Joi.string().max(500).allow(''),
  isActive: Joi.boolean(),
}).min(1);

const listTaxonomiesQuerySchema = Joi.object({
  ...pagination,
  type: Joi.string().valid('skill', 'major', 'category'),
  isActive: Joi.boolean(),
  search: Joi.string().max(100).allow(''),
});

const reportQuerySchema = Joi.object({
  from: Joi.date().iso(),
  to: Joi.date().iso().min(Joi.ref('from')),
  format: Joi.string().valid('json', 'csv').default('json'),
});

const updateSystemSettingSchema = Joi.object({
  platformName: Joi.string().min(1).max(100),
  maintenanceMode: Joi.boolean(),
  allowRegistration: Joi.boolean(),
  supportEmail: Joi.string().email().allow(''),
  maxUploadSizeMb: Joi.number().integer().min(1).max(100),
}).min(1);

module.exports = {
  idParamsSchema,
  createClubSchema,
  updateClubSchema,
  listClubsQuerySchema,
  createClubRegistrationSchema,
  listClubRegistrationsQuerySchema,
  rejectClubRegistrationSchema,
  createTaxonomySchema,
  updateTaxonomySchema,
  listTaxonomiesQuerySchema,
  reportQuerySchema,
  updateSystemSettingSchema,
};
