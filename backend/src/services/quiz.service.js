const Quiz = require('../models/quiz.model');
const QuizAttempt = require('../models/quiz-attempt.model');
const AppError = require('../utils/app-error');
const { parsePagination, buildPageResult } = require('../utils/pagination');
const { parseQuestions } = require('../utils/quiz-workbook');

const QUIZ_LIST_PROJECTION =
  'title course createdBy questions isPublished createdAt timeLimitMinutes maxAttempts passingPercentage shuffleQuestions';

const validateQuestions = (questions) => {
  for (const question of questions) {
    if (question.correctIndexes.some((index) => index >= question.options.length)) {
      throw new AppError('Đáp án đúng không nằm trong danh sách lựa chọn', 422);
    }
  }
};

const sameSet = (a, b) => {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((value) => set.has(value));
};

const createQuiz = async (createdBy, payload) => {
  validateQuestions(payload.questions);
  return Quiz.create({ ...payload, createdBy });
};

const importQuiz = async (createdBy, filePath, payload) => {
  const questions = await parseQuestions(filePath);
  const isPublished = payload.isPublished === false || payload.isPublished === 'false' ? false : true;
  return createQuiz(createdBy, {
    title: payload.title,
    course: payload.course || null,
    isPublished,
    timeLimitMinutes: Number(payload.timeLimitMinutes) || 0,
    maxAttempts: Number(payload.maxAttempts) || 0,
    passingPercentage: Number(payload.passingPercentage) || 50,
    shuffleQuestions: payload.shuffleQuestions === true || payload.shuffleQuestions === 'true',
    questions,
  });
};

const listQuizzes = async (query, requester) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};
  if (query.course) filter.course = query.course;
  if (query.mine === 'true') filter.createdBy = requester.id;
  if (requester.role === 'student') filter.isPublished = true;

  const [quizzes, total] = await Promise.all([
    Quiz.find(filter)
      .select(QUIZ_LIST_PROJECTION)
      .populate('course', 'code title')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Quiz.countDocuments(filter),
  ]);

  const shaped = quizzes.map((quiz) => ({
    ...quiz,
    questionCount: quiz.questions.length,
    questions: undefined,
  }));
  return buildPageResult(shaped, total, page, limit);
};

const getQuizForTaking = async (quizId, requester) => {
  const quiz = await Quiz.findById(quizId).populate('course', 'code title').lean();
  if (!quiz) throw new AppError('Không tìm thấy bộ câu hỏi', 404);
  if (requester.role === 'student' && !quiz.isPublished) {
    throw new AppError('Bộ câu hỏi này chưa được công bố', 403);
  }

  let attemptStats = {
    previousAttemptsCount: 0,
    remainingAttempts: null,
    canAttempt: true,
  };

  if (requester.role === 'student') {
    const attemptsCount = await QuizAttempt.countDocuments({ quiz: quizId, student: requester.id });
    const maxAttempts = quiz.maxAttempts || 0;
    const remainingAttempts = maxAttempts > 0 ? Math.max(0, maxAttempts - attemptsCount) : null;
    const canAttempt = maxAttempts === 0 || remainingAttempts > 0;

    attemptStats = {
      previousAttemptsCount: attemptsCount,
      remainingAttempts,
      canAttempt,
    };
  }

  const revealAnswers = requester.role !== 'student';
  return {
    ...quiz,
    ...attemptStats,
    questions: quiz.questions.map((q) => ({
      questionText: q.questionText,
      options: q.options,
      isMultipleChoice: (q.correctIndexes?.length || 0) > 1,
      correctIndexes: revealAnswers ? q.correctIndexes : undefined,
      explanation: revealAnswers ? q.explanation : undefined,
    })),
  };
};

const submitAttempt = async (quizId, studentId, payload) => {
  const answers = Array.isArray(payload) ? payload : payload.answers;
  const timeSpentSeconds = Number(payload.timeSpentSeconds) || 0;

  const quiz = await Quiz.findById(quizId).lean();
  if (!quiz) throw new AppError('Không tìm thấy bộ câu hỏi', 404);
  if (!quiz.isPublished) throw new AppError('Bộ câu hỏi này chưa được công bố', 403);

  const attemptsCount = await QuizAttempt.countDocuments({ quiz: quizId, student: studentId });
  if (quiz.maxAttempts > 0 && attemptsCount >= quiz.maxAttempts) {
    throw new AppError(`Bạn đã dùng hết số lượt làm bài cho phép (${quiz.maxAttempts}/${quiz.maxAttempts})`, 403);
  }

  if (!Array.isArray(answers) || answers.length !== quiz.questions.length) {
    throw new AppError('Số lượng câu trả lời không khớp với số câu hỏi', 422);
  }

  let score = 0;
  const review = quiz.questions.map((question, index) => {
    const selectedIndexes = Array.isArray(answers[index]) ? answers[index] : [];
    const isCorrect = sameSet(selectedIndexes, question.correctIndexes);
    if (isCorrect) score += 1;
    return {
      questionText: question.questionText,
      options: question.options,
      selectedIndexes,
      correctIndexes: question.correctIndexes,
      isCorrect,
      explanation: question.explanation || '',
    };
  });

  const percentage = quiz.questions.length > 0 ? Math.round((score / quiz.questions.length) * 100) : 0;
  const passingScore = quiz.passingPercentage || 50;
  const passed = percentage >= passingScore;

  const attempt = await QuizAttempt.create({
    quiz: quizId,
    student: studentId,
    answers,
    score,
    totalQuestions: quiz.questions.length,
    percentage,
    passed,
    timeSpentSeconds,
    attemptNumber: attemptsCount + 1,
  });

  return {
    attempt,
    review,
    score,
    totalQuestions: quiz.questions.length,
    percentage,
    passed,
    timeSpentSeconds,
    passingPercentage: passingScore,
  };
};

const listMyAttempts = async (studentId, query) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = { student: studentId };
  if (query.quiz) filter.quiz = query.quiz;

  const [attempts, total] = await Promise.all([
    QuizAttempt.find(filter)
      .populate({ path: 'quiz', select: 'title course timeLimitMinutes passingPercentage', populate: { path: 'course', select: 'code title' } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    QuizAttempt.countDocuments(filter),
  ]);

  return buildPageResult(attempts, total, page, limit);
};

const assertQuizOwnership = (quiz, requester) => {
  if (requester.role !== 'admin' && quiz.createdBy.toString() !== requester.id.toString()) {
    throw new AppError('Bạn chỉ có thể chỉnh sửa bộ câu hỏi do mình tạo', 403);
  }
};

const updateQuiz = async (quizId, requester, updates) => {
  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw new AppError('Không tìm thấy bộ câu hỏi', 404);
  assertQuizOwnership(quiz, requester);
  if (updates.questions) validateQuestions(updates.questions);
  if ('title' in updates) quiz.title = updates.title;
  if ('course' in updates) quiz.course = updates.course || null;
  if ('questions' in updates) quiz.questions = updates.questions;
  if ('isPublished' in updates) quiz.isPublished = updates.isPublished;
  if ('timeLimitMinutes' in updates) quiz.timeLimitMinutes = Number(updates.timeLimitMinutes) || 0;
  if ('maxAttempts' in updates) quiz.maxAttempts = Number(updates.maxAttempts) || 0;
  if ('passingPercentage' in updates) quiz.passingPercentage = Number(updates.passingPercentage) || 50;
  if ('shuffleQuestions' in updates) quiz.shuffleQuestions = Boolean(updates.shuffleQuestions);

  await quiz.save();
  return quiz;
};

const deleteQuiz = async (quizId, requester) => {
  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw new AppError('Không tìm thấy bộ câu hỏi', 404);
  assertQuizOwnership(quiz, requester);
  await Promise.all([Quiz.deleteOne({ _id: quizId }), QuizAttempt.deleteMany({ quiz: quizId })]);
};

/**
 * Thống kê chi tiết kết quả làm bài của sinh viên cho Giảng viên
 */
const getQuizAnalytics = async (quizId, requester) => {
  const quiz = await Quiz.findById(quizId).populate('course', 'code title').lean();
  if (!quiz) throw new AppError('Không tìm thấy bộ câu hỏi', 404);
  assertQuizOwnership(quiz, requester);

  const attempts = await QuizAttempt.find({ quiz: quizId })
    .populate('student', 'name studentCode email')
    .sort({ createdAt: -1 })
    .lean();

  const totalAttempts = attempts.length;
  const uniqueStudentsMap = new Map();
  let totalScore = 0;
  let totalPercentage = 0;
  let passedCount = 0;

  // Thống kê độ chính xác từng câu hỏi
  const questionAccuracy = quiz.questions.map((q, idx) => ({
    questionText: q.questionText,
    correctCount: 0,
    totalAnswered: 0,
    accuracyRate: 0,
  }));

  for (const att of attempts) {
    totalScore += att.score;
    const pct = att.percentage ?? (att.totalQuestions > 0 ? Math.round((att.score / att.totalQuestions) * 100) : 0);
    totalPercentage += pct;
    if (att.passed || pct >= (quiz.passingPercentage || 50)) {
      passedCount += 1;
    }

    const sId = att.student?._id?.toString();
    if (sId && !uniqueStudentsMap.has(sId)) {
      uniqueStudentsMap.set(sId, {
        student: att.student,
        bestScore: att.score,
        attemptsCount: 1,
        latestAttemptAt: att.createdAt,
      });
    } else if (sId) {
      const s = uniqueStudentsMap.get(sId);
      s.attemptsCount += 1;
      if (att.score > s.bestScore) s.bestScore = att.score;
    }

    if (Array.isArray(att.answers)) {
      quiz.questions.forEach((q, idx) => {
        const studentAns = att.answers[idx] || [];
        if (sameSet(studentAns, q.correctIndexes)) {
          questionAccuracy[idx].correctCount += 1;
        }
        questionAccuracy[idx].totalAnswered += 1;
      });
    }
  }

  questionAccuracy.forEach((qa) => {
    qa.accuracyRate = qa.totalAnswered > 0 ? Math.round((qa.correctCount / qa.totalAnswered) * 100) : 0;
  });

  const averageScore = totalAttempts > 0 ? Number((totalScore / totalAttempts).toFixed(1)) : 0;
  const averagePercentage = totalAttempts > 0 ? Math.round(totalPercentage / totalAttempts) : 0;
  const passRate = totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 100) : 0;

  return {
    quiz: {
      _id: quiz._id,
      title: quiz.title,
      course: quiz.course,
      timeLimitMinutes: quiz.timeLimitMinutes,
      maxAttempts: quiz.maxAttempts,
      passingPercentage: quiz.passingPercentage,
      totalQuestions: quiz.questions.length,
      isPublished: quiz.isPublished,
    },
    summary: {
      totalAttempts,
      uniqueStudentsCount: uniqueStudentsMap.size,
      averageScore,
      averagePercentage,
      passRate,
    },
    questionStats: questionAccuracy,
    attempts: attempts.map((a) => ({
      _id: a._id,
      student: a.student,
      score: a.score,
      totalQuestions: a.totalQuestions,
      percentage: a.percentage ?? (a.totalQuestions > 0 ? Math.round((a.score / a.totalQuestions) * 100) : 0),
      passed: Boolean(a.passed || (a.percentage ?? 0) >= (quiz.passingPercentage || 50)),
      timeSpentSeconds: a.timeSpentSeconds || 0,
      attemptNumber: a.attemptNumber || 1,
      createdAt: a.createdAt,
    })),
  };
};

module.exports = {
  createQuiz,
  importQuiz,
  listQuizzes,
  getQuizForTaking,
  submitAttempt,
  listMyAttempts,
  updateQuiz,
  deleteQuiz,
  getQuizAnalytics,
};
