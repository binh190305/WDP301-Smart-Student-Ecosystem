const mongoose = require('mongoose');

// Cache câu giải thích do LLM sinh cho cặp (sinh viên, nhóm). dataHash đổi khi dữ liệu
// chấm điểm hoặc yêu cầu tìm kiếm đổi, nên cache tự làm mới.
const recommendationExplanationSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    perspective: { type: String, enum: ['student', 'team'], required: true },
    dataHash: { type: String, required: true },
    text: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

recommendationExplanationSchema.index({ student: 1, team: 1, perspective: 1, dataHash: 1 }, { unique: true });
recommendationExplanationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RecommendationExplanation', recommendationExplanationSchema);
