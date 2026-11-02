const mongoose = require('mongoose');

// Log tương tác với gợi ý để sau này huấn luyện lại trọng số.
// Các sự kiện xin vào / được nhận / bị từ chối lấy từ JoinRequest và TeamInvitation
// (đã có trạng thái + thời gian), ghép với log này theo (user, team).
const recommendationEventSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // người xem gợi ý
    kind: { type: String, enum: ['impression', 'click', 'chat_query'], required: true },
    direction: { type: String, enum: ['student_to_team', 'team_to_student'], required: true },
    source: { type: String, enum: ['profile', 'chat'], default: 'profile' },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    rank: { type: Number, default: null },
    score: { type: Number, default: null },
    scoreBreakdown: { type: mongoose.Schema.Types.Mixed, default: null },
    query: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

recommendationEventSchema.index({ user: 1, createdAt: -1 });
recommendationEventSchema.index({ team: 1, kind: 1 });

module.exports = mongoose.model('RecommendationEvent', recommendationEventSchema);
