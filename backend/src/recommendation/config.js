// Cấu hình module gợi ý nhóm. Thay đổi trọng số tại đây, không cần sửa logic.
module.exports = {
  // Trọng số các thành phần dương (tổng = 1). Khi thiếu dữ liệu cho một thành phần,
  // trọng số của nó được chia lại theo tỉ lệ cho các thành phần còn lại.
  weights: {
    gap_fill: 0.35,
    semantic_sim: 0.2,
    schedule_overlap: 0.2,
    goal_match: 0.1,
    level_balance: 0.15,
  },
  // Trọng số trừ điểm cho kỹ năng trùng với những gì nhóm đã đủ.
  redundancyPenalty: 0.15,

  teamSizeCap: 6,
  defaultSkillLevel: 3, // level mặc định khi sinh viên chỉ khai tên kỹ năng
  defaultRequiredLevel: 3, // level yêu cầu mặc định cho skillsNeeded
  strongSkillLevel: 4,
  roleMatchBonus: 0.25,

  // Cosine của multilingual-e5 nằm trong khoảng hẹp (đo trên dữ liệu mẫu: ~0.875 với đề tài
  // không liên quan, ~0.93 với đề tài rất khớp), nên ánh xạ tuyến tính đoạn [min, max] về 0-1.
  semanticRange: { min: 0.86, max: 0.94 },

  embedding: {
    enabled: process.env.EMBEDDING_ENABLED !== 'false',
    provider: process.env.EMBEDDING_PROVIDER || 'local-e5', // 'local-e5' | 'openai-compatible'
    model: process.env.EMBEDDING_MODEL || 'Xenova/multilingual-e5-small',
    // Cho provider 'openai-compatible' (OpenAI, Ollama /v1, ...)
    apiUrl: process.env.EMBEDDING_API_URL || 'https://api.openai.com/v1/embeddings',
    apiKey: process.env.EMBEDDING_API_KEY || '',
    batchSize: 16,
    syncIntervalMs: Number(process.env.EMBEDDING_SYNC_INTERVAL_MS) || 5 * 60 * 1000,
  },

  scheduleFullOverlapHours: 10,

  // Trình độ trung bình mục tiêu (thang 1-5) theo mục tiêu của nhóm.
  goalTargetLevel: { excellent: 4, good: 3.5, pass: 3 },
  defaultTargetLevel: 3.5,
  levelBalanceMaxDistance: 2,

  fairness: {
    enabled: true,
    smallTeamMaxMembers: 2, // nhóm từ 2 người trở xuống coi là nhóm ít thành viên
    staleDays: 14, // lâu không có thành viên mới
    minScore: 0.25, // không chèn nhóm quá kém phù hợp
  },

  defaultLimits: { groups: 5, members: 10, max: 20 },

  // Lớp 3: LLM chỉ hỗ trợ (hiểu câu hỏi, viết giải thích), không quyết định thứ hạng.
  llm: {
    model: process.env.LLM_MODEL || 'claude-haiku-5-5',
    timeoutMs: Number(process.env.LLM_TIMEOUT_MS) || 15000,
    explanationCacheDays: 7,
  },

  // Chat tìm nhóm: điểm cuối = blend * mức khớp yêu cầu + (1 - blend) * điểm hồ sơ.
  chat: {
    // Kết quả chat bám sát yêu cầu: điểm hồ sơ chỉ để phân định giữa các nhóm cùng khớp.
    queryBlend: 0.85,
    // Nhóm có mức khớp yêu cầu dưới ngưỡng này bị loại, không lấp cho đủ số lượng.
    minRelevance: 0.5,
    // Câu chỉ mô tả đề tài (không nêu ngành/kỹ năng) thì chỉ dựa vào ngữ nghĩa nên cần ngưỡng chặt hơn.
    minSemanticOnly: 0.7,
    // Cosine câu hỏi ngắn - đề tài nhóm đo trên dữ liệu mẫu: ~0.81 không liên quan, ~0.88 rất khớp.
    semanticAbsoluteRange: { min: 0.83, max: 0.88 },
    queryWeights: { semantic: 0.4, skills: 0.2, majors: 0.2, roles: 0.15, goal: 0.05 },
    maxMessageLength: 500,
    maxHistory: 6,
  },
};
