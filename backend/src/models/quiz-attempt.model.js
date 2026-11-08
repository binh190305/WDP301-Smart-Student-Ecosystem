const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    answers: { type: [[Number]], default: [] },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    percentage: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    timeSpentSeconds: { type: Number, default: 0 },
    attemptNumber: { type: Number, default: 1 },
  },
  { timestamps: true }
);

quizAttemptSchema.index({ quiz: 1, student: 1, createdAt: -1 });
quizAttemptSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
