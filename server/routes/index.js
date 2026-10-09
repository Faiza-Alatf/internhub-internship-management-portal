const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth');

router.use('/auth', require('./authRoutes'));

// Everything below needs a valid JWT
router.use(authenticateToken);
router.use('/interns', require('./internRoutes'));
router.use('/mentors', require('./mentorRoutes'));
router.use('/departments', require('./departmentRoutes'));
router.use('/tasks', require('./taskRoutes'));
router.use('/attendance', require('./attendanceRoutes'));
router.use('/evaluations', require('./evaluationRoutes'));
router.use('/notifications', require('./notificationRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));

module.exports = router;
