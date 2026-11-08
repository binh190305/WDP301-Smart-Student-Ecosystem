const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true },
    options: {
      type: [String],
      required: true,
      validate: (v) => Array.isArray(v) && v.length >= 2 && v.length <= 6,
    },
    correctIndexes: {
      type: [Number],
      required: true,
      validate: (v) => Array.isArray(v) && v.length >= 1,
    },
    explanation: { type: String, default: '' },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    questions: { type: [questionSchema], default: [] },
    isPublished: { type: Boolean, default: true },
    timeLimitMinutes: { type: Number, default: 0, min: 0 },
    maxAttempts: { type: Number, default: 0, min: 0 },
    passingPercentage: { type: Number, default: 50, min: 0, max: 100 },
    shuffleQuestions: { type: Boolean, default: false },
  },
  { timestamps: true }
);

quizSchema.index({ course: 1, createdAt: -1 });
quizSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Quiz', quizSchema);
