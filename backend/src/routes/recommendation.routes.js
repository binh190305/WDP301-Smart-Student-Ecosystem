const express = require('express');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { aiChatRateLimit } = require('../middleware/rate-limit');
const { limitQuerySchema, chatSchema, clickSchema } = require('../validators/recommendation.validator');
const controller = require('../controllers/recommendation.controller');

// Gắn tại /api:
//   GET  /students/:id/group-recommendations?limit=5
//   POST /students/:id/group-recommendations/chat
//   GET  /groups/:id/member-recommendations?limit=10
//   POST /recommendations/events
const router = express.Router();

router.use(['/students', '/groups', '/recommendations'], protect);

router.get(
  '/students/:id/group-recommendations',
  validate(limitQuerySchema, 'query'),
  controller.getGroupRecommendations
);
router.post(
  '/students/:id/group-recommendations/chat',
  aiChatRateLimit,
  validate(chatSchema),
  controller.chatGroupRecommendations
);
router.get(
  '/groups/:id/member-recommendations',
  validate(limitQuerySchema, 'query'),
  controller.getMemberRecommendations
);
router.post('/recommendations/events', validate(clickSchema), controller.logClick);

module.exports = router;
