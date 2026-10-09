const router = require('express').Router();
const c = require('../controllers/mentorController');
const { requireRole } = require('../middleware/auth');

router.get('/', requireRole('ADMIN'), c.list);
router.get('/:id', c.getById);
router.post('/', requireRole('ADMIN'), c.create);
router.put('/:id', requireRole('ADMIN'), c.update);
router.delete('/:id', requireRole('ADMIN'), c.remove);

module.exports = router;
