const router = require('express').Router();
const c = require('../controllers/evaluationController');
const { requireRole } = require('../middleware/auth');

router.get('/', c.list);
router.post('/', requireRole('ADMIN', 'MENTOR'), c.create);

module.exports = router;
