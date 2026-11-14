const express = require('express');

const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/teams', require('./team.routes'));
router.use('/join-requests', require('./join-request.routes'));
router.use('/club-registrations', require('./club-registration.routes'));
router.use('/team-invitations', require('./team-invitation.routes'));
router.use('/courses', require('./course.routes'));
router.use('/assignments', require('./assignment.routes'));
router.use('/lessons', require('./lesson.routes'));
router.use('/calendar', require('./calendar.routes'));
router.use('/gamification', require('./gamification.routes'));
router.use('/search', require('./search.routes'));
router.use('/materials', require('./material.routes'));
router.use('/quizzes', require('./quiz.routes'));
router.use('/announcements', require('./announcement.routes'));
router.use('/posts', require('./post.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/admin', require('./admin.routes'));
router.use(require('./recommendation.routes'));
// AI CORE 01 – Skill Intelligence
router.use('/skill-intelligence', require('./skill-intelligence.routes'));

module.exports = router;
