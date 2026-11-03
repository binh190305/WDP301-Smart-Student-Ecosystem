const mongoose = require('mongoose');

// Vector embedding của hồ sơ sinh viên / đề tài nhóm, do job nền tính và cập nhật.
const embeddingSchema = new mongoose.Schema(
  {
    ownerType: { type: String, enum: ['student', 'team'], required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, required: true },
    model: { type: String, required: true },
    textHash: { type: String, required: true },
    vector: { type: [Number], required: true },
  },
  { timestamps: true }
);

embeddingSchema.index({ ownerType: 1, owner: 1, model: 1 }, { unique: true });

module.exports = mongoose.model('Embedding', embeddingSchema);
