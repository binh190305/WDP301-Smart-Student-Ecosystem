const asyncHandler = require('../utils/async-handler');
const AppError = require('../utils/app-error');
const recommendationService = require('../recommendation/service');

// Sinh viên chỉ xem gợi ý của chính mình ("me" hoặc id của mình); admin xem được mọi người.
const resolveStudentId = (req) => {
  const { id } = req.params;
  if (id === 'me' || id === req.user.id) return req.user.id;
  if (req.user.role === 'admin') return id;
  throw new AppError('Bạn không có quyền xem gợi ý của sinh viên khác', 403);
};

const getGroupRecommendations = asyncHandler(async (req, res) => {
  const data = await recommendationService.getGroupRecommendations(resolveStudentId(req), req.query);
  res.status(200).json({ success: true, data });
});

const chatGroupRecommendations = asyncHandler(async (req, res) => {
  const data = await recommendationService.chatGroupRecommendations(resolveStudentId(req), req.body);
  res.status(200).json({ success: true, data });
});

const getMemberRecommendations = asyncHandler(async (req, res) => {
  const data = await recommendationService.getMemberRecommendations(req.params.id, req.user, req.query);
  res.status(200).json({ success: true, data });
});

const logClick = asyncHandler(async (req, res) => {
  await recommendationService.logClick(req.user.id, req.body);
  res.status(201).json({ success: true });
});

module.exports = { getGroupRecommendations, chatGroupRecommendations, getMemberRecommendations, logClick };
