const router = require('express').Router();
const c = require('../controllers/departmentController');
const { requireRole } = require('../middleware/auth');

router.get('/', c.list);
router.post('/', requireRole('ADMIN'), c.create);
router.put('/:id', requireRole('ADMIN'), c.update);
router.delete('/:id', requireRole('ADMIN'), c.remove);

module.exports = router;
