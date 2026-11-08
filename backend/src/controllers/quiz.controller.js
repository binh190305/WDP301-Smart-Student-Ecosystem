const asyncHandler = require('../utils/async-handler');
const quizService = require('../services/quiz.service');
const aiQuizService = require('../services/ai-quiz.service');
const fs = require('fs/promises');
const path = require('path');
const { createTemplateWorkbook } = require('../utils/quiz-workbook');

const createQuiz = asyncHandler(async (req, res) => {
  const quiz = await quizService.createQuiz(req.user.id, req.body);
  res.status(201).json({ success: true, data: { quiz } });
});

const importQuiz = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(422).json({ success: false, message: 'Vui lòng chọn file Excel' });
  if (path.extname(req.file.originalname).toLowerCase() !== '.xlsx') {
    await fs.unlink(req.file.path).catch(() => {});
    return res.status(422).json({ success: false, message: 'Vui lòng sử dụng file Excel .xlsx' });
  }
  try {
    const quiz = await quizService.importQuiz(req.user.id, req.file.path, req.body);
    res.status(201).json({ success: true, data: { quiz } });
  } finally {
    await fs.unlink(req.file.path).catch(() => {});
  }
});

const downloadTemplate = asyncHandler(async (req, res) => {
  const workbook = await createTemplateWorkbook(false);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="ste-quiz-template.xlsx"');
  await workbook.xlsx.write(res);
  res.end();
});

const downloadSample = asyncHandler(async (req, res) => {
  const workbook = await createTemplateWorkbook(true);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="ste-quiz-sample.xlsx"');
  await workbook.xlsx.write(res);
  res.end();
});

const listQuizzes = asyncHandler(async (req, res) => {
  const result = await quizService.listQuizzes(req.query, req.user);
  res.status(200).json({ success: true, ...result });
});

const getQuiz = asyncHandler(async (req, res) => {
  const quiz = await quizService.getQuizForTaking(req.params.id, req.user);
  res.status(200).json({ success: true, data: { quiz } });
});

const submitAttempt = asyncHandler(async (req, res) => {
  const result = await quizService.submitAttempt(req.params.id, req.user.id, req.body);
  res.status(201).json({ success: true, data: result });
});

const generateAiQuiz = asyncHandler(async (req, res) => {
  const questions = await aiQuizService.generateQuizQuestions(req.body);
  res.status(200).json({ success: true, data: { questions } });
});

const getQuizAnalytics = asyncHandler(async (req, res) => {
  const analytics = await quizService.getQuizAnalytics(req.params.id, req.user);
  res.status(200).json({ success: true, data: analytics });
});

const listMyAttempts = asyncHandler(async (req, res) => {
  const result = await quizService.listMyAttempts(req.user.id, req.query);
  res.status(200).json({ success: true, ...result });
});

const updateQuiz = asyncHandler(async (req, res) => {
  const quiz = await quizService.updateQuiz(req.params.id, req.user, req.body);
  res.status(200).json({ success: true, data: { quiz } });
});

const deleteQuiz = asyncHandler(async (req, res) => {
  await quizService.deleteQuiz(req.params.id, req.user);
  res.status(204).send();
});

module.exports = {
  createQuiz,
  importQuiz,
  downloadTemplate,
  downloadSample,
  listQuizzes,
  getQuiz,
  submitAttempt,
  generateAiQuiz,
  getQuizAnalytics,
  listMyAttempts,
  updateQuiz,
  deleteQuiz,
};
