const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createQuizSchema,
  updateQuizSchema,
  submitAttemptSchema,
  generateAiQuizSchema,
  listQuizzesQuerySchema,
} = require('../validators/quiz.validator');
const quizController = require('../controllers/quiz.controller');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect);

router.get('/', validate(listQuizzesQuerySchema, 'query'), quizController.listQuizzes);
router.get('/import-template', restrictTo('lecturer', 'admin'), quizController.downloadTemplate);
router.get('/import-sample', restrictTo('lecturer', 'admin'), quizController.downloadSample);
router.get('/attempts/mine', restrictTo('student'), quizController.listMyAttempts);
router.post('/generate-ai', restrictTo('lecturer', 'admin'), validate(generateAiQuizSchema), quizController.generateAiQuiz);
router.get('/:id/analytics', restrictTo('lecturer', 'admin'), quizController.getQuizAnalytics);
router.get('/:id', quizController.getQuiz);

router.post('/', restrictTo('lecturer', 'admin'), validate(createQuizSchema), quizController.createQuiz);
router.post('/import', restrictTo('lecturer', 'admin'), upload.single('file'), quizController.importQuiz);
router.post('/:id/attempts', restrictTo('student'), validate(submitAttemptSchema), quizController.submitAttempt);
router.patch('/:id', restrictTo('lecturer', 'admin'), validate(updateQuizSchema), quizController.updateQuiz);
router.delete('/:id', restrictTo('lecturer', 'admin'), quizController.deleteQuiz);

module.exports = router;
