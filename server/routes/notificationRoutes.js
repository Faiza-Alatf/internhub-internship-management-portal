const router = require('express').Router();
const c = require('../controllers/notificationController');

router.get('/', c.list);
router.put('/read-all', c.markAllRead);
router.put('/:id/read', c.markRead);

module.exports = router;
