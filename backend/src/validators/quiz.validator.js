const Joi = require('joi');

const questionSchema = Joi.object({
  questionText: Joi.string().min(3).max(500).required(),
  options: Joi.array().items(Joi.string().max(200)).min(2).max(6).required(),
  correctIndexes: Joi.array().items(Joi.number().integer().min(0)).min(1).unique().required(),
  explanation: Joi.string().max(1000).allow('').default(''),
});

const createQuizSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  course: Joi.string().hex().length(24).allow(null),
  questions: Joi.array().items(questionSchema).min(1).max(50).required(),
  isPublished: Joi.boolean(),
  timeLimitMinutes: Joi.number().integer().min(0).max(300).default(0),
  maxAttempts: Joi.number().integer().min(0).max(50).default(0),
  passingPercentage: Joi.number().integer().min(0).max(100).default(50),
  shuffleQuestions: Joi.boolean().default(false),
});

const updateQuizSchema = Joi.object({
  title: Joi.string().min(3).max(200),
  course: Joi.string().hex().length(24).allow(null),
  questions: Joi.array().items(questionSchema).min(1).max(50),
  isPublished: Joi.boolean(),
  timeLimitMinutes: Joi.number().integer().min(0).max(300),
  maxAttempts: Joi.number().integer().min(0).max(50),
  passingPercentage: Joi.number().integer().min(0).max(100),
  shuffleQuestions: Joi.boolean(),
}).min(1);

const submitAttemptSchema = Joi.object({
  answers: Joi.array().items(Joi.array().items(Joi.number().integer().min(0))).required(),
  timeSpentSeconds: Joi.number().integer().min(0).default(0),
});

const generateAiQuizSchema = Joi.object({
  prompt: Joi.string().max(1000).allow(''),
  text: Joi.string().max(15000).allow(''),
  course: Joi.string().hex().length(24).allow(null, ''),
  questionCount: Joi.number().integer().min(1).max(20).default(5),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').default('medium'),
  apiKey: Joi.string().max(250).allow('', null),
  provider: Joi.string().valid('gemini', 'openai', 'anthropic').allow('', null),
}).custom((value, helpers) => {
  const hasPrompt = Boolean(value.prompt && value.prompt.trim());
  const hasText = Boolean(value.text && value.text.trim());
  if (!hasPrompt && !hasText) {
    return helpers.message('Vui lòng cung cấp chủ đề (prompt) hoặc tài liệu bài giảng (text)');
  }
  return value;
});

const listQuizzesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  course: Joi.string().hex().length(24),
  mine: Joi.string().valid('true', 'false'),
});

module.exports = {
  createQuizSchema,
  updateQuizSchema,
  submitAttemptSchema,
  generateAiQuizSchema,
  listQuizzesQuerySchema,
};
