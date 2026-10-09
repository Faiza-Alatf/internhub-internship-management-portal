const router = require('express').Router();
const c = require('../controllers/attendanceController');
const { requireRole } = require('../middleware/auth');

router.get('/', c.list);
router.get('/monthly', c.monthly);
router.post('/', requireRole('ADMIN', 'MENTOR'), c.record);

module.exports = router;
