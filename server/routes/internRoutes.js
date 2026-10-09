const router = require('express').Router();
const c = require('../controllers/internController');
const { requireRole } = require('../middleware/auth');

router.get('/', requireRole('ADMIN', 'MENTOR'), c.list);
router.get('/:id', c.getById); // interns can only load their own record (enforced in the controller)
router.post('/', requireRole('ADMIN'), c.create);
router.put('/:id', requireRole('ADMIN'), c.update);
router.delete('/:id', requireRole('ADMIN'), c.remove);

module.exports = router;
